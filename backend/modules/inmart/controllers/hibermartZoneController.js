import HibermartZone from '../models/HibermartZone.js';
import asyncHandler from '../../../shared/middleware/asyncHandler.js';

// ─── GET ALL ────────────────────────────────────────────────────────────────
export const getHibermartZones = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search, isActive } = req.query;

    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { zoneName: { $regex: search, $options: 'i' } },
            { serviceLocation: { $regex: search, $options: 'i' } }
        ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [zones, total] = await Promise.all([
        HibermartZone.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean(),
        HibermartZone.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        message: 'HiberMart zones retrieved successfully',
        data: {
            zones,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────
export const getHibermartZoneById = asyncHandler(async (req, res) => {
    const zone = await HibermartZone.findById(req.params.id).populate('createdBy', 'name email');
    if (!zone) {
        return res.status(404).json({ success: false, message: 'HiberMart zone not found' });
    }
    res.status(200).json({ success: true, message: 'HiberMart zone retrieved successfully', data: { zone } });
});

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createHibermartZone = asyncHandler(async (req, res) => {
    const { name, serviceLocation, country, zoneName, unit, coordinates } = req.body;

    if (!name || !coordinates || coordinates.length < 3) {
        return res.status(400).json({ success: false, message: 'Zone name and at least 3 coordinates are required' });
    }

    const zone = new HibermartZone({
        name,
        serviceLocation,
        country: country || 'India',
        zoneName,
        unit: unit || 'kilometer',
        coordinates,
        createdBy: req.admin?._id || null
    });

    await zone.save();
    res.status(201).json({ success: true, message: 'HiberMart zone created successfully', data: { zone } });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateHibermartZone = asyncHandler(async (req, res) => {
    const zone = await HibermartZone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.status(200).json({ success: true, message: 'HiberMart zone updated successfully', data: { zone } });
});

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteHibermartZone = asyncHandler(async (req, res) => {
    const zone = await HibermartZone.findByIdAndDelete(req.params.id);
    if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.status(200).json({ success: true, message: 'HiberMart zone deleted successfully' });
});

// ─── TOGGLE STATUS ───────────────────────────────────────────────────────────
export const toggleHibermartZoneStatus = asyncHandler(async (req, res) => {
    const zone = await HibermartZone.findById(req.params.id);
    if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    zone.isActive = !zone.isActive;
    await zone.save();
    res.status(200).json({
        success: true,
        message: `Zone ${zone.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { zone }
    });
});

// ─── PUBLIC: DETECT USER ZONE ────────────────────────────────────────────────
export const detectUserHibermartZone = asyncHandler(async (req, res) => {
    const { lat, lng, latitude, longitude } = req.query;
    const userLat = parseFloat(lat || latitude);
    const userLng = parseFloat(lng || longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({ success: false, message: 'Valid lat/lng required' });
    }

    const activeZones = await HibermartZone.find({ isActive: true });
    let detectedZone = null;

    for (const zone of activeZones) {
        if (zone.containsPoint(userLat, userLng)) {
            detectedZone = zone;
            break;
        }
    }

    res.status(200).json({
        success: true,
        message: detectedZone ? 'HiberMart zone detected' : 'No HiberMart zone found for this location',
        data: { zone: detectedZone, inZone: !!detectedZone }
    });
});

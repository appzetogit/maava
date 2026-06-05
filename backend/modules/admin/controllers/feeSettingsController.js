import FeeSettings from '../models/FeeSettings.js';
import Zone from '../models/Zone.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import asyncHandler from '../../../shared/middleware/asyncHandler.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Get current fee settings
 * GET /api/admin/fee-settings
 */
export const getFeeSettings = asyncHandler(async (req, res) => {
  try {
    const { zoneId } = req.query;
    
    // Normalize string representation of null/undefined
    const targetZoneId = (zoneId && zoneId !== 'null' && zoneId !== 'undefined') ? zoneId : null;

    // Build query
    const query = { isActive: true, zoneId: targetZoneId };

    // Get the most recent active fee settings
    let feeSettings = await FeeSettings.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    // If no active settings exist, and we requested global, create default ones
    if (!feeSettings && (!zoneId || zoneId === 'null')) {
      const defaultSettings = new FeeSettings({
        deliveryFee: 25,
        freeDeliveryThreshold: 149,
        platformFee: 5,
        gstRate: 5,
        isActive: true,
        zoneId: null,
        createdBy: req.admin?._id || null,
      });

      await defaultSettings.save();
      feeSettings = defaultSettings.toObject();
    }

    return successResponse(res, 200, 'Fee settings retrieved successfully', {
      feeSettings,
    });
  } catch (error) {
    logger.error(`Error fetching fee settings: ${error.message}`);
    return errorResponse(res, 500, 'Failed to fetch fee settings');
  }
});

/**
 * Create or update fee settings
 * POST /api/admin/fee-settings
 */
export const createOrUpdateFeeSettings = asyncHandler(async (req, res) => {
  try {
    const { deliveryFee, deliveryFeeRanges, freeDeliveryThreshold, platformFee, gstRate, isActive, zoneId } = req.body;

    // Validate platform fee
    if (platformFee === undefined || platformFee < 0) {
      return errorResponse(res, 400, 'Platform fee must be a positive number');
    }

    if (gstRate === undefined || gstRate < 0 || gstRate > 100) {
      return errorResponse(res, 400, 'GST rate must be between 0 and 100');
    }

    // Validate delivery fee ranges if provided
    if (deliveryFeeRanges && Array.isArray(deliveryFeeRanges)) {
      for (const range of deliveryFeeRanges) {
        if (range.min === undefined || range.min < 0) {
          return errorResponse(res, 400, 'Each range must have a valid min value (≥ 0)');
        }
        if (range.max === undefined || range.max < 0) {
          return errorResponse(res, 400, 'Each range must have a valid max value (≥ 0)');
        }
        if (range.min >= range.max) {
          return errorResponse(res, 400, 'Range min value must be less than max value');
        }
        if (range.fee === undefined || range.fee < 0) {
          return errorResponse(res, 400, 'Each range must have a valid fee value (≥ 0)');
        }
      }
    }

    const targetZoneId = (zoneId && zoneId !== 'null' && zoneId !== 'undefined') ? zoneId : null;

    // Deactivate all existing settings for this zone if this is being set as active
    if (isActive !== false) {
      await FeeSettings.updateMany(
        { isActive: true, zoneId: targetZoneId },
        { isActive: false, updatedBy: req.admin?._id || null }
      );
    }

    // Create new fee settings
    const feeSettingsData = {
      deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : 25,
      freeDeliveryThreshold: freeDeliveryThreshold ? Number(freeDeliveryThreshold) : 149,
      platformFee: Number(platformFee),
      gstRate: Number(gstRate),
      isActive: isActive !== false,
      zoneId: targetZoneId,
      createdBy: req.admin?._id || null,
      updatedBy: req.admin?._id || null,
    };

    // Add delivery fee ranges if provided
    if (deliveryFeeRanges && Array.isArray(deliveryFeeRanges)) {
      feeSettingsData.deliveryFeeRanges = deliveryFeeRanges.map(range => ({
        min: Number(range.min),
        max: Number(range.max),
        fee: Number(range.fee),
      }));
    }

    const feeSettings = new FeeSettings(feeSettingsData);

    await feeSettings.save();

    return successResponse(res, 201, 'Fee settings created successfully', {
      feeSettings,
    });
  } catch (error) {
    logger.error(`Error creating fee settings: ${error.message}`);
    return errorResponse(res, 500, 'Failed to create fee settings');
  }
});

/**
 * Update fee settings
 * PUT /api/admin/fee-settings/:id
 */
export const updateFeeSettings = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryFee, deliveryFeeRanges, freeDeliveryThreshold, platformFee, gstRate, isActive } = req.body;

    const feeSettings = await FeeSettings.findById(id);

    if (!feeSettings) {
      return errorResponse(res, 404, 'Fee settings not found');
    }

    // If setting as active, deactivate others
    if (isActive === true && !feeSettings.isActive) {
      await FeeSettings.updateMany(
        { _id: { $ne: id }, isActive: true },
        { isActive: false, updatedBy: req.admin?._id || null }
      );
    }

    // Update fields
    if (deliveryFee !== undefined) {
      if (deliveryFee < 0) {
        return errorResponse(res, 400, 'Delivery fee must be a positive number');
      }
      feeSettings.deliveryFee = Number(deliveryFee);
    }

    if (deliveryFeeRanges !== undefined && Array.isArray(deliveryFeeRanges)) {
      // Validate delivery fee ranges
      for (const range of deliveryFeeRanges) {
        if (range.min === undefined || range.min < 0) {
          return errorResponse(res, 400, 'Each range must have a valid min value (≥ 0)');
        }
        if (range.max === undefined || range.max < 0) {
          return errorResponse(res, 400, 'Each range must have a valid max value (≥ 0)');
        }
        if (range.min >= range.max) {
          return errorResponse(res, 400, 'Range min value must be less than max value');
        }
        if (range.fee === undefined || range.fee < 0) {
          return errorResponse(res, 400, 'Each range must have a valid fee value (≥ 0)');
        }
      }
      feeSettings.deliveryFeeRanges = deliveryFeeRanges.map(range => ({
        min: Number(range.min),
        max: Number(range.max),
        fee: Number(range.fee),
      }));
    }

    if (freeDeliveryThreshold !== undefined) {
      feeSettings.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    }

    if (platformFee !== undefined) {
      if (platformFee < 0) {
        return errorResponse(res, 400, 'Platform fee must be a positive number');
      }
      feeSettings.platformFee = Number(platformFee);
    }

    if (gstRate !== undefined) {
      if (gstRate < 0 || gstRate > 100) {
        return errorResponse(res, 400, 'GST rate must be between 0 and 100');
      }
      feeSettings.gstRate = Number(gstRate);
    }

    if (isActive !== undefined) {
      feeSettings.isActive = isActive;
    }

    feeSettings.updatedBy = req.admin?._id || null;

    await feeSettings.save();

    return successResponse(res, 200, 'Fee settings updated successfully', {
      feeSettings,
    });
  } catch (error) {
    logger.error(`Error updating fee settings: ${error.message}`);
    return errorResponse(res, 500, 'Failed to update fee settings');
  }
});

/**
 * Get all fee settings history
 * GET /api/admin/fee-settings/history
 */
export const getFeeSettingsHistory = asyncHandler(async (req, res) => {
  try {
    const { limit = 50, offset = 0, zoneId } = req.query;

    const targetZoneId = (zoneId && zoneId !== 'null' && zoneId !== 'undefined') ? zoneId : null;
    const query = { zoneId: targetZoneId };

    const feeSettings = await FeeSettings.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await FeeSettings.countDocuments(query);

    return successResponse(res, 200, 'Fee settings history retrieved successfully', {
      feeSettings,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    logger.error(`Error fetching fee settings history: ${error.message}`);
    return errorResponse(res, 500, 'Failed to fetch fee settings history');
  }
});

/**
 * Get public fee settings (for user frontend)
 * GET /api/admin/fee-settings/public
 */
export const getPublicFeeSettings = asyncHandler(async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    let query = { isActive: true, zoneId: null };

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const matchedZone = await Zone.findOne({
          boundary: {
            $geoIntersects: {
              $geometry: { type: 'Point', coordinates: [lng, lat] }
            }
          },
          isActive: true
        });

        if (matchedZone) {
          query = { isActive: true, zoneId: matchedZone._id };
        }
      }
    }

    let feeSettings = await FeeSettings.findOne(query)
      .sort({ createdAt: -1 })
      .select('deliveryFee deliveryFeeRanges freeDeliveryThreshold platformFee gstRate')
      .lean();

    // Fallback to global active fee settings if zone-specific active settings not found
    if (!feeSettings && query.zoneId !== null) {
      feeSettings = await FeeSettings.findOne({ isActive: true, zoneId: null })
        .sort({ createdAt: -1 })
        .select('deliveryFee deliveryFeeRanges freeDeliveryThreshold platformFee gstRate')
        .lean();
    }

    // If no active settings, return default values
    if (!feeSettings) {
      return successResponse(res, 200, 'Fee settings retrieved successfully', {
        feeSettings: {
          deliveryFee: 25,
          deliveryFeeRanges: [],
          freeDeliveryThreshold: 149,
          platformFee: 5,
          gstRate: 5,
        },
      });
    }

    return successResponse(res, 200, 'Fee settings retrieved successfully', {
      feeSettings,
    });
  } catch (error) {
    logger.error(`Error fetching public fee settings: ${error.message}`);
    return errorResponse(res, 500, 'Failed to fetch fee settings');
  }
});


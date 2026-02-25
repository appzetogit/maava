import HibermartStoreLocation from '../models/HibermartStoreLocation.js';
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';

export const getHibermartStoreLocation = asyncHandler(async (req, res) => {
  try {
    const doc = await HibermartStoreLocation.getOrCreate();
    return successResponse(res, 200, 'Hibermart store location retrieved', doc);
  } catch (error) {
    console.error('Error fetching Hibermart store location:', error);
    return errorResponse(res, 500, 'Failed to fetch Hibermart store location');
  }
});

export const updateHibermartStoreLocation = asyncHandler(async (req, res) => {
  try {
    const { name, location } = req.body;

    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (_) {
        parsedLocation = null;
      }
    }

    const doc = await HibermartStoreLocation.getOrCreate();

    if (name !== undefined) {
      doc.name = name;
    }

    if (parsedLocation) {
      const lat = parsedLocation.latitude ?? parsedLocation.coordinates?.[1];
      const lng = parsedLocation.longitude ?? parsedLocation.coordinates?.[0];
      doc.location = {
        ...parsedLocation,
        coordinates: (lng != null && lat != null)
          ? [lng, lat]
          : parsedLocation.coordinates
      };
    }

    await doc.save();
    return successResponse(res, 200, 'Hibermart store location updated', doc);
  } catch (error) {
    console.error('Error updating Hibermart store location:', error);
    return errorResponse(res, 500, 'Failed to update Hibermart store location');
  }
});

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import Referral from '../models/Referral.js';
import Delivery from '../models/Delivery.js';
import Joi from 'joi';

/**
 * Add a new referral
 * POST /api/delivery/referrals
 */
const addReferralSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().pattern(/^\d{10}$/).required()
});

export const addReferral = asyncHandler(async (req, res) => {
  const deliveryPartner = req.delivery; // From auth middleware
  const { name, phone } = req.body;

  // Validate input
  const { error } = addReferralSchema.validate(req.body);
  if (error) {
    return errorResponse(res, 400, error.details[0].message);
  }

  // 1. Check if the phone number is already a registered delivery partner
  const existingPartner = await Delivery.findOne({ phone });
  if (existingPartner) {
    return errorResponse(res, 400, 'This number is already registered as a delivery partner');
  }

  // 2. Check if the phone number has already been referred by ANYONE
  const existingReferral = await Referral.findOne({ friendPhone: phone });
  if (existingReferral) {
    if (existingReferral.referrer.toString() === deliveryPartner._id.toString()) {
      return errorResponse(res, 400, 'You have already referred this number');
    }
    return errorResponse(res, 400, 'This number has already been referred by another partner');
  }

  // 3. Create the referral record
  const referral = await Referral.create({
    referrer: deliveryPartner._id,
    friendName: name,
    friendPhone: phone,
    status: 'pending'
  });

  return successResponse(res, 201, 'Referral added successfully', referral);
});

/**
 * Get all referrals for current partner
 * GET /api/delivery/referrals
 */
export const getMyReferrals = asyncHandler(async (req, res) => {
  const deliveryPartner = req.delivery;

  const referrals = await Referral.find({ referrer: deliveryPartner._id })
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Referrals fetched successfully', {
    referrals,
    count: referrals.length
  });
});

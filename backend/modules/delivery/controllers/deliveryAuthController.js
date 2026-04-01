import Delivery from '../models/Delivery.js';
import Referral from '../models/Referral.js';
import otpService from '../../auth/services/otpService.js';
import jwtService from '../../auth/services/jwtService.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js';
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
 * Send OTP for delivery boy phone number
 * POST /api/delivery/auth/send-otp
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone, purpose = 'login' } = req.body;

  if (!phone) {
    return errorResponse(res, 400, 'Phone number is required');
  }

  try {
    // Check if user exists if purpose is register
    if (purpose === 'register') {
      const existingUser = await Delivery.findOne({ phone });
      if (existingUser) {
        return errorResponse(res, 400, 'Delivery boy already exists with this phone number. Please login.');
      }
    }

    // Call shared OTP service
    await otpService.sendOTP(phone, purpose);

    return successResponse(res, 200, 'OTP sent successfully');
  } catch (error) {
    logger.error(`Error sending OTP: ${error.message}`);
    return errorResponse(res, 400, error.message);
  }
});

/**
 * Verify OTP and login/register delivery boy
 * POST /api/delivery/auth/verify-otp
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, purpose = 'login', name, referralCode } = req.body;

  // Validate inputs
  if (!phone || !otp) {
    return errorResponse(res, 400, 'Phone number and OTP are required');
  }

  // Normalize name - convert null/undefined to empty string for optional field
  const normalizedName = name && typeof name === 'string' ? name.trim() : null;

  try {
    let delivery;
    
    if (purpose === 'register') {
      // Registration flow
      delivery = await Delivery.findOne({ phone });
      if (delivery) {
        return errorResponse(res, 400, 'Delivery boy already exists with this phone number. Please login.');
      }

      if (!normalizedName) {
        return errorResponse(res, 400, 'Name is required for registration');
      }

      // Verify OTP
      await otpService.verifyOTP(phone, otp, purpose, null);

      let verifiedReferrer = null;
      // 1. Check existing Referral record
      const existingReferral = await Referral.findOne({ friendPhone: phone, status: 'pending' });
      if (existingReferral) {
        const referrer = await Delivery.findById(existingReferral.referrer);
        if (referrer) verifiedReferrer = referrer.deliveryId;
      } 
      // 2. Check manual code
      else if (referralCode) {
        const referrer = await Delivery.findOne({ deliveryId: referralCode.trim().toUpperCase() });
        if (referrer) {
          verifiedReferrer = referrer.deliveryId;
          await Referral.create({
            referrer: referrer._id,
            friendName: normalizedName,
            friendPhone: phone,
            status: 'pending'
          }).catch(err => logger.error(`Error creating Referral: ${err.message}`));
        }
      }

      const deliveryData = {
        name: normalizedName,
        phone,
        phoneVerified: true,
        signupMethod: 'phone',
        status: 'pending',
        isActive: true,
        referredBy: verifiedReferrer,
        referralStatus: verifiedReferrer ? 'pending' : null
      };

      try {
        delivery = await Delivery.create(deliveryData);
        if (verifiedReferrer) {
          await Referral.findOneAndUpdate(
            { friendPhone: phone, status: 'pending' },
            { status: 'signed_up', signedUpAs: delivery._id }
          ).catch(err => logger.error(`Error updating Referral: ${err.message}`));
        }
      } catch (createError) {
        if (createError.code === 11000) {
          delivery = await Delivery.findOne({ phone });
          if (!delivery) throw createError;
        } else {
          throw createError;
        }
      }
    } else {
      // Login Flow
      delivery = await Delivery.findOne({ phone });
      await otpService.verifyOTP(phone, otp, purpose, null);

      if (!delivery) {
        // Minimal record for new user via login
        let verifiedReferrer = null;
        const existingReferral = await Referral.findOne({ friendPhone: phone, status: 'pending' });
        if (existingReferral) {
          const referrer = await Delivery.findById(existingReferral.referrer);
          if (referrer) verifiedReferrer = referrer.deliveryId;
        } else if (referralCode) {
          const referrer = await Delivery.findOne({ deliveryId: referralCode.trim().toUpperCase() });
          if (referrer) {
            verifiedReferrer = referrer.deliveryId;
            await Referral.create({
              referrer: referrer._id,
              friendName: normalizedName || 'Delivery Partner',
              friendPhone: phone,
              status: 'pending'
            }).catch(err => logger.error(`Error creating Referral: ${err.message}`));
          }
        }

        const deliveryData = {
          name: normalizedName || 'Delivery Partner',
          phone,
          phoneVerified: true,
          signupMethod: 'phone',
          status: 'pending',
          isActive: true,
          referredBy: verifiedReferrer,
          referralStatus: verifiedReferrer ? 'pending' : null
        };

        try {
          delivery = await Delivery.create(deliveryData);
          if (verifiedReferrer) {
            await Referral.findOneAndUpdate(
              { friendPhone: phone, status: 'pending' },
              { status: 'signed_up', signedUpAs: delivery._id }
            ).catch(err => logger.error(`Error updating Referral: ${err.message}`));
          }
        } catch (createError) {
          if (createError.code === 11000) {
            delivery = await Delivery.findOne({ phone });
            if (!delivery) throw createError;
          } else {
            throw createError;
          }
        }
      } else {
        if (!delivery.phoneVerified) {
          delivery.phoneVerified = true;
          await delivery.save();
        }
      }
    }

    // Common Token & Response Logic
    const needsSignup = !delivery.location?.city || 
                       !delivery.vehicle?.number || 
                       !delivery.documents?.pan?.number ||
                       !delivery.documents?.aadhar?.number ||
                       !delivery.documents?.aadhar?.document ||
                       !delivery.documents?.pan?.document ||
                       !delivery.documents?.drivingLicense?.document;

    if (!delivery.isActive && delivery.status !== 'blocked' && delivery.status !== 'pending') {
      return errorResponse(res, 403, 'Your account has been deactivated. Please contact support.');
    }

    const tokens = jwtService.generateTokens({
      userId: delivery._id.toString(),
      role: 'delivery',
      email: delivery.email || delivery.phone || delivery.deliveryId
    });

    delivery.refreshToken = tokens.refreshToken;
    delivery.lastLogin = new Date();
    await delivery.save();

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return successResponse(res, 200, needsSignup ? 'OTP verified. Please complete your profile.' : 'Authentication successful', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: delivery._id,
        deliveryId: delivery.deliveryId,
        name: delivery.name,
        email: delivery.email,
        phone: delivery.phone,
        phoneVerified: delivery.phoneVerified,
        status: delivery.status,
        rejectionReason: delivery.rejectionReason || null,
        profileImage: delivery.profileImage,
        metrics: delivery.metrics,
        earnings: delivery.earnings
      },
      needsSignup
    });
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    return errorResponse(res, 400, error.message);
  }
});

/**
 * Refresh Access Token
 * POST /api/delivery/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.headers['x-refresh-token'];
  if (!refreshToken) return errorResponse(res, 401, 'Refresh token not found');

  try {
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    if (decoded.role !== 'delivery') return errorResponse(res, 401, 'Invalid token for delivery');

    const delivery = await Delivery.findById(decoded.userId).select('+refreshToken');
    if (!delivery || !delivery.isActive) return errorResponse(res, 401, 'Delivery boy not found or inactive');
    if (delivery.refreshToken !== refreshToken) return errorResponse(res, 401, 'Invalid refresh token');

    const accessToken = jwtService.generateAccessToken({
      userId: delivery._id.toString(),
      role: 'delivery',
      email: delivery.email || delivery.phone || delivery.deliveryId
    });

    return successResponse(res, 200, 'Token refreshed successfully', { accessToken });
  } catch (error) {
    return errorResponse(res, 401, error.message || 'Invalid refresh token');
  }
});

/**
 * Logout
 * POST /api/delivery/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  if (req.delivery) {
    req.delivery.refreshToken = null;
    await req.delivery.save();
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return successResponse(res, 200, 'Logged out successfully');
});

/**
 * Get current delivery boy
 * GET /api/delivery/auth/me
 */
export const getCurrentDelivery = asyncHandler(async (req, res) => {
  return successResponse(res, 200, 'Delivery boy retrieved successfully', {
    user: {
      id: req.delivery._id,
      deliveryId: req.delivery.deliveryId,
      name: req.delivery.name,
      email: req.delivery.email,
      phone: req.delivery.phone,
      phoneVerified: req.delivery.phoneVerified,
      signupMethod: req.delivery.signupMethod,
      profileImage: req.delivery.profileImage,
      isActive: req.delivery.isActive,
      status: req.delivery.status,
      location: req.delivery.location,
      vehicle: req.delivery.vehicle,
      documents: req.delivery.documents,
      availability: req.delivery.availability,
      metrics: req.delivery.metrics,
      earnings: req.delivery.earnings,
      wallet: req.delivery.wallet,
      level: req.delivery.level,
      lastLogin: req.delivery.lastLogin
    }
  });
});

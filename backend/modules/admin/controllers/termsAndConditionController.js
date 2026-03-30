import TermsAndCondition from '../models/TermsAndCondition.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import asyncHandler from '../../../shared/middleware/asyncHandler.js';

/**
 * Get Terms and Condition (Public)
 * GET /api/terms/public
 */
export const getTermsPublic = asyncHandler(async (req, res) => {
  try {
    const terms = await TermsAndCondition.findOne({ isActive: true })
      .select('-updatedBy -createdAt -updatedAt -__v')
      .lean();

    if (!terms) {
      // Return default data if no terms exists
      return successResponse(res, 200, 'Terms and conditions retrieved successfully', {
        title: 'Terms and Conditions',
        content: '<p>No terms and conditions available at the moment.</p>'
      });
    }

    return successResponse(res, 200, 'Terms and conditions retrieved successfully', terms);
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    return errorResponse(res, 500, 'Failed to fetch terms and conditions');
  }
});

/**
 * Get Terms and Condition (Admin)
 * GET /api/admin/terms
 */
export const getTerms = asyncHandler(async (req, res) => {
  try {
    let terms = await TermsAndCondition.findOne({ isActive: true }).lean();

    if (!terms) {
      // Create default terms if it doesn't exist
      terms = await TermsAndCondition.create({
        title: 'Terms and Conditions',
        content: '<p>Welcome to Maava. These Terms and Conditions govern your use of our food delivery platform. By accessing or using our services, you agree to be bound by these terms.</p><p><strong>1. Acceptance of Terms</strong></p><p>By using the Maava platform, you confirm that you are at least 18 years old and capable of entering into a legally binding agreement.</p><p><strong>2. User Accounts</strong></p><p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>',
        updatedBy: req.admin._id
      });
    }

    return successResponse(res, 200, 'Terms and conditions retrieved successfully', terms);
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    return errorResponse(res, 500, 'Failed to fetch terms and conditions');
  }
});

/**
 * Update Terms and Condition
 * PUT /api/admin/terms
 */
export const updateTerms = asyncHandler(async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate required fields
    if (!content) {
      return errorResponse(res, 400, 'Content is required');
    }

    // Find existing terms or create new one
    let terms = await TermsAndCondition.findOne({ isActive: true });

    if (!terms) {
      terms = new TermsAndCondition({
        title: title || 'Terms and Conditions',
        content,
        updatedBy: req.admin._id
      });
    } else {
      if (title !== undefined) terms.title = title;
      terms.content = content;
      terms.updatedBy = req.admin._id;
    }

    await terms.save();

    return successResponse(res, 200, 'Terms and conditions updated successfully', terms);
  } catch (error) {
    console.error('Error updating terms and conditions:', error);
    return errorResponse(res, 500, 'Failed to update terms and conditions');
  }
});


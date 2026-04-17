import Support from '../models/Support.js';
import asyncHandler from '../../../shared/middleware/asyncHandler.js';

/**
 * @desc    Get support content
 * @route   GET /api/admin/support
 * @access  Private (Admin)
 */
export const getSupport = asyncHandler(async (req, res) => {
  let support = await Support.findOne({ isActive: true });

  if (!support) {
    // Create default if not exists
    support = await Support.create({
      title: 'Support & FAQ',
      content: '<p>Welcome to support. Please edit this content in the admin panel.</p>'
    });
  }

  res.status(200).json({
    success: true,
    data: support
  });
});

/**
 * @desc    Get support content (Public)
 * @route   GET /api/support/public
 * @access  Public
 */
export const getSupportPublic = asyncHandler(async (req, res) => {
  const support = await Support.findOne({ isActive: true });

  res.status(200).json({
    success: true,
    data: support || { title: 'Support & FAQ', content: '' }
  });
});

/**
 * @desc    Update support content
 * @route   PUT /api/admin/support
 * @access  Private (Admin)
 */
export const updateSupport = asyncHandler(async (req, res) => {
  let support = await Support.findOne({ isActive: true });

  if (support) {
    support.title = req.body.title || support.title;
    support.content = req.body.content || support.content;
    support.updatedBy = req.admin._id;
    await support.save();
  } else {
    support = await Support.create({
      title: req.body.title || 'Support & FAQ',
      content: req.body.content,
      updatedBy: req.admin._id
    });
  }

  res.status(200).json({
    success: true,
    data: support
  });
});

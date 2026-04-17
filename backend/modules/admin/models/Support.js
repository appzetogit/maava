import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Support & FAQ',
      trim: true
    },
    content: {
      type: String,
      required: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
supportSchema.index({ isActive: 1 });

export default mongoose.model('Support', supportSchema);

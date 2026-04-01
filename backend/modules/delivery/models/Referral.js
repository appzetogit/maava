import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    index: true
  },
  friendName: {
    type: String,
    required: true,
    trim: true
  },
  friendPhone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'signed_up', 'completed'],
    default: 'pending'
  },
  signedUpAs: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  }
}, {
  timestamps: true
});

// Compound unique index to prevent same partner referring same phone twice
referralSchema.index({ referrer: 1, friendPhone: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;

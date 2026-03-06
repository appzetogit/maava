import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    zone: {
        type: String,
        default: 'All'
    },
    target: {
        type: String,
        enum: ['Customer', 'Delivery Man', 'Restaurant'],
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    // Tracking Firebase stats
    stats: {
        successCount: { type: Number, default: 0 },
        failureCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Virtual for SI (Serial Indexing) or simple ID
notificationSchema.virtual('sl').get(function () {
    return this._id;
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

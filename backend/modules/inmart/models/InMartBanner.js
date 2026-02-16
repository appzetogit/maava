import mongoose from 'mongoose';

const inmartBannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            enum: ['Hero', 'Promo', 'Offer', 'Campaign'],
            default: 'Hero',
        },
        image: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            default: '',
        },
        publicId: {
            type: String,
            default: '',
        },
        percentageOff: {
            type: String,
            default: '',
        },
        tagline: {
            type: String,
            default: '',
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            default: null,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InMartStore',
            default: null,
        },
        collection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InMartCollection',
            default: null,
        },
        linkUrl: {
            type: String,
            default: '',
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

inmartBannerSchema.index({ isActive: 1, displayOrder: 1 });
inmartBannerSchema.index({ type: 1 });

export default mongoose.model('InMartBanner', inmartBannerSchema);

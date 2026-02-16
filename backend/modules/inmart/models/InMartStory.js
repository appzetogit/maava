import mongoose from 'mongoose';

const inmartStorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
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
        linkUrl: {
            type: String,
            default: '',
        },
        collection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InMartCollection',
            default: null,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

inmartStorySchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.model('InMartStory', inmartStorySchema);

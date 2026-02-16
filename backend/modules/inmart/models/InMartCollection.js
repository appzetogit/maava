import mongoose from 'mongoose';

const inmartCollectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            enum: ['sale', 'newly-launched', 'best-sellers', 'trending', 'custom'],
            default: 'custom',
        },
        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'InMartProduct',
            }
        ],
        displayOrder: {
            type: Number,
            default: 0,
        },
        themeColor: {
            type: String, // Hex color: "#8B5CF6", "#21C063", "#FD8930"
            default: '#8B5CF6',
        },
        bannerImage: {
            type: String,
            default: '',
        },
        icon: {
            type: String, // Lucide icon name
            default: 'Tag',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVisible: {
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

// Generate slug from name if not provided
inmartCollectionSchema.pre('save', async function (next) {
    if (this.name && !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!baseSlug) {
            baseSlug = `collection-${Date.now()}`;
        }

        this.slug = baseSlug;
    }

    next();
});

inmartCollectionSchema.index({ slug: 1 });
inmartCollectionSchema.index({ type: 1, isActive: 1 });
inmartCollectionSchema.index({ displayOrder: 1 });

export default mongoose.model('InMartCollection', inmartCollectionSchema);

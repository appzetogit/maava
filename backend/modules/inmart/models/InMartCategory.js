import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
    id: String,
    name: {
        type: String,
        required: true,
    },
    slug: String,
    image: String,
    level: {
        type: String,
        default: 'sub',
    },
    displayOrder: {
        type: Number,
        default: 0,
    },
    children: [
        {
            id: String,
            name: String,
            slug: String,
            image: String,
            level: {
                type: String,
                default: 'child',
            },
            displayOrder: {
                type: Number,
                default: 0,
            },
        }
    ],
});

const inmartCategorySchema = new mongoose.Schema(
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
        icon: {
            type: String, // Lucide icon name: "ShoppingBag", "Heart", "Coffee"
            default: 'ShoppingBag',
        },
        image: {
            type: String,
            default: '',
        },
        themeColor: {
            type: String, // Hex color: "#BFF7D4", "#8B5CF6"
            default: '#8B5CF6',
        },
        level: {
            type: String,
            enum: ['main', 'sub', 'child'],
            default: 'main',
        },
        subCategories: [subCategorySchema],
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Generate slug from name if not provided
inmartCategorySchema.pre('save', async function (next) {
    if (this.name && !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!baseSlug) {
            baseSlug = `category-${Date.now()}`;
        }

        this.slug = baseSlug;
    }

    next();
});

inmartCategorySchema.index({ slug: 1 });
inmartCategorySchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.model('InMartCategory', inmartCategorySchema);

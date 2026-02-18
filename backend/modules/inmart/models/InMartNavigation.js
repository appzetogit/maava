import mongoose from 'mongoose';

const inmartNavigationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String, // Lucide icon name: "ShoppingBag", "Home", "Gamepad2", etc.
            required: true,
            default: 'ShoppingBag',
        },
        themeColor: {
            type: String, // Hex color: "#D3AEFE", "#BFF7D4", etc.
            required: true,
            default: '#8B5CF6',
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        link: {
            type: String, // Optional link or slug 
            default: '',
        },
        targetType: {
            type: String,
            enum: ['category', 'collection', 'external', 'none'],
            default: 'category'
        },
        targetId: {
            type: String, // Can be category slug or collection slug
            default: ''
        },
        featuredCategories: [
            {
                categoryId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'InMartCategory'
                },
                subCategoryIds: [String] // Array of slugs or IDs of sub-categories to show
            }
        ]
    },
    {
        timestamps: true,
    }
);

inmartNavigationSchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.model('InMartNavigation', inmartNavigationSchema);

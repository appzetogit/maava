import mongoose from 'mongoose';

const inmartProductSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            unique: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InMartStore',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            trim: true,
        },
        brand: {
            type: String,
            default: '',
        },
        weight: {
            type: String, // "1 pack (1 kg)", "500 g", "1 L"
            default: '',
        },
        image: {
            type: String,
            default: '',
        },
        images: {
            type: [String],
            default: [],
        },
        category: {
            type: String, // "Grocery & Kitchen", "Beauty & Wellness"
            required: true,
            index: true,
        },
        subCategory: {
            type: String, // "Fresh Vegetables", "Bath and Body"
            default: '',
        },
        childCategory: {
            type: String, // "Leafy and Seasonings", "Potatoes, Onions & Tomatoes"
            default: '',
        },
        price: {
            type: Number,
            required: true,
        },
        originalPrice: {
            type: Number,
            default: null,
        },
        discount: {
            type: String, // "52%", "20% OFF"
            default: '',
        },
        discountType: {
            type: String,
            enum: ['Percent', 'Fixed', ''],
            default: '',
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        stock: {
            type: mongoose.Schema.Types.Mixed, // Number or "Unlimited"
            default: 'Unlimited',
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalRatings: {
            type: Number,
            default: 0,
        },
        reviews: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
            default: '',
        },
        tags: {
            type: [String],
            default: [],
        },
        nutrition: {
            calories: Number,
            protein: String,
            carbs: String,
            fat: String,
        },
        allergies: {
            type: [String],
            default: [],
        },
        barcode: {
            type: String,
            default: '',
        },
        sku: {
            type: String,
            default: '',
        },
        expiryDate: {
            type: Date,
            default: null,
        },
        // Flags
        isNew: {
            type: Boolean,
            default: false,
        },
        isBestSeller: {
            type: Boolean,
            default: false,
        },
        isOnSale: {
            type: Boolean,
            default: false,
        },
        isTrending: {
            type: Boolean,
            default: false,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        // Delivery
        deliveryTime: {
            type: String,
            default: '10 MINS',
        },
        // Admin approval
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'approved',
        },
        rejectionReason: {
            type: String,
            default: '',
        },
        approvedAt: Date,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
    },
    {
        timestamps: true,
    }
);

// Generate productId before saving
inmartProductSchema.pre('save', async function (next) {
    if (!this.productId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        this.productId = `PROD-${timestamp}-${random}`;
    }

    // Generate slug from name if not provided
    if (this.name && !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!baseSlug) {
            baseSlug = `product-${this.productId}`;
        }

        this.slug = baseSlug;
    }

    next();
});

// Indexes for faster queries
inmartProductSchema.index({ store: 1, isAvailable: 1 });
inmartProductSchema.index({ category: 1, subCategory: 1 });
inmartProductSchema.index({ isNew: 1, isOnSale: 1, isBestSeller: 1, isTrending: 1 });
inmartProductSchema.index({ name: 'text', brand: 'text', tags: 'text' }); // Text search
inmartProductSchema.index({ price: 1 });
inmartProductSchema.index({ slug: 1 });

export default mongoose.model('InMartProduct', inmartProductSchema);

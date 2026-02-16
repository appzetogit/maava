import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    coordinates: {
        type: [Number], // [longitude, latitude] for geospatial queries
        default: undefined
    },
    formattedAddress: String,
    address: String,
    addressLine1: String,
    addressLine2: String,
    area: String,
    city: String,
    state: String,
    landmark: String,
    zipCode: String,
    pincode: String,
    postalCode: String,
    street: String,
});

const operatingHoursSchema = new mongoose.Schema({
    openingTime: String,
    closingTime: String,
});

const inmartStoreSchema = new mongoose.Schema(
    {
        storeId: {
            type: String,
            unique: true,
        },
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
        ownerName: {
            type: String,
            required: true,
        },
        ownerEmail: {
            type: String,
            default: '',
        },
        ownerPhone: {
            type: String,
            required: true,
        },
        primaryContactNumber: String,
        location: locationSchema,
        storeImage: {
            url: String,
            publicId: String,
        },
        categories: [String], // ["Grocery", "Beauty", "Snacks", "Household"]
        operatingHours: operatingHoursSchema,
        openDays: [String],
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
        isActive: {
            type: Boolean,
            default: true,
        },
        isAcceptingOrders: {
            type: Boolean,
            default: true,
        },
        deliveryTime: {
            type: String,
            default: "15-20 mins",
        },
        minimumOrder: {
            type: Number,
            default: 99,
        },
        deliveryFee: {
            type: Number,
            default: 29,
        },
        freeDeliveryAbove: {
            type: Number,
            default: 199,
        },
    },
    {
        timestamps: true,
    }
);

// Generate storeId before saving
inmartStoreSchema.pre('save', async function (next) {
    if (!this.storeId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        this.storeId = `STORE-${timestamp}-${random}`;
    }

    // Generate slug from name if not provided
    if (this.name && !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!baseSlug) {
            baseSlug = `store-${this.storeId}`;
        }

        this.slug = baseSlug;
    }

    next();
});

// Geospatial index for location-based queries
inmartStoreSchema.index({ "location.coordinates": "2dsphere" });
inmartStoreSchema.index({ slug: 1 });
inmartStoreSchema.index({ isActive: 1, isAcceptingOrders: 1 });

export default mongoose.model('InMartStore', inmartStoreSchema);

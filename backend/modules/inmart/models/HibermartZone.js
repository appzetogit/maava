import mongoose from 'mongoose';

const hibermartCoordinateSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
}, { _id: false });

const hibermartZoneSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        serviceLocation: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true,
            default: 'India'
        },
        zoneName: {
            type: String,
            trim: true
        },
        unit: {
            type: String,
            enum: ['kilometer', 'miles'],
            default: 'kilometer'
        },
        // Polygon points
        coordinates: {
            type: [hibermartCoordinateSchema],
            required: true,
            validate: {
                validator: (coords) => coords.length >= 3,
                message: 'Zone must have at least 3 coordinates'
            }
        },
        // GeoJSON polygon for spatial queries
        boundary: {
            type: {
                type: String,
                enum: ['Polygon'],
                default: 'Polygon'
            },
            coordinates: {
                type: [[[Number]]],
                required: false
            }
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        }
    },
    { timestamps: true }
);

// Separate collection name: 'hibermartz ones'
hibermartZoneSchema.index({ isActive: 1 });
hibermartZoneSchema.index({ boundary: '2dsphere' });
hibermartZoneSchema.index({ serviceLocation: 'text', name: 'text' });

// Pre-save: build GeoJSON boundary
hibermartZoneSchema.pre('save', function (next) {
    if (this.coordinates && this.coordinates.length >= 3) {
        const geoJsonCoords = this.coordinates.map(c => [c.longitude, c.latitude]);
        geoJsonCoords.push(geoJsonCoords[0]); // close polygon
        this.boundary = { type: 'Polygon', coordinates: [geoJsonCoords] };
    }
    next();
});

// Point-in-polygon check
hibermartZoneSchema.methods.containsPoint = function (latitude, longitude) {
    if (!this.boundary?.coordinates) return false;
    const coords = this.boundary.coordinates[0];
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        const [xi, yi] = coords[i];
        const [xj, yj] = coords[j];
        const intersect =
            yi > longitude !== yj > longitude &&
            latitude < ((xj - xi) * (longitude - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
};

// Stored in 'hibemart_zones' collection — totally separate from 'zones'
export default mongoose.model('HibermartZone', hibermartZoneSchema, 'hibermart_zones');

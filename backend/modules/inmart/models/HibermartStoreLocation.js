import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  coordinates: {
    type: [Number], // [longitude, latitude]
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
  street: String
}, { _id: false });

const hibermartStoreLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Hibermart Store',
      trim: true
    },
    location: locationSchema,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

hibermartStoreLocationSchema.statics.getOrCreate = async function() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({
      name: 'Hibermart Store',
      location: {}
    });
  }
  return doc;
};

export default mongoose.model('HibermartStoreLocation', hibermartStoreLocationSchema, 'hibermart_store_location');

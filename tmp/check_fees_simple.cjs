
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const FeeSettingsSchema = new mongoose.Schema({
  deliveryFee: Number,
  freeDeliveryThreshold: Number,
  platformFee: Number,
  gstRate: Number,
  isActive: Boolean
}, { collection: 'feesettings' });

const RestaurantSchema = new mongoose.Schema({
  name: String,
  freeDeliveryAbove: Number,
}, { collection: 'restaurants' });

const FeeSettings = mongoose.model('FeeSettings', FeeSettingsSchema);
const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const feeSettings = await FeeSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    if (feeSettings) {
      console.log('--- FEE SETTINGS ---');
      console.log('Delivery Fee:', feeSettings.deliveryFee);
      console.log('Free Delivery Threshold:', feeSettings.freeDeliveryThreshold);
      console.log('Platform Fee:', feeSettings.platformFee);
      console.log('GST Rate:', feeSettings.gstRate);
    } else {
      console.log('No active fee settings found');
    }

    const restaurant = await Restaurant.findOne({ name: /Test Restaurant/i }).lean();
    if (restaurant) {
      console.log('--- RESTAURANT SETTINGS ---');
      console.log('Restaurant Name:', restaurant.name);
      console.log('Free Delivery Above:', restaurant.freeDeliveryAbove);
    } else {
      console.log('Test Restaurant not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();

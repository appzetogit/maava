
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas to match the models
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
    console.log('Connected to MongoDB');

    const feeSettings = await FeeSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    console.log('Active Fee Settings:', JSON.stringify(feeSettings, null, 2));

    const restaurants = await Restaurant.find({ name: /Test Restaurant/i }).lean();
    console.log('Test Restaurants Found:', restaurants.length);
    if (restaurants.length > 0) {
      console.log('Test Restaurant Settings:', JSON.stringify(restaurants[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();

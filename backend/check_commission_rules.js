import mongoose from 'mongoose';
import DeliveryBoyCommission from './modules/admin/models/DeliveryBoyCommission.js';
import Admin from './modules/admin/models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

async function addDefaultRule() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maava';
    console.log(`Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('CONNECTED TO MONGODB');

    // 1. Get an Admin ID to act as creator
    const admin = await Admin.findOne();
    if (!admin) {
      console.error('❌ No Admin found in database. Please create an admin first.');
      await mongoose.disconnect();
      return;
    }

    // 2. Check if rule already exists
    const existingRules = await DeliveryBoyCommission.find();
    if (existingRules.length > 0) {
      console.log(`⚠️ Database already has ${existingRules.length} rules. No changes made.`);
    } else {
      // 3. Create Default Rule
      const defaultRule = new DeliveryBoyCommission({
        name: 'Standard Delivery Pay',
        minDistance: 0,
        maxDistance: null, // Unlimited
        basePayout: 10,
        commissionPerKm: 5,
        status: true,
        createdBy: admin._id
      });

      await defaultRule.save();
      console.log('✅ Default Commission Rule (₹10 Base + ₹5/km) added successfully!');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

addDefaultRule();

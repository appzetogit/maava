import mongoose from 'mongoose';
import DeliveryBoyCommission from './modules/admin/models/DeliveryBoyCommission.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkRules() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maava';
    await mongoose.connect(mongoUri);
    const rules = await DeliveryBoyCommission.find();
    console.log('CURRENT_RULES_JSON:' + JSON.stringify(rules));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkRules();

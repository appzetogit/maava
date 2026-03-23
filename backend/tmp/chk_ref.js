import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Delivery from './modules/delivery/models/Delivery.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const referred = await Delivery.find({ referredBy: { $ne: null } }).select('name phone deliveryId referredBy referralStatus');
  console.log('Referred users in DB:', JSON.stringify(referred, null, 2));
  process.exit(0);
}

run();

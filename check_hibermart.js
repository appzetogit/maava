import mongoose from 'mongoose';
import Restaurant from './backend/modules/restaurant/models/Restaurant.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const h = await Restaurant.findOne({ name: /hibermart/i });
  console.log('Hibermart Restaurant:', h);
  await mongoose.disconnect();
}

check();

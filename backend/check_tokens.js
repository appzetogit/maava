import mongoose from 'mongoose';
import Restaurant from './modules/restaurant/models/Restaurant.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkTokens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const restaurants = await Restaurant.find({}).select('name fcmTokens fcmTokenMobile');
    console.log('--- Restaurant Tokens ---');
    if (restaurants.length === 0) {
      console.log('No restaurants found in DB.');
    }
    restaurants.forEach(r => {
      console.log(`Restaurant: ${r.name}`);
      console.log(`- FCM Tokens (Web/General): ${r.fcmTokens?.length || 0}`);
      console.log(`- FCM Tokens (Mobile): ${r.fcmTokenMobile?.length || 0}`);
      if (r.fcmTokens?.length > 0) console.log(`  [Tokens]: ${JSON.stringify(r.fcmTokens)}`);
      if (r.fcmTokenMobile?.length > 0) console.log(`  [Mobile Tokens]: ${JSON.stringify(r.fcmTokenMobile)}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTokens();

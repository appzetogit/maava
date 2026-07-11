import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testZones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maava');
    console.log('Connected to DB');
    
    // Load models
    const Zone = (await import('./modules/admin/models/Zone.js')).default;
    const Delivery = (await import('./modules/delivery/models/Delivery.js')).default;
    
    const count = await Zone.countDocuments();
    const zones = await Zone.find({ isActive: true }, 'name _id');
    console.log(`Total Active Zones in System: ${count}`);
    zones.forEach(z => console.log(`- ${z.name} (ID: ${z._id})`));
    
    // Check some delivery boys and their assigned zones
    const deliveryBoys = await Delivery.find().select('name availability.zones').limit(5);
    console.log('\nSample Delivery Boys Zones Check:');
    deliveryBoys.forEach(d => {
      console.log(`- ${d.name}: assigned to zones: ${d.availability?.zones || []}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testZones();


const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const DeliveryBoyCommissionSchema = new mongoose.Schema({
  name: String,
  minDistance: Number,
  maxDistance: Number,
  commissionPerKm: Number,
  basePayout: Number,
  status: Boolean
}, { collection: 'deliveryboycommissions' });

const DeliveryBoyCommission = mongoose.model('DeliveryBoyCommission', DeliveryBoyCommissionSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const rules = await DeliveryBoyCommission.find({ status: true }).sort({ minDistance: 1 }).lean();
    console.log('--- DELIVERY COMMISSION RULES ---');
    console.log(JSON.stringify(rules, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();

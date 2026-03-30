
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const OrderSettlementSchema = new mongoose.Schema({
  orderNumber: String,
  deliveryPartnerEarning: Object,
}, { collection: 'ordersettlements' });

const OrderSettlement = mongoose.model('OrderSettlement', OrderSettlementSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const settlement = await OrderSettlement.findOne({ orderNumber: /1774677315515-8/ }).lean();
    if (settlement && settlement.deliveryPartnerEarning) {
      const d = settlement.deliveryPartnerEarning;
      console.log(`RESULT_START|${d.basePayout}|${d.distance}|${d.distanceCommission}|${d.surgeAmount}|${d.tipAmount}|${d.totalEarning}|RESULT_END`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();

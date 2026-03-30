
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const OrderSettlementSchema = new mongoose.Schema({
  orderNumber: String,
  userPayment: Object,
  restaurantEarning: Object,
  deliveryPartnerEarning: Object,
  adminEarning: Object,
}, { collection: 'ordersettlements' });

const OrderSettlement = mongoose.model('OrderSettlement', OrderSettlementSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const settlement = await OrderSettlement.findOne({ orderNumber: /1774677315515-8/ }).lean();
    if (settlement) {
      console.log('--- ORDER SETTLEMENT DETAILS ---');
      console.log('User Payment:', JSON.stringify(settlement.userPayment, null, 2));
      console.log('Restaurant Earning:', JSON.stringify(settlement.restaurantEarning, null, 2));
      console.log('Delivery Partner Earning:', JSON.stringify(settlement.deliveryPartnerEarning, null, 2));
      console.log('Admin Earning:', JSON.stringify(settlement.adminEarning, null, 2));
    } else {
      console.log('Settlement not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();

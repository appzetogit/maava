
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const OrderSchema = new mongoose.Schema({
  orderId: String,
  pricing: {
    subtotal: Number,
    discount: Number,
    deliveryFee: Number,
    platformFee: Number,
    tax: Number,
    total: Number,
    breakdown: Object
  }
}, { collection: 'orders' });

const Order = mongoose.model('Order', OrderSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Using regex for orderId 
    const order = await Order.findOne({ orderId: /1774677315515-8/ }).lean();
    if (order) {
      console.log('--- ORDER PRICING ---');
      console.log('Order ID:', order.orderId);
      console.log('Pricing:', JSON.stringify(order.pricing, null, 2));
    } else {
      console.log('Order not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();


const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const OrderSchema = new mongoose.Schema({
  orderId: String,
  deliveryPartnerId: mongoose.Schema.Types.ObjectId,
  status: String,
  pricing: Object,
  assignmentInfo: Object
}, { collection: 'orders' });

const Order = mongoose.model('Order', OrderSchema);

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const order = await Order.findOne({ orderId: /1774677315515-8/ }).lean();
    if (order) {
      console.log('Order Status:', order.status);
      console.log('Delivery Partner ID:', order.deliveryPartnerId);
      console.log('Assignment Info:', JSON.stringify(order.assignmentInfo, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();

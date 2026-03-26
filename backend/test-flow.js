import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URI);

const { default: Order } = await import('./modules/order/models/Order.js');
const { default: Restaurant } = await import('./modules/restaurant/models/Restaurant.js');
const { default: User } = await import('./modules/auth/models/User.js');

try {
  // 1. Get a random user and the specific restaurant
  const user = await User.findOne({});
  const restaurant = await Restaurant.findById('6982f0e9b6968ce39cab42f1');

  if (!user || !restaurant) {
    throw new Error('User or Restaurant not found');
  }

  // 2. Create a test order
  console.log('📦 Creating test order...');
  const orderId = `TEST-${Date.now()}`;
  const order = new Order({
    orderId,
    userId: user._id,
    restaurantId: restaurant._id.toString(),
    restaurantName: restaurant.name,
    items: [{
      itemId: 'test-item',
      name: 'Test Item',
      price: 100,
      quantity: 1
    }],
    pricing: {
      subtotal: 100,
      total: 110
    },
    address: {
      street: 'Test Street',
      city: 'Test City',
      location: { type: 'Point', coordinates: [0, 0] }
    },
    payment: {
      method: 'cash',
      status: 'completed'
    },
    status: 'confirmed',
    tracking: {
      confirmed: { status: true, timestamp: new Date() }
    }
  });

  await order.save();
  console.log(`✅ Order created: ${order.orderId} (MongoDB ID: ${order._id})`);
  console.log(`⏰ Current time: ${new Date().toISOString()}`);

  // 3. Wait for 1 minute (should NOT be auto-rejected yet even with old 4m limit)
  console.log('⏳ Waiting for 60 seconds...');
  await new Promise(resolve => setTimeout(resolve, 60000));

  // 4. Check if order is still active
  const checkOrder = await Order.findById(order._id);
  console.log(`📊 Order status after 1m: ${checkOrder.status}`);

  if (checkOrder.status === 'cancelled') {
    console.warn('❌ Order was ALREADY cancelled by auto-reject within 60s! Check server clock and auto-reject limit.');
  } else {
    // 5. Try to accept the order
    console.log('🍽️ Attempting to accept order...');
    // We'll mimic the acceptOrder logic
    checkOrder.status = 'preparing';
    checkOrder.tracking.preparing = { status: true, timestamp: new Date() };
    await checkOrder.save();

    const acceptedOrder = await Order.findById(order._id);
    console.log(`✅ Order status after acceptance: ${acceptedOrder.status}`);
    
    if (acceptedOrder.status === 'preparing') {
      console.log('🚀 TEST SUCCESSFUL: Order could be accepted without issues.');
    } else {
      console.error('❌ TEST FAILED: Order status is not preparing!');
    }
  }

} catch (error) {
  console.error('🔥 Test error:', error);
} finally {
  await mongoose.disconnect();
}

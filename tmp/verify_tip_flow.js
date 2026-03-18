import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../backend/modules/order/models/Order.js';
import OrderSettlement from '../backend/modules/order/models/OrderSettlement.js';
import { calculateOrderSettlement } from '../backend/modules/order/services/orderSettlementService.js';

dotenv.config({ path: '../backend/.env' });

const testTipFlow = async () => {
  try {
    // 1. Connect to DB
    if (!process.env.MONGODB_URI) {
       console.error('❌ MONGODB_URI not found in .env');
       process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Create a Mock Order with a tip
    const testOrderId = `TEST-TIP-${Date.now()}`;
    const mockOrder = await Order.create({
      orderId: testOrderId,
      userId: new mongoose.Types.ObjectId(),
      restaurantId: 'hibermart-id',
      restaurantName: 'Hibermart',
      isHibermartOrder: true,
      items: [{ name: 'Test item', price: 100, quantity: 1 }],
      pricing: {
        subtotal: 100,
        deliveryFee: 20,
        platformFee: 5,
        tax: 5,
        discount: 0,
        deliveryTip: 15, // THE TIP
        total: 145 // 100+20+5+5+15
      },
      status: 'delivered',
      payment: {
        method: 'wallet',
        status: 'completed'
      }
    });

    console.log('📦 Created test order with tip: ₹15');

    // 3. Run settlement calculation
    const settlement = await calculateOrderSettlement(mockOrder._id);
    
    console.log('\n📊 Settlement Results:');
    console.log('---------------------');
    console.log(`User Total Paid: ₹${settlement.userPayment.total}`);
    console.log(`User Tip Paid: ₹${settlement.userPayment.tipAmount}`);
    console.log(`Delivery Partner Base Earning: ₹${(settlement.deliveryPartnerEarning.totalEarning - settlement.deliveryPartnerEarning.tipAmount).toFixed(2)}`);
    console.log(`Delivery Partner Tip Earning: ₹${settlement.deliveryPartnerEarning.tipAmount}`);
    console.log(`Delivery Partner Total Earning: ₹${settlement.deliveryPartnerEarning.totalEarning}`);

    // 4. Verification
    const isTipCorrectInUserPayment = settlement.userPayment.tipAmount === 15;
    const isTipCorrectInPartnerEarning = settlement.deliveryPartnerEarning.tipAmount === 15;
    const isTotalCorrect = settlement.deliveryPartnerEarning.totalEarning >= 15;

    if (isTipCorrectInUserPayment && isTipCorrectInPartnerEarning && isTotalCorrect) {
      console.log('\n✅ TEST PASSED: Tip flow is working correctly!');
    } else {
      console.log('\n❌ TEST FAILED: Tip flow calculation mismatch.');
      if (!isTipCorrectInUserPayment) console.log(`- Expected User Tip ₹15, got ₹${settlement.userPayment.tipAmount}`);
      if (!isTipCorrectInPartnerEarning) console.log(`- Expected Partner Tip ₹15, got ₹${settlement.deliveryPartnerEarning.tipAmount}`);
    }

    // 5. Cleanup
    await Order.deleteOne({ _id: mockOrder._id });
    await OrderSettlement.deleteOne({ orderId: mockOrder._id });
    console.log('\n🧹 Cleanup complete.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Error:', error);
    process.exit(1);
  }
};

testTipFlow();

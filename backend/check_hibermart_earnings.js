import mongoose from 'mongoose';
import Order from './modules/order/models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkHibermartOrders() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maava';
    await mongoose.connect(mongoUri);
    console.log('CONNECTED TO MONGODB');

    const hibermartFilter = {
        $or: [
            { isHibermartOrder: true },
            { restaurantId: 'hibermart-id' },
            { restaurantName: { $regex: /^hibermart$/i } }
        ]
    };

    const orders = await Order.find(hibermartFilter).lean();
    console.log(`\nFound ${orders.length} Hibermart orders.`);
    
    if (orders.length > 0) {
        const statuses = {};
        const paymentStatuses = {};
        let totalRevenue = 0;
        
        orders.forEach(o => {
            statuses[o.status] = (statuses[o.status] || 0) + 1;
            const pStatus = o.payment?.status || 'missing';
            paymentStatuses[pStatus] = (paymentStatuses[pStatus] || 0) + 1;
            
            if (o.status !== 'cancelled') {
                totalRevenue += (o.pricing?.total || 0);
            }
        });
        
        console.log('\nOrder Statuses:', statuses);
        console.log('Payment Statuses:', paymentStatuses);
        console.log('Potential Total Revenue (excluding cancelled): ₹', totalRevenue);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkHibermartOrders();

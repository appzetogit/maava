import mongoose from 'mongoose';
import Restaurant from './modules/restaurant/models/Restaurant.js';
import User from './modules/auth/models/User.js';
import Delivery from './modules/delivery/models/Delivery.js';
import Order from './modules/order/models/Order.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const orders = await Order.find().sort({ createdAt: -1 }).limit(1);
        if (orders.length === 0) { console.log('No orders'); process.exit(0); }
        const order = orders[0];
        console.log('--- Testing Current Order Trigger Targets ---');
        console.log('Order ID:', order.orderId);
        console.log('Restaurant Target ID:', order.restaurantId);
        console.log('User Target ID:', order.userId);
        console.log('Delivery Partner Target ID:', order.deliveryPartnerId);

        const restaurant = await Restaurant.findOne({ restaurantId: order.restaurantId });
        console.log('Restaurant Found:', !!restaurant, restaurant ? restaurant.name : 'N/A');
        console.log('Restaurant Tokens:', restaurant?.fcmTokenMobile?.length || 0);

        const user = await User.findById(order.userId);
        console.log('User Found:', !!user, user ? user.name : 'N/A');
        console.log('User Tokens:', user?.fcmTokenMobile?.length || 0);

        const delivery = await Delivery.findById(order.deliveryPartnerId);
        console.log('Delivery Found:', !!delivery, delivery ? delivery.name : 'N/A');
        console.log('Delivery Tokens:', delivery?.fcmTokenMobile?.length || 0);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

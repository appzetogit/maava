import mongoose from 'mongoose';
import Order from './modules/order/models/Order.js';
import User from './modules/auth/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
        for (const o of orders) {
            const u = await User.findById(o.userId);
            console.log(`Order: ${o.orderId}, User: ${u ? u.name : 'Unknown'}, UserID: ${o.userId}, MobileTokens: ${u && u.fcmTokenMobile ? u.fcmTokenMobile.length : 0}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

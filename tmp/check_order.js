import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../backend/modules/order/models/Order.js';

dotenv.config({ path: '../backend/.env' });

async function checkOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const orderId = '69afff130037edc11310b888';
        const order = await Order.findById(orderId).lean();

        if (!order) {
            console.log('Order not found');
        } else {
            console.log('Order found:', JSON.stringify(order, null, 2));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrder();

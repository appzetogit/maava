const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

async function checkOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const orderId = '69afff130037edc11310b888';
        const db = mongoose.connection.db;
        const order = await db.collection('orders').findOne({ _id: new mongoose.Types.ObjectId(orderId) });

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

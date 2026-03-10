const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function checkOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const orderId = '69afff130037edc11310b888';
        const order = await mongoose.connection.db.collection('orders').findOne({
            $or: [
                { _id: new mongoose.Types.ObjectId(orderId) },
                { orderId: orderId }
            ]
        });

        if (!order) {
            console.log('Order not found');
            return;
        }

        console.log('Order Details:');
        console.log(JSON.stringify({
            orderId: order.orderId,
            status: order.status,
            isHibermartOrder: order.isHibermartOrder,
            restaurantId: order.restaurantId,
            restaurantName: order.restaurantName,
            adminApproval: order.adminApproval,
            payment: order.payment
        }, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkOrder();

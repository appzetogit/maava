
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: 'c:/Users/Hp/OneDrive/Desktop/Maava1/maava-main/backend/.env' });

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema);

async function clearHibermartOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const filter = {
            $or: [
                { isHibermartOrder: true },
                { restaurantId: 'hibermart-id' },
                { restaurantName: { $regex: /^hibermart$/i } }
            ]
        };

        const count = await Order.countDocuments(filter);
        console.log(`Found ${count} Hibermart orders.`);

        const result = await Order.deleteMany(filter);
        console.log(`Deleted ${result.deletedCount} Hibermart orders.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearHibermartOrders();

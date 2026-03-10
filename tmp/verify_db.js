import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema);

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const hibermartMatch = {
            $or: [
                { isHibermartOrder: true },
                { restaurantId: 'hibermart-id' },
                { restaurantName: { $regex: /^hibermart$/i } }
            ]
        };

        const count = await Order.countDocuments(hibermartMatch);
        console.log(`📊 Total Hibermart Orders in DB: ${count}`);

        const pendingCount = await Order.countDocuments({
            ...hibermartMatch,
            'adminApproval.status': 'pending'
        });
        console.log(`⏳ Pending Hibermart Orders: ${pendingCount}`);

        const sample = await Order.findOne(hibermartMatch).select('orderId status adminApproval').lean();
        if (sample) {
            console.log('📝 Sample Order Data:', JSON.stringify(sample, null, 2));
        }

    } catch (err) {
        console.error('❌ Error checking DB:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDB();

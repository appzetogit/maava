import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const UserSchema = new mongoose.Schema({
    fcmTokens: [String],
    fcmTokenMobile: [String]
}, { strict: false });

const DeliverySchema = new mongoose.Schema({
    fcmTokens: [String],
    fcmTokenMobile: [String]
}, { strict: false });

const RestaurantSchema = new mongoose.Schema({
    fcmTokens: [String],
    fcmTokenMobile: [String]
}, { strict: false });

async function checkCount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        const User = mongoose.model('User', UserSchema);
        const users = await User.find({
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        });
        const userTokens = users.flatMap(u => [...(u.fcmTokens || []), ...(u.fcmTokenMobile || [])]);
        console.log(`🙋 CUSTOMERS WITH TOKENS: ${users.length} (${userTokens.length} total tokens)`);

        const Delivery = mongoose.model('Delivery', DeliverySchema);
        const delivery = await Delivery.find({
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        });
        const deliveryTokens = delivery.flatMap(d => [...(d.fcmTokens || []), ...(d.fcmTokenMobile || [])]);
        console.log(`🚚 DELIVERY WITH TOKENS: ${delivery.length} (${deliveryTokens.length} total tokens)`);

        const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
        const restaurants = await Restaurant.find({
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        });
        const restaurantTokens = restaurants.flatMap(r => [...(r.fcmTokens || []), ...(r.fcmTokenMobile || [])]);
        console.log(`🍽️ RESTAURANTS WITH TOKENS: ${restaurants.length} (${restaurantTokens.length} total tokens)`);

    } catch (err) {
        console.error('❌ Error checking counts:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCount();

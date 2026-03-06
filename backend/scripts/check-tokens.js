
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkTokens = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Define minimal schemas to avoid duplicate index issues in dev
        const TokenSchema = new mongoose.Schema({ fcmTokens: [String] });

        const User = mongoose.models.User || mongoose.model('User', TokenSchema);
        const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', TokenSchema);
        const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', TokenSchema);

        const userCount = await User.countDocuments({ fcmTokens: { $exists: true, $ne: [] } });
        const deliveryCount = await Delivery.countDocuments({ fcmTokens: { $exists: true, $ne: [] } });
        const restaurantCount = await Restaurant.countDocuments({ fcmTokens: { $exists: true, $ne: [] } });

        console.log('--- FCM Token Counts ---');
        console.log('Users:', userCount);
        console.log('Delivery Partners:', deliveryCount);
        console.log('Restaurants:', restaurantCount);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error checking tokens:', err.message);
        process.exit(1);
    }
};

checkTokens();

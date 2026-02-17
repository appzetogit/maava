import mongoose from 'mongoose';
import InMartBanner from '../modules/inmart/models/InMartBanner.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearBanners = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in .env file');
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const result = await InMartBanner.deleteMany({});
        console.log(`🗑️ Cleared ${result.deletedCount} banners`);

        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing banners:', error);
        process.exit(1);
    }
};

clearBanners();

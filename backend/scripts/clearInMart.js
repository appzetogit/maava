import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import InMartStore from '../modules/inmart/models/InMartStore.js';
import InMartProduct from '../modules/inmart/models/InMartProduct.js';
import InMartCategory from '../modules/inmart/models/InMartCategory.js';
import InMartCollection from '../modules/inmart/models/InMartCollection.js';
import InMartBanner from '../modules/inmart/models/InMartBanner.js';
import InMartStory from '../modules/inmart/models/InMartStory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearInMart = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing all InMart data...');

        const results = await Promise.all([
            InMartStore.deleteMany({}),
            InMartProduct.deleteMany({}),
            InMartCategory.deleteMany({}),
            InMartCollection.deleteMany({}),
            InMartBanner.deleteMany({}),
            InMartStory.deleteMany({})
        ]);

        console.log('✅ InMart data cleared successfully:');
        console.log(`   • Stores removed: ${results[0].deletedCount}`);
        console.log(`   • Products removed: ${results[1].deletedCount}`);
        console.log(`   • Categories removed: ${results[2].deletedCount}`);
        console.log(`   • Collections removed: ${results[3].deletedCount}`);
        console.log(`   • Banners removed: ${results[4].deletedCount}`);
        console.log(`   • Stories removed: ${results[5].deletedCount}`);

        // Re-create the basic Hibermart store since most operations depend on it
        console.log('🏪 Re-creating base Hibermart Store (operational base)...');
        await InMartStore.create({
            storeId: "STORE-HIBERMART-001",
            name: "Hibermart",
            slug: "hibermart",
            ownerName: "Maava Admin",
            ownerPhone: "+919876543210",
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                coordinates: [77.2090, 28.6139],
                city: "Delhi",
                pincode: "110001",
            },
            deliveryTime: "15-20 mins",
            minimumOrder: 99,
            rating: 4.5,
        });
        console.log('✅ Base store created\n');

        // Re-create base collections as they are also required for the UI logic
        console.log('🎯 Re-creating base collections...');
        await InMartCollection.create([
            { name: "Sale", slug: "sale", type: "sale", displayOrder: 1 },
            { name: "Newly Launched", slug: "newly-launched", type: "newly-launched", displayOrder: 2 },
            { name: "Best Sellers", slug: "best-sellers", type: "best-sellers", displayOrder: 3 },
            { name: "Trending Near You", slug: "trending", type: "trending", displayOrder: 4 }
        ]);
        console.log('✅ Base collections created\n');

        console.log('🎉 Done! Database is now ready for dynamic input.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing InMart data:', error);
        process.exit(1);
    }
};

clearInMart();

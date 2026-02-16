import mongoose from 'mongoose';
import InMartCollection from '../modules/inmart/models/InMartCollection.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maava';

const collectionsToSeed = [
    {
        name: "Big Sale",
        slug: "sale",
        description: "Featured products with massive discounts",
        displayOrder: 1,
        isActive: true,
        products: [] // Will be populated through admin panel
    },
    {
        name: "Newly Launched",
        slug: "newly-launched",
        description: "Recently added products to our catalog",
        displayOrder: 2,
        isActive: true,
        products: []
    },
    {
        name: "Best Sellers",
        slug: "best-sellers",
        description: "Our most popular products loved by customers",
        displayOrder: 3,
        isActive: true,
        products: []
    },
    {
        name: "Trending Near You",
        slug: "trending",
        description: "Popular products in your area",
        displayOrder: 4,
        isActive: true,
        products: []
    }
];

const seedCollections = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing existing collections...');
        await InMartCollection.deleteMany({});

        console.log('📦 Seeding collections...');
        const result = await InMartCollection.insertMany(collectionsToSeed);

        console.log(`\n✅ Successfully seeded ${result.length} collections:\n`);
        result.forEach(collection => {
            console.log(`   📁 ${collection.name} (${collection.slug})`);
        });

        console.log('\n💡 Next Steps:');
        console.log('   1. Go to admin panel: http://localhost:5173/admin/hibermart/sale');
        console.log('   2. Add products to each collection');
        console.log('   3. Products will appear on InMart homepage automatically\n');

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding collections:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedCollections();

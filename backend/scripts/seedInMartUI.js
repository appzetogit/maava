import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import InMartStore from '../modules/inmart/models/InMartStore.js';
import InMartProduct from '../modules/inmart/models/InMartProduct.js';
import InMartCategory from '../modules/inmart/models/InMartCategory.js';
import InMartCollection from '../modules/inmart/models/InMartCollection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🌱 Seeding InMart with EXACT UI Data...\n');

const seedInMartUI = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        console.log('🗑️  Clearing existing data...');
        await InMartStore.deleteMany({});
        await InMartProduct.deleteMany({});
        await InMartCategory.deleteMany({});
        await InMartCollection.deleteMany({});
        console.log('✅ Cleared\n');

        // CREATE STORE
        console.log('🏪 Creating Hibermart Store...');
        const store = await InMartStore.create({
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
        console.log(`✅ Created: ${store.name}\n`);

        // CREATE CATEGORIES (4 main categories from UI)
        console.log('📁 Creating Categories...');
        await InMartCategory.create([
            {
                name: "Grocery & Kitchen",
                slug: "grocery-kitchen",
                icon: "ShoppingBag",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3",
                themeColor: "#BFF7D4",
                displayOrder: 1,
            },
            {
                name: "Beauty & Wellness",
                slug: "beauty-wellness",
                icon: "Heart",
                image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2024/11/14/06511b7d-6979-450f-a492-9430fd40e0be_973121d5-bc6b-4e60-8f9f-6828859e3845",
                themeColor: "#FFB6C1",
                displayOrder: 2,
            },
            {
                name: "Household & Lifestyle",
                slug: "household-lifestyle",
                icon: "Home",
                image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2025/3/19/03b3be59-51bc-4127-9cea-8179017f68d5_4420c246-b05a-413a-8494-deeb470112c7",
                themeColor: "#FFE4B5",
                displayOrder: 3,
            },
            {
                name: "Snacks & Drinks",
                slug: "snacks-drinks",
                icon: "Coffee",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252/RX_LIFESTYLE_IMAGES/IMAGES/MERCHANDISER/2024/11/4/9769dae1-432d-45db-9c3f-c1f60579e0bf_SnacksDrinks.png",
                themeColor: "#FFD700",
                displayOrder: 4,
            },
        ]);
        console.log('✅ Created 4 categories\n');

        // CREATE PRODUCTS (EXACT from InMart.jsx UI)
        console.log('🛒 Creating Products from UI...');

        const productsData = [
            // SALE PRODUCTS
            {
                name: "McCain French Fries | Crispy & Ready to Cook",
                brand: "McCain",
                weight: "1 pack (1 kg)",
                price: 141,
                originalPrice: 297,
                discount: "52%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2024/11/5/16a1bde7-3a81-4876-b9a3-5c4d3609848f_McCain.png",
                category: "Snacks & Drinks",
                subCategory: "Frozen Food",
                isOnSale: true,
                isNew: true,
            },
            {
                name: "Go Zero Mocha Fudge Brownie Low Calorie G...",
                brand: "Go Zero",
                weight: "1 pack (500 ml)",
                price: 180,
                originalPrice: 380,
                discount: "52%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/17/524ebaf2-1947-4e09-a376-e6032a14ae9c_4MP8MFPI3S_MN_16122025.png",
                category: "Snacks & Drinks",
                subCategory: "Ice Creams and Frozen Desserts",
                isOnSale: true,
            },
            {
                name: "Godrej Chicken Breast | Boneless & Skinless",
                brand: "Godrej",
                weight: "1 pack (500 g)",
                price: 165,
                originalPrice: 250,
                discount: "35%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/18/842b7149-4588-438d-a98a-0f53bf7e8750_E0C013K89G_MN_18122025.png",
                category: "Grocery & Kitchen",
                subCategory: "Meat and Seafood",
                isOnSale: true,
                isNew: true,
            },
            // NEWLY LAUNCHED
            {
                name: "Sunfeast Dark Fantasy Choco Fills",
                brand: "Sunfeast",
                weight: "1 pack (300 g)",
                price: 99,
                originalPrice: 150,
                discount: "34%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/caa15a5a7c1d16e06cfcecef9e1b489e",
                category: "Snacks & Drinks",
                subCategory: "Chocolates",
                isNew: true,
            },
            {
                name: "Epigamia Greek Yogurt Strawberry",
                brand: "Epigamia",
                weight: "1 cup (90 g)",
                price: 45,
                originalPrice: 60,
                discount: "25%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/17/7720168d-1424-4f15-8e72-67981b569817_KO8FJ6RXVV_MN_16122025.png",
                category: "Grocery & Kitchen",
                subCategory: "Dairy, Bread and Eggs",
                isNew: true,
            },
            {
                name: "Raw Pressery Cold Pressed Juice",
                brand: "Raw Pressery",
                weight: "1 bottle (250 ml)",
                price: 75,
                originalPrice: 100,
                discount: "25%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/CIW/2026/1/12/f3f605db-4a7c-4427-8023-964d98f72e39_340_1.png",
                category: "Snacks & Drinks",
                subCategory: "Cold Drinks and Juices",
                isNew: true,
            },
            // BEST SELLERS
            {
                name: "Amul Taaza Toned Milk",
                brand: "Amul",
                weight: "1 L",
                price: 54,
                originalPrice: 56,
                discount: "3%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_544,w_504/NI_CATALOG/IMAGES/ciw/2025/12/17/51a2cd89-2a42-4b2b-ac97-95288e02952d_TYF3262KU8_MN_16122025.png",
                category: "Grocery & Kitchen",
                subCategory: "Dairy, Bread and Eggs",
                isBestSeller: true,
                isTrending: true,
            },
            {
                name: "Fortune Soya Health Refined Soyabean Oil",
                brand: "Fortune",
                weight: "1 L",
                price: 115,
                originalPrice: 145,
                discount: "20%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_304/NI_CATALOG/IMAGES/CIW/2026/1/9/a54d1b9a-f1a9-4846-a24a-66208271590c_266_1.png",
                category: "Grocery & Kitchen",
                subCategory: "Dairy, Bread and Eggs",
                isBestSeller: true,
                isTrending: true,
            },
            {
                name: "Aashirvaad Superior MP Whole Wheat Atta",
                brand: "Aashirvaad",
                weight: "5 kg",
                price: 245,
                originalPrice: 285,
                discount: "14%",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_304/NI_CATALOG/IMAGES/ciw/2025/12/16/5629ecac-0e29-4e80-bd3a-08fd5c5d8a24_X6CGC0Y38M_MN_15122025.png",
                category: "Grocery & Kitchen",
                subCategory: "Dairy, Bread and Eggs",
                isBestSeller: true,
                isTrending: true,
            },
        ];

        const products = [];
        for (const productData of productsData) {
            const product = await InMartProduct.create({
                ...productData,
                store: store._id,
                deliveryTime: "10 MINS",
                stock: 50,
                isAvailable: true,
            });
            products.push(product);
        }
        console.log(`✅ Created ${products.length} products\n`);

        // CREATE COLLECTIONS
        console.log('🎯 Creating Collections...');

        const saleProducts = products.filter(p => p.isOnSale);
        const newProducts = products.filter(p => p.isNew);
        const bestSellers = products.filter(p => p.isBestSeller);
        const trending = products.filter(p => p.isTrending);

        await InMartCollection.create([
            {
                name: "Sale",
                slug: "sale",
                type: "sale",
                description: "Up to 52% OFF",
                themeColor: "#8B5CF6",
                products: saleProducts.map(p => p._id),
                displayOrder: 1,
            },
            {
                name: "Newly Launched",
                slug: "newly-launched",
                type: "newly-launched",
                description: "Fresh arrivals",
                themeColor: "#21C063",
                products: newProducts.map(p => p._id),
                displayOrder: 2,
            },
            {
                name: "Best Sellers",
                slug: "best-sellers",
                type: "best-sellers",
                description: "Most loved",
                themeColor: "#FD8930",
                products: bestSellers.map(p => p._id),
                displayOrder: 3,
            },
            {
                name: "Trending Near You",
                slug: "trending",
                type: "trending",
                description: "Popular in your area",
                themeColor: "#FFD700",
                products: trending.map(p => p._id),
                displayOrder: 4,
            },
        ]);
        console.log('✅ Created 4 collections\n');

        console.log('═══════════════════════════════════════');
        console.log('✅ SEEDING COMPLETED!');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Summary:`);
        console.log(`   • Store: 1`);
        console.log(`   • Categories: 4`);
        console.log(`   • Products: ${products.length} (from UI)`);
        console.log(`   • Collections: 4`);
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedInMartUI();

import mongoose from 'mongoose';
import InMartCategory from '../modules/inmart/models/InMartCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maava';

const categoriesToSeed = [
    {
        name: "Grocery & Kitchen",
        slug: "grocery-kitchen",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3",
        icon: "ShoppingBag",
        themeColor: "#BFF7D4",
        level: "main",
        displayOrder: 1,
        isActive: true,
        subCategories: [
            {
                id: "fresh-vegetables",
                name: "Fresh Vegetables",
                slug: "fresh-vegetables",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3",
                level: "sub",
                displayOrder: 1
            },
            {
                id: "fresh-fruits",
                name: "Fresh Fruits",
                slug: "fresh-fruits",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/12/5/13a82fb6-aac6-4a94-af24-3a9522876d76_a27e7cc7-8e5f-4264-b978-c51531625dde",
                level: "sub",
                displayOrder: 2
            },
            {
                id: "dairy-bread-eggs",
                name: "Dairy, Bread and Eggs",
                slug: "dairy-bread-eggs",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/12/24/ceb53190-72a3-466b-a892-8989615788c9_fe00456c-3b5a-4e74-80e2-c274a4c9f818.png",
                level: "sub",
                displayOrder: 3
            },
            {
                id: "meat-seafood",
                name: "Meat and Seafood",
                slug: "meat-seafood",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/9c48b537-eef1-4047-becb-ddb7e79c373d_72aac542-4cef-4cf9-a9dd-5f1b862165c1",
                level: "sub",
                displayOrder: 4
            }
        ]
    },
    {
        name: "Beauty & Wellness",
        slug: "beauty-wellness",
        image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2024/11/14/06511b7d-6979-450f-a492-9430fd40e0be_973121d5-bc6b-4e60-8f9f-6828859e3845",
        icon: "Sparkles",
        themeColor: "#FAD0E8",
        level: "main",
        displayOrder: 2,
        isActive: true,
        subCategories: [
            {
                id: "bath-body",
                name: "Bath and Body",
                slug: "bath-body",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/46b1b550-1e5f-423e-967b-e1cf3a608bb8_13bc4f93-eab7-4263-a592-54f144d0eec6",
                level: "sub",
                displayOrder: 1
            },
            {
                id: "hair-care",
                name: "Hair Care",
                slug: "hair-care",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/73dd2be1-fd81-4540-8286-02db395de0e5_5da6d646-978e-4b00-bfd4-63cbe897c0b2",
                level: "sub",
                displayOrder: 2
            },
            {
                id: "skincare",
                name: "Skincare",
                slug: "skincare",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/d6930a4e-6a3c-44c9-8b6b-86f63e20434a_0c08d4e2-6423-4a9e-ad4b-35b339a149b0",
                level: "sub",
                displayOrder: 3
            },
            {
                id: "makeup",
                name: "Makeup",
                slug: "makeup",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/7c05fd2b-1ea8-4ce4-9b9e-0ba402d3f698_b802ea7a-3d08-44f0-ac8e-4793e4806f67",
                level: "sub",
                displayOrder: 4
            },
            {
                id: "oral-care",
                name: "Oral Care",
                slug: "oral-care",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/12/5/d753ff8d-4cdb-4548-bba2-b10e480cc6b2_28cfcd55-1e7f-4333-a5d5-15c023b8b58d",
                level: "sub",
                displayOrder: 5
            },
            {
                id: "grooming",
                name: "Grooming",
                slug: "grooming",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/6fd76e5f-016b-4810-94fd-252eab4245a6_2edc9535-9e14-49cf-a05e-25fa4ca45cb8",
                level: "sub",
                displayOrder: 6
            },
            {
                id: "baby-care",
                name: "Baby Care",
                slug: "baby-care",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/838ef0d0-8687-447a-8520-95b6700b70f6_a08f1496-3e1f-425f-bdd5-90d1e2bfce5d",
                level: "sub",
                displayOrder: 7
            },
            {
                id: "fragrances",
                name: "Fragrances",
                slug: "fragrances",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/d0f1c0f3-5dc4-422e-9120-222c0afc4043_2588dd56-663e-43f0-a14b-1a537b8301a9",
                level: "sub",
                displayOrder: 8
            }
        ]
    },
    {
        name: "Snacks & Drinks",
        slug: "snacks-drinks",
        image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_252/RX_LIFESTYLE_IMAGES/IMAGES/MERCHANDISER/2024/11/4/9769dae1-432d-45db-9c3f-c1f60579e0bf_SnacksDrinks.png",
        icon: "Coffee",
        themeColor: "#FBE04C",
        level: "main",
        displayOrder: 3,
        isActive: true,
        subCategories: [
            {
                id: "cold-drinks-juices",
                name: "Cold Drinks and Juices",
                slug: "cold-drinks-juices",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/5bec1f84-4aa5-49ae-9c3d-9a0dcb9fe2ad_d990b4fc-4629-4cc6-bc7a-ace787fb378a",
                level: "sub",
                displayOrder: 1
            },
            {
                id: "ice-creams-frozen",
                name: "Ice Creams and Frozen Desserts",
                slug: "ice-creams-frozen",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/5b0984b8-303b-4a80-81b7-9656f1950b67_63aaae7c-1add-4357-8ae1-5a9662d6b240",
                level: "sub",
                displayOrder: 2
            },
            {
                id: "chips-namkeens",
                name: "Chips and Namkeens",
                slug: "chips-namkeens",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b654b666-43b5-4599-9919-98f9c7a924e9_cf31e6c0-a70b-4415-b702-3a622d866898",
                level: "sub",
                displayOrder: 3
            },
            {
                id: "chocolates",
                name: "Chocolates",
                slug: "chocolates",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/405730cd-115c-4530-8f32-74e50c09f378_1dab5493-a168-4485-a66f-da4bc7510de3",
                level: "sub",
                displayOrder: 4
            },
            {
                id: "noodles-pasta",
                name: "Noodles, Pasta, Vermicelli",
                slug: "noodles-pasta",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/6a51d704-b2cc-4787-aced-162fae80a0ce_042fb322-f6db-412d-ba43-f83d090aa463",
                level: "sub",
                displayOrder: 5
            },
            {
                id: "frozen-food",
                name: "Frozen Food",
                slug: "frozen-food",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/bf978cbc-ab49-4a43-b23e-41352f4fe33d_dd569df9-8e7b-4e55-bc88-ef692b4d471f",
                level: "sub",
                displayOrder: 6
            },
            {
                id: "sweet-corner",
                name: "Sweet Corner",
                slug: "sweet-corner",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/baa03922-9920-4588-b397-a5faad7f4ff5_b2be157f-a054-402a-b5e6-dbb8eff8ae4a",
                level: "sub",
                displayOrder: 7
            },
            {
                id: "paan-corner",
                name: "Paan Corner",
                slug: "paan-corner",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/822a816f-42b1-44ea-a605-98936352f195_2cf4e5c9-61eb-4c20-91d3-5a3b04af44e8",
                level: "sub",
                displayOrder: 8
            }
        ]
    },
    {
        name: "Household & Lifestyle",
        slug: "household-lifestyle",
        image: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_500/NI_CATALOG/IMAGES/CIW/2025/3/19/03b3be59-51bc-4127-9cea-8179017f68d5_4420c246-b05a-413a-8494-deeb470112c7",
        icon: "Home",
        themeColor: "#FDE256",
        level: "main",
        displayOrder: 4,
        isActive: true,
        subCategories: [
            {
                id: "home-furnishing",
                name: "Home and Furnishing",
                slug: "home-furnishing",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2",
                level: "sub",
                displayOrder: 1
            },
            {
                id: "kitchen-dining",
                name: "Kitchen and Dining",
                slug: "kitchen-dining",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e",
                level: "sub",
                displayOrder: 2
            },
            {
                id: "cleaning-essentials",
                name: "Cleaning Essentials",
                slug: "cleaning-essentials",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b332fa4a-4a15-4c32-8bb8-f46b34ef13d5_ff40260d-3a00-40e7-b019-69ecebed8a91",
                level: "sub",
                displayOrder: 3
            },
            {
                id: "clothing",
                name: "Clothing",
                slug: "clothing",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/93cce7bf-96cc-4ff6-adfc-a248c2a8cb94_783cd072-3e52-4daf-996a-4652d000d943",
                level: "sub",
                displayOrder: 4
            },
            {
                id: "mobiles-electronics",
                name: "Mobiles and Electronics",
                slug: "mobiles-electronics",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/11/6/7b165e34-9f50-4dc8-ae7d-85f85aadad7a_e6d790c1-88b0-4922-901c-1584d65cf264",
                level: "sub",
                displayOrder: 5
            },
            {
                id: "appliances",
                name: "Appliances",
                slug: "appliances",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/11/6/78c66d7c-517c-4b60-b879-bca877df5850_68de0373-8d3b-4945-8e81-60b93b732cc8",
                level: "sub",
                displayOrder: 6
            },
            {
                id: "books-stationery",
                name: "Books and Stationery",
                slug: "books-stationery",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/e1e37212-1b34-4711-927e-bce563247de7_60934c30-e762-4a81-ba56-8bf6f30b6766",
                level: "sub",
                displayOrder: 7
            },
            {
                id: "jewellery-accessories",
                name: "Jewellery and Accessories",
                slug: "jewellery-accessories",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/8e5a7ca9-0291-4e6a-8691-1c1bddb4e642_da8cf6a8-0e6d-4fb4-8e7d-9e1688b9cd07",
                level: "sub",
                displayOrder: 8
            },
            {
                id: "puja",
                name: "Puja",
                slug: "puja",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/965c898a-bc67-4fe8-8fd4-d13e1eb79772_c38285f9-727d-422b-ad77-e1e22d4d251d",
                level: "sub",
                displayOrder: 9
            },
            {
                id: "toys-games",
                name: "Toys and Games",
                slug: "toys-games",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/79f943d8-2977-4753-bab0-1a74f582d6b8_7a341dcf-099f-4617-a44f-d28c55de560a",
                level: "sub",
                displayOrder: 10
            },
            {
                id: "sports-fitness",
                name: "Sports and Fitness",
                slug: "sports-fitness",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/06414bae-6149-4a26-8ca5-a5afffb3f753_171a212b-1edd-4a68-a424-46e240270a3b",
                level: "sub",
                displayOrder: 11
            },
            {
                id: "pet-supplies",
                name: "Pet Supplies",
                slug: "pet-supplies",
                image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_200/NI_CATALOG/IMAGES/CIW/2025/10/8/b936925b-340a-4d1a-a423-0ecbc989d8ee_f70daa6c-8b2f-45d5-86e5-ced16b437ce4",
                level: "sub",
                displayOrder: 12
            }
        ]
    }
];

const seedCategories = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        console.log('🗑️  Clearing existing categories...');
        await InMartCategory.deleteMany({});
        console.log('✅ Cleared existing categories');

        // Insert new categories
        console.log('📦 Seeding categories...');
        const result = await InMartCategory.insertMany(categoriesToSeed);
        console.log(`✅ Successfully seeded ${result.length} main categories`);

        // Count subcategories
        const totalSubcategories = categoriesToSeed.reduce((sum, cat) =>
            sum + (cat.subCategories?.length || 0), 0
        );
        console.log(`   └─ With ${totalSubcategories} subcategories`);

        console.log('\n📊 Category Summary:');
        result.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.name} (${cat.subCategories.length} subcategories)`);
        });

        console.log('\n🎉 Seeding completed successfully!');
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedCategories();

// Quick test script to verify InMart API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/inmart';

console.log('🧪 Testing InMart API Endpoints...\n');

async function testEndpoints() {
    try {
        // Test 1: Home endpoint
        console.log('1️⃣ Testing /api/inmart/home...');
        const homeRes = await fetch(`${BASE_URL}/home`);
        const homeData = await homeRes.json();

        if (homeData.success) {
            console.log('   ✅ Home endpoint working!');
            console.log(`   📊 Data: ${homeData.data.categories?.length || 0} categories, ${homeData.data.collections?.length || 0} collections`);
        } else {
            console.log('   ❌ Home endpoint failed:', homeData.message);
        }

        // Test 2: Categories endpoint
        console.log('\n2️⃣ Testing /api/inmart/categories...');
        const catRes = await fetch(`${BASE_URL}/categories`);
        const catData = await catRes.json();

        if (catData.success) {
            console.log('   ✅ Categories endpoint working!');
            console.log(`   📁 Found ${catData.count} categories`);
        } else {
            console.log('   ❌ Categories endpoint failed:', catData.message);
        }

        // Test 3: Products endpoint
        console.log('\n3️⃣ Testing /api/inmart/products...');
        const prodRes = await fetch(`${BASE_URL}/products`);
        const prodData = await prodRes.json();

        if (prodData.success) {
            console.log('   ✅ Products endpoint working!');
            console.log(`   🛒 Found ${prodData.count} products`);
        } else {
            console.log('   ❌ Products endpoint failed:', prodData.message);
        }

        // Test 4: Collections endpoint
        console.log('\n4️⃣ Testing /api/inmart/collections...');
        const collRes = await fetch(`${BASE_URL}/collections`);
        const collData = await collRes.json();

        if (collData.success) {
            console.log('   ✅ Collections endpoint working!');
            console.log(`   🎯 Found ${collData.count} collections`);
            if (collData.data.collections.length > 0) {
                console.log(`   📦 Collections: ${collData.data.collections.map(c => c.name).join(', ')}`);
            }
        } else {
            console.log('   ❌ Collections endpoint failed:', collData.message);
        }

        console.log('\n═══════════════════════════════════════');
        console.log('✅ All tests completed!');
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error testing endpoints:', error.message);
        console.error('💡 Make sure the backend server is running on port 5000\n');
    }
}

testEndpoints();

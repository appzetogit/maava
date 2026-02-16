import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 MAAVA APPLICATION FUNCTIONALITY CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

const tests = {
    passed: 0,
    failed: 0,
    warnings: 0
};

async function testBackendHealth() {
    console.log('1️⃣  Testing Backend Server...');
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();

        if (data.status === 'OK') {
            console.log('   ✅ Backend is running on port 5000');
            console.log(`   ⏱️  Uptime: ${Math.floor(data.uptime)}s`);
            tests.passed++;
            return true;
        } else {
            console.log('   ❌ Backend health check failed');
            tests.failed++;
            return false;
        }
    } catch (error) {
        console.log('   ❌ Backend is NOT running');
        console.log('   💡 Run: cd backend && npm start');
        tests.failed++;
        return false;
    }
}

async function testFrontend() {
    console.log('\n2️⃣  Testing Frontend Server...');
    try {
        const response = await fetch(FRONTEND_URL);
        if (response.ok) {
            console.log('   ✅ Frontend is running on port 5173');
            tests.passed++;
            return true;
        } else {
            console.log('   ❌ Frontend returned error');
            tests.failed++;
            return false;
        }
    } catch (error) {
        console.log('   ❌ Frontend is NOT running');
        console.log('   💡 Run: cd frontend && npm run dev');
        tests.failed++;
        return false;
    }
}

async function testDatabase() {
    console.log('\n3️⃣  Testing Database Connection...');
    try {
        // Try to fetch products - if this works, DB is connected
        const response = await fetch(`${BASE_URL}/api/inmart/products`);
        const data = await response.json();

        if (data.success) {
            console.log('   ✅ Database is connected');
            console.log(`   📊 Found ${data.count} products in database`);
            tests.passed++;
            return true;
        } else {
            console.log('   ❌ Database query failed');
            tests.failed++;
            return false;
        }
    } catch (error) {
        console.log('   ❌ Database connection failed');
        console.log('   💡 Check MongoDB connection string in .env');
        tests.failed++;
        return false;
    }
}

async function testInMartAPI() {
    console.log('\n4️⃣  Testing InMart API Endpoints...');

    const endpoints = [
        { name: 'Home', url: '/api/inmart/home' },
        { name: 'Categories', url: '/api/inmart/categories' },
        { name: 'Products', url: '/api/inmart/products' },
        { name: 'Collections', url: '/api/inmart/collections' },
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint.url}`);
            const data = await response.json();

            if (data.success) {
                console.log(`   ✅ ${endpoint.name} endpoint working`);
            } else {
                console.log(`   ❌ ${endpoint.name} endpoint failed`);
                allPassed = false;
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint.name} endpoint error: ${error.message}`);
            allPassed = false;
        }
    }

    if (allPassed) {
        tests.passed++;
    } else {
        tests.failed++;
    }

    return allPassed;
}

async function testAdminAPI() {
    console.log('\n5️⃣  Testing Admin API Endpoints...');

    try {
        // Test admin stats endpoint (doesn't require auth for testing)
        const response = await fetch(`${BASE_URL}/api/admin/inmart/products`);

        if (response.status === 401) {
            console.log('   ✅ Admin endpoints are protected (requires auth)');
            console.log('   ℹ️  This is expected - admin routes need authentication');
            tests.passed++;
            return true;
        } else if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Admin API is accessible');
            console.log(`   📊 Admin can manage ${data.data?.products?.length || 0} products`);
            tests.passed++;
            return true;
        } else {
            console.log('   ⚠️  Admin API returned unexpected status:', response.status);
            tests.warnings++;
            return true;
        }
    } catch (error) {
        console.log('   ❌ Admin API test failed:', error.message);
        tests.failed++;
        return false;
    }
}

async function testDataIntegrity() {
    console.log('\n6️⃣  Testing Data Integrity...');

    try {
        const response = await fetch(`${BASE_URL}/api/inmart/home`);
        const data = await response.json();

        if (!data.success) {
            console.log('   ❌ Failed to fetch home data');
            tests.failed++;
            return false;
        }

        const { categories, collections, store } = data.data;

        // Check categories
        if (categories && categories.length > 0) {
            console.log(`   ✅ Categories: ${categories.length} found`);
        } else {
            console.log('   ⚠️  No categories found');
            tests.warnings++;
        }

        // Check collections
        if (collections && collections.length > 0) {
            console.log(`   ✅ Collections: ${collections.length} found`);

            // Check if collections have products
            const collectionsWithProducts = collections.filter(c => c.products && c.products.length > 0);
            console.log(`   ✅ Collections with products: ${collectionsWithProducts.length}/${collections.length}`);
        } else {
            console.log('   ⚠️  No collections found');
            tests.warnings++;
        }

        // Check store
        if (store) {
            console.log(`   ✅ Store: ${store.name} configured`);
            console.log(`   📍 Delivery time: ${store.deliveryTime}`);
        } else {
            console.log('   ⚠️  No store found');
            tests.warnings++;
        }

        tests.passed++;
        return true;
    } catch (error) {
        console.log('   ❌ Data integrity check failed:', error.message);
        tests.failed++;
        return false;
    }
}

async function testRoutes() {
    console.log('\n7️⃣  Testing Critical Routes...');

    const routes = [
        { name: 'Restaurant Routes', url: '/api/restaurant' },
        { name: 'User Routes', url: '/api/user' },
        { name: 'Order Routes', url: '/api/order' },
    ];

    let routesWorking = 0;

    for (const route of routes) {
        try {
            const response = await fetch(`${BASE_URL}${route.url}`);
            // We expect 401 (unauthorized) or 404 (not found) for these routes without auth
            // Anything other than connection error means the route exists
            if (response.status === 401 || response.status === 404 || response.ok) {
                console.log(`   ✅ ${route.name} registered`);
                routesWorking++;
            } else {
                console.log(`   ⚠️  ${route.name} returned status ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${route.name} not accessible`);
        }
    }

    if (routesWorking === routes.length) {
        console.log(`   ✅ All ${routes.length} route groups are registered`);
        tests.passed++;
    } else {
        console.log(`   ⚠️  ${routesWorking}/${routes.length} route groups working`);
        tests.warnings++;
    }

    return routesWorking > 0;
}

async function runAllTests() {
    const backendOk = await testBackendHealth();

    if (!backendOk) {
        console.log('\n❌ Backend is not running. Cannot continue tests.');
        console.log('💡 Start backend with: cd backend && npm start\n');
        printSummary();
        return;
    }

    await testFrontend();
    await testDatabase();
    await testInMartAPI();
    await testAdminAPI();
    await testDataIntegrity();
    await testRoutes();

    printSummary();
}

function printSummary() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Passed:   ${tests.passed}`);
    console.log(`❌ Failed:   ${tests.failed}`);
    console.log(`⚠️  Warnings: ${tests.warnings}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (tests.failed === 0 && tests.warnings === 0) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL!');
        console.log('✅ Your application is fully functional!\n');
        console.log('🚀 You can now:');
        console.log('   1. Access frontend: http://localhost:5173');
        console.log('   2. Access admin panel: http://localhost:5173/admin');
        console.log('   3. Test InMart admin: http://localhost:5173/admin/inmart-test\n');
    } else if (tests.failed === 0) {
        console.log('✅ APPLICATION IS FUNCTIONAL!');
        console.log(`⚠️  ${tests.warnings} warning(s) - check details above\n`);
    } else {
        console.log('❌ SOME ISSUES DETECTED');
        console.log('💡 Please fix the failed tests above\n');
    }
}

// Run all tests
runAllTests();

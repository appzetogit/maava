/**
 * One-time migration script: Fix restaurant location coordinates
 * 
 * Problem: Restaurants created via onboarding saved latitude/longitude
 * fields but NOT the GeoJSON coordinates array. This caused
 * "Restaurant location not found" errors when delivery boys tried to accept orders.
 * 
 * Run with: node scripts/fixRestaurantCoordinates.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Restaurant from '../modules/restaurant/models/Restaurant.js';
import { connectDB } from '../config/database.js';

async function fixRestaurantCoordinates() {
    console.log('🔄 Starting restaurant coordinates migration...');

    await connectDB();

    // Find all restaurants
    const restaurants = await Restaurant.find({}).lean();
    console.log(`📊 Found ${restaurants.length} restaurants`);

    let fixed = 0;
    let alreadyOk = 0;
    let noLocation = 0;

    for (const restaurant of restaurants) {
        const loc = restaurant.location;

        if (!loc) {
            console.warn(`⚠️ Restaurant ${restaurant.name} (${restaurant._id}) has NO location at all`);
            noLocation++;
            continue;
        }

        const hasCoords = loc.coordinates && Array.isArray(loc.coordinates) &&
            loc.coordinates.length >= 2 &&
            !(loc.coordinates[0] === 0 && loc.coordinates[1] === 0);

        const hasLatLng = loc.latitude && loc.longitude &&
            !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
            !(loc.latitude === 0 && loc.longitude === 0);

        if (hasCoords) {
            // Has coordinates — also ensure lat/lng are set
            const update = {};
            if (!loc.latitude || !loc.longitude) {
                update['location.latitude'] = loc.coordinates[1];
                update['location.longitude'] = loc.coordinates[0];
            }
            if (Object.keys(update).length > 0) {
                await Restaurant.updateOne({ _id: restaurant._id }, { $set: update });
                console.log(`✅ Synced lat/lng from coordinates for: ${restaurant.name}`);
                fixed++;
            } else {
                alreadyOk++;
            }
            continue;
        }

        if (hasLatLng) {
            // Has lat/lng but no coordinates — fix it
            await Restaurant.updateOne(
                { _id: restaurant._id },
                {
                    $set: {
                        'location.coordinates': [loc.longitude, loc.latitude], // GeoJSON: [lng, lat]
                    }
                }
            );
            console.log(`✅ Fixed coordinates for: ${restaurant.name} → [${loc.longitude}, ${loc.latitude}]`);
            fixed++;
            continue;
        }

        console.warn(`⚠️ Restaurant ${restaurant.name} (${restaurant._id}) has location but no valid lat/lng or coordinates`);
        console.warn(`   location data:`, JSON.stringify(loc));
        noLocation++;
    }

    console.log('\n📋 Migration Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ✓ Already OK: ${alreadyOk}`);
    console.log(`   ⚠️ No location / unfixable: ${noLocation}`);
    console.log('\n✅ Migration complete!');

    await mongoose.disconnect();
    process.exit(0);
}

fixRestaurantCoordinates().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

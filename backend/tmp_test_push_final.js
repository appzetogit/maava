import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initializeFirebaseRealtime } from './config/firebaseRealtimeDB.js';
import { sendNotificationToUser } from './modules/notification/services/pushNotificationService.js';
dotenv.config();

const run = async () => {
    try {
        console.log('1. Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('2. Initializing Firebase...');
        initializeFirebaseRealtime();

        // Wait a bit for firebase
        await new Promise(r => setTimeout(r, 1000));

        const userId = '69806640bbfbdfe2599ad255'; // Ajay Panchal (Customer)
        console.log(`3. Testing high-priority push to user: ${userId}`);

        const result = await sendNotificationToUser(
            userId,
            'user',
            '🚀 High Priority Test',
            'This should trigger a popup on your mobile!',
            { test: 'true', time: new Date().toISOString() }
        );

        console.log('Final Result:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Test script failed:', e);
        process.exit(1);
    }
};

run();

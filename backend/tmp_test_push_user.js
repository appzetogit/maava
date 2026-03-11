import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendNotificationToUser } from './modules/notification/services/pushNotificationService.js';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Use the user ID we found earlier
        const userId = '69806640bbfbdfe2599ad255';

        console.log(`Testing push to user: ${userId}`);
        const result = await sendNotificationToUser(
            userId,
            'user',
            '🧪 Test Notification',
            'This is a test of the automated system.',
            { test: 'true' }
        );

        console.log('Result:', result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

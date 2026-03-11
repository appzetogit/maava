import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import the service dynamically
        const { sendNotificationToTarget } = await import('../backend/modules/notification/services/pushNotificationService.js');

        const targets = ['Customer', 'Delivery Man', 'Restaurant'];

        console.log('\n--- STARTING TARGET NORMALIZATION TEST ---');

        for (const target of targets) {
            console.log(`\nTesting target: [${target}]`);
            // We call it with a fake title/body just to see if it finds "active device tokens" or errors out
            const result = await sendNotificationToTarget(target, "Test Title", "Test Body");

            if (result.message && result.message.includes('Invalid target')) {
                console.log(`❌ FAILED: ${target} was not recognized!`);
            } else if (result.message && result.message.includes('No active device tokens found')) {
                console.log(`✅ PASSED: ${target} was recognized (but no local tokens found in DB).`);
            } else if (result.successCount >= 0) {
                console.log(`✅ PASSED: ${target} was recognized and sending attempted to ${result.successCount} users.`);
            } else {
                console.log(`❓ UNKNOWN RESULT for ${target}:`, result);
            }
        }

    } catch (error) {
        console.error('❌ Test crashed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();

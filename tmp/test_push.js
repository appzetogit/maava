import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

function loadServiceAccount() {
    const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonStr) {
        try {
            // Remove single quotes if present (some .env parsers keep them)
            let cleaned = jsonStr.trim();
            if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
                cleaned = cleaned.slice(1, -1);
            }
            return JSON.parse(cleaned);
        } catch (err) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
        }
    }
    return null;
}

async function testPush() {
    try {
        const serviceAccount = loadServiceAccount();
        if (!serviceAccount) throw new Error('No service account');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL
            });
        }

        console.log('✅ Admin initialized');

        // Try to send a dummy message to an invalid token safely
        const message = {
            notification: { title: 'Test', body: 'Test' },
            tokens: ['dummy_token_123'], // Invalid token
        };

        console.log('Attempting to send multicast...');
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log('Response:', JSON.stringify(response, null, 2));

    } catch (error) {
        console.error('❌ Crash:', error);
    }
}

testPush();

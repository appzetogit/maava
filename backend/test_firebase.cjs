const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function loadServiceAccount() {
    const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonStr) {
        try {
            let cleaned = jsonStr.trim();
            if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
                cleaned = cleaned.slice(1, -1);
            }
            return JSON.parse(cleaned);
        } catch (err) {
            console.warn('⚠️ JSON FAIL:', err.message);
        }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        // CLEANUP: dotenv might leave quotes
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
            privateKey = privateKey.slice(1, -1);
        }

        if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
        return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
    }
    return null;
}

async function testFirebase() {
    try {
        const serviceAccount = loadServiceAccount();
        if (!serviceAccount) throw new Error('No credentials');

        console.log('Project ID:', serviceAccount.project_id);
        console.log('Email:', serviceAccount.client_email);
        console.log('Key Sample (Start):', serviceAccount.private_key?.substring(0, 30));
        console.log('Key Sample (End):', serviceAccount.private_key?.substring(serviceAccount.private_key.length - 30));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ SDK Initialized');

        // Check if messaging works
        try {
            await admin.messaging().send({
                notification: { title: 'T', body: 'B' },
                token: 'dummy_token'
            });
        } catch (msgErr) {
            if (msgErr.code === 'messaging/registration-token-not-registered' || msgErr.code === 'messaging/invalid-argument') {
                console.log('✅ Messaging Instance Ready (invalid token as expected)');
            } else {
                throw msgErr;
            }
        }

    } catch (err) {
        console.error('❌ CRY: ', err.message);
        if (err.stack) console.error(err.stack);
    }
}
testFirebase();

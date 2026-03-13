import smsIndiaHubService from '../modules/auth/services/smsIndiaHubService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSMS() {
    try {
        console.log('--- SMSIndia Hub Test Tool ---');

        // Connect to DB if needed for credentials
        if (process.env.MONGODB_URI) {
            console.log('Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
        }

        const isConfigured = await smsIndiaHubService.isConfigured();
        console.log(`Configured: ${isConfigured ? '✅ Yes' : '❌ No'}`);
        console.log(`Using API Key: ${smsIndiaHubService.apiKey ? smsIndiaHubService.apiKey.substring(0, 5) + '...' : 'None'}`);
        console.log(`Using Sender ID: ${smsIndiaHubService.senderId || 'None'}`);

        const balance = await smsIndiaHubService.getBalance();
        console.log(`Balance Status: ${balance.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`Current Balance: ${balance.balance} ${balance.currency || 'INR'}`);
        console.log(`Raw Balance Response: ${balance.response}`);

        // Take phone number from command line or default
        const testPhone = process.argv[2] || '919109992290'; // Replace with a real test number
        const testOTP = '123456';

        console.log(`\nSending test OTP ${testOTP} to ${testPhone}...`);

        // Note: In transactional mode, the message must match your DLT template exactly.
        // The service has a fallback template: "Welcome to the {companyName} powered by SMSINDIAHUB. Your OTP for registration is {otp}"
        const result = await smsIndiaHubService.sendOTP(testPhone, testOTP, 'testing');

        if (result.success) {
            console.log('\n✅ TEST SUCCESSFUL!');
            console.log('Message ID:', result.messageId);
            console.log('Response:', result.response);
        } else {
            console.log('\n❌ TEST FAILED');
            console.log('Error:', result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('\n🛑 TEST ERROR:');
        console.error(error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        process.exit();
    }
}

testSMS();

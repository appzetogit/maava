const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({ fcmTokens: [String], fcmTokenMobile: [String] }, { strict: false });

async function checkCount() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is not defined in .env');

        await mongoose.connect(uri);
        console.log('✅ Connected to DB');
        const User = mongoose.model('User', UserSchema);
        const users = await User.find({
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        }).lean();

        let totalTokens = 0;
        users.forEach(u => {
            totalTokens += (u.fcmTokens?.length || 0) + (u.fcmTokenMobile?.length || 0);
        });

        console.log(`🙋 CUSTOMERS WITH TOKENS: ${users.length}`);
        console.log(`📊 TOTAL ACTIVE TOKENS: ${totalTokens}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}
checkCount();

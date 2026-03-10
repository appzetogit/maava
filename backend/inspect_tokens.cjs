const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({ fcmTokens: [String], fcmTokenMobile: [String] }, { strict: false });

async function inspectTokens() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', UserSchema);
        const user = await User.findOne({
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        }).lean();

        if (user) {
            console.log('--- USER TOKENS ---');
            console.log('WEB TOKENS:', user.fcmTokens?.length || 0);
            console.log('MOBILE TOKENS:', user.fcmTokenMobile?.length || 0);

            const all = [...(user.fcmTokens || []), ...(user.fcmTokenMobile || [])];
            const unique = [...new Set(all)];
            console.log('TOTAL:', all.length);
            console.log('UNIQUE TOTAL:', unique.length);

            if (all.length !== unique.length) {
                console.log('⚠️ DUPLICATES FOUND ACROSS ARRAYS');
            }
        } else {
            console.log('No users with tokens found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
inspectTokens();

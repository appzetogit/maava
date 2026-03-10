const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({ fcmTokens: [String], fcmTokenMobile: [String] }, { strict: false });
const DeliverySchema = new mongoose.Schema({ fcmTokens: [String], fcmTokenMobile: [String] }, { strict: false });
const RestaurantSchema = new mongoose.Schema({ fcmTokens: [String], fcmTokenMobile: [String] }, { strict: false });

async function cleanupTokens() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        const models = [
            mongoose.model('User', UserSchema),
            mongoose.model('Delivery', DeliverySchema),
            mongoose.model('Restaurant', RestaurantSchema)
        ];

        for (const Model of models) {
            const docs = await Model.find({
                $or: [
                    { 'fcmTokens.5': { $exists: true } },
                    { 'fcmTokenMobile.5': { $exists: true } }
                ]
            });

            console.log(`🧹 Processing ${Model.modelName}: Found ${docs.length} users with many tokens`);

            for (const doc of docs) {
                const updateObj = {};
                if (doc.fcmTokens && doc.fcmTokens.length > 3) {
                    updateObj.fcmTokens = doc.fcmTokens.slice(-3);
                }
                if (doc.fcmTokenMobile && doc.fcmTokenMobile.length > 2) {
                    updateObj.fcmTokenMobile = doc.fcmTokenMobile.slice(-2);
                }
                if (Object.keys(updateObj).length > 0) {
                    await Model.updateOne({ _id: doc._id }, { $set: updateObj });
                }
            }
        }
        console.log('✅ Token cleanup complete!');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupTokens();

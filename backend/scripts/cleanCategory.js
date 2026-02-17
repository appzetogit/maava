import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

const inmartCategorySchema = new mongoose.Schema({
    name: String,
    level: String
}, { strict: false });

const InMartCategory = mongoose.model('InMartCategory', inmartCategorySchema);

async function cleanUp() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const idToRemove = '6993604deeb06f0057786c5a';
        const result = await InMartCategory.findByIdAndDelete(idToRemove);

        if (result) {
            console.log(`✅ Category with ID ${idToRemove} ("${result.name}") removed successfully.`);
        } else {
            console.log(`⚠️ Category with ID ${idToRemove} not found.`);
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

cleanUp();

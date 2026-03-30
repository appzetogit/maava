import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appzeto-food';

const COLLECTIONS = [
  'abouts',
  'privacypolicies',
  'refundpolicies',
  'shippingpolicies',
  'cancellationpolicies',
  'termsandconditions'
];

async function fixPoliciesNames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    for (const collectionName of COLLECTIONS) {
      console.log(`\nProcessing collection: ${collectionName}...`);
      const collection = db.collection(collectionName);
      
      const documents = await collection.find({}).toArray();
      console.log(`Found ${documents.length} documents.`);

      for (const doc of documents) {
        let updatedContent = doc.content || '';
        let updatedTitle = doc.title || '';
        let hasChanges = false;

        // Replace brand names in content
        if (updatedContent.includes('StackFood') || updatedContent.includes('Appzeto')) {
          updatedContent = updatedContent.replace(/StackFood/g, 'Maava');
          updatedContent = updatedContent.replace(/Appzeto/g, 'Maava');
          hasChanges = true;
        }

        // Replace brand names in title
        if (updatedTitle.includes('StackFood') || updatedTitle.includes('Appzeto')) {
          updatedTitle = updatedTitle.replace(/StackFood/g, 'Maava');
          updatedTitle = updatedTitle.replace(/Appzeto/g, 'Maava');
          hasChanges = true;
        }

        if (hasChanges) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { content: updatedContent, title: updatedTitle } }
          );
          console.log(`✓ Updated document: ${doc._id}`);
        }
      }
    }

    // Special check for BusinessSettings or any other brand-related settings
    console.log('\nChecking businesssettings for branding...');
    const businessSettings = db.collection('businesssettings');
    const settings = await businessSettings.findOne({});
    if (settings) {
      let hasChanges = false;
      const updates = {};

      if (settings.businessName === 'StackFood' || settings.businessName === 'Appzeto') {
        updates.businessName = 'Maava';
        hasChanges = true;
      }

      if (hasChanges) {
        await businessSettings.updateOne({ _id: settings._id }, { $set: updates });
        console.log('✓ Updated BusinessSettings name to Maava');
      }
    }

    console.log('\n✅ Branding migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during branding migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

fixPoliciesNames();

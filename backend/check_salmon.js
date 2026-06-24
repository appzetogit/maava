import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maava');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

const checkSalmon = async () => {
  await connectDB();
  const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({ name: String }, { strict: false }));
  const salmon = await Restaurant.find({ name: /salmon/i });
  console.log('Salmon restaurants found:', salmon.length);
  for (const r of salmon) {
    console.log('ID:', r._id, 'Name:', r.name);
    
    // Check withdrawals
    const WithdrawalRequest = mongoose.model('WithdrawalRequest', new mongoose.Schema({ restaurantId: mongoose.Schema.Types.ObjectId, amount: Number, status: String, createdAt: Date }, { strict: false }));
    const withdrawals = await WithdrawalRequest.find({ restaurantId: r._id });
    console.log('Withdrawals:', withdrawals);
  }
  process.exit(0);
};

checkSalmon();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const withdrawalSchema = new mongoose.Schema({
  restaurantId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String
}, { timestamps: true });
const WithdrawalRequest = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', withdrawalSchema);

mongoose.connect(MONGO_URI).then(async () => {
  // Raju ka dhaba IDs
  const rajuMongoId = '6a087638fc8d6083b4f0b83f';

  // MAAVA IDs  
  const maavaMongoId = '69fc3ed6bfb3d1eea69f0260';

  // Check Raju ka dhaba withdrawals
  const rajuWithdrawals = await WithdrawalRequest.find({
    restaurantId: new mongoose.Types.ObjectId(rajuMongoId)
  }).lean();

  console.log('=== Raju ka dhaba Withdrawals ===');
  console.log('Total withdrawal records:', rajuWithdrawals.length);
  rajuWithdrawals.forEach(w => console.log(`  amount: ${w.amount}, status: ${w.status}`));

  // Check MAAVA withdrawals
  const maavaWithdrawals = await WithdrawalRequest.find({
    restaurantId: new mongoose.Types.ObjectId(maavaMongoId)
  }).lean();

  console.log('\n=== MAAVA Withdrawals ===');
  console.log('Total withdrawal records:', maavaWithdrawals.length);
  maavaWithdrawals.forEach(w => console.log(`  amount: ${w.amount}, status: ${w.status}`));

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });

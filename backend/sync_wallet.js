import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function syncWallet() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Restaurant = (await import('./modules/restaurant/models/Restaurant.js')).default;
    const RestaurantWallet = (await import('./modules/restaurant/models/RestaurantWallet.js')).default;
    const Order = (await import('./modules/order/models/Order.js')).default;
    const RestaurantCommission = (await import('./modules/admin/models/RestaurantCommission.js')).default;

    const rest = await Restaurant.findOne({ name: 'Raju ka dhaba' });
    if (!rest) {
      console.log('Restaurant not found');
      process.exit(1);
    }
    
    console.log(`Processing for Restaurant: ${rest.name} (${rest._id})`);

    const wallet = await RestaurantWallet.findOrCreateByRestaurantId(rest._id);
    
    const deliveredOrders = await Order.find({ 
      restaurantId: { $in: [rest._id.toString(), rest.restaurantId] },
      status: 'delivered' 
    });

    console.log(`Found ${deliveredOrders.length} delivered orders.`);

    let addedCount = 0;
    
    for (const order of deliveredOrders) {
      const orderIdStr = order._id.toString();
      
      const existing = wallet.transactions?.find(t => 
        t.orderId && t.orderId.toString() === orderIdStr && t.type === 'payment'
      );
      
      if (existing) {
        console.log(`Order ${order.orderId} already synced.`);
        continue;
      }
      
      const foodPrice = (order.pricing?.subtotal || 0) - (order.pricing?.discount || 0);
      let commissionAmount = 0;
      
      try {
        const commissionResult = await RestaurantCommission.calculateCommissionForOrder(rest._id, foodPrice);
        commissionAmount = commissionResult.commission || 0;
      } catch (err) {
        commissionAmount = (foodPrice * 10) / 100; // fallback 10%
      }
      
      const earning = foodPrice - commissionAmount;
      
      if (earning > 0) {
        wallet.addTransaction({
          amount: earning,
          type: 'payment',
          status: 'Completed',
          description: `Order #${order.orderId} - Synced manually`,
          orderId: order._id
        });
        addedCount++;
        console.log(`Added ₹${earning.toFixed(2)} for Order ${order.orderId}`);
      }
    }

    if (addedCount > 0) {
      await wallet.save();
      console.log(`Successfully synced ${addedCount} orders. New Balance: ₹${wallet.totalBalance.toFixed(2)}`);
    } else {
      console.log('Wallet is already up to date!');
      console.log(`Current Balance: ₹${wallet.totalBalance.toFixed(2)}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

syncWallet();

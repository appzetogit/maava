import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

await mongoose.connect(process.env.MONGODB_URI);
const { default: Order } = await import('./modules/order/models/Order.js');

// Check BOTH orders from the errors
const ids = ['69c3c6df0ed7061778ab22f5', '69c3cb560ed7061778ab25e5'];
for (const id of ids) {
  const order = await Order.findById(id).lean();
  if (!order) { console.log(`NOT FOUND: ${id}`); continue; }
  const created = new Date(order.createdAt);
  const confirmed = order.tracking?.confirmed?.timestamp ? new Date(order.tracking.confirmed.timestamp) : null;
  const cancelled = order.cancelledAt ? new Date(order.cancelledAt) : null;
  
  const secToCancel = cancelled && confirmed ? Math.floor((cancelled - confirmed) / 1000) : 
    (cancelled ? Math.floor((cancelled - created) / 1000) : null);
  
  console.log(`\nOrder: ${id}`);
  console.log(`  orderId: ${order.orderId}`);
  console.log(`  status: ${order.status}`);
  console.log(`  cancelledBy: ${order.cancelledBy}`);
  console.log(`  cancellationReason: ${order.cancellationReason}`);
  console.log(`  createdAt (UTC): ${created.toISOString()}`);
  console.log(`  confirmedAt (UTC): ${confirmed?.toISOString() || 'NEVER_CONFIRMED'}`);
  console.log(`  cancelledAt (UTC): ${cancelled?.toISOString() || 'NOT_CANCELLED'}`);
  console.log(`  seconds from ${confirmed ? 'confirmed' : 'created'} to cancelled: ${secToCancel}`);
  console.log(`  restaurantId: ${order.restaurantId}`);
  console.log(`  paymentMethod: ${order.payment?.method}`);
}

await mongoose.disconnect();
process.exit(0);

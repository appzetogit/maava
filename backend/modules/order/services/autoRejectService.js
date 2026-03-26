import Order from '../models/Order.js';
import { notifyRestaurantOrderUpdate } from './restaurantNotificationService.js';
import { calculateCancellationRefund } from './cancellationRefundService.js';

/**
 * Automatically reject orders that haven't been accepted within the accept time limit
 * This runs as a cron job to check all pending/confirmed orders
 * Accept time limit (Confirmed): 600 seconds (10 minutes) - Increased from 4 mins for better reliability
 * Accept time limit (Pending): 900 seconds (15 minutes) - For payment timeout
 * @returns {Promise<{processed: number, message: string}>}
 */
export async function processAutoRejectOrders() {
  try {
    const RESTAURANT_ACCEPT_TIME_LIMIT_SECONDS = 600; // 10 minutes (Restaurant acceptance)
    const PAYMENT_PENDING_TIME_LIMIT_SECONDS = 900;    // 15 minutes (Payment timeout)
    
    const now = new Date();
    console.log(`[AutoReject] Starting check at ${now.toISOString()}`);
    
    const RESTAURANT_ACCEPT_TIME_LIMIT_MS = RESTAURANT_ACCEPT_TIME_LIMIT_SECONDS * 1000;
    const PAYMENT_PENDING_TIME_LIMIT_MS = PAYMENT_PENDING_TIME_LIMIT_SECONDS * 1000;

    // Find all orders with status 'pending' or 'confirmed' that haven't been accepted yet
    const validOrders = await Order.find({
      status: { $in: ['pending', 'confirmed'] }
    }).lean();

    if (validOrders.length === 0) {
      // console.log('[AutoReject] No pending/confirmed orders found');
      return { processed: 0, message: 'No orders to check' };
    }
    
    console.log(`[AutoReject] Checking ${validOrders.length} orders...`);

    let processedCount = 0;
    const rejectedOrders = [];

    for (const order of validOrders) {
      let isExpired = false;
      let reason = '';
      let cancelledBy = 'system';
      let elapsedMs = 0;

      if (order.status === 'confirmed') {
        // Confirmed orders: Restaurant has been notified and needs to accept
        // We calculate elapsed time since the order reached 'confirmed' status
        const confirmedAt = order.tracking?.confirmed?.timestamp 
          ? new Date(order.tracking.confirmed.timestamp) 
          : new Date(order.createdAt);
        
        elapsedMs = now - confirmedAt;
        
        if (elapsedMs >= RESTAURANT_ACCEPT_TIME_LIMIT_MS) {
          isExpired = true;
          reason = 'Order not accepted within time limit. Restaurant did not respond in time.';
          cancelledBy = 'restaurant';
        }
      } else if (order.status === 'pending') {
        // Pending orders: Waiting for payment completion
        // If it stays pending for too long, it's likely a failed or abandoned payment
        elapsedMs = now - new Date(order.createdAt);
        
        if (elapsedMs >= PAYMENT_PENDING_TIME_LIMIT_MS) {
          isExpired = true;
          reason = 'Order could not be processed within the time limit. (Payment pending for too long)';
          cancelledBy = 'system';
        }
        console.log(`[AutoReject] Pending order ${order.orderId}: elapsed ${Math.floor(elapsedMs/1000)}s / ${PAYMENT_PENDING_TIME_LIMIT_SECONDS}s`);
      }
      
      if (order.status === 'confirmed') {
        console.log(`[AutoReject] Confirmed order ${order.orderId}: elapsed ${Math.floor(elapsedMs/1000)}s / ${RESTAURANT_ACCEPT_TIME_LIMIT_SECONDS}s`);
      }

      if (isExpired) {
        try {
          // Double-check order hasn't been changed by another process
          const currentOrder = await Order.findById(order._id);
          if (!currentOrder || !['pending', 'confirmed'].includes(currentOrder.status)) {
            continue;
          }

          // Update order status to cancelled
          currentOrder.status = 'cancelled';
          currentOrder.cancellationReason = reason;
          currentOrder.cancelledBy = cancelledBy;
          currentOrder.cancelledAt = now;

          // Sync tracking
          const currentTracking = currentOrder.tracking || {};
          currentTracking.cancelled = {
            status: true,
            timestamp: now,
            reason: reason,
            cancelledBy: cancelledBy
          };
          currentOrder.tracking = currentTracking;

          await currentOrder.save();

          rejectedOrders.push({
            orderId: currentOrder.orderId,
            status: order.status,
            elapsedSeconds: Math.floor(elapsedMs / 1000)
          });
          processedCount++;

          console.log(`✅ Order ${currentOrder.orderId} (${order.status}) automatically rejected (elapsed: ${Math.floor(elapsedMs / 1000)}s, CancelledBy: ${cancelledBy})`);

          // Calculate refund but skip if was pending (never paid)
          if (order.status === 'confirmed') {
            try {
              await calculateCancellationRefund(currentOrder._id, reason);
              console.log(`✅ Cancellation refund calculated for ${currentOrder.orderId}`);
            } catch (refundError) {
              console.error(`❌ Refund Error for ${currentOrder.orderId}:`, refundError.message);
            }
          }

          // Notify restaurant about status update (only if they were actually working on it)
          if (order.status === 'confirmed') {
            try {
              await notifyRestaurantOrderUpdate(currentOrder._id.toString(), 'cancelled');
            } catch (notifError) {
              console.error(`❌ Notification Error for ${currentOrder.orderId}:`, notifError.message);
            }
          }
        } catch (updateError) {
          console.error(`❌ Error auto-rejecting order ${order.orderId}:`, updateError);
        }
      }
    }

    return {
      processed: processedCount,
      message: processedCount > 0
        ? `Auto-rejected ${processedCount} order(s)`
        : 'No orders to auto-reject'
    };
  } catch (error) {
    console.error('❌ Error processing auto-reject orders:', error);
    return { processed: 0, message: `Error: ${error.message}` };
  }
}

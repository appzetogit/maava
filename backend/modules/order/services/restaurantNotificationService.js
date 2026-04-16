import Order from '../models/Order.js';
import Payment from '../../payment/models/Payment.js';
import Restaurant from '../../restaurant/models/Restaurant.js';
import mongoose from 'mongoose';

// Dynamic import to avoid circular dependency
let getIO = null;

async function getIOInstance() {
  if (!getIO) {
    const serverModule = await import('../../../server.js');
    getIO = serverModule.getIO;
  }
  return getIO ? getIO() : null;
}

// Push notification import (dynamic to avoid direct index dependency problems)
const getPushService = async () => {
  return await import('../../notification/services/pushNotificationService.js');
};

/**
 * Notify restaurant about new order via Socket.IO
 * @param {Object} order - Order document
 * @param {string} restaurantId - Restaurant ID
 * @param {string} [paymentMethodOverride] - Explicit payment method ('cash' | 'razorpay') so restaurant sees correct value
 */
export async function notifyRestaurantNewOrder(order, restaurantId, paymentMethodOverride) {
  try {
    const io = await getIOInstance();

    if (!io) {
      console.warn('Socket.IO not initialized, skipping restaurant notification');
      return;
    }

    // CRITICAL: Validate restaurantId matches order's restaurantId
    const orderRestaurantId = order.restaurantId?.toString() || order.restaurantId;
    const providedRestaurantId = restaurantId?.toString() || restaurantId;

    if (orderRestaurantId !== providedRestaurantId) {
      console.error('❌ CRITICAL: RestaurantId mismatch in notification!', {
        orderRestaurantId: orderRestaurantId,
        providedRestaurantId: providedRestaurantId,
        orderId: order.orderId,
        orderRestaurantName: order.restaurantName
      });
      // Use order's restaurantId instead of provided one
      restaurantId = orderRestaurantId;
    }

    // Get restaurant details
    let restaurant = null;
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
      restaurant = await Restaurant.findById(restaurantId).lean();
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne({
        $or: [
          { restaurantId: restaurantId },
          { _id: restaurantId }
        ]
      }).lean();
    }

    // Validate restaurant name matches order
    if (restaurant && order.restaurantName && restaurant.name !== order.restaurantName) {
      console.warn('⚠️ Restaurant name mismatch:', {
        orderRestaurantName: order.restaurantName,
        foundRestaurantName: restaurant.name,
        restaurantId: restaurantId
      });
      // Still proceed but log warning
    }

    // Resolve payment method: override > order.payment > Payment collection (COD fallback)
    let resolvedPaymentMethod = paymentMethodOverride ?? order.payment?.method ?? 'razorpay';
    if (resolvedPaymentMethod !== 'cash') {
      try {
        const paymentRecord = await Payment.findOne({ orderId: order._id }).select('method').lean();
        if (paymentRecord?.method === 'cash') resolvedPaymentMethod = 'cash';
      } catch (e) { /* ignore */ }
    }

    // Prepare order notification data
    const orderNotification = {
      orderId: order.orderId,
      orderMongoId: order._id.toString(),
      restaurantId: restaurantId,
      restaurantName: order.restaurantName,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: order.pricing.total,
      customerAddress: {
        label: order.address.label,
        street: order.address.street,
        city: order.address.city,
        location: order.address.location
      },
      status: order.status,
      createdAt: order.createdAt,
      estimatedDeliveryTime: order.estimatedDeliveryTime || 30,
      note: order.note || '',
      sendCutlery: order.sendCutlery,
      paymentMethod: resolvedPaymentMethod
    };
    console.log('📢 Restaurant notification payload paymentMethod:', orderNotification.paymentMethod, { override: paymentMethodOverride, orderPaymentMethod: order.payment?.method });

    // Get restaurant namespace
    const restaurantNamespace = io.of('/restaurant');

    // Normalize restaurantId to string (handle both ObjectId and string)
    const normalizedRestaurantId = restaurantId?.toString() || restaurantId;

    // Try multiple room formats to ensure we find the restaurant
    const roomVariations = [
      `restaurant:${normalizedRestaurantId}`,
      `restaurant:${restaurantId}`,
      ...(mongoose.Types.ObjectId.isValid(normalizedRestaurantId)
        ? [`restaurant:${new mongoose.Types.ObjectId(normalizedRestaurantId).toString()}`]
        : [])
    ];

    // Get all connected sockets in the restaurant room
    let socketsInRoom = [];
    for (const room of roomVariations) {
      const sockets = await restaurantNamespace.in(room).fetchSockets();
      if (sockets.length > 0) {
        socketsInRoom = sockets;
        console.log(`📢 Found ${sockets.length} socket(s) in room: ${room}`);
        break;
      }
    }

    const primaryRoom = roomVariations[0];

    console.log(`📢 CRITICAL: Attempting to notify restaurant about new order:`);
    console.log(`📢 Order ID: ${order.orderId}`);
    console.log(`📢 Order MongoDB ID: ${order._id?.toString()}`);
    console.log(`📢 Restaurant ID (normalized): ${normalizedRestaurantId}`);
    console.log(`📢 Restaurant Name: ${order.restaurantName}`);
    console.log(`📢 Restaurant ID from order: ${order.restaurantId}`);
    console.log(`📢 Room variations to try:`, roomVariations);
    console.log(`📢 Connected sockets in primary room ${primaryRoom}: ${socketsInRoom.length}`);

    // CRITICAL: Only emit to the specific restaurant room - NEVER broadcast to all restaurants
    // This ensures orders only go to the correct restaurant
    if (socketsInRoom.length > 0) {
      // Found sockets in the restaurant room - send notification ONLY ONCE to the primary room
      // This prevents double notifications if the restaurant is connected through multiple alias rooms.
      const targetRoom = socketsInRoom.length > 0 ? primaryRoom : roomVariations[0];
      restaurantNamespace.to(targetRoom).emit('new_order', orderNotification);
      restaurantNamespace.to(targetRoom).emit('play_notification_sound', {
        type: 'new_order',
        orderId: order.orderId,
        message: `New order received: ${order.orderId}`
      });
      console.log(`📤 Sent notification only to room: ${targetRoom}`);
      console.log(`✅ Notified restaurant ${normalizedRestaurantId} about new order ${order.orderId} (${socketsInRoom.length} socket(s) connected)`);
    } else {
      // No sockets found in restaurant room - log error but DO NOT broadcast to all restaurants
      console.error(`❌ CRITICAL: No sockets found for restaurant ${normalizedRestaurantId} in any room!`);
      console.error(`❌ Order ${order.orderId} will NOT be delivered to restaurant ${normalizedRestaurantId}`);
      console.error(`❌ Room variations tried:`, roomVariations);
      console.error(`❌ Restaurant name: ${order.restaurantName}`);
      console.error(`❌ Restaurant ID from order: ${order.restaurantId}`);
      console.error(`❌ Normalized restaurant ID: ${normalizedRestaurantId}`);

      // Log all connected restaurant sockets for debugging (but don't send to them)
      const allSockets = await restaurantNamespace.fetchSockets();
      console.log(`📊 Total restaurant sockets connected: ${allSockets.length}`);
      if (allSockets.length > 0) {
        // Get room information for each socket
        const socketRooms = [];
        for (const socket of allSockets) {
          const rooms = Array.from(socket.rooms);
          socketRooms.push({
            socketId: socket.id,
            rooms: rooms.filter(r => r.startsWith('restaurant:'))
          });
        }
        console.log(`📊 Connected restaurant sockets and their rooms:`, socketRooms);
      }

      // Still try to emit to the primary room (in case socket connects later)
      // But DO NOT broadcast to all restaurants and do NOT loop through aliases
      const targetRoom = roomVariations[0];
      restaurantNamespace.to(targetRoom).emit('new_order', orderNotification);
      restaurantNamespace.to(targetRoom).emit('play_notification_sound', {
        type: 'new_order',
        orderId: order.orderId,
        message: `New order received: ${order.orderId}`
      });
      console.log(`📤 Emitted only to room ${targetRoom} (no sockets found present, but room exists)`);

      // Return error instead of success
      return {
        success: false,
        restaurantId,
        orderId: order.orderId,
        error: 'Restaurant not connected to Socket.IO',
        message: `Restaurant ${normalizedRestaurantId} (${order.restaurantName}) is not connected. Order notification not sent.`
      };
    }

    // --- PUSH NOTIFICATION (AUTOMATED) ---
    try {
      const pushService = await getPushService();

      // Get customer name for the message
      let customerName = 'a customer';
      if (order.userId && typeof order.userId === 'object' && (order.userId.name || order.userId.fullName)) {
        customerName = order.userId.name || order.userId.fullName;
      } else if (order.userId) {
        try {
          const User = (await import('../../auth/models/User.js')).default;
          const userEntity = await User.findById(order.userId).select('name fullName').lean();
          if (userEntity) {
            customerName = userEntity.name || userEntity.fullName || 'a customer';
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch user name for restaurant notification:', err.message);
        }
      }

      await pushService.sendNotificationToUser(
        normalizedRestaurantId,
        'restaurant',
        '🔔 New Order Received!',
        `You have a new order from ${customerName}. Total: ₹${order.pricing.total}`,
        { orderId: order._id.toString(), type: 'NEW_ORDER' }
      );
    } catch (pushErr) {
      console.warn('⚠️ Failed to send backup push notification to restaurant:', pushErr.message);
    }

    return {
      success: true,
      restaurantId,
      orderId: order.orderId
    };
  } catch (error) {
    console.error('Error notifying restaurant:', error);
    throw error;
  }
}

/**
 * Notify restaurant about order status update
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 */
export async function notifyRestaurantOrderUpdate(orderId, status) {
  try {
    const io = await getIOInstance();

    if (!io) {
      return;
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new Error('Order not found');
    }

    // Get restaurant namespace
    const restaurantNamespace = io.of('/restaurant');

    restaurantNamespace.to(`restaurant:${order.restaurantId}`).emit('order_status_update', {
      orderId: order.orderId,
      status,
      updatedAt: new Date()
    });

    console.log(`📢 Notified restaurant ${order.restaurantId} about order ${order.orderId} status: ${status}`);
  } catch (error) {
    console.error('Error notifying restaurant about order update:', error);
    throw error;
  }
}

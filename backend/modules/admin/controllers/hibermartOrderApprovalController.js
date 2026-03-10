import { asyncHandler } from '../../../shared/middleware/asyncHandler.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import Order from '../../order/models/Order.js';
import Restaurant from '../../restaurant/models/Restaurant.js';
import InMartStore from '../../inmart/models/InMartStore.js';
import HibermartStoreLocation from '../../inmart/models/HibermartStoreLocation.js';
import Delivery from '../../delivery/models/Delivery.js';
import {
  findNearestDeliveryBoys,
  findNearestDeliveryBoy,
  assignOrderToDeliveryBoy
} from '../../order/services/deliveryAssignmentService.js';
import { notifyMultipleDeliveryBoys, notifyDeliveryBoyNewOrder } from '../../order/services/deliveryNotificationService.js';

const getOrderByIdOrOrderId = async (id) => {
  if (!id) return null;
  const order = await Order.findOne({
    $or: [
      { _id: id },
      { orderId: id }
    ]
  });
  return order;
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const filterDeliveryPartnersByZone = async (deliveryPartnerIds, zoneId, skipZoneFilter = false) => {
  if (skipZoneFilter || !zoneId || !deliveryPartnerIds?.length) return deliveryPartnerIds || [];
  const partners = await Delivery.find({
    _id: { $in: deliveryPartnerIds },
    'availability.zones': zoneId
  }).select('_id').lean();
  return partners.map(p => p._id.toString());
};

const resolveRestaurantLocation = async (order) => {
  // Prefer Hibermart store location from admin-set pin (separate collection)
  try {
    const storeDoc = await HibermartStoreLocation.getOrCreate();
    const storeLoc = storeDoc?.location;
    if (storeLoc && (storeLoc.coordinates?.length >= 2 || (storeLoc.latitude && storeLoc.longitude))) {
      const lat = storeLoc.coordinates?.[1] || storeLoc.latitude;
      const lng = storeLoc.coordinates?.[0] || storeLoc.longitude;
      return {
        restaurant: {
          name: storeDoc?.name || 'Hibermart Store',
          address: storeLoc.formattedAddress || storeLoc.address || 'Hibermart Store Location',
          location: {
            ...storeLoc,
            coordinates: storeLoc.coordinates?.length ? storeLoc.coordinates : [lng, lat]
          }
        },
        lat,
        lng
      };
    }
  } catch (e) {
    console.warn('⚠️ Could not load Hibermart store location:', e?.message || e);
  }

  if (!order?.restaurantId) return null;
  if (typeof order.restaurantId === 'object' && order.restaurantId?.location?.coordinates) {
    const coords = order.restaurantId.location.coordinates;
    return {
      restaurant: order.restaurantId,
      lat: coords?.[1],
      lng: coords?.[0]
    };
  }

  let restaurant = null;
  if (order.restaurantId) {
    restaurant = await Restaurant.findOne({
      $or: [
        { _id: order.restaurantId },
        { restaurantId: order.restaurantId },
        { slug: order.restaurantId }
      ]
    }).lean();
  }

  if (restaurant?.location?.coordinates) {
    return {
      restaurant,
      lat: restaurant.location.coordinates[1],
      lng: restaurant.location.coordinates[0]
    };
  }

  // Hibermart: fallback to nearest InMart store based on customer location
  const customerCoords = order?.address?.location?.coordinates;
  if (customerCoords && customerCoords.length >= 2) {
    const [customerLng, customerLat] = customerCoords;
    const stores = await InMartStore.find({ isActive: true, isAcceptingOrders: true })
      .select('name location address')
      .lean();
    let nearestStore = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    stores.forEach((store) => {
      const coords = store?.location?.coordinates;
      if (!coords || coords.length < 2) return;
      const [storeLng, storeLat] = coords;
      if (!storeLat || !storeLng) return;
      const distance = calculateDistance(customerLat, customerLng, storeLat, storeLng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStore = store;
      }
    });

    if (nearestStore?.location?.coordinates) {
      return {
        restaurant: {
          name: nearestStore.name || 'Hibermart Admin',
          address: nearestStore.location?.formattedAddress || nearestStore.address || 'Hibermart Admin Location',
          location: nearestStore.location
        },
        lat: nearestStore.location.coordinates[1],
        lng: nearestStore.location.coordinates[0]
      };
    }
  }

  return null;
};

export const getPendingHibermartOrders = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;

  // Robust Hibermart check query
  const hibermartMatch = {
    $or: [
      { isHibermartOrder: true },
      { restaurantId: 'hibermart-id' },
      { restaurantName: { $regex: /^hibermart$/i } }
    ]
  };

  const query = { ...hibermartMatch };

  if (status === 'pending') {
    query['adminApproval.status'] = 'pending';
    // Ensure we don't show cancelled orders in pending list
    query.status = { $nin: ['cancelled', 'delivered'] };
  } else if (status === 'approved') {
    query['adminApproval.status'] = 'approved';
    // Filter for last 7 days for historical views
    query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  } else if (status === 'rejected') {
    query['adminApproval.status'] = 'rejected';
    query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name phone email')
    .lean();

  return successResponse(res, 200, 'Hibermart orders retrieved', {
    orders,
    total: orders.length
  });
});

export const approveHibermartOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?._id;

  console.log('📦 [Hibermart Approve] Request received:', { id, adminId: adminId?.toString?.() || adminId });

  const order = await getOrderByIdOrOrderId(id);
  if (!order) {
    console.error(`❌ [Hibermart Approve] Order ${id} not found`);
    return errorResponse(res, 404, 'Order not found');
  }

  // Robust check for Hibermart order
  const isHibermart = order.isHibermartOrder || order.restaurantId === 'hibermart-id' || order.restaurantName?.toLowerCase() === 'hibermart';

  if (!isHibermart) {
    console.error(`❌ [Hibermart Approve] Order ${id} is NOT a Hibermart order (isHibermartOrder: ${order.isHibermartOrder}, restaurantId: ${order.restaurantId})`);
    return errorResponse(res, 400, 'Order is not a Hibermart order');
  }

  if (order.adminApproval?.status === 'approved') {
    console.warn(`⚠️ [Hibermart Approve] Order ${id} is already approved`);
    return errorResponse(res, 400, 'Order is already approved');
  }

  if (order.status === 'cancelled') {
    console.warn(`⚠️ [Hibermart Approve] Order ${id} is already cancelled`);
    return errorResponse(res, 400, 'Cannot approve a cancelled order');
  }

  order.adminApproval = {
    ...(order.adminApproval || {}),
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: adminId || undefined
  };

  // Move order forward so delivery partners can accept (match restaurant flow)
  if (order.status === 'pending') {
    order.tracking.confirmed = { status: true, timestamp: new Date() };
  }
  order.status = 'preparing';
  order.tracking.preparing = { status: true, timestamp: new Date() };

  await order.save();

  console.log(`✅ Hibermart order approved. Starting delivery notification flow for order ${order.orderId}`);

  // Notify delivery partners using the same flow as restaurant accept (best-effort)
  try {
    if (!order.deliveryPartnerId) {
      const location = await resolveRestaurantLocation(order);
      if (!location) {
        console.warn(`⚠️ Hibermart order ${order.orderId} has no store location. Broadcasting to all online partners.`);
      }
      if (location?.lat && location?.lng) {
        const orderForNotification = {
          ...(order.toObject ? order.toObject() : order),
          restaurantName: location.restaurant?.name || order.restaurantName,
          restaurantId: {
            name: location.restaurant?.name || order.restaurantName,
            address: location.restaurant?.address || 'Hibermart Admin Location',
            location: {
              coordinates: [location.lng, location.lat],
              formattedAddress: location.restaurant?.address || 'Hibermart Admin Location'
            }
          },
          restaurantLocation: {
            coordinates: [location.lng, location.lat],
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress: location.restaurant?.address || 'Hibermart Admin Location',
            address: location.restaurant?.address || 'Hibermart Admin Location'
          }
        };

        console.log(`📍 Hibermart store location resolved: ${location.lat}, ${location.lng}`);

        const priorityDeliveryBoys = await findNearestDeliveryBoys(
          location.lat,
          location.lng,
          order.restaurantId,
          5
        );

        // Try direct assignment to nearest delivery boy (same as restaurant flow fallback)
        try {
          const assignResult = await assignOrderToDeliveryBoy(order, location.lat, location.lng, order.restaurantId);
          if (assignResult?.deliveryPartnerId) {
            console.log(`✅ Hibermart order assigned to delivery partner ${assignResult.deliveryPartnerId}`);
            const populatedOrder = await Order.findById(order._id)
              .populate('userId', 'name phone')
              .populate('restaurantId', 'name address location phone ownerPhone')
              .lean();
            await notifyDeliveryBoyNewOrder(orderForNotification, assignResult.deliveryPartnerId);
          }
        } catch (assignError) {
          console.warn('⚠️ Hibermart direct assignment failed (continuing with notify flow):', assignError?.message || assignError);
        }

        if (priorityDeliveryBoys?.length) {
          order.assignmentInfo = {
            ...(order.assignmentInfo || {}),
            priorityNotifiedAt: new Date(),
            priorityDeliveryPartnerIds: priorityDeliveryBoys.map(db => db.deliveryPartnerId),
            notificationPhase: 'priority',
            assignedBy: 'manual'
          };
          await order.save();

          let priorityIds = priorityDeliveryBoys.map(db => db.deliveryPartnerId);
          priorityIds = await filterDeliveryPartnersByZone(priorityIds, order.assignmentInfo?.zoneId, false);
          console.log(`📣 Hibermart priority notify count: ${priorityIds.length}`);
          await notifyMultipleDeliveryBoys(orderForNotification, priorityIds, 'priority');

          setTimeout(async () => {
            try {
              const checkOrder = await Order.findById(order._id);
              if (!checkOrder || checkOrder.deliveryPartnerId) return;

              const allDeliveryBoys = await findNearestDeliveryBoys(
                location.lat,
                location.lng,
                order.restaurantId,
                50
              );
              const expandedDeliveryBoys = allDeliveryBoys.filter(
                db => !priorityIds.includes(db.deliveryPartnerId)
              );

              if (expandedDeliveryBoys?.length) {
                let expandedIds = expandedDeliveryBoys.map(db => db.deliveryPartnerId);
                expandedIds = await filterDeliveryPartnersByZone(expandedIds, checkOrder.assignmentInfo?.zoneId, false);
                console.log(`📣 Hibermart expanded notify count: ${expandedIds.length}`);
                checkOrder.assignmentInfo = {
                  ...(checkOrder.assignmentInfo || {}),
                  expandedNotifiedAt: new Date(),
                  expandedDeliveryPartnerIds: expandedIds,
                  notificationPhase: 'expanded'
                };
                await checkOrder.save();

                await notifyMultipleDeliveryBoys(orderForNotification, expandedIds, 'expanded');
              }
            } catch (expandError) {
              console.error('Error in expanded Hibermart notification:', expandError);
            }
          }, 30000);
        } else {
          const anyDeliveryBoy = await findNearestDeliveryBoy(
            location.lat,
            location.lng,
            order.restaurantId,
            50
          );
          if (anyDeliveryBoy) {
            await notifyMultipleDeliveryBoys(orderForNotification, [anyDeliveryBoy.deliveryPartnerId], 'immediate');
          } else {
            // Fallback: notify all online delivery partners (no location filter)
            const allOnlinePartners = await Delivery.find({
              'availability.isOnline': true,
              status: { $in: ['approved', 'active'] },
              isActive: true
            }).select('_id').lean();
            const allIds = allOnlinePartners.map(p => p._id.toString());
            if (allIds.length > 0) {
              console.log(`📣 Hibermart fallback notify count: ${allIds.length}`);
              await notifyMultipleDeliveryBoys(orderForNotification, allIds, 'broadcast');
            } else {
              console.warn('⚠️ No online delivery partners found for Hibermart fallback notification');
            }
          }
        }
      } else {
        const allOnlinePartners = await Delivery.find({
          'availability.isOnline': true,
          status: { $in: ['approved', 'active'] },
          isActive: true
        }).select('_id').lean();
        const allIds = allOnlinePartners.map(p => p._id.toString());
        if (allIds.length > 0) {
          console.log(`📣 Hibermart fallback notify count (no location): ${allIds.length}`);
          await notifyMultipleDeliveryBoys(order.toObject ? order.toObject() : order, allIds, 'broadcast');
        }
      }
    }
  } catch (notificationError) {
    console.error('Error notifying delivery partners for Hibermart order:', notificationError);
  }

  return successResponse(res, 200, 'Hibermart order approved', {
    orderId: order.orderId,
    status: order.status
  });
});

export const rejectHibermartOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.admin?._id;

  const order = await getOrderByIdOrOrderId(id);
  if (!order) {
    console.error(`❌ [Hibermart Reject] Order ${id} not found`);
    return errorResponse(res, 404, 'Order not found');
  }

  // Robust check for Hibermart order
  const isHibermart = order.isHibermartOrder || order.restaurantId === 'hibermart-id' || order.restaurantName?.toLowerCase() === 'hibermart';

  if (!isHibermart) {
    console.error(`❌ [Hibermart Reject] Order ${id} is NOT a Hibermart order`);
    return errorResponse(res, 400, 'Order is not a Hibermart order');
  }

  if (order.status === 'cancelled') {
    return errorResponse(res, 400, 'Order is already cancelled');
  }

  order.adminApproval = {
    ...(order.adminApproval || {}),
    status: 'rejected',
    rejectedAt: new Date(),
    rejectedBy: adminId || undefined,
    rejectionReason: reason || 'Rejected by admin'
  };

  order.status = 'cancelled';
  order.cancelledBy = 'admin';
  order.cancellationReason = reason || 'Rejected by admin';
  order.cancelledAt = new Date();

  await order.save();

  // If payment was completed, attempt to process refund immediately
  try {
    const paymentMethod = order.payment?.method;
    const paymentStatus = order.payment?.status;
    if ((paymentMethod === 'razorpay' || paymentMethod === 'wallet') && paymentStatus === 'completed') {
      const { processCancellationRefund } = await import('../../order/services/cancellationRefundService.js');
      await processCancellationRefund(order._id, order.cancellationReason);
    }
  } catch (refundError) {
    console.error('Error processing Hibermart order refund:', refundError);
  }

  return successResponse(res, 200, 'Hibermart order rejected', {
    orderId: order.orderId,
    status: order.status
  });
});

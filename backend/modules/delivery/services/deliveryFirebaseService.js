/**
 * Delivery Firebase Service
 * ==========================
 * Handles ALL delivery-related writes/reads to Firebase Realtime Database.
 *
 * Firebase DB Structure:
 * ─────────────────────
 * delivery_boys/
 *   {boyId}/
 *     status: "online" | "offline" | "busy"
 *     lat: number
 *     lng: number
 *     last_updated: timestamp (ms)
 *     name: string
 *     phone: string
 *     active_order: string | null   ← current orderId
 *
 * active_orders/
 *   {orderId}/
 *     polyline: string              ← Google encoded polyline (written ONCE on order assign)
 *     total_distance: number        ← km
 *     duration: number              ← seconds
 *     boy_id: string
 *     boy_lat: number
 *     boy_lng: number
 *     boy_bearing: number
 *     status: "assigned"|"picked_up"|"delivered"
 *     updated_at: timestamp (ms)
 *
 * COST SAVING:
 *  • Polyline is fetched from Google Directions API ONLY ONCE per order.
 *  • After that, all clients (user tracking screen) read it from Firebase — FREE.
 *  • Live location updates are direct writes to Firebase — NO Maps API calls.
 */

import { getRealtimeDB, isRealtimeDBReady } from '../../../config/firebaseRealtimeDB.js';

// ─── Delivery Boy Status ──────────────────────────────────────────────────────

/**
 * Set delivery boy as online / offline / busy.
 * @param {string} boyId  — MongoDB delivery partner _id (as string)
 * @param {"online"|"offline"|"busy"} status
 * @param {object} [meta] — optional extra fields like { name, phone }
 */
export async function setDeliveryBoyStatus(boyId, status, meta = {}) {
    const db = getRealtimeDB();
    if (!db) {
        console.warn('⚠️ Firebase Realtime Database not available — skipping status update for boy', boyId);
        return;
    }

    try {
        const ref = db.ref(`delivery_boys/${boyId}`);
        await ref.update({
            status,
            last_updated: Date.now(),
            ...meta
        });
        console.log(`📡 Firebase: delivery boy ${boyId} status → ${status}`);
    } catch (err) {
        console.error(`❌ Firebase: failed to set status for boy ${boyId}:`, err.message);
    }
}

// ─── Delivery Boy Live Location ───────────────────────────────────────────────

/**
 * Update delivery boy's live GPS location in Firebase.
 * Also updates the corresponding active_orders node.
 *
 * @param {string} boyId
 * @param {string} orderId
 * @param {number} lat
 * @param {number} lng
 * @param {number} [bearing]
 * @param {number} [speed]
 */
export async function updateDeliveryBoyLocation(boyId, orderId, lat, lng, bearing = 0, speed = 20) {
    const db = getRealtimeDB();
    if (!db) {
        console.warn('⚠️ Firebase Realtime Database not available — skipping location update');
        return;
    }

    const now = Date.now();

    try {
        const updates = {};

        // Update delivery boy's location node
        updates[`delivery_boys/${boyId}/lat`] = lat;
        updates[`delivery_boys/${boyId}/lng`] = lng;
        updates[`delivery_boys/${boyId}/bearing`] = bearing;
        updates[`delivery_boys/${boyId}/speed`] = speed;
        updates[`delivery_boys/${boyId}/last_updated`] = now;
        updates[`delivery_boys/${boyId}/status`] = 'busy';
        updates[`delivery_boys/${boyId}/active_order`] = orderId || null;

        // Update active order's tracking node
        if (orderId) {
            updates[`active_orders/${orderId}/boy_lat`] = lat;
            updates[`active_orders/${orderId}/boy_lng`] = lng;
            updates[`active_orders/${orderId}/boy_bearing`] = bearing;
            updates[`active_orders/${orderId}/updated_at`] = now;
        }

        // Multi-path update — atomic
        await db.ref('/').update(updates);
    } catch (err) {
        console.error(`❌ Firebase: location update failed for boy ${boyId}:`, err.message);
    }
}

// ─── Order Polyline (Cache) ───────────────────────────────────────────────────

/**
 * Save the Google Directions polyline to Firebase when an order is assigned.
 * This is called ONCE per order — all subsequent tracking reads from Firebase.
 *
 * @param {string} orderId
 * @param {string} boyId
 * @param {string} polyline         — Google encoded polyline string
 * @param {number} totalDistanceKm
 * @param {number} durationSeconds
 */
export async function saveOrderPolylineToFirebase(orderId, boyId, polyline, totalDistanceKm, durationSeconds) {
    const db = getRealtimeDB();
    if (!db) {
        console.warn('⚠️ Firebase Realtime Database not available — polyline not cached for order', orderId);
        return;
    }

    try {
        await db.ref(`active_orders/${orderId}`).set({
            polyline,
            total_distance: totalDistanceKm,
            duration: durationSeconds,
            boy_id: boyId,
            boy_lat: null,
            boy_lng: null,
            boy_bearing: 0,
            status: 'assigned',
            updated_at: Date.now()
        });
        console.log(`✅ Firebase: polyline saved for order ${orderId} (${(polyline || '').length} chars)`);
    } catch (err) {
        console.error(`❌ Firebase: failed to save polyline for order ${orderId}:`, err.message);
    }
}

/**
 * Fetch the cached polyline for an order from Firebase.
 * Returns null if not found or Firebase is unavailable.
 *
 * @param {string} orderId
 * @returns {Promise<object|null>}  { polyline, total_distance, duration, boy_lat, boy_lng, status }
 */
export async function getOrderTrackingFromFirebase(orderId) {
    const db = getRealtimeDB();
    if (!db) return null;

    try {
        const snapshot = await db.ref(`active_orders/${orderId}`).once('value');
        return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
        console.error(`❌ Firebase: failed to fetch tracking for order ${orderId}:`, err.message);
        return null;
    }
}

/**
 * Update order status in Firebase (e.g., picked_up, delivered).
 * @param {string} orderId
 * @param {"assigned"|"picked_up"|"delivered"} status
 */
export async function updateOrderStatusInFirebase(orderId, status) {
    const db = getRealtimeDB();
    if (!db) return;

    try {
        await db.ref(`active_orders/${orderId}`).update({
            status,
            updated_at: Date.now()
        });
        console.log(`📡 Firebase: order ${orderId} status → ${status}`);
    } catch (err) {
        console.error(`❌ Firebase: failed to update order status for ${orderId}:`, err.message);
    }
}

/**
 * Remove order from Firebase active_orders once delivered.
 * @param {string} orderId
 */
export async function clearOrderFromFirebase(orderId) {
    const db = getRealtimeDB();
    if (!db) return;

    try {
        await db.ref(`active_orders/${orderId}`).remove();
        console.log(`🗑️ Firebase: cleared active_orders/${orderId}`);
    } catch (err) {
        console.error(`❌ Firebase: failed to clear order ${orderId}:`, err.message);
    }
}

// ─── Nearest Online Delivery Boy ──────────────────────────────────────────────

/**
 * Get all online delivery boys from Firebase.
 * Use this instead of calling Distance Matrix API.
 * Calculate nearest via Haversine formula (free).
 *
 * @param {number} restaurantLat
 * @param {number} restaurantLng
 * @param {number} [radiusKm=10]
 * @returns {Promise<Array>} sorted by distance asc
 */
export async function getNearestOnlineDeliveryBoys(restaurantLat, restaurantLng, radiusKm = 10) {
    const db = getRealtimeDB();
    if (!db) return [];

    try {
        const snapshot = await db.ref('delivery_boys')
            .orderByChild('status')
            .equalTo('online')
            .once('value');

        if (!snapshot.exists()) return [];

        const boys = snapshot.val();
        const results = [];

        for (const [boyId, data] of Object.entries(boys)) {
            if (data.lat == null || data.lng == null) continue;

            const dist = haversineKm(restaurantLat, restaurantLng, data.lat, data.lng);
            if (dist <= radiusKm) {
                results.push({ boyId, ...data, distanceKm: dist });
            }
        }

        results.sort((a, b) => a.distanceKm - b.distanceKm);
        return results;
    } catch (err) {
        console.error('❌ Firebase: failed to get online delivery boys:', err.message);
        return [];
    }
}

// ─── Haversine Helper ─────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

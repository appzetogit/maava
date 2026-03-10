/**
 * useFirebaseTracking — React hook for live delivery tracking via Firebase RTDB
 * ===============================================================================
 * Usage (in your order tracking screen):
 *
 *   const { location, polyline, orderStatus, isLoading } = useFirebaseTracking(orderId);
 *
 *   // location  → { lat, lng, bearing, speed, updated_at }
 *   // polyline  → encoded Google polyline string (decode with polyline lib)
 *   // orderStatus → "assigned" | "picked_up" | "delivered"
 *   // isLoading → true until first Firebase snapshot arrives
 *
 * WHY THIS SAVES MONEY:
 *   - NO Google Maps API calls for location or routing.
 *   - Delivery boy writes lat/lng to Firebase (a free write operation).
 *   - This hook reads from Firebase in real-time — also free (reads are cheap/free tier).
 *   - Polyline is only fetched from Google Directions API ONCE on backend when order
 *     is assigned. After that, all reads come from Firebase.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { realtimeDB } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// ─── Types ────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} TrackingData
 * @property {{ lat: number, lng: number, bearing: number, speed: number, updated_at: number }|null} location
 * @property {string|null} polyline
 * @property {string|null} orderStatus
 * @property {boolean} isLoading
 * @property {boolean} isFirebaseAvailable
 */

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * @param {string|null} orderId
 * @returns {TrackingData}
 */
export function useFirebaseTracking(orderId) {
    const [location, setLocation] = useState(null);
    const [polyline, setPolyline] = useState(null);
    const [orderStatus, setOrderStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const listenerRef = useRef(null);
    const isFirebaseAvailable = !!realtimeDB;

    const cleanup = useCallback(() => {
        if (listenerRef.current) {
            off(listenerRef.current);
            listenerRef.current = null;
        }
    }, []);

    useEffect(() => {
        // If no orderId or Firebase not available, skip
        if (!orderId || !realtimeDB) {
            setIsLoading(false);
            return;
        }

        cleanup();
        setIsLoading(true);

        const orderRef = ref(realtimeDB, `active_orders/${orderId}`);
        listenerRef.current = orderRef;

        const unsubscribe = onValue(
            orderRef,
            (snapshot) => {
                setIsLoading(false);
                if (snapshot.exists()) {
                    const data = snapshot.val();

                    // Update location only if coordinates are present
                    if (data.boy_lat != null && data.boy_lng != null) {
                        setLocation({
                            lat: data.boy_lat,
                            lng: data.boy_lng,
                            bearing: data.boy_bearing || 0,
                            speed: 20, // default
                            updated_at: data.updated_at || Date.now()
                        });
                    }

                    // Update polyline (only written once — free reads after that)
                    if (data.polyline) {
                        setPolyline(data.polyline);
                    }

                    // Update order status
                    if (data.status) {
                        setOrderStatus(data.status);
                    }
                }
            },
            (error) => {
                // Silently handle permission_denied — this is normal for orders
                // that don't have tracking data in Firebase yet (e.g. InMart orders or newly placed orders)
                if (!error.message?.includes('permission_denied')) {
                    console.error('Firebase tracking error:', error.message);
                }
                setIsLoading(false);
            }
        );

        return () => {
            unsubscribe();
            cleanup();
        };
    }, [orderId, cleanup]);

    return {
        location,
        polyline,
        orderStatus,
        isLoading,
        isFirebaseAvailable
    };
}

// ─── Delivery Boy Status Hook ─────────────────────────────────────────────────

/**
 * Listen to a specific delivery boy's status and location from Firebase.
 * Used in admin panels or restaurant dashboards to see nearby boys.
 *
 * @param {string|null} boyId
 * @returns {{ status: string|null, location: {lat,lng}|null, activeOrder: string|null, isOnline: boolean }}
 */
export function useDeliveryBoyStatus(boyId) {
    const [status, setStatus] = useState(null);
    const [location, setLocation] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);

    useEffect(() => {
        if (!boyId || !realtimeDB) return;

        const boyRef = ref(realtimeDB, `delivery_boys/${boyId}`);

        const unsubscribe = onValue(boyRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setStatus(data.status || 'offline');
                setActiveOrder(data.active_order || null);
                if (data.lat != null && data.lng != null) {
                    setLocation({ lat: data.lat, lng: data.lng, bearing: data.bearing || 0 });
                }
            } else {
                setStatus('offline');
            }
        });

        return () => unsubscribe();
    }, [boyId]);

    return {
        status,
        location,
        activeOrder,
        isOnline: status === 'online' || status === 'busy'
    };
}

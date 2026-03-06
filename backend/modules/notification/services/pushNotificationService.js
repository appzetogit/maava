import admin from 'firebase-admin';

/**
 * Send push notification to specific tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send
 * @returns {Promise<Object>} - FCM response
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) {
        return { success: false, message: 'No tokens provided' };
    }

    // Filter out null/undefined tokens
    const validTokens = tokens.filter(token => !!token);
    if (validTokens.length === 0) {
        return { success: false, message: 'No valid tokens provided' };
    }

    // Prepare the message
    const message = {
        notification: {
            title,
            body,
        },
        data: {
            ...data,
            click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK', // Common for mobile apps
        },
        tokens: validTokens,
    };

    try {
        // Note: Use sendEachForMulticast instead of sendMulticast (deprecated in newer versions)
        // admin.messaging().sendMulticast(message) is deprecated in some versions, but sendEachForMulticast is newer
        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`✅ Push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);

        // Check for stale tokens (those that failed with specific error codes)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    console.error(`❌ Token ${validTokens[idx]} failed:`, res.error.code);
                    if (res.error.code === 'messaging/invalid-registration-token' ||
                        res.error.code === 'messaging/registration-token-not-registered') {
                        failedTokens.push(validTokens[idx]);
                    }
                }
            });
            // We could emit an event here to clean up these tokens from DB
        }

        return response;
    } catch (error) {
        console.error('❌ FCM Error:', error);
        throw error;
    }
};

/**
 * Send notification to a specific user role (all users in that role)
 * @param {string} target - 'Customer', 'Delivery Man', 'Restaurant'
 * @param {string} title 
 * @param {string} body 
 * @param {Object} data 
 */
export const sendNotificationToTarget = async (target, title, body, data = {}) => {
    let tokens = [];

    try {
        if (target === 'Customer') {
            const User = (await import('../../auth/models/User.js')).default;
            const users = await User.find({ $or: [{ fcmTokens: { $exists: true, $ne: [] } }, { fcmTokenMobile: { $exists: true, $ne: [] } }] }).select('fcmTokens fcmTokenMobile');
            tokens = users.flatMap(u => [...(u.fcmTokens || []), ...(u.fcmTokenMobile || [])]);
        } else if (target === 'Delivery Man') {
            const Delivery = (await import('../../delivery/models/Delivery.js')).default;
            const deliveryPartners = await Delivery.find({ $or: [{ fcmTokens: { $exists: true, $ne: [] } }, { fcmTokenMobile: { $exists: true, $ne: [] } }] }).select('fcmTokens fcmTokenMobile');
            tokens = deliveryPartners.flatMap(d => [...(d.fcmTokens || []), ...(d.fcmTokenMobile || [])]);
        } else if (target === 'Restaurant') {
            const Restaurant = (await import('../../restaurant/models/Restaurant.js')).default;
            const restaurants = await Restaurant.find({ $or: [{ fcmTokens: { $exists: true, $ne: [] } }, { fcmTokenMobile: { $exists: true, $ne: [] } }] }).select('fcmTokens fcmTokenMobile');
            tokens = restaurants.flatMap(r => [...(r.fcmTokens || []), ...(r.fcmTokenMobile || [])]);
        }

        if (tokens.length > 0) {
            return await sendPushNotification(tokens, title, body, data);
        } else {
            console.warn(`⚠️ No ${target} subscribers found with FCM tokens.`);
            return { successCount: 0, failureCount: 0 };
        }
    } catch (error) {
        console.error(`❌ Global Notification Error for ${target}:`, error);
        throw error;
    }
};

import admin from 'firebase-admin';

const normalizeTokens = (tokens = []) => {
    const flattened = tokens.flatMap((token) => {
        if (Array.isArray(token)) return token;
        if (typeof token === 'string') return [token];
        return [];
    });

    return [...new Set(
        flattened
            .map((token) => (typeof token === 'string' ? token.trim() : ''))
            .filter((token) => token && token.length > 20)
    )];
};

const normalizeDataPayload = (data = {}) => {
    if (!data || typeof data !== 'object') return {};

    const normalized = {};
    for (const [key, value] of Object.entries(data)) {
        if (!key) continue;
        if (value === undefined || value === null) continue;

        if (typeof value === 'string') {
            normalized[key] = value;
            continue;
        }
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
            normalized[key] = String(value);
            continue;
        }
        if (value instanceof Date) {
            normalized[key] = value.toISOString();
            continue;
        }
        // FCM data payload only supports string values.
        try {
            normalized[key] = JSON.stringify(value);
        } catch {
            normalized[key] = String(value);
        }
    }
    return normalized;
};

const INVALID_TOKEN_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/mismatched-credential'
]);

const getModelByTargetType = async (targetType) => {
    if (targetType === 'customer') {
        return (await import('../../auth/models/User.js')).default;
    }
    if (targetType === 'delivery') {
        return (await import('../../delivery/models/Delivery.js')).default;
    }
    if (targetType === 'restaurant') {
        return (await import('../../restaurant/models/Restaurant.js')).default;
    }
    return null;
};

const cleanupInvalidTokens = async (targetType, invalidTokens = []) => {
    const uniqueInvalidTokens = normalizeTokens(invalidTokens);
    if (!targetType || uniqueInvalidTokens.length === 0) return;

    const Model = await getModelByTargetType(targetType);
    if (!Model) return;

    await Model.updateMany(
        {
            $or: [
                { fcmTokens: { $in: uniqueInvalidTokens } },
                { fcmTokenMobile: { $in: uniqueInvalidTokens } }
            ]
        },
        {
            $pull: {
                fcmTokens: { $in: uniqueInvalidTokens },
                fcmTokenMobile: { $in: uniqueInvalidTokens }
            }
        }
    );
};

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

    // Normalize + dedupe tokens to avoid same device receiving duplicates.
    const validTokens = normalizeTokens(tokens);
    if (validTokens.length === 0) {
        return { success: false, message: 'No valid tokens provided' };
    }

    // Prepare the message
    const normalizedData = normalizeDataPayload(data);

    const message = {
        notification: {
            title,
            body,
        },
        data: {
            ...normalizedData,
            click_action: normalizedData.click_action || 'FLUTTER_NOTIFICATION_CLICK',
        },
        tokens: validTokens,
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`? Push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);

        const failedDetails = [];
        const invalidTokens = [];
        if (response.failureCount > 0) {
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const token = validTokens[idx];
                    const code = res?.error?.code || 'unknown';
                    failedDetails.push({ token, code });
                    if (INVALID_TOKEN_CODES.has(code)) {
                        invalidTokens.push(token);
                    }
                    console.error(`? Token ${token} failed:`, code);
                }
            });
        }

        return {
            ...response,
            attemptedTokenCount: validTokens.length,
            invalidTokens: normalizeTokens(invalidTokens),
            failedDetails,
            message: response.successCount > 0
                ? 'Push notification sent successfully'
                : (response.failureCount > 0
                    ? 'Push delivery failed for all target devices'
                    : 'No target devices processed')
        };
    } catch (error) {
        console.error('? FCM Error:', error);
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
    const normalizedTarget = String(target || '').trim().toLowerCase();
    const targetType =
        normalizedTarget === 'customer' || normalizedTarget === 'user'
            ? 'customer'
            : normalizedTarget === 'delivery man' || normalizedTarget === 'delivery' || normalizedTarget === 'delivery_partner'
                ? 'delivery'
                : normalizedTarget === 'restaurant'
                    ? 'restaurant'
                    : null;

    try {
        if (targetType === 'customer') {
            const User = await getModelByTargetType('customer');
            const users = await User.find({
                $or: [
                    { fcmTokens: { $exists: true, $ne: [] } },
                    { fcmTokenMobile: { $exists: true, $ne: [] } }
                ]
            }).select('fcmTokens fcmTokenMobile');
            tokens = users.flatMap((u) => [...(u.fcmTokens || []), ...(u.fcmTokenMobile || [])]);
        } else if (targetType === 'delivery') {
            const Delivery = await getModelByTargetType('delivery');
            const deliveryPartners = await Delivery.find({
                $or: [
                    { fcmTokens: { $exists: true, $ne: [] } },
                    { fcmTokenMobile: { $exists: true, $ne: [] } }
                ]
            }).select('fcmTokens fcmTokenMobile');
            tokens = deliveryPartners.flatMap((d) => [...(d.fcmTokens || []), ...(d.fcmTokenMobile || [])]);
        } else if (targetType === 'restaurant') {
            const Restaurant = await getModelByTargetType('restaurant');
            const restaurants = await Restaurant.find({
                $or: [
                    { fcmTokens: { $exists: true, $ne: [] } },
                    { fcmTokenMobile: { $exists: true, $ne: [] } }
                ]
            }).select('fcmTokens fcmTokenMobile');
            tokens = restaurants.flatMap((r) => [...(r.fcmTokens || []), ...(r.fcmTokenMobile || [])]);
        } else {
            return { successCount: 0, failureCount: 0, message: `Unsupported notification target: ${target}` };
        }

        const uniqueTokens = normalizeTokens(tokens);

        if (uniqueTokens.length > 0) {
            const result = await sendPushNotification(uniqueTokens, title, body, data);
            if (result?.invalidTokens?.length) {
                await cleanupInvalidTokens(targetType, result.invalidTokens);
            }
            return result;
        }

        console.warn(`?? No ${target} subscribers found with FCM tokens.`);
        return { successCount: 0, failureCount: 0, message: `No active ${target} device tokens found` };
    } catch (error) {
        console.error(`? Global Notification Error for ${target}:`, error);
        throw error;
    }
};

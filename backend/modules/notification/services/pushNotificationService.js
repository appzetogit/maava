import admin from 'firebase-admin';
import mongoose from 'mongoose';

// --- DE-DUPLICATION LOGIC ---
const sentHistory = new Map();
const DUPLICATE_WINDOW_MS = 5000; // 5 seconds window to prevent double pops

const isDuplicateNotification = (userId, title, body) => {
    const key = `${userId}:${title}:${body}`;
    const now = Date.now();
    if (sentHistory.has(key)) {
        const lastSent = sentHistory.get(key);
        if (now - lastSent < DUPLICATE_WINDOW_MS) return true;
    }
    sentHistory.set(key, now);

    // Occasional cleanup
    if (sentHistory.size > 500) {
        for (const [k, v] of sentHistory.entries()) {
            if (now - v > DUPLICATE_WINDOW_MS) sentHistory.delete(k);
        }
    }
    return false;
};

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
    try {
        if (targetType === 'customer') {
            return (await import('../../auth/models/User.js')).default;
        }
        if (targetType === 'delivery') {
            return (await import('../../delivery/models/Delivery.js')).default;
        }
        if (targetType === 'restaurant') {
            return (await import('../../restaurant/models/Restaurant.js')).default;
        }
    } catch (e) {
        console.error(`Error importing model for ${targetType}:`, e);
    }
    return null;
};

const cleanupInvalidTokens = async (targetType, invalidTokens = []) => {
    const uniqueInvalidTokens = normalizeTokens(invalidTokens);
    if (!targetType || uniqueInvalidTokens.length === 0) return;

    try {
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
    } catch (e) {
        console.error('Cleanup failed:', e);
    }
};

/**
 * Send push notification to specific tokens
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
    try {
        if (!tokens || tokens.length === 0) {
            return { success: false, message: 'No tokens provided', successCount: 0, failureCount: 0 };
        }

        const validTokens = normalizeTokens(tokens);
        if (validTokens.length === 0) {
            return { success: false, message: 'No valid tokens provided', successCount: 0, failureCount: 0 };
        }

        if (!admin.apps.length) {
            try {
                const { initializeFirebaseRealtime } = await import('../../../config/firebaseRealtimeDB.js');
                initializeFirebaseRealtime();
            } catch (initErr) {
                return { success: false, message: 'Firebase not initialized', successCount: 0, failureCount: 0 };
            }
        }

        if (!admin.apps.length) {
            return { success: false, message: 'Firebase Admin not ready', successCount: 0, failureCount: 0 };
        }

        const normalizedData = normalizeDataPayload(data);

        const message = {
            notification: { title, body },
            data: {
                ...normalizedData,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high',
                notification: {
                    channel_id: 'maava_channel',
                    sound: 'default',
                    priority: 'high'
                }
            },
            apns: {
                payload: {
                    aps: { sound: 'default' }
                }
            },
            tokens: validTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        const invalidTokensFound = [];
        if (response.failureCount > 0) {
            response.responses.forEach((res, idx) => {
                if (!res.success && res.error) {
                    if (INVALID_TOKEN_CODES.has(res.error.code)) {
                        invalidTokensFound.push(validTokens[idx]);
                    }
                }
            });
        }

        return {
            ...response,
            success: response.successCount > 0,
            invalidTokens: invalidTokensFound
        };

    } catch (error) {
        console.error('🛑 FCM sendPushNotification Error:', error);
        return { success: false, message: error.message, successCount: 0, failureCount: 1 };
    }
};

/**
 * Send notification to a specific user role (all users in that role)
 */
export const sendNotificationToTarget = async (target, title, body, data = {}) => {
    const normalizedTarget = String(target || '').trim().toLowerCase();
    const targetType =
        normalizedTarget === 'customer' || normalizedTarget === 'user'
            ? 'customer'
            : normalizedTarget === 'delivery man' || normalizedTarget === 'delivery' || normalizedTarget === 'delivery_partner'
                ? 'delivery'
                : normalizedTarget === 'restaurant'
                    ? 'restaurant'
                    : null;

    if (!targetType) return { success: false, message: `Invalid target: ${target}`, successCount: 0 };

    try {
        const Model = await getModelByTargetType(targetType);
        if (!Model) return { success: false, message: 'Source model not found', successCount: 0 };

        const entities = await Model.find({
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmTokenMobile: { $exists: true, $ne: [] } }
            ]
        }).select('fcmTokens fcmTokenMobile');

        const tokens = entities.flatMap((e) => [
            ...(e.fcmTokens || []).slice(-1), // Take ONLY the latest token per field type to prevent duplication
            ...(e.fcmTokenMobile || []).slice(-1)
        ]);

        const uniqueTokens = normalizeTokens(tokens);
        if (uniqueTokens.length > 0) {
            const result = await sendPushNotification(uniqueTokens, title, body, data);
            if (result?.invalidTokens?.length) {
                await cleanupInvalidTokens(targetType, result.invalidTokens);
            }
            return result;
        }

        return { success: false, message: 'No active device tokens found', successCount: 0 };
    } catch (error) {
        console.error(`❌ sendNotificationToTarget Error (${target}):`, error);
        return { success: false, message: error.message, successCount: 0 };
    }
};

/**
 * Send notification to a specific user by ID and Role
 */
export const sendNotificationToUser = async (userId, role, title, body, data = {}) => {
    if (!userId) return { success: false, message: 'User ID is required' };

    // --- DOUBLE POPUP PREVENTION ---
    if (isDuplicateNotification(userId, title, body)) {
        console.log(`⚡ Skipped duplicate notification to ${userId}: "${title}"`);
        return { success: true, message: 'Duplicate skipped' };
    }

    const targetType = role?.toLowerCase() === 'user' ? 'customer' : role?.toLowerCase();
    const Model = await getModelByTargetType(targetType);

    if (!Model) return { success: false, message: `Invalid role: ${role}` };

    try {
        let entity = null;
        const idField = targetType === 'restaurant' ? 'restaurantId' : (targetType === 'delivery' ? 'deliveryId' : '_id');

        if (mongoose.Types.ObjectId.isValid(userId)) {
            entity = await Model.findById(userId).select('fcmTokens fcmTokenMobile restaurantId deliveryId');
        }

        if (!entity && typeof userId === 'string') {
            entity = await Model.findOne({ [idField]: userId }).select('fcmTokens fcmTokenMobile');
        }

        if (!entity) return { success: false, message: 'Entity not found' };

        // Optimization: Take only the LATEST token from each category. 
        // This ensures if a user logged into a new phone, they don't get notifications on old tokens.
        const tokens = [
            ...(entity.fcmTokenMobile || []).slice(-1),
            ...(entity.fcmTokens || []).slice(-1)
        ];

        const uniqueTokens = normalizeTokens(tokens);
        if (uniqueTokens.length === 0) return { success: false, message: 'No active device tokens' };

        const result = await sendPushNotification(uniqueTokens, title, body, data);
        if (result?.invalidTokens?.length) {
            await cleanupInvalidTokens(targetType, result.invalidTokens);
        }
        return result;
    } catch (error) {
        console.error(`❌ sendNotificationToUser Error (${userId}):`, error);
        return { success: false, error: error.message };
    }
};

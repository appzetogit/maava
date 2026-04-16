import admin from 'firebase-admin';
import mongoose from 'mongoose';

// --- DE-DUPLICATION LOGIC ---
const sentHistory = new Map();
const sentTokensHistory = new Map(); // Track notifications by physical device token

const isDuplicateNotification = (userId, title, body, data = {}, tokens = []) => {
    const sUserId = String(userId || '');
    const sOrderId = String(data.orderId || data.orderMongoId || '');
    const cleanTitle = (title || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F100}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || title;
    
    const now = Date.now();
    const userKey = sOrderId 
        ? `notif:user:${sUserId}:${sOrderId}:${cleanTitle.toLowerCase()}`
        : `notif:user:${sUserId}:${cleanTitle.toLowerCase()}`;
        
    // 1. Check User-based duplication
    if (sentHistory.has(userKey)) {
        const lastSent = sentHistory.get(userKey);
        if (now - lastSent < 30000) {
            console.log(`🛡️ [BLOCK] DUPLICATE BY USER: ${userKey} (Last sent ${now - lastSent}ms ago)`);
            return true;
        }
    }
    
    // 2. Check Token-based duplication (CRITICAL: prevents double alerts when multiple users share the same token)
    if (tokens && tokens.length > 0) {
        for (const token of tokens) {
            const tokenKey = sOrderId 
                ? `notif:token:${token}:${sOrderId}:${cleanTitle.toLowerCase()}`
                : `notif:token:${token}:${cleanTitle.toLowerCase()}`;
            
            if (sentTokensHistory.has(tokenKey)) {
                const lastTokenSent = sentTokensHistory.get(tokenKey);
                if (now - lastTokenSent < 30000) {
                    console.log(`🛡️ [BLOCK] DUPLICATE BY TOKEN: ${token.substring(0, 10)}... (Already sent to this device for this event)`);
                    return true;
                }
            }
        }
    }
    
    // Record sent events
    sentHistory.set(userKey, now);
    if (tokens && tokens.length > 0) {
        for (const token of tokens) {
            const tokenKey = sOrderId 
                ? `notif:token:${token}:${sOrderId}:${cleanTitle.toLowerCase()}`
                : `notif:token:${token}:${cleanTitle.toLowerCase()}`;
            sentTokensHistory.set(tokenKey, now);
        }
    }
    
    console.log(`🆕 [ALLOW] Sending notification to User:${sUserId} | Order:${sOrderId}`);

    // Cleanup (Occasional)
    if (sentHistory.size > 2000 || sentTokensHistory.size > 2000) {
        for (const [k, v] of sentHistory.entries()) {
            if (now - v > 300000) sentHistory.delete(k);
        }
        for (const [k, v] of sentTokensHistory.entries()) {
            if (now - v > 300000) sentTokensHistory.delete(k);
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
        if (targetType === 'user' || targetType === 'customer') {
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

        // FCM sendEachForMulticast has a limit of 500 tokens per request.
        // We must chunk the tokens into batches of 500.
        const CHUNK_SIZE = 500;
        let totalSuccess = 0;
        let totalFailure = 0;
        const invalidTokensFound = [];
        const failedDetails = [];

        for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
            const chunk = validTokens.slice(i, i + CHUNK_SIZE);
            const message = {
                notification: { title, body },
                data: {
                    ...normalizedData,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                android: {
                    priority: 'high',
                    collapseKey: (title || 'maava_update').substring(0, 64),
                    notification: {
                        channel_id: 'maava_channel',
                        sound: 'default',
                        priority: 'high'
                    }
                },
                apns: {
                    headers: {
                        'apns-collapse-id': (title || 'maava_update').substring(0, 64)
                    },
                    payload: {
                        aps: { sound: 'default' }
                    }
                },
                tokens: chunk,
            };

            const sendMethod = admin.messaging().sendEachForMulticast
                ? admin.messaging().sendEachForMulticast.bind(admin.messaging())
                : admin.messaging().sendMulticast.bind(admin.messaging());

            const response = await sendMethod(message);
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;

            if (response.failureCount > 0) {
                response.responses.forEach((res, idx) => {
                    if (!res.success && res.error) {
                        failedDetails.push({ token: chunk[idx], code: res.error.code, message: res.error.message });
                        if (INVALID_TOKEN_CODES.has(res.error.code)) {
                            invalidTokensFound.push(chunk[idx]);
                        }
                    }
                });
            }
        }

        return {
            success: true,
            successCount: totalSuccess,
            failureCount: totalFailure,
            invalidTokens: invalidTokensFound,
            failedDetails: failedDetails
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
    const normalizedTarget = (target || '').toLowerCase().trim();
    const targetType = (normalizedTarget === 'customers' || normalizedTarget === 'customer' || normalizedTarget === 'user') ? 'user'
        : (normalizedTarget === 'riders' || normalizedTarget === 'rider' || normalizedTarget === 'delivery' || normalizedTarget === 'delivery man') ? 'delivery'
            : (normalizedTarget === 'restaurant' || normalizedTarget === 'restaurants') ? 'restaurant'
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

        const allTokens = entities.flatMap((e) => [
            ...(e.fcmTokens || []),
            ...(e.fcmTokenMobile || [])
        ]);

        const uniqueTokens = normalizeTokens(allTokens);

        if (uniqueTokens.length > 0) {
            console.log(`🚀 [FCM Bulk] Sending to ${targetType} group. Total unique tokens: ${uniqueTokens.length}`);
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
    
    // Normalize casing for easier debugging
    const sUserId = String(userId);
    const sRole = String(role || 'user').toLowerCase();

    console.log(`\n🔔 [NOTIF-TRACE] Starting notification process:`);
    console.log(`   - UserID: ${sUserId}`);
    console.log(`   - Role: ${sRole}`);
    console.log(`   - Title: "${title}"`);
    console.log(`   - Data Keys: ${Object.keys(data).join(', ') || 'none'}`);

    const targetType = sRole === 'user' ? 'customer' : sRole;
    const Model = await getModelByTargetType(targetType);

    if (!Model) {
        console.warn(`   ⚠️ [NOTIF-TRACE] Invalid role: ${sRole}`);
        return { success: false, message: `Invalid role: ${role}` };
    }

    try {
        let entity = null;
        const idField = targetType === 'restaurant' ? 'restaurantId' : (targetType === 'delivery' ? 'deliveryId' : '_id');

        if (mongoose.Types.ObjectId.isValid(sUserId)) {
            entity = await Model.findById(sUserId).select('fcmTokens fcmTokenMobile restaurantId deliveryId').lean();
        }

        if (!entity && typeof sUserId === 'string') {
            entity = await Model.findOne({ [idField]: sUserId }).select('fcmTokens fcmTokenMobile').lean();
        }

        if (!entity) {
            console.warn(`   ⚠️ [NOTIF-TRACE] Entity not found in DB: ${sUserId}`);
            return { success: false, message: 'Entity not found' };
        }

        const allTokens = [
            ...(entity.fcmTokens || []),
            ...(entity.fcmTokenMobile || [])
        ];
        
        const cleanTokens = normalizeTokens(allTokens);
        console.log(`   📱 [NOTIF-TRACE] Found ${allTokens.length} raw tokens. Normalized to ${cleanTokens.length} active tokens.`);
        
        // Pick only the absolute latest token 
        const latestToken = cleanTokens.length > 0 ? cleanTokens[cleanTokens.length - 1] : null;
        const uniqueTokens = latestToken ? [latestToken] : [];

        if (uniqueTokens.length === 0) {
            console.log(`   ℹ️ [NOTIF-TRACE] No active device tokens found for ${sUserId}`);
            return { success: false, message: 'No active device tokens' };
        }

        // --- SECONDARY TOKEN-BASED DE-DUPE ---
        // Crucial fix: Even if UserID is different, if the TOKEN is the same, we block duplicate order notifications
        if (isDuplicateNotification(sUserId, title, body, data, uniqueTokens)) {
            return { success: true, message: 'Duplicate skipped (by token)' };
        }

        console.log(`   🚀 [NOTIF-TRACE] Dispatching to LATEST TOKEN: ${latestToken.substring(0, 10)}... (Total: 1)`);

        const result = await sendPushNotification(uniqueTokens, title, body, data);
        
        if (result?.invalidTokens?.length) {
            console.log(`   🧹 [NOTIF-TRACE] Cleaning up ${result.invalidTokens.length} invalid tokens`);
            await cleanupInvalidTokens(targetType, result.invalidTokens);
        }

        console.log(`   ✅ [NOTIF-TRACE] Dispatch complete. Success: ${result.successCount}, Failure: ${result.failureCount}`);
        return result;

    } catch (error) {
        console.error(`   ❌ [NOTIF-TRACE] CRITICAL ERROR:`, error.message);
        return { success: false, error: error.message };
    }
};

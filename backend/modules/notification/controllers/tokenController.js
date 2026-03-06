import User from '../../auth/models/User.js';
import Delivery from '../../delivery/models/Delivery.js';
import Restaurant from '../../restaurant/models/Restaurant.js';
import jwtService from '../../auth/services/jwtService.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

/**
 * Register/Update FCM token for a user/delivery/restaurant
 * POST /api/notification/register-token
 */
export const registerFCMToken = async (req, res) => {
    const { token, role, platform = 'web' } = req.body;
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!token || !role) {
        return res.status(400).json({ success: false, message: 'Token and role are required' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization token is required' });
    }

    try {
        const accessToken = authHeader.substring(7);
        const decoded = jwtService.verifyAccessToken(accessToken);

        if (decoded.role !== role) {
            return res.status(403).json({ success: false, message: 'Token role does not match request role' });
        }

        let Model;
        if (role === 'user') Model = User;
        else if (role === 'delivery') Model = Delivery;
        else if (role === 'restaurant') Model = Restaurant;
        else return res.status(400).json({ success: false, message: 'Invalid role' });

        const targetField = platform === 'mobile' ? 'fcmTokenMobile' : 'fcmTokens';

        // Keep registration stable: dedupe token by set semantics.
        // (Avoid combining multiple updates on same path, which can trigger Mongo update conflicts.)
        const updated = await Model.findByIdAndUpdate(decoded.userId, {
            $addToSet: { [targetField]: token }
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: `${role} account not found` });
        }

        return res.status(200).json({ success: true, message: 'FCM token registered successfully' });
    } catch (error) {
        const isAuthError = error?.message === 'Token expired' || error?.message === 'Invalid token';
        if (isAuthError) {
            return res.status(401).json({ success: false, message: error.message });
        }

        console.error('FCM registration error:', error);
        return res.status(500).json({ success: false, message: 'Failed to register token', error: error.message });
    }
};

/**
 * Send test push notification to the current account's tokens
 * POST /api/notification/test-token
 */
export const sendTestNotification = async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    try {
        const accessToken = authHeader.substring(7);
        const decoded = jwtService.verifyAccessToken(accessToken);
        const { role, userId } = decoded;

        let Model;
        if (role === 'user') Model = User;
        else if (role === 'delivery') Model = Delivery;
        else if (role === 'restaurant') Model = Restaurant;
        else return res.status(400).json({ success: false, message: 'Invalid role' });

        const account = await Model.findById(userId).select('fcmTokens fcmTokenMobile name');
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const allTokens = [...(account.fcmTokens || []), ...(account.fcmTokenMobile || [])];
        const uniqueTokens = [...new Set(allTokens)];

        if (uniqueTokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No registered FCM tokens found for this account',
                details: 'Allow browser notifications, keep user logged in, then refresh once so /notification/register-token can run.'
            });
        }

        const result = await sendPushNotification(
            uniqueTokens,
            '🔔 Test Notification',
            `Hello ${account.name || 'User'}! This is a test push notification from Maava.`,
            { type: 'test' }
        );

        if (!result || (result.successCount || 0) === 0) {
            return res.status(400).json({
                success: false,
                message: result?.message || 'Test notification delivery failed for all devices',
                data: {
                    tokensProcessed: uniqueTokens.length,
                    successCount: result?.successCount || 0,
                    failureCount: result?.failureCount || 0,
                    failedDetails: result?.failedDetails || []
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Test notification sent!',
            tokensProcessed: uniqueTokens.length,
            result
        });
    } catch (error) {
        console.error('Test notification error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send test notification', error: error.message });
    }
};

/**
 * Returns token registration status for current account
 * GET /api/notification/token-status
 */
export const getTokenStatus = async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    try {
        const accessToken = authHeader.substring(7);
        const decoded = jwtService.verifyAccessToken(accessToken);
        const { role, userId } = decoded;

        let Model;
        if (role === 'user') Model = User;
        else if (role === 'delivery') Model = Delivery;
        else if (role === 'restaurant') Model = Restaurant;
        else return res.status(400).json({ success: false, message: 'Invalid role' });

        const account = await Model.findById(userId).select('fcmTokens fcmTokenMobile');
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const webTokens = account.fcmTokens || [];
        const mobileTokens = account.fcmTokenMobile || [];
        const allTokens = [...new Set([...webTokens, ...mobileTokens])];

        return res.status(200).json({
            success: true,
            data: {
                role,
                webTokenCount: webTokens.length,
                mobileTokenCount: mobileTokens.length,
                totalTokenCount: allTokens.length
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch token status', error: error.message });
    }
};

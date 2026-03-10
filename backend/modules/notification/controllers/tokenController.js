import User from '../../auth/models/User.js';
import Delivery from '../../delivery/models/Delivery.js';
import Restaurant from '../../restaurant/models/Restaurant.js';
import jwtService from '../../auth/services/jwtService.js';

/**
 * Register/Update FCM token for a user/delivery/restaurant
 * POST /api/notification/register-token
 */
export const registerFCMToken = async (req, res) => {
    const { token, platform = 'web' } = req.body;
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization token is required' });
    }

    try {
        const accessToken = authHeader.substring(7);
        const decoded = jwtService.verifyAccessToken(accessToken);
        const role = decoded.role;

        let Model;
        if (role === 'user') Model = User;
        else if (role === 'delivery') Model = Delivery;
        else if (role === 'restaurant') Model = Restaurant;
        else return res.status(400).json({ success: false, message: 'Invalid role' });

        const targetField = platform === 'mobile' ? 'fcmTokenMobile' : 'fcmTokens';

        // 1. Remove it if exists (to ensure it moves to the end of the array)
        await Model.findByIdAndUpdate(decoded.userId, {
            $pull: { [targetField]: token }
        });

        // 2. Add to end and keep only last 5 sessions
        const updated = await Model.findByIdAndUpdate(decoded.userId, {
            $push: {
                [targetField]: {
                    $each: [token],
                    $slice: -5
                }
            }
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

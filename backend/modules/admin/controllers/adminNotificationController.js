import { sendNotificationToTarget } from '../../notification/services/pushNotificationService.js';
import NotificationModel from '../models/Notification.js';

/**
 * Send push notification from admin panel
 * POST /admin/push-notification
 */
export const sendAdminPushNotification = async (req, res) => {
    const { title, zone, sendTo, description, image, data } = req.body;

    if (!title || !description || !sendTo) {
        return res.status(400).json({
            success: false,
            message: 'Title, description, and target (Send To) are required'
        });
    }

    try {
        // 1. Send via Firebase
        const result = await sendNotificationToTarget(sendTo, title, description, {
            ...data,
            image: image || null,
            zone: zone || 'All',
        });

        // 2. Save to Notification History in MongoDB
        const newNotification = await NotificationModel.create({
            title,
            description,
            image: image || null,
            zone: zone || 'All',
            target: sendTo,
            sentBy: req.admin?._id, // Set by auth middleware
            stats: {
                successCount: result.successCount || 0,
                failureCount: result.failureCount || 0,
            }
        });

        res.status(200).json({
            success: true,
            message: `Notification sent successfully to ${sendTo}`,
            data: newNotification
        });

    } catch (error) {
        console.error('❌ Error in sendAdminPushNotification controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification via Firebase',
            error: error.message
        });
    }
};

/**
 * Get all notifications (history)
 * GET /admin/push-notification
 */
export const getNotifications = async (req, res) => {
    try {
        const notifications = await NotificationModel.find()
            .sort({ createdAt: -1 })
            .lean();

        // Formatter to match frontend
        const formattedNotifications = notifications.map((n, index) => ({
            _id: n._id,
            sl: index + 1,
            title: n.title,
            description: n.description,
            image: n.image,
            zone: n.zone,
            target: n.target,
            status: n.status,
            createdAt: n.createdAt,
            stats: n.stats
        }));

        res.status(200).json({
            success: true,
            data: formattedNotifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

/**
 * Delete a notification
 * DELETE /admin/push-notification/:id
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await NotificationModel.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

/**
 * Toggle notification status (Enable/Disable) - Not strictly used by Firebase sendMulticast but useful for UX
 * PATCH /admin/push-notification/:id/toggle
 */
export const toggleNotificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await NotificationModel.findById(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        notification.status = !notification.status;
        await notification.save();
        res.status(200).json({
            success: true,
            message: `Notification ${notification.status ? 'enabled' : 'disabled'} successfully`,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to toggle status',
            error: error.message
        });
    }
};

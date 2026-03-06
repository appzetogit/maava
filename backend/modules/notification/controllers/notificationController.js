import NotificationModel from '../../admin/models/Notification.js';

const roleTargetMap = {
  user: 'Customer',
  delivery: 'Delivery Man',
  restaurant: 'Restaurant',
};

const buildNotificationList = (notifications) => notifications.map((item) => ({
  _id: item._id,
  title: item.title,
  message: item.description,
  description: item.description,
  image: item.image,
  zone: item.zone,
  target: item.target,
  createdAt: item.createdAt,
  status: item.status,
}));

const getNotificationsByRole = async (target, res) => {
  const notifications = await NotificationModel.find({
    target,
    status: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: buildNotificationList(notifications),
  });
};

export const getUserNotifications = async (req, res) => {
  try {
    return await getNotificationsByRole(roleTargetMap.user, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user notifications',
      error: error.message,
    });
  }
};

export const getDeliveryNotifications = async (req, res) => {
  try {
    return await getNotificationsByRole(roleTargetMap.delivery, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery notifications',
      error: error.message,
    });
  }
};

export const getRestaurantNotifications = async (req, res) => {
  try {
    return await getNotificationsByRole(roleTargetMap.restaurant, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant notifications',
      error: error.message,
    });
  }
};

import express from 'express';
import { getTokenStatus, registerFCMToken, sendTestNotification } from '../controllers/tokenController.js';
import {
  getDeliveryNotifications,
  getRestaurantNotifications,
  getUserNotifications,
} from '../controllers/notificationController.js';
import { authenticate as authenticateUser } from '../../auth/middleware/auth.js';
import { authenticate as authenticateDelivery } from '../../delivery/middleware/deliveryAuth.js';
import { authenticate as authenticateRestaurant } from '../../restaurant/middleware/restaurantAuth.js';

const router = express.Router();

// Register/Update FCM token
router.post('/register-token', registerFCMToken);
router.post('/test-token', sendTestNotification);
router.get('/token-status', getTokenStatus);

// Role-wise notification inbox endpoints
router.get('/user', authenticateUser, getUserNotifications);
router.get('/delivery', authenticateDelivery, getDeliveryNotifications);
router.get('/restaurant', authenticateRestaurant, getRestaurantNotifications);

export default router;

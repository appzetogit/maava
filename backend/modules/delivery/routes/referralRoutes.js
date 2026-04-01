import express from 'express';
import { addReferral, getMyReferrals } from '../controllers/referralController.js';
import { authenticate } from '../middleware/deliveryAuth.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// POST /api/delivery/referrals - Add a new referral
router.post('/', addReferral);

// GET /api/delivery/referrals - Get current partner's referrals
router.get('/', getMyReferrals);

export default router;

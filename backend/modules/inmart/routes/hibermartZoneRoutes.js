import express from 'express';
import {
    getHibermartZones,
    getHibermartZoneById,
    createHibermartZone,
    updateHibermartZone,
    deleteHibermartZone,
    toggleHibermartZoneStatus,
    detectUserHibermartZone
} from '../controllers/hibermartZoneController.js';
import { authenticateAdmin } from '../../admin/middleware/adminAuth.js';

const router = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
router.get('/detect', detectUserHibermartZone);
router.get('/public', getHibermartZones); // Public zone list (no auth)

// ── ADMIN (authenticated) ────────────────────────────────────────────────────
router.use(authenticateAdmin);
router.get('/', getHibermartZones);
router.get('/:id', getHibermartZoneById);
router.post('/', createHibermartZone);
router.put('/:id', updateHibermartZone);
router.delete('/:id', deleteHibermartZone);
router.patch('/:id/status', toggleHibermartZoneStatus);

export default router;

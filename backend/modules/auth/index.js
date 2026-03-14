import express from 'express';
import authRoutes from './routes/authRoutes.js';

const router = express.Router();

// Mount auth routes at the root of this router
// This will be prefixed with /api/auth in server.js
router.use('/', authRoutes);

export default router;


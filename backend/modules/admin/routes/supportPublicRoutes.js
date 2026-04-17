import express from 'express';
import { getSupportPublic } from '../controllers/supportController.js';

const router = express.Router();

router.get('/support/public', getSupportPublic);

export default router;

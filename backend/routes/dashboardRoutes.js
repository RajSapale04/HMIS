import express from 'express';
import { getMISStats } from '../controllers/dashboardController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/stats', protect, authorizeRoles('admin'), getMISStats);
export default router;
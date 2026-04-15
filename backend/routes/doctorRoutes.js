import express from 'express';
import { getDoctors } from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, getDoctors);
export default router;
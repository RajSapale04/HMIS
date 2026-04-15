import express from 'express';
import { createBill, getBills, updateBill } from '../controllers/billingController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.get('/',      authorizeRoles('admin','staff'), getBills);
router.post('/',     authorizeRoles('admin','staff'), createBill);
router.patch('/:id', authorizeRoles('admin','staff'), updateBill);
export default router;
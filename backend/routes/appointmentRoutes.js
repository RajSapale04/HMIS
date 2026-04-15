import express from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.get('/',          getAppointments);
router.post('/',         authorizeRoles('admin', 'staff', 'patient'), createAppointment);
router.patch('/:id/status', authorizeRoles('admin', 'doctor', 'staff'), updateAppointmentStatus);
export default router;
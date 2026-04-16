import express from 'express';
import { registerPatient, getPatients, getPatient, updatePatient } from '../controllers/patientController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.get('/',      authorizeRoles('admin','staff','doctor'), getPatients);
router.post('/',     authorizeRoles('admin','staff'),          registerPatient);
router.get('/:id',   authorizeRoles('admin','staff','doctor', 'patient'), getPatient);
router.patch('/:id', authorizeRoles('admin','staff'),          updatePatient);
export default router;


// import express from 'express';
// import { getDoctors } from '../controllers/doctorController.js';
// import { protect } from '../middleware/authMiddleware.js';

// const router = express.Router();
// router.get('/', protect, getDoctors);
// export default router;

import express from 'express';
import { registerDoctor, getDoctors, getDoctor, updateDoctor } from '../controllers/doctorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all doctor routes
router.use(protect);

// Patients need to be able to see the list of doctors to book appointments
router.get('/',      authorizeRoles('admin', 'staff', 'doctor', 'patient'), getDoctors);

// Only Admins and Staff can register new doctors
router.post('/',     authorizeRoles('admin', 'staff'),                      registerDoctor);

// Anyone logged in can view a specific doctor's profile
router.get('/:id',   authorizeRoles('admin', 'staff', 'doctor', 'patient'), getDoctor);

// Doctors can update their own profiles (e.g., changing availability), and Admins/Staff can edit them
router.patch('/:id', authorizeRoles('admin', 'staff', 'doctor'),            updateDoctor);

export default router;
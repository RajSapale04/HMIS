import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js'; // 1. Import the new Doctor model

await mongoose.connect(process.env.MONGO_URI);

// 2. Clear all three collections
await User.deleteMany({});
await Patient.deleteMany({});
await Doctor.deleteMany({});

// --- Create Admin ---
const admin = await User.create({
  name: 'Super Admin', email: 'admin@hmis.com',
  password: 'Admin@1234', role: 'admin',
});

// --- Create Staff ---
await User.create({
  name: 'Staff Member', email: 'staff@hmis.com',
  password: 'Staff@1234', role: 'staff',
});

// --- Create Doctor ---
// Step A: Create the User account for authentication
const doctorUser = await User.create({
  name: 'Priya Sharma', // We removed "Dr." since your frontend automatically prepends it!
  email: 'doctor@hmis.com',
  password: 'Doctor@1234', 
  role: 'doctor',
});

// Step B: Create the Doctor Profile with all professional details
await Doctor.create({
  user: doctorUser._id,
  department: 'Cardiology',
  specialization: 'Interventional Cardiology',
  qualifications: ['MBBS', 'MD - Cardiology'],
  experience: 10,
  licenseNumber: 'MH-2024-001',
  phone: '9876500001',
  consultationFee: 1500,
  availability: 'Available',
  registeredBy: admin._id,
});

// --- Create Patient ---
// Step A: Create the User account for authentication
const patientUser = await User.create({
  name: 'Rahul Mehta', email: 'patient@hmis.com',
  password: 'Patient@1234', role: 'patient',
});

// Step B: Create the Patient Profile with medical details
await Patient.create({
  user: patientUser._id,
  dateOfBirth: new Date('1990-05-15'),
  gender: 'male', bloodGroup: 'O+',
  phone: '9876543210',
  address: '42 MG Road, Mumbai, Maharashtra',
  emergencyContact: { name: 'Sunita Mehta', phone: '9876543211', relation: 'Spouse' },
  insurance: { provider: 'Star Health', policyNo: 'SH-123456' },
  medicalHistory: ['Hypertension'],
  allergies: ['Penicillin'],
  registeredBy: admin._id,
});

console.log('✅ Seed complete');
process.exit(0);
import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

await mongoose.connect(process.env.MONGO_URI);

await User.deleteMany({});
await Patient.deleteMany({});

const admin = await User.create({
  name: 'Super Admin', email: 'admin@hmis.com',
  password: 'Admin@1234', role: 'admin',
});

const doctor = await User.create({
  name: 'Dr. Priya Sharma', email: 'doctor@hmis.com',
  password: 'Doctor@1234', role: 'doctor',
  specialisation: 'Cardiology', licenseNumber: 'MH-2024-001',
});

const patientUser = await User.create({
  name: 'Rahul Mehta', email: 'patient@hmis.com',
  password: 'Patient@1234', role: 'patient',
});

await User.create({
  name: 'Staff Member', email: 'staff@hmis.com',
  password: 'Staff@1234', role: 'staff',
});

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
import User    from '../../models/User.js';
import Patient from '../../models/Patient.js';

export const createAdmin = () =>
  User.create({ name: 'Test Admin', email: 'admin@test.com', password: 'Admin@1234', role: 'admin' });

export const createDoctor = () =>
  User.create({ name: 'Dr. Test', email: 'doctor@test.com', password: 'Doctor@1234',
    role: 'doctor', specialisation: 'General', licenseNumber: 'LIC-001' });

export const createPatientUser = () =>
  User.create({ name: 'Pat Test', email: 'patient@test.com', password: 'Patient@1234', role: 'patient' });

export const createPatientRecord = async (userId, registeredById) =>
  Patient.create({
    user: userId,
    dateOfBirth: new Date('1992-06-15'),
    gender: 'male', bloodGroup: 'B+',
    phone: '9000000001',
    address: '1 Test Lane',
    registeredBy: registeredById,
  });
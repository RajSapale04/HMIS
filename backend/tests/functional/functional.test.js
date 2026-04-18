import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb.js';
import { createPatientUser ,createAdmin, createDoctor, createPatientRecord } from '../helpers/fixtures.js';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';

chai.use(chaiHttp);
const { expect } = chai;

// ─── Functional Test Suite ──────────────────────────────────────────────────
describe('HMIS Functional Tests', () => {
  let adminToken, doctorToken, patientToken;
  let adminUser, doctorUser, patientUser, patientRecord;

  before(async () => { await connect(); });
  after(async  () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  // ── TC-F-01: User registration ───────────────────────────────────────────
  describe('TC-F-01: User registration', () => {
    it('should register a new patient user successfully', async () => {
      const res = await chai.request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'john@test.com', password: 'Test@1234', role: 'patient' });
      expect(res).to.have.status(201);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.have.property('email', 'john@test.com');
      expect(res.body.user).to.not.have.property('password');
    });

    it('should reject registration with duplicate email', async () => {
      await User.create({ name: 'Existing', email: 'exists@test.com', password: 'Test@1234', role: 'patient' });
      const res = await chai.request(app)
        .post('/api/auth/register')
        .send({ name: 'New', email: 'exists@test.com', password: 'Test@1234', role: 'patient' });
      expect(res).to.have.status(400);
      expect(res.body.message).to.include('already registered');
    });

    it('should reject weak passwords (less than 8 chars)', async () => {
      const res = await chai.request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'jane@test.com', password: '123', role: 'patient' });
      expect(res).to.have.status(400);
    });
  });

  // ── TC-F-02: Authentication ──────────────────────────────────────────────
  describe('TC-F-02: Authentication & JWT', () => {
    beforeEach(async () => {
      adminUser = await createAdmin();
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@1234' });
      adminToken = res.body.token;
    });

    it('should login with valid credentials and return JWT', async () => {
      expect(adminToken).to.be.a('string');
      expect(adminToken.split('.').length).to.equal(3); // valid JWT format
    });

    it('should reject login with wrong password', async () => {
      const res = await chai.request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Wrong@1234' });
      expect(res).to.have.status(401);
      expect(res.body.message).to.equal('Invalid credentials');
    });

    it('should reject access to protected route without token', async () => {
      const res = await chai.request(app).get('/api/patients');
      expect(res).to.have.status(401);
    });

    it('should allow access to protected route with valid token', async () => {
      const res = await chai.request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(200);
    });

    it('should reject access with tampered token', async () => {
      const res = await chai.request(app)
        .get('/api/patients')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.signature');
      expect(res).to.have.status(401);
    });
  });

  // ── TC-F-03: Role-based access control ──────────────────────────────────
  describe('TC-F-03: Role-based access control', () => {
    beforeEach(async () => {
      adminUser  = await createAdmin();
      doctorUser = await createDoctor();
      const [adminRes, docRes] = await Promise.all([
        chai.request(app).post('/api/auth/login').send({ email: 'admin@test.com',  password: 'Admin@1234' }),
        chai.request(app).post('/api/auth/login').send({ email: 'doctor@test.com', password: 'Doctor@1234' }),
      ]);
      adminToken  = adminRes.body.token;
      doctorToken = docRes.body.token;
    });

    it('doctor should NOT access admin MIS dashboard', async () => {
      const res = await chai.request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res).to.have.status(403);
    });

    it('admin should access MIS dashboard', async () => {
      const res = await chai.request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(200);
      expect(res.body.data).to.have.all.keys('totalPatients', 'activeDoctors', 'todayAppointments','totalRevenue','monthlyRevenue','appointmentsByType');
    });

    it('doctor should NOT register a new patient', async () => {
      const res = await chai.request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ name: 'Pat', email: 'p@t.com', password: 'Test@1234',
                dateOfBirth: '1990-01-01', gender: 'male', phone: '9000000002', address: 'Lane 1' });
      expect(res).to.have.status(403);
    });
  });

  // ── TC-F-04: Patient registration ────────────────────────────────────────
  describe('TC-F-04: Patient registration module', () => {
    beforeEach(async () => {
      adminUser = await createAdmin();
      const res = await chai.request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
      adminToken = res.body.token;
    });

    it('should register a patient with all required fields', async () => {
      const res = await chai.request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Pat', email: 'newpat@test.com', password: 'Pat@12345',
          dateOfBirth: '1985-03-20', gender: 'female', bloodGroup: 'A+',
          phone: '9876500001', address: '5 Main St',
          emergencyContact: { name: 'Em Name', phone: '9876500002', relation: 'Spouse' },
          medicalHistory: ['Diabetes'], allergies: ['Aspirin'],
        });
      expect(res).to.have.status(201);
      expect(res.body.data).to.have.property('phone', '9876500001');
      expect(res.body.data.medicalHistory).to.include('Diabetes');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await chai.request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete' }); // missing many required fields
      expect(res).to.have.status(400);
    });

    it('should search patients by name', async () => {
      const patUser = await createPatientUser();
      await createPatientRecord(patUser._id, adminUser._id);
      const res = await chai.request(app)
        .get('/api/patients?search=Pat Test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res).to.have.status(200);
      expect(res.body.data.length).to.be.at.least(1);
    });
  });

  // ── TC-F-05: Appointment booking ─────────────────────────────────────────
  describe('TC-F-05: Appointment booking module', () => {
    let patientRec;
    beforeEach(async () => {
      adminUser  = await createAdmin();
      doctorUser = await createDoctor();
      const patUser = await createPatientUser();
      patientRec = await createPatientRecord(patUser._id, adminUser._id);
      const res = await chai.request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
      adminToken = res.body.token;
    });

    const bookAppt = (token, startTime, endTime, date = '2025-12-01') =>
      chai.request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          patient: patientRec._id,
          doctor:  doctorUser._id,
          date, startTime, endTime,
          type: 'consultation',
        });

    it('should book a valid appointment', async () => {
      const res = await bookAppt(adminToken, '09:00', '09:30');
      expect(res).to.have.status(201);
      expect(res.body.data).to.have.property('startTime', '09:00');
    });

    it('should reject overlapping appointment for same doctor', async () => {
      await bookAppt(adminToken, '09:00', '09:30');
      const res = await bookAppt(adminToken, '09:15', '09:45'); // overlaps
      expect(res).to.have.status(409);
      expect(res.body.message).to.include('already has an appointment');
    });

    it('should allow back-to-back appointments (no overlap)', async () => {
      await bookAppt(adminToken, '09:00', '09:30');
      const res = await bookAppt(adminToken, '09:30', '10:00'); // contiguous, not overlapping
      expect(res).to.have.status(201);
    });

    it('should reject end time before start time', async () => {
      const res = await bookAppt(adminToken, '10:00', '09:00');
      expect(res).to.have.status(400);
    });

    it('should allow same doctor on different dates', async () => {
      await bookAppt(adminToken, '09:00', '09:30', '2025-12-01');
      const res = await bookAppt(adminToken, '09:00', '09:30', '2025-12-02');
      expect(res).to.have.status(201);
    });

    it('should update appointment status', async () => {
      const appt = await bookAppt(adminToken, '11:00', '11:30');
      const res = await chai.request(app)
        .patch(`/api/appointments/${appt.body.data._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });
      expect(res).to.have.status(200);
      expect(res.body.data.status).to.equal('completed');
    });
  });

  // ── TC-F-06: Billing ─────────────────────────────────────────────────────
  describe('TC-F-06: Billing module', () => {
    let patientRec;
    beforeEach(async () => {
      adminUser = await createAdmin();
      const patUser = await createPatientUser();
      patientRec = await createPatientRecord(patUser._id, adminUser._id);
      const res = await chai.request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' });
      adminToken = res.body.token;
    });

    it('should create a bill with correct total calculation', async () => {
      const res = await chai.request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patient: patientRec._id,
          items: [{ description: 'Consultation', quantity: 1, unitPrice: 500 },
                  { description: 'Blood test',   quantity: 2, unitPrice: 250 }],
          discount: 10, tax: 18,
          total: parseFloat((1000 * 0.9 * 1.18).toFixed(2)),
          paymentMethod: 'cash',
        });
      expect(res).to.have.status(201);
      expect(res.body.data.total).to.equal(1062);
    });

    it('should update bill status to paid', async () => {
      const bill = await chai.request(app)
        .post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ patient: patientRec._id, items: [{ description: 'X-ray', quantity: 1, unitPrice: 800 }],
                discount: 0, tax: 0, total: 800, paymentMethod: 'upi' });
      const res = await chai.request(app)
        .patch(`/api/billing/${bill.body.data._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid', amountPaid: 800 });
      expect(res).to.have.status(200);
      expect(res.body.data.status).to.equal('paid');
    });
  });
});
import chai from 'chai';
// import * as chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server.js';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb.js';
import { createAdmin, createDoctor, createPatientUser, createPatientRecord } from '../helpers/fixtures.js';

chai.use(chaiHttp);
const { expect } = chai;

// ═══════════════════════════════════════════════════════════════════════════
//  HMIS REGRESSION SUITE
//  Purpose: Verify that all previously-working functionality still works
//           after code changes. Run before every merge/release.
// ═══════════════════════════════════════════════════════════════════════════
describe('REGRESSION SUITE — HMIS v1.0', () => {
  let admin, doctor, patientUser, patientRec;
  let adminToken, doctorToken, patientToken;

  before(async () => {
    await connect();
    process.env.JWT_SECRET = 'regression_test_secret_32chars!!';
  });
  after(async () => { await closeDatabase(); });

  beforeEach(async () => {
    await clearDatabase();
    admin       = await createAdmin();
    doctor      = await createDoctor();
    patientUser = await createPatientUser();
    patientRec  = await createPatientRecord(patientUser._id, admin._id);

    const [ar, dr, pr] = await Promise.all([
      chai.request(app).post('/api/auth/login').send({ email: 'admin@test.com',   password: 'Admin@1234'  }),
      chai.request(app).post('/api/auth/login').send({ email: 'doctor@test.com',  password: 'Doctor@1234' }),
      chai.request(app).post('/api/auth/login').send({ email: 'patient@test.com', password: 'Patient@1234'}),
    ]);
    adminToken   = ar.body.token;
    doctorToken  = dr.body.token;
    patientToken = pr.body.token;
  });

  // ── RG-01: Auth regressions ──────────────────────────────────────────────
  describe('RG-01 Authentication', () => {
    it('[RG-01-01] Login still returns 3-part JWT', async () => {
      const res = await chai.request(app).post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@1234' });
      expect(res.status).to.equal(200);
      expect(res.body.token.split('.').length).to.equal(3);
    });

    it('[RG-01-02] /auth/me returns logged-in user', async () => {
      const res = await chai.request(app).get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal('admin@test.com');
    });

    it('[RG-01-03] Password never appears in any response', async () => {
      const res = await chai.request(app).get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(JSON.stringify(res.body)).to.not.include('$2b$'); // bcrypt hash pattern
    });

    it('[RG-01-04] Expired/invalid tokens are rejected', async () => {
      const res = await chai.request(app).get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).to.equal(401);
    });
  });

  // ── RG-02: RBAC regressions ──────────────────────────────────────────────
  describe('RG-02 Role-based access control', () => {
    const rbacCases = [
      { role: 'doctor',  token: () => doctorToken,  route: 'GET /api/dashboard/stats', expectedStatus: 403 },
      { role: 'patient', token: () => patientToken, route: 'GET /api/dashboard/stats', expectedStatus: 403 },
      { role: 'doctor',  token: () => doctorToken,  route: 'POST /api/patients',       expectedStatus: 403 },
      { role: 'patient', token: () => patientToken, route: 'POST /api/billing',        expectedStatus: 403 },
    ];

    rbacCases.forEach(({ role, token, route, expectedStatus }) => {
      it(`[RG-02] ${role} → ${route} should be ${expectedStatus}`, async () => {
        const [method, path] = route.split(' ');
        const res = await chai.request(app)[method.toLowerCase()](path)
          .set('Authorization', `Bearer ${token()}`);
        expect(res.status).to.equal(expectedStatus);
      });
    });

    it('[RG-02-A] Admin still accesses dashboard', async () => {
      const res = await chai.request(app).get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
    });
  });

  // ── RG-03: Patient module regressions ────────────────────────────────────
  describe('RG-03 Patient module', () => {
    it('[RG-03-01] GET /api/patients returns array', async () => {
      const res = await chai.request(app).get('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });

    it('[RG-03-02] Seeded patient is in the list', async () => {
      const res = await chai.request(app).get('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.length).to.be.at.least(1);
    });

    it('[RG-03-03] Search still filters correctly', async () => {
      const res = await chai.request(app).get('/api/patients?search=Pat Test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.every(p => p.user?.name?.includes('Pat'))).to.be.true;
    });

    it('[RG-03-04] GET /api/patients/:id returns correct patient', async () => {
      const res = await chai.request(app).get(`/api/patients/${patientRec._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data._id.toString()).to.equal(patientRec._id.toString());
    });
  });

  // ── RG-04: Appointment regressions ──────────────────────────────────────
  describe('RG-04 Appointment module', () => {
    const bookAppt = (token, start, end, date = '2025-12-15') =>
      chai.request(app).post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({ patient: patientRec._id, doctor: doctor._id, date, startTime: start, endTime: end });

    it('[RG-04-01] Valid appointment still returns 201', async () => {
      const res = await bookAppt(adminToken, '08:00', '08:30');
      expect(res.status).to.equal(201);
    });

    it('[RG-04-02] Overlap guard still blocks conflicting slot', async () => {
      await bookAppt(adminToken, '08:00', '08:30');
      const res = await bookAppt(adminToken, '08:20', '08:50');
      expect(res.status).to.equal(409);
    });

    it('[RG-04-03] Status update to completed still works', async () => {
      const a = await bookAppt(adminToken, '09:00', '09:30');
      const res = await chai.request(app)
        .patch(`/api/appointments/${a.body.data._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });
      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal('completed');
    });

    it('[RG-04-04] Doctor can view their own appointments', async () => {
      await bookAppt(adminToken, '10:00', '10:30');
      const res = await chai.request(app).get('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  // ── RG-05: Billing regressions ───────────────────────────────────────────
  describe('RG-05 Billing module', () => {
    const createBill = (total = 1000) =>
      chai.request(app).post('/api/billing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patient: patientRec._id,
          items: [{ description: 'Regression item', quantity: 1, unitPrice: total }],
          discount: 0, tax: 0, total, paymentMethod: 'cash',
        });

    it('[RG-05-01] Bill creation returns 201 with correct total', async () => {
      const res = await createBill(750);
      expect(res.status).to.equal(201);
      expect(res.body.data.total).to.equal(750);
    });

    it('[RG-05-02] Bill defaults to pending status', async () => {
      const res = await createBill();
      expect(res.body.data.status).to.equal('pending');
    });

    it('[RG-05-03] Mark paid still updates status', async () => {
      const bill = await createBill(500);
      const res = await chai.request(app)
        .patch(`/api/billing/${bill.body.data._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid', amountPaid: 500 });
      expect(res.body.data.status).to.equal('paid');
    });
  });

  // ── RG-06: Dashboard MIS regressions ────────────────────────────────────
  describe('RG-06 Dashboard MIS', () => {
    it('[RG-06-01] Stats endpoint returns all required keys', async () => {
      const res = await chai.request(app).get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.all.keys(
        'totalPatients', 'activeDoctors', 'todayAppointments',
        'totalRevenue', 'monthlyRevenue', 'appointmentsByType'
      );
    });

    it('[RG-06-02] totalPatients count is accurate', async () => {
      const res = await chai.request(app).get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.totalPatients).to.equal(1); // one seeded patient
    });

    it('[RG-06-03] activeDoctors count is accurate', async () => {
      const res = await chai.request(app).get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.body.data.activeDoctors).to.equal(1);
    });
  });
});
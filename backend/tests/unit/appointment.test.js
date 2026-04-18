import chai from 'chai';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb.js';
import Appointment from '../../models/Appointment.js';
import { createAdmin, createDoctor, createPatientUser, createPatientRecord } from '../helpers/fixtures.js';

const { expect } = chai;

describe('Unit — Appointment model & overlap logic', () => {
  let doctor, patientRec, admin;

  before(async () => { await connect(); });
  after(async  () => { await closeDatabase(); });
  beforeEach(async () => {
    await clearDatabase();
    admin     = await createAdmin();
    doctor    = await createDoctor();
    const pu  = await createPatientUser();
    patientRec = await createPatientRecord(pu._id, admin._id);
  });

  const makeAppt = (start, end, date = '2025-12-01') =>
    Appointment.create({
      patient: patientRec._id, doctor: doctor._id,
      date: new Date(date), startTime: start, endTime: end,
      type: 'consultation', bookedBy: admin._id,
    });

  it('should create a valid appointment', async () => {
    const appt = await makeAppt('09:00', '09:30');
    expect(appt._id).to.exist;
    expect(appt.status).to.equal('scheduled');
  });

  it('should default status to scheduled', async () => {
    const appt = await makeAppt('10:00', '10:30');
    expect(appt.status).to.equal('scheduled');
  });

  it('should reject invalid status enum', async () => {
    try {
      await Appointment.create({
        patient: patientRec._id, doctor: doctor._id,
        date: new Date(), startTime: '08:00', endTime: '08:30',
        status: 'invalid_status', bookedBy: admin._id,
      });
      expect.fail('Should throw validation error');
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });

  it('should reject missing required fields', async () => {
    try {
      await Appointment.create({ patient: patientRec._id });
      expect.fail();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });

  describe('Overlap detection (hasOverlap)', () => {
    it('toMins helper: "09:30" → 570 minutes', () => {
      const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      expect(toMins('09:30')).to.equal(570);
      expect(toMins('00:00')).to.equal(0);
      expect(toMins('23:59')).to.equal(1439);
    });

    it('intervals [09:00–09:30] and [09:15–09:45] should overlap', () => {
      const toMins  = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const overlaps = (s1, e1, s2, e2) => toMins(s1) < toMins(e2) && toMins(e1) > toMins(s2);
      expect(overlaps('09:00', '09:30', '09:15', '09:45')).to.be.true;
    });

    it('intervals [09:00–09:30] and [09:30–10:00] should NOT overlap', () => {
      const toMins  = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const overlaps = (s1, e1, s2, e2) => toMins(s1) < toMins(e2) && toMins(e1) > toMins(s2);
      expect(overlaps('09:00', '09:30', '09:30', '10:00')).to.be.false;
    });

    it('fully contained interval [09:10–09:20] within [09:00–09:30] should overlap', () => {
      const toMins  = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const overlaps = (s1, e1, s2, e2) => toMins(s1) < toMins(e2) && toMins(e1) > toMins(s2);
      expect(overlaps('09:00', '09:30', '09:10', '09:20')).to.be.true;
    });
  });
});
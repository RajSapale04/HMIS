import chai from 'chai';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb.js';
import Patient from '../../models/Patient.js';
import { createAdmin, createPatientUser, createPatientRecord } from '../helpers/fixtures.js';

const { expect } = chai;

describe('Unit — Patient model', () => {
  before(async () => { await connect(); });
  after(async  () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  it('should create a patient with all required fields', async () => {
    const admin = await createAdmin();
    const user  = await createPatientUser();
    const pat   = await createPatientRecord(user._id, admin._id);
    expect(pat._id).to.exist;
    expect(pat.gender).to.equal('male');
    expect(pat.bloodGroup).to.equal('B+');
  });

  it('should reject invalid blood group', async () => {
    const admin = await createAdmin();
    const user  = await createPatientUser();
    try {
      await Patient.create({
        user: user._id, dateOfBirth: new Date('1990-01-01'),
        gender: 'male', bloodGroup: 'Z+', phone: '9000000001', address: 'Test',
        registeredBy: admin._id,
      });
      expect.fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });

  it('should reject invalid gender enum', async () => {
    const admin = await createAdmin();
    const user  = await createPatientUser();
    try {
      await Patient.create({
        user: user._id, dateOfBirth: new Date(), gender: 'unknown',
        phone: '9000000001', address: 'X', registeredBy: admin._id,
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });

  it('should enforce unique user per patient record', async () => {
    const admin = await createAdmin();
    const user  = await createPatientUser();
    await createPatientRecord(user._id, admin._id);
    try {
      await createPatientRecord(user._id, admin._id); // duplicate
      expect.fail('Should have thrown duplicate key error');
    } catch (err) {
      expect(err.code).to.equal(11000);
    }
  });

  it('should store medical history as array', async () => {
    const admin = await createAdmin();
    const user  = await createPatientUser();
    const pat   = await Patient.create({
      user: user._id, dateOfBirth: new Date(), gender: 'female',
      phone: '9111111111', address: 'Somewhere', registeredBy: admin._id,
      medicalHistory: ['Asthma', 'Hypertension'],
    });
    expect(pat.medicalHistory).to.deep.equal(['Asthma', 'Hypertension']);
  });
});
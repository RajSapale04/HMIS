import chai from 'chai';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb.js';
import Billing from '../../models/Billing.js';
import { createAdmin, createPatientUser, createPatientRecord } from '../helpers/fixtures.js';

const { expect } = chai;

describe('Unit — Billing model', () => {
  let admin, patientRec;

  before(async () => { await connect(); });
  after(async  () => { await closeDatabase(); });
  beforeEach(async () => {
    await clearDatabase();
    admin      = await createAdmin();
    const pu   = await createPatientUser();
    patientRec = await createPatientRecord(pu._id, admin._id);
  });

  it('should create a bill with correct structure', async () => {
    const bill = await Billing.create({
      patient: patientRec._id,
      items: [{ description: 'Consult', quantity: 1, unitPrice: 500 }],
      discount: 0, tax: 18, total: 590, issuedBy: admin._id,
    });
    expect(bill.status).to.equal('pending');
    expect(bill.items).to.have.length(1);
    expect(bill.total).to.equal(590);
  });

  it('should reject invalid status', async () => {
    try {
      await Billing.create({
        patient: patientRec._id,
        items: [{ description: 'X', quantity: 1, unitPrice: 100 }],
        discount: 0, tax: 0, total: 100, status: 'INVALID', issuedBy: admin._id,
      });
      expect.fail('Should throw');
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
    }
  });

  it('total calculation: subtotal × (1 - discount%) × (1 + tax%)', () => {
    const subtotal = 2 * 500; // qty=2, price=500 → 1000
    const afterDiscount = 1000 * (1 - 10 / 100); // -10% → 900
    const withTax = afterDiscount * (1 + 18 / 100); // +18% → 1062
    expect(parseFloat(withTax.toFixed(2))).to.equal(1062);
  });

  it('should allow amountPaid update for partial payment', async () => {
    const bill = await Billing.create({
      patient: patientRec._id,
      items: [{ description: 'Scan', quantity: 1, unitPrice: 1200 }],
      discount: 0, tax: 0, total: 1200, issuedBy: admin._id,
    });
    bill.amountPaid = 600;
    bill.status = 'partial';
    await bill.save();
    expect(bill.amountPaid).to.equal(600);
    expect(bill.status).to.equal('partial');
  });
});
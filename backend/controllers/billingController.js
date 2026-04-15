import Billing from '../models/Billing.js';
import ApiError from '../utils/ApiError.js';

export const createBill = async (req, res, next) => {
  try {
    const { patient, appointment, items, discount, tax, total, paymentMethod } = req.body;
    const bill = await Billing.create({
      patient, appointment, items, discount, tax, total,
      paymentMethod, issuedBy: req.user._id,
      status: 'pending',
    });
    await bill.populate({ path: 'patient', populate: { path: 'user', select: 'name' } });
    res.status(201).json({ success: true, data: bill });
  } catch (err) { next(err); }
};

export const getBills = async (req, res, next) => {
  try {
    const bills = await Billing.find()
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate('appointment')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) { next(err); }
};

export const updateBill = async (req, res, next) => {
  try {
    const allowed = ['status','amountPaid','paymentMethod'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const bill = await Billing.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } });
    if (!bill) throw new ApiError(404, 'Bill not found');
    res.json({ success: true, data: bill });
  } catch (err) { next(err); }
};
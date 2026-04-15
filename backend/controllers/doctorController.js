import User from '../models/User.js';

export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name email specialisation licenseNumber createdAt');
    res.json({ success: true, data: doctors });
  } catch (err) { next(err); }
};
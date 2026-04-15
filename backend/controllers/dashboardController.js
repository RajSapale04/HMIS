import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Billing from '../models/Billing.js';

export const getMISStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      activeDoctors,
      todayAppointments,
      revenue,
      monthlyRevenue,
      appointmentsByType,
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: 'doctor', isActive: true }),
      Appointment.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lte: new Date(new Date().setHours(23,59,59,999)),
        },
        status: 'scheduled',
      }),
      // Total revenue (paid bills)
      Billing.aggregate([
        { $match: { status: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      // Last 6 months revenue
      Billing.aggregate([
        { $match: { status: { $in: ['paid', 'partial'] }, createdAt: { $gte: new Date(Date.now() - 180 * 864e5) } } },
        { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amountPaid' },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Appointment.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        activeDoctors,
        todayAppointments,
        totalRevenue: revenue[0]?.total ?? 0,
        monthlyRevenue,
        appointmentsByType,
      },
    });
  } catch (err) { next(err); }
};
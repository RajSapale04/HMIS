import Appointment from '../models/Appointment.js';
import ApiError from '../utils/ApiError.js';

// Helper: "HH:MM" → minutes since midnight
const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const hasOverlap = async (doctorId, date, startTime, endTime, excludeId = null) => {
  const newStart = toMins(startTime);
  const newEnd   = toMins(endTime);
  if (newEnd <= newStart) throw new ApiError(400, 'End time must be after start time');

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const existing = await Appointment.find({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ['cancelled', 'no-show'] },
    ...(excludeId && { _id: { $ne: excludeId } }),
  });

  return existing.some(appt => {
    const s = toMins(appt.startTime);
    const e = toMins(appt.endTime);
    // Overlap when intervals intersect: newStart < e AND newEnd > s
    return newStart < e && newEnd > s;
  });
};

export const createAppointment = async (req, res, next) => {
  try {
    const { patient, doctor, date, startTime, endTime, type, notes } = req.body;

    if (await hasOverlap(doctor, date, startTime, endTime)) {
      throw new ApiError(409, 'Doctor already has an appointment during this time slot');
    }

    const appt = await Appointment.create({
      patient, doctor, date, startTime, endTime, type, notes,
      bookedBy: req.user._id,
    });
    await appt.populate(['patient', 'doctor']);
    res.status(201).json({ success: true, data: appt });
  } catch (err) { next(err); }
};


export const getAppointments = async (req, res, next) => {
  try {
    const filter = {};
    
    // 1. Fixed Doctor Filter: Look up the Doctor document by User ID
    if (req.user.role === 'doctor') {
      const doc = await (await import('../models/Doctor.js')).default.findOne({ user: req.user._id });
      if (doc) filter.doctor = doc._id;
    }
    
    if (req.user.role === 'patient') {
      const pat = await (await import('../models/Patient.js')).default.findOne({ user: req.user._id });
      if (pat) filter.patient = pat._id;
    }
    
    if (req.query.date) {
      const d = new Date(req.query.date);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email' 
        }
      })
      // 2. Deep Populate Doctor: Pull specialization AND the nested User name
      .populate({
        path: 'doctor',
        select: 'specialization department',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ date: 1, startTime: 1 });
      
    res.json({ success: true, data: appointments });
  } catch (err) { 
    next(err); 
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!appt) throw new ApiError(404, 'Appointment not found');
    res.json({ success: true, data: appt });
  } catch (err) { next(err); }
};
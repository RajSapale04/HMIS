import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  date:    { type: Date, required: true },
  startTime: { type: String, required: true }, // "HH:MM" 24-hr
  endTime:   { type: String, required: true },
  type:   { type: String, enum: ['consultation', 'follow-up', 'emergency', 'procedure'], default: 'consultation' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  notes:  String,
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Compound index for fast overlap queries
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);
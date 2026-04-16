import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  department:      { type: String, required: true },
  specialization:  { type: String, required: true },
  qualifications:  [{ type: String }], // e.g., ["MBBS", "MD - Cardiology"]
  experience:      { type: Number, required: true }, // Years of experience
  licenseNumber:   { type: String, required: true, unique: true },
  phone:           { type: String, required: true },
  consultationFee: { type: Number, required: true },
  availability:    { type: String, enum: ['Available', 'On Leave', 'Unavailable'], default: 'Available' },
  registeredBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes for faster querying by user ID and department
doctorSchema.index({ 'user': 1 });
doctorSchema.index({ 'department': 1 });

export default mongoose.model('Doctor', doctorSchema);
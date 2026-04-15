import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth:   { type: Date, required: true },
  gender:        { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodGroup:    { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  phone:         { type: String, required: true },
  address:       { type: String, required: true },
  emergencyContact: {
    name:  String,
    phone: String,
    relation: String,
  },
  insurance: {
    provider:  String,
    policyNo:  String,
    expiresAt: Date,
  },
  medicalHistory: [String],
  allergies:      [String],
  registeredBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

patientSchema.index({ 'user': 1 });

export default mongoose.model('Patient', patientSchema);
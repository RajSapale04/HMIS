import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  role:     { type: String, enum: ['admin', 'doctor', 'patient', 'staff'], default: 'patient' },
  isActive: { type: Boolean, default: true },
  // Doctor-specific fields
  specialisation: String,
  licenseNumber:  String,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never expose the password hash
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
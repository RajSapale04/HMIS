import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, default: 1 },
  unitPrice:   { type: Number, required: true },
});

const billingSchema = new mongoose.Schema({
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items:       [lineItemSchema],
  discount:    { type: Number, default: 0 },           // percentage
  tax:         { type: Number, default: 0 },            // percentage
  total:       { type: Number, required: true },
  amountPaid:  { type: Number, default: 0 },
  status:      { type: String, enum: ['pending', 'paid', 'partial', 'waived'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'insurance', 'upi'] },
  issuedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Billing', billingSchema);
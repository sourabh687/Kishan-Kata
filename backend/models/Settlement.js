const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  laborerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laborer', required: true },
  settlementDate: { type: Date, default: Date.now },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  totalDays: { type: Number, required: true },
  grossWage: { type: Number, required: true },
  advanceDeducted: { type: Number, default: 0 },
  netPaid: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Credit'], default: 'Cash' },
  cropBreakdown: [{
    cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    cropName: { type: String },
    days: { type: Number },
    amount: { type: Number }
  }],
  attendanceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }],
  notes: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);

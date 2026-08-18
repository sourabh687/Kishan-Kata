const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  laborerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laborer', required: true },
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', default: null },
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Full Day', 'Half Day', 'Overtime', 'Absent'], 
    default: 'Full Day' 
  },
  units: { type: Number, default: 1 }, // 1 for full day, 0.5 for half day, >1 for overtime
  wageRate: { type: Number, required: true },
  totalWage: { type: Number, required: true }, // units * wageRate
  activity: { type: String, default: '' }, // e.g., 'Weeding', 'Harvesting', 'Spraying'
  isSettled: { type: Boolean, default: false },
  settlementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Settlement', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

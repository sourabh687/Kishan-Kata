const mongoose = require('mongoose');

const laborerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  baseRate: { type: Number, default: 0 },
  advanceBalance: { type: Number, default: 0 }, // Positive means they owe us, negative means we owe them
  assignedCrops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crop' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Laborer', laborerSchema);

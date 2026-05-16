const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  season: { type: String, required: true }, // e.g., "Rabi 2026", "Kharif 2025"
  area: { type: String }, // e.g., "5 Acres"
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' }, // Can be null if it's a general expense
  type: { type: String, enum: ['Kharcha', 'Kamai'], required: true },
  category: { type: String, required: true }, // e.g., 'Fertilizer', 'Labor', 'Sale'
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['Cash', 'Bank', 'Credit'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  details: { type: String },
  laborerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laborer' }, // If it's a labor transaction
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);

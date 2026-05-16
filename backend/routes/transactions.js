const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    if (req.query.cropId) {
      query.cropId = req.query.cropId;
    }
    const transactions = await Transaction.find(query).populate('cropId').sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new transaction
router.post('/', auth, async (req, res) => {
  const transaction = new Transaction({
    cropId: req.body.cropId,
    type: req.body.type,
    category: req.body.category,
    amount: req.body.amount,
    mode: req.body.mode || 'Cash',
    details: req.body.details,
    date: req.body.date ? new Date(req.body.date) : Date.now(),
    laborerId: req.body.laborerId,
    userId: req.user.id
  });

  try {
    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

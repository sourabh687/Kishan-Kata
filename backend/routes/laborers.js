const express = require('express');
const router = express.Router();
const Laborer = require('../models/Laborer');
const auth = require('../middleware/auth');

// Get all laborers for user
router.get('/', auth, async (req, res) => {
  try {
    const laborers = await Laborer.find({ userId: req.user.id }).populate('assignedCrops').sort({ createdAt: -1 });
    res.json(laborers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single laborer
router.get('/:id', auth, async (req, res) => {
  try {
    const laborer = await Laborer.findOne({ _id: req.params.id, userId: req.user.id }).populate('assignedCrops');
    if (!laborer) return res.status(404).json({ message: 'Laborer not found' });
    res.json(laborer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new laborer
router.post('/', auth, async (req, res) => {
  const laborer = new Laborer({
    name: req.body.name,
    contact: req.body.contact,
    baseRate: req.body.baseRate || 0,
    advanceBalance: req.body.advanceBalance || 0,
    assignedCrops: req.body.assignedCrops || [],
    userId: req.user.id
  });

  try {
    const newLaborer = await laborer.save();
    res.status(201).json(newLaborer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a laborer (e.g. for advanceBalance)
router.patch('/:id', auth, async (req, res) => {
  try {
    const laborer = await Laborer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!laborer) return res.status(404).json({ message: 'Laborer not found' });

    if (req.body.advanceBalance !== undefined) {
      laborer.advanceBalance = req.body.advanceBalance;
    }
    
    const updatedLaborer = await laborer.save();
    res.json(updatedLaborer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

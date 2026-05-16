const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');
const auth = require('../middleware/auth');

// Get all crops for user
router.get('/', auth, async (req, res) => {
  try {
    const crops = await Crop.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new crop
router.post('/', auth, async (req, res) => {
  const crop = new Crop({
    name: req.body.name,
    season: req.body.season,
    area: req.body.area,
    status: req.body.status || 'Active',
    userId: req.user.id
  });

  try {
    const newCrop = await crop.save();
    res.status(201).json(newCrop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

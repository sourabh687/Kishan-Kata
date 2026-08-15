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
  const { name, season, area, status } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Crop name is required' });
  }

  if (!season || !season.trim()) {
    return res.status(400).json({ message: 'Crop season is required' });
  }

  const crop = new Crop({
    name: name.trim(),
    season: season.trim(),
    area: area ? area.trim() : '',
    status: status || 'Active',
    userId: req.user.id
  });

  try {
    const newCrop = await crop.save();
    res.status(201).json(newCrop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get single crop by id
router.get('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, userId: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json(crop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update crop
router.patch('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, userId: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (req.body.name) crop.name = req.body.name.trim();
    if (req.body.season) crop.season = req.body.season.trim();
    if (req.body.area !== undefined) crop.area = req.body.area.trim();
    if (req.body.status) crop.status = req.body.status;

    const updatedCrop = await crop.save();
    res.json(updatedCrop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete crop
router.delete('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.json({ message: 'Crop deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

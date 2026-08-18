const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Laborer = require('../models/Laborer');
const Attendance = require('../models/Attendance');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Helper to compute laborer stats
async function getLaborerStats(userId, laborerIds) {
  const objectIds = laborerIds.map(id => new mongoose.Types.ObjectId(id));

  // Aggregate attendances
  const attendanceStats = await Attendance.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), laborerId: { $in: objectIds } } },
    {
      $group: {
        _id: { laborerId: '$laborerId', cropId: '$cropId' },
        totalDays: { $sum: '$units' },
        totalWage: { $sum: '$totalWage' },
        unsettledDays: {
          $sum: { $cond: [{ $eq: ['$isSettled', false] }, '$units', 0] }
        },
        unsettledWage: {
          $sum: { $cond: [{ $eq: ['$isSettled', false] }, '$totalWage', 0] }
        },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'crops',
        localField: '_id.cropId',
        foreignField: '_id',
        as: 'crop'
      }
    },
    {
      $unwind: { path: '$crop', preserveNullAndEmptyArrays: true }
    }
  ]);

  // Aggregate total advance given from transactions
  const advanceStats = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        laborerId: { $in: objectIds },
        category: 'Labor Advance'
      }
    },
    {
      $group: {
        _id: '$laborerId',
        totalAdvanceGiven: { $sum: '$amount' }
      }
    }
  ]);

  const advanceMap = {};
  advanceStats.forEach(item => {
    advanceMap[item._id.toString()] = item.totalAdvanceGiven;
  });

  const laborerStatsMap = {};
  laborerIds.forEach(id => {
    laborerStatsMap[id.toString()] = {
      totalDays: 0,
      totalWage: 0,
      unsettledDays: 0,
      unsettledWage: 0,
      cropBreakdown: [],
      totalAdvanceGiven: advanceMap[id.toString()] || 0
    };
  });

  attendanceStats.forEach(item => {
    const lId = item._id.laborerId.toString();
    if (laborerStatsMap[lId]) {
      laborerStatsMap[lId].totalDays += item.totalDays;
      laborerStatsMap[lId].totalWage += item.totalWage;
      laborerStatsMap[lId].unsettledDays += item.unsettledDays;
      laborerStatsMap[lId].unsettledWage += item.unsettledWage;

      laborerStatsMap[lId].cropBreakdown.push({
        cropId: item._id.cropId,
        cropName: item.crop ? item.crop.name : 'General',
        season: item.crop ? item.crop.season : '',
        days: item.totalDays,
        unsettledDays: item.unsettledDays,
        wage: item.totalWage
      });
    }
  });

  return laborerStatsMap;
}

// Get all laborers for user with attendance & advance stats
router.get('/', auth, async (req, res) => {
  try {
    const laborers = await Laborer.find({ userId: req.user.id })
      .populate('assignedCrops')
      .sort({ createdAt: -1 });

    if (laborers.length === 0) {
      return res.json([]);
    }

    const laborerIds = laborers.map(l => l._id);
    const statsMap = await getLaborerStats(req.user.id, laborerIds);

    const result = laborers.map(l => {
      const stats = statsMap[l._id.toString()] || {
        totalDays: 0,
        totalWage: 0,
        unsettledDays: 0,
        unsettledWage: 0,
        cropBreakdown: [],
        totalAdvanceGiven: 0
      };
      return {
        ...l.toObject(),
        stats
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching laborers:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get single laborer with detailed stats
router.get('/:id', auth, async (req, res) => {
  try {
    const laborer = await Laborer.findOne({ _id: req.params.id, userId: req.user.id }).populate('assignedCrops');
    if (!laborer) return res.status(404).json({ message: 'Laborer not found' });

    const statsMap = await getLaborerStats(req.user.id, [laborer._id]);
    const stats = statsMap[laborer._id.toString()];

    res.json({
      ...laborer.toObject(),
      stats
    });
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

    // If initial advanceBalance was set > 0, log a transaction for it
    if (req.body.advanceBalance && req.body.advanceBalance > 0) {
      await Transaction.create({
        type: 'Kharcha',
        category: 'Labor Advance',
        amount: req.body.advanceBalance,
        mode: 'Cash',
        date: new Date(),
        details: `Initial Advance balance for ${newLaborer.name}`,
        laborerId: newLaborer._id,
        userId: req.user.id
      });
    }

    res.status(201).json(newLaborer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a laborer (e.g. advanceBalance, baseRate, name, crops)
router.patch('/:id', auth, async (req, res) => {
  try {
    const laborer = await Laborer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!laborer) return res.status(404).json({ message: 'Laborer not found' });

    if (req.body.advanceBalance !== undefined) laborer.advanceBalance = req.body.advanceBalance;
    if (req.body.baseRate !== undefined) laborer.baseRate = req.body.baseRate;
    if (req.body.name !== undefined) laborer.name = req.body.name;
    if (req.body.contact !== undefined) laborer.contact = req.body.contact;
    if (req.body.assignedCrops !== undefined) laborer.assignedCrops = req.body.assignedCrops;
    
    const updatedLaborer = await laborer.save();
    res.json(updatedLaborer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete laborer
router.delete('/:id', auth, async (req, res) => {
  try {
    const laborer = await Laborer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!laborer) return res.status(404).json({ message: 'Laborer not found' });

    await Laborer.deleteOne({ _id: req.params.id });
    // Also clean up attendances and their linked transactions
    const attendances = await Attendance.find({ laborerId: req.params.id, userId: req.user.id });
    const txIds = attendances.map(a => a.transactionId).filter(Boolean);
    if (txIds.length > 0) {
      await Transaction.deleteMany({ _id: { $in: txIds } });
    }
    await Transaction.deleteMany({ laborerId: req.params.id, userId: req.user.id });
    await Attendance.deleteMany({ laborerId: req.params.id, userId: req.user.id });

    res.json({ message: 'Laborer and associated records deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

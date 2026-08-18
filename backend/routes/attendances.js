const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Laborer = require('../models/Laborer');
const auth = require('../middleware/auth');

// GET /api/attendances - query attendances with filters
router.get('/', auth, async (req, res) => {
  try {
    const { laborerId, cropId, isSettled, startDate, endDate } = req.query;
    const filter = { userId: req.user.id };

    if (laborerId) filter.laborerId = laborerId;
    if (cropId) filter.cropId = cropId;
    if (isSettled !== undefined) filter.isSettled = isSettled === 'true';
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const attendances = await Attendance.find(filter)
      .populate('laborerId', 'name baseRate contact')
      .populate('cropId', 'name season')
      .sort({ date: -1, createdAt: -1 });

    res.json(attendances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendances/summary - summary across laborers/crops
router.get('/summary', auth, async (req, res) => {
  try {
    const { laborerId } = req.query;
    const match = { userId: req.user.id };
    if (laborerId) {
      match.laborerId = new mongoose.Types.ObjectId(laborerId);
    }

    const summary = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$cropId',
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
          localField: '_id',
          foreignField: '_id',
          as: 'crop'
        }
      },
      {
        $unwind: { path: '$crop', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          cropId: '$_id',
          cropName: { $ifNull: ['$crop.name', 'General / Unassigned'] },
          season: '$crop.season',
          totalDays: 1,
          totalWage: 1,
          unsettledDays: 1,
          unsettledWage: 1,
          count: 1
        }
      }
    ]);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendances - create single or batch attendance
router.post('/', auth, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const createdAttendances = [];

    for (const item of items) {
      const { laborerId, cropId, date, status, units, wageRate, activity } = item;

      if (!laborerId) {
        return res.status(400).json({ message: 'Laborer ID is required' });
      }

      // If wageRate is not provided, fetch default from Laborer
      let rate = wageRate;
      if (rate === undefined || rate === null || rate === '') {
        const lab = await Laborer.findOne({ _id: laborerId, userId: req.user.id });
        rate = lab ? lab.baseRate : 0;
      }
      rate = Number(rate) || 0;

      let effectiveUnits = units;
      if (effectiveUnits === undefined || effectiveUnits === null) {
        if (status === 'Half Day') effectiveUnits = 0.5;
        else if (status === 'Absent') effectiveUnits = 0;
        else effectiveUnits = 1;
      }
      effectiveUnits = Number(effectiveUnits);

      const totalWage = effectiveUnits * rate;

      const att = new Attendance({
        laborerId,
        cropId: cropId || null,
        date: date ? new Date(date) : new Date(),
        status: status || 'Full Day',
        units: effectiveUnits,
        wageRate: rate,
        totalWage: totalWage,
        activity: activity || '',
        isSettled: false,
        userId: req.user.id
      });

      const saved = await att.save();
      await saved.populate('laborerId', 'name baseRate');
      await saved.populate('cropId', 'name season');
      createdAttendances.push(saved);
    }

    res.status(201).json(Array.isArray(req.body) ? createdAttendances : createdAttendances[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/attendances/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, userId: req.user.id });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendance.isSettled) {
      return res.status(400).json({ message: 'Cannot delete already settled attendance record' });
    }

    await Attendance.deleteOne({ _id: req.params.id });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Settlement = require('../models/Settlement');
const Attendance = require('../models/Attendance');
const Laborer = require('../models/Laborer');
const Crop = require('../models/Crop');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// GET /api/settlements
router.get('/', auth, async (req, res) => {
  try {
    const { laborerId } = req.query;
    const filter = { userId: req.user.id };
    if (laborerId) filter.laborerId = laborerId;

    const settlements = await Settlement.find(filter)
      .populate('laborerId', 'name contact baseRate advanceBalance')
      .populate('attendanceIds')
      .sort({ settlementDate: -1, createdAt: -1 });

    res.json(settlements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/settlements/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const settlement = await Settlement.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('laborerId', 'name contact baseRate advanceBalance')
      .populate('attendanceIds');

    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    res.json(settlement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/settlements - Compile and settle attendances
router.post('/', auth, async (req, res) => {
  try {
    const { 
      laborerId, 
      periodStart, 
      periodEnd, 
      attendanceIds, 
      advanceDeducted = 0, 
      paymentMode = 'Cash', 
      notes = '' 
    } = req.body;

    if (!laborerId) {
      return res.status(400).json({ message: 'Laborer ID is required' });
    }

    const laborer = await Laborer.findOne({ _id: laborerId, userId: req.user.id });
    if (!laborer) {
      return res.status(404).json({ message: 'Laborer not found' });
    }

    // Find unsettled attendances
    let query = { laborerId, userId: req.user.id, isSettled: false };
    if (attendanceIds && attendanceIds.length > 0) {
      query._id = { $in: attendanceIds };
    }

    const attendances = await Attendance.find(query).populate('cropId', 'name season');
    if (attendances.length === 0) {
      return res.status(400).json({ message: 'No unsettled attendance records found to compile.' });
    }

    // Calculate totals and crop breakdown
    let totalDays = 0;
    let grossWage = 0;
    const cropMap = {};

    attendances.forEach(att => {
      totalDays += att.units;
      grossWage += att.totalWage;

      const cId = att.cropId ? att.cropId._id.toString() : 'unassigned';
      const cName = att.cropId ? att.cropId.name : 'General / Unassigned';

      if (!cropMap[cId]) {
        cropMap[cId] = {
          cropId: att.cropId ? att.cropId._id : null,
          cropName: cName,
          days: 0,
          amount: 0
        };
      }
      cropMap[cId].days += att.units;
      cropMap[cId].amount += att.totalWage;
    });

    const cropBreakdown = Object.values(cropMap);
    const numAdvanceDeducted = Math.max(0, Number(advanceDeducted) || 0);
    const netPaid = Math.max(0, grossWage - numAdvanceDeducted);

    // Create Settlement Record
    const settlement = new Settlement({
      laborerId,
      settlementDate: new Date(),
      periodStart: periodStart ? new Date(periodStart) : (attendances[attendances.length - 1]?.date || new Date()),
      periodEnd: periodEnd ? new Date(periodEnd) : (attendances[0]?.date || new Date()),
      totalDays,
      grossWage,
      advanceDeducted: numAdvanceDeducted,
      netPaid,
      paymentMode,
      cropBreakdown,
      attendanceIds: attendances.map(a => a._id),
      notes,
      userId: req.user.id
    });

    const savedSettlement = await settlement.save();

    // Mark attendances as settled
    await Attendance.updateMany(
      { _id: { $in: attendances.map(a => a._id) } },
      { $set: { isSettled: true, settlementId: savedSettlement._id } }
    );

    // Update laborer advance balance
    laborer.advanceBalance = Math.max(0, laborer.advanceBalance - numAdvanceDeducted);
    await laborer.save();

    // Record Kharcha Transactions for accurate farm accounting
    // Create transaction entries according to crop breakdown
    for (const cropItem of cropBreakdown) {
      // Proportionate net payout for this crop
      const cropShareRatio = grossWage > 0 ? (cropItem.amount / grossWage) : 0;
      const cropNetPaid = Math.round(netPaid * cropShareRatio);

      await Transaction.create({
        cropId: cropItem.cropId,
        type: 'Kharcha',
        category: 'Labor',
        amount: cropItem.amount, // Record full wage expense for the crop
        mode: paymentMode,
        date: new Date(),
        details: `Settlement for ${laborer.name}: ${cropItem.days} days work (${cropItem.cropName}). ${numAdvanceDeducted > 0 ? `(Advance deducted: ₹${Math.round(numAdvanceDeducted * cropShareRatio)})` : ''}`,
        laborerId: laborer._id,
        userId: req.user.id
      });
    }

    res.status(201).json(savedSettlement);
  } catch (err) {
    console.error('Error creating settlement:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

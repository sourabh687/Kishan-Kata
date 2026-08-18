require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://kishan-kata.vercel.app'
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive CORS for dev/prod flexibility
  },
  credentials: true
}));
app.use(express.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kishankata';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log(`MongoDB Connected successfully to ${MONGODB_URI}`);
    // Sync any existing attendance records that don't have crop labor expense transactions yet
    try {
      const Attendance = require('./models/Attendance');
      const Transaction = require('./models/Transaction');
      const unsynced = await Attendance.find({ transactionId: null, totalWage: { $gt: 0 } })
        .populate('laborerId')
        .populate('cropId');

      for (const att of unsynced) {
        const workerName = att.laborerId ? att.laborerId.name : 'Worker';
        const cropName = att.cropId ? ` (${att.cropId.name})` : '';
        const tx = await Transaction.create({
          cropId: att.cropId ? att.cropId._id : null,
          type: 'Kharcha',
          category: 'Labor',
          amount: att.totalWage,
          mode: 'Credit',
          date: att.date || new Date(),
          details: `Labor Expense: ${workerName}${cropName} - ${att.units}d (${att.status || 'Full Day'})${att.activity ? ` [${att.activity}]` : ''}`,
          laborerId: att.laborerId ? att.laborerId._id : null,
          attendanceId: att._id,
          userId: att.userId
        });
        await Attendance.updateOne({ _id: att._id }, { transactionId: tx._id });
      }
      if (unsynced.length > 0) {
        console.log(`Synced ${unsynced.length} existing attendance labor expenses into crop transactions.`);
      }
    } catch (syncErr) {
      console.error('Error syncing legacy attendance transactions:', syncErr);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRouter = require('./routes/auth');
const cropsRouter = require('./routes/crops');
const transactionsRouter = require('./routes/transactions');
const laborersRouter = require('./routes/laborers');
const attendancesRouter = require('./routes/attendances');
const settlementsRouter = require('./routes/settlements');

app.use('/api/auth', authRouter);
app.use('/api/crops', cropsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/laborers', laborersRouter);
app.use('/api/attendances', attendancesRouter);
app.use('/api/settlements', settlementsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kishan Kata backend is running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

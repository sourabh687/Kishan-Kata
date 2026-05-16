require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kishankata')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
const authRouter = require('./routes/auth');
const cropsRouter = require('./routes/crops');
const transactionsRouter = require('./routes/transactions');
const laborersRouter = require('./routes/laborers');

app.use('/api/auth', authRouter);
app.use('/api/crops', cropsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/laborers', laborersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kishan Kata backend is running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

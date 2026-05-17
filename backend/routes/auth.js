const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Register User
router.post('/register', async (req, res) => {
  const { name, username, mobile, password } = req.body;

  try {
    let user = await User.findOne({ $or: [{ username }, { mobile }] });
    if (user) {
      return res.status(400).json({ message: 'User with this username or mobile already exists' });
    }

    user = new User({ name, username, mobile, password, isVerified: true });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, username: user.username, mobile: user.mobile } });
    });
  } catch (err) {
    if (err.code === 11000) {
       return res.status(400).json({ message: 'A database index error occurred. If email index exists, please clear it.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { loginIdentifier, password } = req.body;

  try {
    let user = await User.findOne({ 
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier },
        { mobile: loginIdentifier },
        { mobileOrEmail: loginIdentifier }
      ]
    });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, username: user.username, mobile: user.mobile } });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get logged in user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password (Directly without OTP)
router.post('/reset-password', async (req, res) => {
  const { mobileOrEmail, newPassword } = req.body;

  try {
    let user = await User.findOne({ 
      $or: [
        { mobile: mobileOrEmail },
        { username: mobileOrEmail },
        { email: mobileOrEmail }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

const sendEmailOtp = async (mobileOrEmail, otp) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mobileOrEmail);
  
  if (!isEmail) {
    console.log(`\n=================================================`);
    console.log(`[SIMULATED SMS] 🔑 OTP for ${mobileOrEmail}: ${otp}`);
    console.log(`=================================================\n`);
    return true;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log(`\n=================================================`);
    console.log(`[SIMULATED EMAIL] 🔑 OTP for ${mobileOrEmail}: ${otp}`);
    console.log(`=================================================\n`);
    throw new Error('Email credentials are not configured on the server production environment.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: mobileOrEmail,
    subject: 'Your Kishan Kata OTP Verification',
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email OTP sent successfully to ${mobileOrEmail}`);
};

// Register User
router.post('/register', async (req, res) => {
  const { name, mobileOrEmail, password } = req.body;

  try {
    let user = await User.findOne({ mobileOrEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, mobileOrEmail, password, isVerified: false });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    await sendEmailOtp(mobileOrEmail, otp);

    res.json({ message: 'OTP sent successfully. Please verify to continue.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobileOrEmail, otp } = req.body;

  try {
    let user = await User.findOne({ mobileOrEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, mobileOrEmail: user.mobileOrEmail } });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { mobileOrEmail, password } = req.body;

  try {
    let user = await User.findOne({ mobileOrEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your account using OTP first', requiresVerification: true });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, mobileOrEmail: user.mobileOrEmail } });
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

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { mobileOrEmail } = req.body;

  try {
    let user = await User.findOne({ mobileOrEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmailOtp(mobileOrEmail, otp);

    res.json({ message: 'OTP sent successfully for password reset.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { mobileOrEmail, otp, newPassword } = req.body;

  try {
    let user = await User.findOne({ mobileOrEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (String(user.otp).trim() !== String(otp).trim() || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

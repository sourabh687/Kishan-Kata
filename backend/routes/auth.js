const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const sendFast2SmsOtp = async (mobile, otp) => {
  if (!process.env.FAST2SMS_API_KEY || process.env.FAST2SMS_API_KEY === 'YOUR_API_KEY') {
    console.log(`\n=================================================`);
    console.log(`[SIMULATED SMS] 🔑 OTP for ${mobile}: ${otp}`);
    console.log(`=================================================\n`);
    return;
  }
  
  const url = 'https://www.fast2sms.com/dev/bulkV2';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: process.env.FAST2SMS_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp.toString(),
      numbers: mobile.toString()
    })
  };

  try {
    const res = await fetch(url, options);
    const json = await res.json();
    console.log('Fast2SMS Response:', json);
  } catch (err) {
    console.error('Fast2SMS Error:', err);
  }
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

    await user.save();

    await sendFast2SmsOtp(mobileOrEmail, otp);

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

    if (user.otp !== otp || user.otpExpires < Date.now()) {
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

    await sendFast2SmsOtp(mobileOrEmail, otp);

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

    if (user.otp !== otp || user.otpExpires < Date.now()) {
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

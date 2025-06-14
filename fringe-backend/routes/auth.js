const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');
const passport = require('passport');
const Notification = require('../models/Notification');
require('dotenv').config();

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const newUser = new User({ name, email, password, role: role || 'customer' });
    await newUser.save();

    // Notification: New User Registration
    await Notification.create({
      type: 'user',
      content: `New user registered: ${name} (${email})`,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('🔥 Registration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('✅ User Found:', user.email);
    console.log('🔑 Entered Password:', password);
    console.log('🔒 Stored Hashed Password:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Password Match:', isMatch);

    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('🔥 Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get User Profile (Protected Route) ──────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('🔥 Profile Fetch Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get All Users (Admin Only) ───────────────────────────────────────────────
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    // Include createdAt for admin customer details view
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('🔥 Fetch Users Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    // Redirect to your frontend login endpoint with token
    // Updated for Vercel deployment - using environment variables
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?token=${token}`);
  }
);

// ─── Update User Profile (name, email) ────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check for duplicate email
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();
    res.json({
      message: 'Profile updated',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
router.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

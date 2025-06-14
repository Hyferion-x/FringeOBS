const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');
const { addUserValidation } = require('../Middlewares/Validations/users/user.validation');


const router = express.Router();

// **User Registration Route with Validation**
router.post('/register', addUserValidation, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const newUser = new User({ name, email, password, role: role || 'customer' });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('🔥 Registration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/all', authMiddleware, async (req, res) => {
  console.log('User for /all:', req.user);
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const users = await User.find({}, 'name email role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get User Details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).send('User not found');

    res.status(200).send(user);
  } catch (error) {
    console.error('User Fetch Error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');

// Get all bookings for the user (or all if admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Get a single booking by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
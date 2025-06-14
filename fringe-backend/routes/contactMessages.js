const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');

const router = express.Router();

// GET /api/contactMessages - Get all contact messages (admin only)
router.get('/', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');

// Get all notifications (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const notifications = await Notification.find().sort({ time: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a notification (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const notif = new Notification(req.body);
    await notif.save();
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as unread
router.patch('/:id/unread', authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: false }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
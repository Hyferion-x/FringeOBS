const express = require('express');
const router = express.Router();
const TicketOrder = require('../models/TicketOrder');
const Booking = require('../models/Booking');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');

// Get all ticket orders for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const orders = await TicketOrder.find(filter).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Admin: Get all ticket orders for a user (with booking, event, user info)
router.get('/admin', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const orders = await TicketOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'bookingId',
        populate: { path: 'eventId', model: 'Event' }
      })
      .populate('userId', 'name email');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Delete a ticket order by ID (user or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await TicketOrder.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    // Only allow owner or admin
    if (req.user.role !== 'admin' && ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await TicketOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
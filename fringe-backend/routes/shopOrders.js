const express = require('express');
const router = express.Router();
const ShopOrder = require('../models/ShopOrder');
const requireAuth = require('../Middlewares/Auth/authMiddleware');
const mongoose = require('mongoose');

// Create a new merchandise order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, total } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order.' });
    }
    const order = new ShopOrder({
      userId: req.user.id, // Let Mongoose handle type; do not forcibly cast. See admin panel note.
      items,
      total,
      status: 'pending',
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all merchandise orders for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await ShopOrder.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all merchandise orders (admin only)
router.get('/all', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const orders = await ShopOrder.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new shop order from cart
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const ShopCart = require('../models/ShopCart');
    const cart = await ShopCart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }
    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = new ShopOrder({
      userId: req.user.id, // Let Mongoose handle type; do not forcibly cast. See admin panel note.
      items: cart.items,
      total,
      status: 'paid',
    });
    await order.save();
    cart.items = [];
    await cart.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a single shop order by ID (for receipt)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await ShopOrder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin: Get all merchandise orders for a user (with user info)
router.get('/admin', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { userId } = req.query;
    let filter = {};
    if (userId) {
      // Robustly match both ObjectId and string userIds in ShopOrder documents
      // This ensures all orders for the user are found, regardless of how userId was stored (string or ObjectId)
      const or = [];
      if (mongoose.Types.ObjectId.isValid(userId)) {
        or.push({ userId: mongoose.Types.ObjectId(userId) });
      }
      or.push({ userId: userId }); // Always add string match (covers legacy or string-stored userIds)
      filter = { $or: or };
    }
    // Also match all orders if no userId is provided (admin view)
    const orders = await ShopOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const auth = require('../Middlewares/Auth/authMiddleware');

// Get current user's cart
router.get('/', auth, async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });
  res.json(cart);
});

// Add or update item
router.post('/add', auth, async (req, res) => {
  const { eventId, merchId, eventName, ticketType, ticketLabel, price, quantity, imgUrl } = req.body;
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });
  let idx;
  if (ticketType === 'merch') {
    idx = cart.items.findIndex(i => i.merchId && i.merchId.equals(eventId) && i.ticketType === 'merch' && i.ticketLabel === ticketLabel);
  } else {
    idx = cart.items.findIndex(i => i.eventId && i.eventId.equals(eventId) && i.ticketType === ticketType);
  }
  if (idx >= 0) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push({
      eventId: ticketType === 'merch' ? undefined : eventId,
      merchId: ticketType === 'merch' ? eventId : undefined,
      eventName,
      ticketType,
      ticketLabel,
      price,
      quantity,
      imgUrl
    });
  }
  await cart.save();
  res.json(cart);
});

// Update quantity
router.post('/update', auth, async (req, res) => {
  const { eventId, ticketType, quantity } = req.body;
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).send('Cart not found');
  const idx = cart.items.findIndex(i => i.eventId.equals(eventId) && i.ticketType === ticketType);
  if (idx >= 0) {
    cart.items[idx].quantity = quantity;
    if (quantity <= 0) cart.items.splice(idx, 1);
    await cart.save();
  }
  res.json(cart);
});

// Remove item
router.post('/remove', auth, async (req, res) => {
  const { eventId, ticketType, ticketLabel } = req.body;
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).send('Cart not found');
  try {
    if (ticketType === 'merch') {
      // Remove by merchId and label for merch
      cart.items = cart.items.filter(i => !(i.merchId && i.merchId.equals(eventId) && i.ticketType === 'merch' && i.ticketLabel === ticketLabel));
    } else {
      // Remove by eventId and ticketType for event tickets
      cart.items = cart.items.filter(i => !(i.eventId && i.eventId.equals(eventId) && i.ticketType === ticketType));
    }
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error('Cart remove error:', err);
    res.status(500).json({ message: 'Failed to remove item from cart', error: err.message });
  }
});

// Clear cart
router.post('/clear', auth, async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json(cart);
});

module.exports = router; 
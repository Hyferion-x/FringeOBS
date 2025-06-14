const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const TicketOrder = require('../models/TicketOrder');
const auth = require('../Middlewares/Auth/authMiddleware');
const ShopOrder = require('../models/ShopOrder');
const mongoose = require('mongoose');

const router = express.Router();

// Create Stripe checkout session and bookings
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    // Fetch user's cart from DB
    const Cart = require('../models/Cart');
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }
    // Build Stripe line items for both event and merch
    const ticketLineItems = cart.items.map(item => ({
      price_data: {
        currency: 'aud',
        product_data: { name: item.eventName + (item.ticketType ? ` (${item.ticketLabel})` : '') },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: ticketLineItems,
      mode: 'payment',
      // Updated for Vercel deployment - using environment variables
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
      metadata: {
        userId: req.user.id.toString(),
      },
    });
    // Now create Bookings using the Stripe session.id as sessionId
    let bookingIds = [];
    for (const item of cart.items) {
      let booking = await Booking.findOneAndUpdate(
        {
          userId: req.user.id,
          eventId: item.eventId,
          ticketType: item.ticketType,
          sessionId: session.id
        },
        {
          $setOnInsert: {
            quantity: item.quantity,
            status: 'Completed',
            price: item.price
          }
        },
        { new: true, upsert: true }
      );
      bookingIds.push(booking._id);
    }
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Stripe webhook: create TicketOrders after payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  res.json({ received: true });
});

// Unified order creation after payment
router.post('/verify-and-create-orders', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Missing sessionId.' });
    }
    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Check payment status
    if (session.payment_status !== 'paid' && session.payment_status !== 'processing') {
      return res.status(402).json({ message: 'Payment not completed.' });
    }
    // Fetch user's cart from DB
    const Cart = require('../models/Cart');
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty.' });
    }
    // Separate event and merch items
    const eventItems = cart.items.filter(item => item.ticketType !== 'merch');
    const merchItems = cart.items.filter(item => item.ticketType === 'merch');
    let createdTickets = [];
    // Process event tickets
    for (const item of eventItems) {
      let booking = await Booking.findOne({
        userId: req.user.id,
        eventId: item.eventId,
        ticketType: item.ticketType,
        sessionId: sessionId
      });
      if (!booking) {
        booking = await Booking.create({
          eventId: item.eventId,
          userId: req.user.id,
          ticketType: item.ticketType,
          quantity: item.quantity,
          sessionId: sessionId,
          status: 'Completed',
          price: item.price
        });
      }
      for (let i = 0; i < item.quantity; i++) {
        const transactionId = `${sessionId}-${booking._id}-${i + 1}`;
        let ticket = await TicketOrder.findOne({ bookingId: booking._id, transactionId });
        if (!ticket) {
          ticket = await TicketOrder.create({
            bookingId: booking._id,
            userId: req.user.id,
            transactionId,
            paymentStatus: 'Completed',
            qrCode: `QR_${sessionId}_${booking._id}_${i + 1}`
          });
        }
        const event = await (async () => {
          try {
            return await require('../models/Event').findById(booking.eventId);
          } catch (e) { return null; }
        })();
        createdTickets.push({
          _id: ticket._id,
          bookingId: booking._id,
          eventName: event ? event.name : '',
          ticketType: booking.ticketType,
          quantity: 1,
          price: booking.price,
          status: ticket.paymentStatus === 'Completed' ? 'Confirmed' : ticket.paymentStatus,
          qrCode: ticket.qrCode,
          createdAt: ticket.createdAt,
        });
      }
    }
    // Process merch items as a single ShopOrder
    let createdShopOrder = null;
    if (merchItems.length > 0) {
      // Prevent duplicate ShopOrder for the same session/user
      createdShopOrder = await ShopOrder.findOne({ userId: req.user.id, 'items.sessionId': sessionId });
      if (!createdShopOrder) {
        const total = merchItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        createdShopOrder = await ShopOrder.create({
          userId: req.user.id, // Let Mongoose handle type; do not forcibly cast. See admin panel note.
          items: merchItems.map(item => ({
            name: item.eventName,
            price: item.price,
            quantity: item.quantity,
            variant: item.ticketLabel,
            imgUrl: item.imgUrl,
            merchId: item.merchId || item.eventId,
            sessionId // Add sessionId to each item for deduplication
          })),
          total,
          status: 'paid',
        });
      }
    }
    // Clear user's cart after successful order
    cart.items = [];
    await cart.save();
    // Always return both tickets and shopOrder, even if empty
    res.status(201).json({
      tickets: createdTickets || [],
      shopOrder: createdShopOrder || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
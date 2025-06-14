const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');  // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
const { validateEvent } = require('../Middlewares/Validations/events/event.validation');// :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}
const Notification = require('../models/Notification');
const EventExpectedSales = require('../models/EventExpectedSales');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();


router.get('/test-alive', (req, res) => {
  res.json({ ok: true });
});

// --- Get all events (existing) ---
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 'asc' });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// --- Get one event ---
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');
    res.status(200).json(event);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// --- Create a new event (Admin only) ---
router.post(
  '/',
  authMiddleware,
  validateEvent,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    try {
      const newEvent = new Event(req.body);
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(500).send('Server error');
    }
  }
);

// --- Update an event (Admin only) ---
router.put(
  '/:id',
  authMiddleware,
  validateEvent,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).send('Event not found');
      const oldName = event.name;
      const oldDate = event.date;
      const oldVenue = event.venue;
      const oldCategory = event.category;
      Object.assign(event, req.body);
      await event.save();
      // If the name changed, create a notification
      if (req.body.name && req.body.name !== oldName) {
        await Notification.create({
          type: 'event',
          content: `Event name changed from '${oldName}' to '${req.body.name}'.`,
          eventId: event._id,
        });
      }
      // If the date changed
      if (req.body.date && new Date(req.body.date).toISOString() !== new Date(oldDate).toISOString()) {
        await Notification.create({
          type: 'event',
          content: `Event '${event.name}' date changed from ${new Date(oldDate).toLocaleString()} to ${new Date(req.body.date).toLocaleString()}.`,
          eventId: event._id,
        });
      }
      // If the venue changed
      if (req.body.venue && req.body.venue !== oldVenue) {
        await Notification.create({
          type: 'event',
          content: `Event '${event.name}' venue changed from '${oldVenue}' to '${req.body.venue}'.`,
          eventId: event._id,
        });
      }
      // If the category changed
      if (req.body.category && req.body.category !== oldCategory) {
        await Notification.create({
          type: 'event',
          content: `Event '${event.name}' category changed from '${oldCategory}' to '${req.body.category}'.`,
          eventId: event._id,
        });
      }
      res.json(event);
    } catch (err) {
      res.status(500).send('Server error');
    }
  }
);

// --- Delete an event (Admin only) ---
router.delete(
  '/:id',
  authMiddleware,
  async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    try {
      const removed = await Event.findByIdAndDelete(req.params.id);
      if (!removed) return res.status(404).send('Event not found');
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).send('Server error');
    }
  }
);

// --- Expected Sales API ---
// Get expected sales for an event
router.get('/expected-sales/:eventId', authMiddleware, async (req, res) => {
  try {
    const doc = await EventExpectedSales.findOne({ eventId: req.params.eventId });
    if (!doc) return res.status(404).json({ message: 'No expected sales set for this event' });
    res.json({ eventId: doc.eventId, expectedSales: doc.expectedSales });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Set/update expected sales for an event (admin only)
router.put('/expected-sales/:eventId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { expectedSales } = req.body;
  if (typeof expectedSales !== 'number' || expectedSales < 0) {
    return res.status(400).json({ message: 'expectedSales must be a non-negative number' });
  }
  try {
    const doc = await EventExpectedSales.findOneAndUpdate(
      { eventId: req.params.eventId },
      { expectedSales },
      { new: true, upsert: true }
    );
    res.json({ eventId: doc.eventId, expectedSales: doc.expectedSales });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// --- Contact Messages API ---
// Submit a new contact message (public)
router.post('/contact-messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required.' });
    }
    const msg = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json(msg);
  } catch (err) {
    console.error('[DEBUG] Error in POST /contact-messages:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all contact messages (admin only)
router.get('/contact-messages', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const ContactMessage = require('../models/ContactMessage');
    const msgs = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (modelErr) {
    console.error('[DEBUG] Model/query error:', modelErr);
    return res.status(500).json({ message: 'Model error', error: modelErr.message });
  }
});

// Get a single contact message (admin only)
router.get('/contact-messages/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mark as read/unread (admin only)
router.put('/contact-messages/:id/read', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { isRead } = req.body;
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: !!isRead }, { new: true });
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a message (admin only)
router.delete('/contact-messages/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

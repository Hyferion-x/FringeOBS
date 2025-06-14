const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'ticket', 'event', 'user', 'inventory'
  content: { type: String, required: true },
  time: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // optional, for go to event
});

module.exports = mongoose.model('Notification', NotificationSchema); 
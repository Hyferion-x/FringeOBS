const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketType: { type: String, required: true, enum: ['standard', 'vip', 'student'] },
  quantity: { type: Number, required: true, min: 1 },
  sessionId: { type: String, required: true },
  status: { type: String, default: 'Completed', enum: ['Completed', 'Pending', 'Cancelled'] },
  price: { type: Number },
}, { timestamps: true });

bookingSchema.index({ userId: 1, eventId: 1, ticketType: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
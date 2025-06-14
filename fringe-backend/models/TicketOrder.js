const mongoose = require('mongoose');

const ticketOrderSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: String, required: true },
  paymentStatus: { type: String, required: true, enum: ['Pending', 'Completed', 'Failed'] },
  qrCode: { type: String, required: true },
}, { timestamps: true });

ticketOrderSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('TicketOrder', ticketOrderSchema);
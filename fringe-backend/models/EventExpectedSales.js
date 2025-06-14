const mongoose = require('mongoose');

const eventExpectedSalesSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
  expectedSales: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('EventExpectedSales', eventExpectedSalesSchema); 
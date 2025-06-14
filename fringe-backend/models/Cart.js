const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  merchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchandise' },
  eventName: { type: String, required: true },
  ticketType: { type: String, required: true }, // 'standard', 'vip', 'student', 'merch'
  ticketLabel: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  imgUrl: { type: String }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema); 
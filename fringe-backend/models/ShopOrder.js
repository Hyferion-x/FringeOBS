const mongoose = require('mongoose');

const ShopOrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variant: { type: String },
  imgUrl: { type: String },
  merchId: { type: String }, // id from frontend merchandise list
});

const ShopOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [ShopOrderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // 'pending', 'paid', 'cancelled', etc.
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ShopOrder', ShopOrderSchema); 
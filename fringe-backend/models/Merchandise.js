const mongoose = require('mongoose');

const merchandiseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs
  type: { type: String, enum: ['clothing', 'object'], required: true },
  sizes: [{ type: String }], // Only for clothing
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Merchandise', merchandiseSchema); 
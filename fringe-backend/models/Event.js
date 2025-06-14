// Event.js (Converted from Product.js)
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true, minlength: 10, maxlength: 200 },
  venue: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true, enum: ['Comedy', 'Music', 'Theatre', 'Dance', 'Other'] },
  ticketPrices: { standard: Number, vip: Number, student: Number },
  seatingCapacity: { type: Number, required: true },
  imgUrl: { type: String }, // Optional image URL for event
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
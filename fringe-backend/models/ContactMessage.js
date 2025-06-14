const mongoose = require('mongoose');
const modelName = 'ContactMessage';

if (mongoose.models[modelName]) {
  module.exports = mongoose.model(modelName);
} else {
  const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    subject: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });
  module.exports = mongoose.model(modelName, contactMessageSchema);
} 
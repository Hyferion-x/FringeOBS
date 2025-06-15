const mongoose = require('mongoose');

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Import Event model directly
    const Event = require('../fringe-backend/models/Event');
    
    // Test the events query
    const events = await Event.find().sort({ date: 'asc' });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events: events,
      message: 'Events fetched successfully'
    });
  } catch (error) {
    console.error('Test events error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}; 
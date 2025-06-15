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

    // Test database connection
    let dbStatus = 'disconnected';
    let dbError = null;
    
    try {
      if (process.env.MONGO_URL) {
        console.log('Testing database connection...');
        await mongoose.connect(process.env.MONGO_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        dbStatus = 'connected';
        console.log('Database connection successful');
      }
    } catch (error) {
      dbError = error.message;
      console.error('Database connection failed:', error);
    }

    const debug = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      query: req.query,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        MONGO_URL: process.env.MONGO_URL ? 'SET' : 'NOT SET',
        SECRET_KEY: process.env.SECRET_KEY ? 'SET' : 'NOT SET',
        SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
      },
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
        error: dbError,
        states: {
          0: 'disconnected',
          1: 'connected', 
          2: 'connecting',
          3: 'disconnecting'
        }
      },
      serverless: {
        working: true,
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(debug);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}; 
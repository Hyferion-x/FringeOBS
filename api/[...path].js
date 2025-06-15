// Serverless function handler for Express app
const mongoose = require('mongoose');
const path = require('path');

// Cache the database connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const MONGO_URL = process.env.MONGO_URL;
  if (!MONGO_URL) {
    throw new Error('MONGO_URL environment variable is required');
  }

  try {
    console.log('Connecting to MongoDB...');
    const connection = await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    cachedDb = connection;
    console.log('✅ Connected to MongoDB in serverless function');
    return connection;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Connect to database first
    await connectToDatabase();

    // Get the path from the query parameter
    const { path: urlPath } = req.query;
    
    // Debug logging
    console.log('Original req.url:', req.url);
    console.log('Path from query:', urlPath);
    console.log('Full query:', req.query);
    
    // Reconstruct the original URL
    if (urlPath && Array.isArray(urlPath)) {
      req.url = '/api/' + urlPath.join('/');
    } else if (urlPath) {
      req.url = '/api/' + urlPath;
    } else {
      req.url = '/api/';
    }
    
    // Add query string if it exists (excluding the path parameter)
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path') {
        queryParams.append(key, value);
      }
    });
    
    if (queryParams.toString()) {
      req.url += '?' + queryParams.toString();
    }

    console.log('Reconstructed req.url:', req.url);
    console.log('Request method:', req.method);

    // Change working directory to backend folder so relative imports work
    const originalCwd = process.cwd();
    const backendPath = path.join(originalCwd, 'fringe-backend');
    process.chdir(backendPath);
    
    try {
      // Import and use the Express app
      const app = require('../fringe-backend/server.js');
      
      // Restore original working directory
      process.chdir(originalCwd);
      
      // Let Express handle the request
      return app(req, res);
    } catch (appError) {
      // Restore original working directory even if there's an error
      process.chdir(originalCwd);
      throw appError;
    }
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 
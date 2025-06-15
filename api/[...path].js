// Serverless function handler for Express app
const path = require('path');

// Import the Express app directly
const app = require('../fringe-backend/server.js');

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

    // Get the path from the query parameter
    const { path: urlPath } = req.query;
    
    // Debug logging
    console.log('Original req.url:', req.url);
    console.log('Path from query:', urlPath);
    console.log('Request method:', req.method);
    console.log('Environment variables check:');
    console.log('- MONGO_URL:', process.env.MONGO_URL ? 'Set' : 'Not set');
    console.log('- SECRET_KEY:', process.env.SECRET_KEY ? 'Set' : 'Not set');
    
    // Reconstruct the original URL for API routes
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

    // Ensure environment variables are available
    if (!process.env.MONGO_URL) {
      console.error('❌ MONGO_URL not found in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error',
        error: 'Database connection not configured'
      });
    }

    // Let Express handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 
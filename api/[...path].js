// Serverless function handler for Express app
const path = require('path');

// Import the Express app directly
let app;
try {
  app = require('../fringe-backend/server.js');
} catch (error) {
  console.error('Failed to import Express app:', error);
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

    // Get the path from the query parameter or extract from URL
    const { path: urlPath } = req.query;
    
    // If path is not in query, extract from the original URL
    let extractedPath = urlPath;
    if (!extractedPath) {
      // Extract path from the original URL after /api/
      const urlMatch = req.url.match(/^\/api\/(.*)$/);
      if (urlMatch && urlMatch[1]) {
        extractedPath = urlMatch[1].split('/');
      }
    }
    
    // Debug logging
    console.log('Original req.url:', req.url);
    console.log('Path from query:', urlPath);
    console.log('Extracted path:', extractedPath);
    console.log('Request method:', req.method);
    console.log('Environment variables check:');
    console.log('- MONGO_URL:', process.env.MONGO_URL ? 'Set' : 'Not set');
    console.log('- SECRET_KEY:', process.env.SECRET_KEY ? 'Set' : 'Not set');
    
    // Reconstruct the original URL for API routes
    if (extractedPath && Array.isArray(extractedPath)) {
      req.url = '/api/' + extractedPath.join('/');
    } else if (extractedPath && typeof extractedPath === 'string') {
      req.url = '/api/' + extractedPath;
    } else if (extractedPath) {
      req.url = '/api/' + extractedPath;
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
    if (!app) {
      console.error('Express app not available');
      return res.status(500).json({ 
        message: 'Server not initialized',
        error: 'Express app failed to load'
      });
    }
    
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
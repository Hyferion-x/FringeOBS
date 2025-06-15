// Serverless function handler for Express app
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
    const { path } = req.query;
    
    // Reconstruct the original URL
    if (path && Array.isArray(path)) {
      req.url = '/api/' + path.join('/');
    } else if (path) {
      req.url = '/api/' + path;
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

    console.log('Serverless function called:', req.method, req.url);

    // Import and use the Express app
    const app = require('../fringe-backend/server.js');
    
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
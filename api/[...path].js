// Vercel serverless function handler
const app = require('../fringe-backend/server');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path from the query parameter
  const { path } = req.query;
  
  // Reconstruct the URL for the Express app
  if (path && Array.isArray(path)) {
    req.url = '/api/' + path.join('/');
  } else if (path) {
    req.url = '/api/' + path;
  } else {
    req.url = '/api/';
  }

  // Add query string if it exists
  if (req.url.indexOf('?') === -1 && Object.keys(req.query).length > 1) {
    const queryString = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path') {
        queryString.append(key, value);
      }
    });
    if (queryString.toString()) {
      req.url += '?' + queryString.toString();
    }
  }

  // Let Express handle the request
  return app(req, res);
}; 
// Vercel serverless function handler for the backend API
const { parse } = require('url');
const app = require('../fringe-backend/server');

// Export as a serverless function handler
module.exports = async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  // Parse the URL to get the path without /api prefix
  const parsed = parse(req.url, true);
  
  // Remove /api prefix if it exists
  if (parsed.pathname.startsWith('/api')) {
    req.url = parsed.pathname.replace('/api', '') + (parsed.search || '');
  }

  // If the path is empty after removing /api, set it to /
  if (!req.url || req.url === '') {
    req.url = '/';
  }

  // Let Express handle the request
  return app(req, res);
}; 
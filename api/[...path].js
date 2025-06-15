// Vercel serverless function handler for the backend API
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

  // The path parameter in [...path].js will capture everything after /api/
  // So we need to prepend /api/ to the captured path to match backend routes
  const path = req.url || '/';
  req.url = `/api${path}`;

  // Let Express handle the request
  return app(req, res);
}; 
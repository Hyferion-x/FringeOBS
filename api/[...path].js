// This is a catch-all API route that delegates to the main backend server
// It allows Vercel to recognize the serverless function while keeping the existing backend structure

const path = require('path');

// Import the main server app
const app = require('../fringe-backend/server');

// Export the app as a serverless function
module.exports = app; 
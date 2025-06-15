require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rt = require('file-stream-rotator');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const passport = require(path.join(__dirname, 'config', 'passport'));

// Force model registration
require(path.join(__dirname, 'models', 'ContactMessage'));

const app = express();

// Enhanced CORS configuration for production and development
const allowedOrigins = [
  'http://localhost:3000',
  'https://fringe-obs.vercel.app',
  'https://fringe-obs-git-main-zeskys-projects.vercel.app', // Keep for compatibility
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration optimized for serverless
// Note: MemoryStore is not ideal for production serverless, but it's simple and works for this use case
app.use(session({
  secret: process.env.SESSION_SECRET || 'fringe_secret_development_only',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 2 * 60 * 60 * 1000, // Reduced to 2 hours for serverless
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'fringeSessionId'
}));

app.use(passport.initialize());
app.use(passport.session());

// **Import routes**
const home = require(path.join(__dirname, 'routes', 'home'));
const users = require(path.join(__dirname, 'routes', 'users'));
const auth = require(path.join(__dirname, 'routes', 'auth'));
const bookings = require(path.join(__dirname, 'routes', 'bookings'));
const ticketOrders = require(path.join(__dirname, 'routes', 'ticketOrders'));
const events = require(path.join(__dirname, 'routes', 'events'));
const paymentsRouter = require(path.join(__dirname, 'routes', 'payments'));
const notifications = require(path.join(__dirname, 'routes', 'notifications'));
const shopOrders = require(path.join(__dirname, 'routes', 'shopOrders'));
const merchandise = require(path.join(__dirname, 'routes', 'merchandise'));
const cartRoutes = require(path.join(__dirname, 'routes', 'cart'));
const contactMessages = require(path.join(__dirname, 'routes', 'contactMessages'));

// Port configuration - Updated to match frontend expectation
const port = process.env.PORT || 5002;

// Environment validation
const { MONGO_URL } = process.env;
if (!MONGO_URL) {
  console.error('❌ MONGO_URL environment variable is required');
  if (require.main === module) {
    process.exit(1);
  }
}

// **Logging setup - only for local development**
if (require.main === module) {
  // Create logs directories if they don't exist
  const logsDir = path.join(__dirname, 'Middlewares', 'Logs');
  const errorLogsDir = path.join(logsDir, 'Error logs');
  const successLogsDir = path.join(logsDir, 'Success logs');

  [logsDir, errorLogsDir, successLogsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // **Generating Logs Middleware and Rotating Logs Daily**
  const fileWriter = rt.getStream({ 
    filename: path.join(errorLogsDir, 'errors.log'), 
    frequency: 'daily', 
    verbose: false 
  });
  const successWriter = rt.getStream({ 
    filename: path.join(successLogsDir, 'success.log'), 
    frequency: 'daily', 
    verbose: false 
  });

  // **Separate success and error request logging**
  const skipSuccess = (req, res) => res.statusCode < 400;
  const skipError = (req, res) => res.statusCode >= 400;

  // **Error logging**
  app.use(morgan('combined', { skip: skipSuccess, stream: fileWriter }));

  // **Success logging**
  app.use(morgan('combined', { skip: skipError, stream: successWriter }));
} else {
  // For serverless, use simple console logging
  app.use(morgan('combined'));
}

// **Serverless-Optimized Database Connection**
// Cache the connection promise to reuse across function invocations
let cachedConnection = null;

async function connectToDatabase() {
  // If we have a cached connection that's still valid, reuse it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('🔄 Reusing existing MongoDB connection');
    return cachedConnection;
  }

  // If connection is connecting or disconnecting, wait for it
  if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
    console.log('⏳ Waiting for MongoDB connection...');
    await new Promise((resolve) => {
      const checkConnection = () => {
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 0) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  // Only create new connection if not connected
  if (mongoose.connection.readyState === 0) {
    console.log('🔌 Creating new MongoDB connection...');
    
    // Serverless-optimized connection options
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // Increased for cold starts
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 5, // Limit pool size for serverless
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000
    };

    try {
      cachedConnection = await mongoose.connect(MONGO_URL, connectionOptions);
      
      // Set Mongoose-specific options for serverless
      mongoose.set('bufferCommands', false);
      mongoose.set('bufferMaxEntries', 0);
      
      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${MONGO_URL.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas'}`);
      console.log(`🔗 Connection state: ${mongoose.connection.readyState}`);
      
      // Handle connection events for better monitoring
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('📱 MongoDB disconnected');
        cachedConnection = null;
      });
      
      return cachedConnection;
    } catch (err) {
      console.error('❌ Database connection error:', err.message);
      console.error('❌ MONGO_URL:', MONGO_URL ? 'Set' : 'Not set');
      
      // Reset cached connection on error
      cachedConnection = null;
      
      if (require.main === module) {
        process.exit(1);
      }
      throw err;
    }
  }

  return cachedConnection;
}

// **Middleware to ensure database connection before handling requests**
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('❌ Database connection middleware error:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const connectionState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      state: stateMap[connectionState],
      readyState: connectionState
    }
  });
});

// **Routes**
app.use('/api', home);  // Change base route to /api for Vercel compatibility
app.use('/api/users', users);
app.use('/api/auth', auth);
app.use('/api/bookings', bookings);
app.use('/api/ticketOrders', ticketOrders);  // Keep original case for existing routes
app.use('/api/ticketorders', ticketOrders);  // Add lowercase version for frontend compatibility
app.use('/api/events', events);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notifications);
app.use('/api/shopOrders', shopOrders);
app.use('/api/merchandise', merchandise);
app.use('/api/cart', cartRoutes);
app.use('/api/contactMessages', contactMessages);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// **Start server for local development**
if (require.main === module) {
  // For local development, initialize connection immediately
  connectToDatabase().then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server is running on port: ${port}`);
      console.log(`🌐 API Base URL: http://localhost:${port}/api`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  }).catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

// Export the app for serverless deployment
module.exports = app;

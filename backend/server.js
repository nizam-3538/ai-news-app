/**
 * Main Express server for AI News Aggregator
 * Handles routing, middleware, database connection, and graceful shutdown
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from the correct path
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import routes
const newsRoutes = require('./routes/news');
const analyzeRoutes = require('./routes/analyze');
const authRoutes = require('./routes/auth');
const passwordResetRoutes = require('./routes/password-reset');
const favoritesRoutes = require('./routes/favorites');

// Server configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// Trust proxy for deployment (Render, Heroku, etc.)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000'
    ];
    
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// --- API Routes ---
app.get('/', (req, res) => res.json({ ok: true, service: 'AI News Aggregator API' }));
app.use('/news', newsRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/auth', authRoutes);
app.use('/password-reset', passwordResetRoutes);
app.use('/favorites', favoritesRoutes);

// --- Error Handling ---
app.use('*', (req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

app.use((err, req, res, _next) => {
  console.error('Global error handler:', err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    ok: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// --- Database Connection ---
if (!MONGODB_URI) {
  console.warn('MongoDB URI not provided; authentication features will be disabled.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// --- Export the app for Vercel ---
// Vercel will automatically handle starting the server and listening for requests
module.exports = app;
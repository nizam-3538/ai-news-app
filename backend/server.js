/**
 * Main Express server for AI News Aggregator (TESTING WITHOUT MONGODB)
 */

const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose'); // Temporarily removed
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import routes (favorites removed)
const newsRoutes = require('./routes/news');
const analyzeRoutes = require('./routes/analyze');
const authRoutes = require('./routes/auth');
const passwordResetRoutes = require('./routes/password-reset');
// const favoritesRoutes = require('./routes/favorites'); // Temporarily removed

// Server configuration
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
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

// --- API Routes ---
app.get('/', (req, res) => res.json({ ok: true, service: 'AI News Aggregator API - MongoDB Disabled' }));
app.use('/news', newsRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/auth', authRoutes);
app.use('/password-reset', passwordResetRoutes);
// app.use('/favorites', favoritesRoutes); // Temporarily removed

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

// --- Database Connection (Temporarily Disabled) ---
console.log('MongoDB connection has been temporarily disabled for testing.');

// --- Export the app for Vercel ---
module.exports = app;
/**
 * Simple test server for news APIs without MongoDB dependency
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000; // Fixed port for frontend compatibility

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
} else {
  console.log('⚠️  MongoDB URI not configured - auth features will be limited');
}

// CORS middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Import news routes and analyze routes
const newsRoutes = require('./routes/news');
const analyzeRoutes = require('./routes/analyze');
const authRoutes = require('./routes/auth');
app.use('/news', newsRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    status: 'healthy',
    apis: {
      newsapi: !!process.env.NEWSAPI_KEY,
      gnews: !!process.env.GNEWS_API_KEY,
      newsdata: !!process.env.NEWSDATA_API_KEY
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📰 News APIs available:`);
  console.log(`   NewsAPI: ${process.env.NEWSAPI_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   GNews: ${process.env.GNEWS_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   NewsData: ${process.env.NEWSDATA_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`🌐 Visit http://localhost:${PORT} to test the news aggregator`);
});

module.exports = app;
const path = require('path');

// Load environment for serverless runtime (if present)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('../server');
const mongoose = require('mongoose');

// Production-grade configs (tunable via env)
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_CONNECT_TIMEOUT_MS = parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 3000; // wait this long for connect before continuing
const DB_SERVER_SELECTION_TIMEOUT_MS = parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000;
const DB_MAX_POOL_SIZE = parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 10;

// Connection state tracking to avoid duplicate connect attempts
let connectionPromise = null;

function isConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function maskMongoUri(uri) {
  try {
    if (!uri) return '';
    // show only host portion and hide credentials
    const noProto = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const parts = noProto.split('@');
    const hostPart = parts.length === 2 ? parts[1] : parts[0];
    const hostOnly = hostPart.split('/')[0];
    return `mongodb://${hostOnly}`;
  } catch (e) {
    return 'mongodb://<hidden>';
  }
}

async function ensureDb() {
  if (isConnected()) return true;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (NODE_ENV !== 'production') console.warn('MONGODB_URI not set; skipping DB connect (serverless wrapper).');
    return false;
  }

  // If a connection is already in progress, wait for it up to timeout
  if (connectionPromise) {
    try {
      await Promise.race([connectionPromise, new Promise((r) => setTimeout(r, DB_CONNECT_TIMEOUT_MS))]);
    } catch (err) {
      connectionPromise = null;
    }
    return isConnected();
  }

  // Start a new connection attempt and cache the promise; do not throw on failure
  connectionPromise = mongoose.connect(uri, {
    maxPoolSize: DB_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: DB_SERVER_SELECTION_TIMEOUT_MS,
  })
    .then(() => {
      if (NODE_ENV !== 'production') console.log('MongoDB connected (serverless wrapper).');
      connectionPromise = null;
      return true;
    })
    .catch((err) => {
      // Log masked URI and message — avoid exposing secrets
      const masked = maskMongoUri(uri);
      console.error(`Failed to connect to MongoDB at ${masked}:`, err && err.message ? err.message : err);
      connectionPromise = null;
      return false;
    });

  // Wait a short period for the connection to succeed; if not, continue and let the background attempt finish
  try {
    const result = await Promise.race([connectionPromise, new Promise((r) => setTimeout(r, DB_CONNECT_TIMEOUT_MS))]);
    return !!result && isConnected();
  } catch (e) {
    // on any unexpected error, don't crash the invocation
    return isConnected();
  }
}

// Lightweight health response (so Vercel health checks can run without full DB)
function healthResponse(res) {
  const dbState = mongoose.connection ? mongoose.connection.readyState : 0;
  const dbConnected = dbState === 1;
  const health = {
    ok: true,
    env: NODE_ENV,
    db: dbConnected ? 'connected' : 'disconnected',
  };
  // Use standard Node ServerResponse API so this works whether `res` is Express or raw HTTP
  try {
    res.setHeader('Content-Type', 'application/json');
  } catch (e) {
    // ignore if setHeader isn't available
  }
  try {
    res.statusCode = dbConnected ? 200 : 503;
  } catch (e) {
    // ignore
  }
  try {
    res.end(JSON.stringify(health));
  } catch (e) {
    // fallback
    try { res.write(JSON.stringify(health)); res.end(); } catch (_) { /* noop */ }
  }
}

// Vercel/serverless handler
module.exports = async (req, res) => {
  try {
    // If this is a health check, respond quickly without forcing a DB connect
    const url = req.url || (req.originalUrl || '/');
    if (url === '/health' || url === '/api/health') {
      // Trigger a non-blocking ensureDb to warm connection, but respond immediately with current state
      ensureDb().catch(() => {});
      return healthResponse(res);
    }

    // Try to ensure DB is connected (short wait) before delegating to app
    await ensureDb();

    // Delegate to the Express app; wrap in try/catch because app(req,res) may throw synchronously in rare cases
    try {
      return app(req, res);
    } catch (innerErr) {
      console.error('Express app threw synchronously in serverless handler:', innerErr && innerErr.stack ? innerErr.stack : innerErr);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
      }
      return;
    }
  } catch (err) {
    // This should be rare — respond safely and do not crash the runtime
    console.error('Serverless handler unrecoverable error:', err && err.stack ? err.stack : err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
    }
  }
};

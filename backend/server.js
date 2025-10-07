const express = require('express');
const app = express();

// A simple test route to confirm the server is running
app.get('/api/test', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for this test
  res.status(200).json({ message: 'Success! The test server is running.' });
});

// A catch-all to see if other routes are being hit
app.use('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for this test
  res.status(404).json({ message: 'Route not found on test server.' });
});

// Export the app for Vercel
module.exports = app;
/**
 * Express Application Setup
 */

const express = require('express');
const cors = require('cors');
const mailRoutes = require('./routes/mail.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Prevent HTTP client response caching (crucial for ESP32 polling)
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// API Routes
app.use('/api', mailRoutes);

// Fallback 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[Application Error]:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;

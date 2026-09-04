/**
 * Server Entry Point
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const { autoSeedIfEmpty } = require('./utils/seeder');

// Connect to Database & Auto-Seed mock data if empty
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    autoSeedIfEmpty();
  });
}

// Security & Utility Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for local CDN / Chart.js in demo UI
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Endpoints
app.use('/api', apiRoutes);

// Fallback for SPA Navigation
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server if not imported by tests
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Restaurant Table Reservation & Food Ordering System  `);
    console.log(` Server active on: http://localhost:${PORT}             `);
    console.log(` Environment:     ${process.env.NODE_ENV || 'development'} `);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('\nReceived kill signal, shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;

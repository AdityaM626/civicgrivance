const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { securityHeaders } = require('./middleware/security.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const path = require('path');

const app = express();

// Global Security & Parsing Middlewares
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets from public/ directory
app.use(express.static(path.join(__dirname, '../public')));

// Base API Version 1 Router
app.use('/api/v1', apiRoutes);

// Root route - serve frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all 404 handler for undefined routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

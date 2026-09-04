const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { securityHeaders } = require('./middleware/security.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Global Security & Parsing Middlewares
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API Version 1 Router
app.use('/api/v1', apiRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

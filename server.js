const dotenv = require('dotenv');

// Load environment variables before initializing application code
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initJobs } = require('./src/jobs');

const PORT = process.env.PORT || 5000;

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`[Server] Municipal Civic Grievance API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  // Initialize background jobs
  initJobs();
});

// Connect to MongoDB asynchronously
connectDB().catch((err) => {
  console.error(`[Startup Warning] Server started, but MongoDB connection failed: ${err.message}`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception] ${err.name}: ${err.message}`);
  process.exit(1);
});

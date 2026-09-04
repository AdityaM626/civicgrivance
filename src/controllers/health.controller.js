/**
 * Health check controller
 * GET /api/v1/health
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Municipal Civic Grievance API is running',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};

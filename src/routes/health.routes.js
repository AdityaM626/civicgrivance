const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/health.controller');

/**
 * @route   GET /api/v1/health
 * @desc    Check API health and operational status
 * @access  Public
 */
router.get('/', getHealthStatus);

module.exports = router;

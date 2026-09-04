const express = require('express');
const router = express.Router();

const publicComplaintController = require('../controllers/publicComplaint.controller');
const { validate } = require('../middleware/validation.middleware');
const { rateLimit } = require('../middleware/rateLimit.middleware');
const { lookupComplaintValidation } = require('../validators/public.validator');

// Rate limiting for public status lookup: 100 requests per 15 minutes per IP
const publicTrackerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many public status lookup requests from this IP address. Please try again after 15 minutes.'
});

/**
 * Public Complaint Status Tracking Endpoint
 * GET /api/v1/public/complaints/:referenceCode
 * NO JWT AUTHENTICATION REQUIRED
 */
router.get(
  '/complaints/:referenceCode',
  publicTrackerRateLimiter,
  validate(lookupComplaintValidation),
  publicComplaintController.lookupComplaintStatus
);

module.exports = router;

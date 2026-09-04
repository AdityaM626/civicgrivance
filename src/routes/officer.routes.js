const express = require('express');
const router = express.Router();

const officerController = require('../controllers/officer.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Officer Queue Endpoints
router.get(
  '/complaints',
  authenticateToken,
  authorizeRoles('OFFICER'),
  officerController.getMyQueue
);

router.get(
  '/complaints/:id',
  authenticateToken,
  authorizeRoles('OFFICER'),
  officerController.getAssignedComplaintById
);

module.exports = router;

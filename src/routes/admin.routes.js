const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Admin SLA & Escalation Management Endpoints
router.post(
  '/sla/check',
  authenticateToken,
  authorizeRoles('ADMIN'),
  adminController.triggerSlaCheck
);

router.get(
  '/escalations',
  authenticateToken,
  authorizeRoles('ADMIN'),
  adminController.getEscalations
);

router.get(
  '/escalations/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  adminController.getEscalationById
);

// Admin Operational Complaint Endpoints
router.get(
  '/complaints',
  authenticateToken,
  authorizeRoles('ADMIN'),
  adminController.getAllComplaints
);

router.get(
  '/complaints/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  adminController.getComplaintById
);

module.exports = router;

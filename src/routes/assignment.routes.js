const express = require('express');
const router = express.Router();

const assignmentController = require('../controllers/assignment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { assignValidation, reassignValidation } = require('../validators/assignment.validator');

// Admin Officer Assignment Endpoints
router.patch(
  '/complaints/:complaintId',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(assignValidation),
  assignmentController.assignComplaint
);

router.patch(
  '/complaints/:complaintId/reassign',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(reassignValidation),
  assignmentController.reassignComplaint
);

router.get(
  '/departments/:departmentId/officers',
  authenticateToken,
  authorizeRoles('ADMIN'),
  assignmentController.getDepartmentOfficers
);

module.exports = router;

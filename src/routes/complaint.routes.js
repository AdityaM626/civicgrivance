const express = require('express');
const router = express.Router();

const complaintController = require('../controllers/complaint.controller');
const resolutionController = require('../controllers/resolution.controller');
const feedbackController = require('../controllers/feedback.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { fileComplaintValidation } = require('../validators/complaint.validator');
const { updateStatusValidation } = require('../validators/status.validator');
const { resolveComplaintValidation } = require('../validators/resolution.validator');
const { submitFeedbackValidation } = require('../validators/feedback.validator');
const { reopenComplaintValidation } = require('../validators/reopen.validator');

// Citizen Complaint Filing & Retrieval Routes
router.post(
  '/',
  authenticateToken,
  authorizeRoles('CITIZEN'),
  validate(fileComplaintValidation),
  complaintController.fileComplaint
);

router.get(
  '/my',
  authenticateToken,
  authorizeRoles('CITIZEN'),
  complaintController.getMyComplaints
);

// Citizen Feedback, Reopen & Closure Routes
router.post(
  '/:complaintId/feedback',
  authenticateToken,
  authorizeRoles('CITIZEN'),
  validate(submitFeedbackValidation),
  feedbackController.submitFeedback
);

router.get(
  '/:complaintId/feedback',
  authenticateToken,
  feedbackController.getFeedback
);

router.post(
  '/:complaintId/reopen',
  authenticateToken,
  authorizeRoles('CITIZEN'),
  validate(reopenComplaintValidation),
  complaintController.reopenComplaint
);

router.post(
  '/:complaintId/close',
  authenticateToken,
  authorizeRoles('CITIZEN'),
  complaintController.closeComplaint
);

// Officer Status & Resolution Routes
router.patch(
  '/:complaintId/resolve',
  authenticateToken,
  authorizeRoles('OFFICER'),
  validate(resolveComplaintValidation),
  resolutionController.resolveComplaint
);

router.patch(
  '/:complaintId/status',
  authenticateToken,
  authorizeRoles('OFFICER'),
  validate(updateStatusValidation),
  complaintController.updateStatus
);

// Single Complaint Detail View
router.get(
  '/:id',
  authenticateToken,
  complaintController.getComplaintById
);

module.exports = router;

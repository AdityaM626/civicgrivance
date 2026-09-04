const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { getReportValidation, getTrendReportValidation } = require('../validators/report.validator');

// All reporting endpoints require authentication & role authorization (ADMIN or OFFICER)
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'OFFICER'));

router.get('/overview', validate(getReportValidation), reportController.getOverview);
router.get('/wards', validate(getReportValidation), reportController.getWards);
router.get('/departments', validate(getReportValidation), reportController.getDepartments);
router.get('/categories', validate(getReportValidation), reportController.getCategories);
router.get('/status', validate(getReportValidation), reportController.getStatus);
router.get('/priorities', validate(getReportValidation), reportController.getPriorities);
router.get('/sla', validate(getReportValidation), reportController.getSla);
router.get('/escalations', validate(getReportValidation), reportController.getEscalations);
router.get('/resolution', validate(getReportValidation), reportController.getResolution);
router.get('/trends', validate(getTrendReportValidation), reportController.getTrends);

module.exports = router;

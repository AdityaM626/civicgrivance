const express = require('express');
const router = express.Router();

// Route imports
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const departmentRoutes = require('./department.routes');
const complaintRoutes = require('./complaint.routes');
const assignmentRoutes = require('./assignment.routes');
const officerRoutes = require('./officer.routes');
const adminRoutes = require('./admin.routes');
const publicComplaintRoutes = require('./publicComplaint.routes');
const reportRoutes = require('./report.routes');

// Base API v1 Routes Mounting
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/complaints', complaintRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/officer', officerRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicComplaintRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

const adminService = require('../services/admin.service');
const slaService = require('../services/sla.service');

/**
 * Get all complaints for operational administration (ADMIN only)
 * GET /api/v1/admin/complaints
 */
const getAllComplaints = async (req, res, next) => {
  try {
    const result = await adminService.getAdminComplaints(req.query);

    res.status(200).json({
      success: true,
      message: 'Complaints list retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Get admin complaint details by ID (ADMIN only)
 * GET /api/v1/admin/complaints/:id
 */
const getComplaintById = async (req, res, next) => {
  try {
    const result = await adminService.getAdminComplaintById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin complaint details retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Manually trigger SLA check and process escalations (ADMIN only)
 * POST /api/v1/admin/sla/check
 */
const triggerSlaCheck = async (req, res, next) => {
  try {
    const result = await slaService.processSlaEscalations();

    res.status(200).json({
      success: true,
      message: 'SLA check completed successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * List escalations with filters (ADMIN only)
 * GET /api/v1/admin/escalations
 */
const getEscalations = async (req, res, next) => {
  try {
    const result = await slaService.getEscalations(req.query);

    res.status(200).json({
      success: true,
      message: 'Escalations retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Get single escalation details by ID (ADMIN only)
 * GET /api/v1/admin/escalations/:id
 */
const getEscalationById = async (req, res, next) => {
  try {
    const escalation = await slaService.getEscalationById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Escalation details retrieved successfully',
      data: {
        escalation
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  getAllComplaints,
  getComplaintById,
  triggerSlaCheck,
  getEscalations,
  getEscalationById
};

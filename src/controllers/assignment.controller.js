const assignmentService = require('../services/assignment.service');

/**
 * Assign complaint to officer (ADMIN only)
 * PATCH /api/v1/assignments/complaints/:complaintId
 */
const assignComplaint = async (req, res, next) => {
  try {
    const { officerId } = req.body;
    const complaint = await assignmentService.assignComplaintToOfficer(
      req.params.complaintId,
      officerId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully',
      data: {
        complaint
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Reassign complaint to another officer (ADMIN only)
 * PATCH /api/v1/assignments/complaints/:complaintId/reassign
 */
const reassignComplaint = async (req, res, next) => {
  try {
    const { officerId, reason } = req.body;
    const complaint = await assignmentService.reassignComplaint(
      req.params.complaintId,
      officerId,
      reason,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Complaint reassigned successfully',
      data: {
        complaint
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Get active officers belonging to a department (ADMIN only)
 * GET /api/v1/assignments/departments/:departmentId/officers
 */
const getDepartmentOfficers = async (req, res, next) => {
  try {
    const officers = await assignmentService.getDepartmentOfficers(req.params.departmentId);

    res.status(200).json({
      success: true,
      message: 'Department officers retrieved successfully',
      data: {
        officers
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  assignComplaint,
  reassignComplaint,
  getDepartmentOfficers
};

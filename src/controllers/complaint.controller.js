const complaintService = require('../services/complaint.service');
const statusService = require('../services/status.service');

/**
 * File a new complaint (CITIZEN only)
 * POST /api/v1/complaints
 */
const fileComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.fileComplaint(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Complaint filed successfully',
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
 * Get complaints filed by logged-in citizen
 * GET /api/v1/complaints/my
 */
const getMyComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.getCitizenComplaints(req.user.id, req.query);

    res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Get single complaint by ID
 * GET /api/v1/complaints/:id
 */
const getComplaintById = async (req, res, next) => {
  try {
    const result = await complaintService.getComplaintById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: 'Complaint details retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Update complaint status (OFFICER only)
 * PATCH /api/v1/complaints/:complaintId/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const complaint = await statusService.updateComplaintStatus(
      req.params.complaintId,
      status,
      req.user,
      remarks
    );

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
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
 * Reopen complaint (CITIZEN only)
 * POST /api/v1/complaints/:complaintId/reopen
 */
const reopenComplaint = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { reopenReason } = req.body;

    const complaint = await complaintService.reopenComplaint(complaintId, req.user, { reopenReason });

    res.status(200).json({
      success: true,
      message: 'Complaint reopened successfully',
      data: { complaint }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Close complaint (CITIZEN only)
 * POST /api/v1/complaints/:complaintId/close
 */
const closeComplaint = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { remarks } = req.body;

    const complaint = await complaintService.closeComplaint(complaintId, req.user, { remarks });

    res.status(200).json({
      success: true,
      message: 'Complaint closed successfully',
      data: { complaint }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  fileComplaint,
  getMyComplaints,
  getComplaintById,
  updateStatus,
  reopenComplaint,
  closeComplaint
};

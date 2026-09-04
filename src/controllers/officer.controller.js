const officerService = require('../services/officer.service');

/**
 * Get officer's assigned complaint queue
 * GET /api/v1/officer/complaints
 */
const getMyQueue = async (req, res, next) => {
  try {
    const result = await officerService.getAssignedComplaints(req.user, req.query);

    res.status(200).json({
      success: true,
      message: 'Assigned complaint queue retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Get assigned complaint details by ID
 * GET /api/v1/officer/complaints/:id
 */
const getAssignedComplaintById = async (req, res, next) => {
  try {
    const result = await officerService.getAssignedComplaintById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: 'Assigned complaint details retrieved successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  getMyQueue,
  getAssignedComplaintById
};

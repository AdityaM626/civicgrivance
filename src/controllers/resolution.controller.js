const resolutionService = require('../services/resolution.service');

/**
 * Submit resolution proof & resolve complaint (OFFICER only)
 * PATCH /api/v1/complaints/:complaintId/resolve
 */
const resolveComplaint = async (req, res, next) => {
  try {
    const { notes, photoUrls } = req.body;
    const result = await resolutionService.resolveComplaint(
      req.params.complaintId,
      req.user,
      { notes, photoUrls }
    );

    res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully with proof notes',
      data: result
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  resolveComplaint
};

const publicComplaintService = require('../services/publicComplaint.service');

/**
 * Controller: Public Complaint Status Lookup by Reference Code
 * GET /api/v1/public/complaints/:referenceCode
 */
const lookupComplaintStatus = async (req, res, next) => {
  try {
    const { referenceCode } = req.params;

    const publicData = await publicComplaintService.getPublicComplaintStatus(referenceCode);

    res.status(200).json({
      success: true,
      data: publicData
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};

module.exports = {
  lookupComplaintStatus
};

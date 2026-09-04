const feedbackService = require('../services/feedback.service');

/**
 * Controller: Submit citizen feedback for a complaint
 * POST /api/v1/complaints/:complaintId/feedback
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { rating, comment } = req.body;

    const feedback = await feedbackService.submitFeedback(complaintId, req.user, { rating, comment });

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get feedback for a complaint
 * GET /api/v1/complaints/:complaintId/feedback
 */
const getFeedback = async (req, res, next) => {
  try {
    const { complaintId } = req.params;

    const feedback = await feedbackService.getFeedbackByComplaintId(complaintId, req.user);

    res.status(200).json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getFeedback
};

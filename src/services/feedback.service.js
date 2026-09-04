const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');

/**
 * Submit or update citizen feedback for a complaint (CITIZEN only)
 */
const submitFeedback = async (complaintId, citizenUser, { rating, comment }) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Ownership Guard: Only the citizen who filed the complaint can submit feedback
  if (complaint.citizenId.toString() !== citizenUser.id.toString()) {
    const error = new Error('You do not have permission to submit feedback for this complaint');
    error.statusCode = 403;
    throw error;
  }

  // Status Guard: Feedback can only be submitted for RESOLVED or CLOSED complaints
  if (!['RESOLVED', 'CLOSED'].includes(complaint.status)) {
    const error = new Error(`Feedback can only be submitted for RESOLVED or CLOSED complaints. Current status: ${complaint.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Upsert feedback document
  let feedback = await Feedback.findOne({ complaintId: complaint._id, citizenId: citizenUser.id });
  if (feedback) {
    feedback.rating = rating;
    feedback.comment = comment ? comment.trim() : '';
    await feedback.save();
  } else {
    feedback = await Feedback.create({
      complaintId: complaint._id,
      citizenId: citizenUser.id,
      rating,
      comment: comment ? comment.trim() : ''
    });
  }

  return feedback;
};

/**
 * Retrieve feedback for a specific complaint with authorization checks
 */
const getFeedbackByComplaintId = async (complaintId, requestingUser) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Guards
  if (requestingUser.role === 'CITIZEN') {
    if (complaint.citizenId.toString() !== requestingUser.id.toString()) {
      const error = new Error('You do not have permission to view feedback for this complaint');
      error.statusCode = 403;
      throw error;
    }
  } else if (requestingUser.role === 'OFFICER') {
    const deptMatch = requestingUser.departmentId &&
      complaint.departmentId.toString() === requestingUser.departmentId.toString();
    const officerMatch = complaint.assignedOfficerId &&
      complaint.assignedOfficerId.toString() === requestingUser.id.toString();

    if (!deptMatch && !officerMatch) {
      const error = new Error('You do not have permission to view feedback for this complaint');
      error.statusCode = 403;
      throw error;
    }
  }

  const feedback = await Feedback.findOne({ complaintId: complaint._id })
    .populate('citizenId', 'name email');

  return feedback;
};

module.exports = {
  submitFeedback,
  getFeedbackByComplaintId
};

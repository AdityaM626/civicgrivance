const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');

/**
 * Phase 5 Centralized Status Transition Matrix
 * Explicitly defines permitted status state transitions
 */
const TRANSITION_MATRIX = {
  FILED: ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS']
};

/**
 * Update complaint status (OFFICER only) with transition validation & audit logging
 */
const updateComplaintStatus = async (complaintId, newStatus, requestingUser, remarks) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Officer Authorization Guard: Must belong to same department
  if (requestingUser.role === 'OFFICER') {
    const deptMatch = requestingUser.departmentId && 
      complaint.departmentId.toString() === requestingUser.departmentId.toString();

    if (!deptMatch) {
      const error = new Error('You do not have permission to modify status for complaints outside your department');
      error.statusCode = 403;
      throw error;
    }

    // Auto-assign officer to unassigned department complaint when starting work
    if (!complaint.assignedOfficerId) {
      complaint.assignedOfficerId = requestingUser.id;
    }
  }

  // Validate state transition against matrix
  const allowedTransitions = TRANSITION_MATRIX[complaint.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    const error = new Error(`Invalid complaint status transition from ${complaint.status} to ${newStatus}`);
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = complaint.status;
  complaint.status = newStatus;
  await complaint.save();

  // Create audit trail record
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus,
    newStatus,
    changedBy: requestingUser.id,
    remarks: remarks.trim()
  });

  await complaint.populate('assignedOfficerId', 'name email phone');
  await complaint.populate('departmentId', 'name code');

  return complaint;
};

module.exports = {
  updateComplaintStatus,
  TRANSITION_MATRIX
};

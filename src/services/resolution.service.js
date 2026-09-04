const Complaint = require('../models/Complaint');
const ResolutionProof = require('../models/ResolutionProof');
const StatusHistory = require('../models/StatusHistory');
const Escalation = require('../models/Escalation');

/**
 * Submit resolution proof & transition complaint to RESOLVED state (OFFICER only)
 */
const resolveComplaint = async (complaintId, officerUser, { notes, photoUrls }) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Officer Ownership Guard
  if (officerUser.role === 'OFFICER') {
    const deptMatch = officerUser.departmentId && 
      complaint.departmentId.toString() === officerUser.departmentId.toString();

    const officerMatch = complaint.assignedOfficerId && 
      complaint.assignedOfficerId.toString() === officerUser.id.toString();

    if (!deptMatch || !officerMatch) {
      const error = new Error('You do not have permission to resolve this complaint');
      error.statusCode = 403;
      throw error;
    }
  }

  // Workflow Status Check: Only IN_PROGRESS complaints can be resolved
  if (complaint.status !== 'IN_PROGRESS') {
    const error = new Error(`Only complaints in IN_PROGRESS status can be resolved. Current status: ${complaint.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Determine resolution cycle & guard against duplicates within the same cycle
  const existingProofsCount = await ResolutionProof.countDocuments({ complaintId: complaint._id });
  const resolutionCycle = existingProofsCount + 1;

  const existingProofInCycle = await ResolutionProof.findOne({ complaintId: complaint._id, resolutionCycle });
  if (existingProofInCycle) {
    const error = new Error(`Resolution proof has already been submitted for resolution cycle ${resolutionCycle}`);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // 1. Create ResolutionProof document
  const resolutionProof = await ResolutionProof.create({
    complaintId: complaint._id,
    officerId: officerUser.id,
    notes: notes.trim(),
    photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
    resolutionCycle,
    resolvedAt: now
  });

  // 2. Update Complaint state
  const previousStatus = complaint.status;
  complaint.status = 'RESOLVED';
  complaint.closedAt = now;
  await complaint.save();

  // 3. Create audit log in StatusHistory
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus,
    newStatus: 'RESOLVED',
    changedBy: officerUser.id,
    remarks: `Resolved by officer: ${notes.trim()}`
  });

  // 4. Auto-close any open escalation records for this complaint
  await Escalation.updateMany(
    { complaintId: complaint._id, status: 'OPEN' },
    { status: 'RESOLVED', resolvedAt: now }
  );

  await complaint.populate('assignedOfficerId', 'name email phone');
  await complaint.populate('departmentId', 'name code');

  return {
    complaint,
    resolutionProof
  };
};

module.exports = {
  resolveComplaint
};

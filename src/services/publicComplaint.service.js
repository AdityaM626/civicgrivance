const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const ResolutionProof = require('../models/ResolutionProof');
const { formatPublicComplaint } = require('../utils/publicComplaintFormatter');

/**
 * Public Complaint Status Lookup Service
 * Retrieves public-safe complaint progress details by reference code (No Auth Required)
 */
const getPublicComplaintStatus = async (referenceCode) => {
  // Normalize reference code to uppercase
  const normalizedCode = referenceCode.trim().toUpperCase();

  // Find complaint by indexed reference code (Populating ONLY department name)
  const complaint = await Complaint.findOne({ referenceCode: normalizedCode })
    .populate('departmentId', 'name');

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Fetch status history timeline
  const statusHistory = await StatusHistory.find({ complaintId: complaint._id })
    .select('newStatus createdAt')
    .sort({ createdAt: 1 });

  // Fetch latest resolution record if complaint is RESOLVED or CLOSED
  let latestResolution = null;
  if (['RESOLVED', 'CLOSED'].includes(complaint.status)) {
    latestResolution = await ResolutionProof.findOne({ complaintId: complaint._id })
      .sort({ resolutionCycle: -1, createdAt: -1 });
  }

  // Compute public-safe SLA status (ON_TIME vs OVERDUE)
  let slaStatus = 'ON_TIME';
  if (complaint.slaDueAt && new Date(complaint.slaDueAt) < new Date() && !['RESOLVED', 'CLOSED'].includes(complaint.status)) {
    slaStatus = 'OVERDUE';
  }

  // Transform and return strict public DTO
  return formatPublicComplaint(complaint, statusHistory, latestResolution, slaStatus);
};

module.exports = {
  getPublicComplaintStatus
};

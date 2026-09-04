const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const ResolutionProof = require('../models/ResolutionProof');
const slaService = require('./sla.service');

/**
 * Get list of complaints with operational filters (ADMIN only)
 */
const getAdminComplaints = async (queryParams = {}) => {
  const filter = {};

  if (queryParams.departmentId) filter.departmentId = queryParams.departmentId;
  if (queryParams.assignedOfficerId) filter.assignedOfficerId = queryParams.assignedOfficerId;
  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.category) filter.category = queryParams.category;
  if (queryParams.ward) filter.ward = queryParams.ward;
  if (queryParams.priority) filter.priority = queryParams.priority;
  if (queryParams.escalationLevel !== undefined) filter.escalationLevel = parseInt(queryParams.escalationLevel, 10);

  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Complaint.countDocuments(filter);
  const complaints = await Complaint.find(filter)
    .populate('departmentId', 'name code')
    .populate('assignedOfficerId', 'name email phone')
    .populate('citizenId', 'name email phone ward')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Compute dynamic SLA status info for each complaint
  const formatted = complaints.map((complaint) => {
    const obj = complaint.toObject();
    obj.sla = slaService.calculateSlaInfo(complaint);
    return obj;
  });

  return {
    complaints: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get complaint details with complete status timeline & resolution proof (ADMIN only)
 */
const getAdminComplaintById = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId)
    .populate('departmentId', 'name code description')
    .populate('assignedOfficerId', 'name email phone')
    .populate('citizenId', 'name email phone ward');

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const statusHistory = await StatusHistory.find({ complaintId: complaint._id })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 });

  const resolutionProof = await ResolutionProof.findOne({ complaintId: complaint._id })
    .populate('officerId', 'name email phone');

  const slaInfo = slaService.calculateSlaInfo(complaint);

  return {
    complaint,
    sla: slaInfo,
    statusHistory,
    resolutionProof
  };
};

module.exports = {
  getAdminComplaints,
  getAdminComplaintById
};

const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');

/**
 * Retrieve complaints assigned to the logged-in field officer
 */
const getAssignedComplaints = async (officerUser, queryParams = {}) => {
  if (!officerUser.departmentId) {
    const error = new Error('Officer account is not associated with any department');
    error.statusCode = 400;
    throw error;
  }

  // Enforce departmentId from authenticated officer context
  const filter = {
    departmentId: officerUser.departmentId,
    $or: [
      { assignedOfficerId: officerUser.id },
      { assignedOfficerId: null }
    ]
  };

  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.category) filter.category = queryParams.category;
  if (queryParams.ward) filter.ward = queryParams.ward;
  if (queryParams.priority) filter.priority = queryParams.priority;

  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Complaint.countDocuments(filter);
  const complaints = await Complaint.find(filter)
    .populate('departmentId', 'name code')
    .populate('citizenId', 'name email phone ward')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    complaints,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single assigned complaint details for officer
 */
const getAssignedComplaintById = async (complaintId, officerUser) => {
  const complaint = await Complaint.findById(complaintId)
    .populate('departmentId', 'name code')
    .populate('citizenId', 'name email phone ward');

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  const deptMatch = officerUser.departmentId && 
    complaint.departmentId._id.toString() === officerUser.departmentId.toString();

  const officerMatch = complaint.assignedOfficerId && 
    complaint.assignedOfficerId.toString() === officerUser.id.toString();

  if (!deptMatch || !officerMatch) {
    const error = new Error('You do not have permission to access this assigned complaint');
    error.statusCode = 403;
    throw error;
  }

  // Load chronological status history timeline
  const statusHistory = await StatusHistory.find({ complaintId: complaint._id })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 });

  return {
    complaint,
    statusHistory
  };
};

module.exports = {
  getAssignedComplaints,
  getAssignedComplaintById
};

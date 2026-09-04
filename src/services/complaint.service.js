const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const ResolutionProof = require('../models/ResolutionProof');
const Feedback = require('../models/Feedback');
const routingService = require('./routing.service');
const { generateReferenceCode } = require('../utils/referenceCode');

/**
 * Format complaint document into standardized API response structure
 */
const formatComplaintResponse = (complaint) => {
  const dept = complaint.departmentId;
  const deptObj = typeof dept === 'object' && dept !== null
    ? { id: dept._id, name: dept.name, code: dept.code }
    : { id: dept };

  const officer = complaint.assignedOfficerId;
  const officerObj = typeof officer === 'object' && officer !== null
    ? { id: officer._id, name: officer.name, email: officer.email, phone: officer.phone || null }
    : officer ? { id: officer } : null;

  return {
    id: complaint._id,
    referenceCode: complaint.referenceCode,
    category: complaint.category,
    department: deptObj,
    assignedOfficer: officerObj,
    ward: complaint.ward,
    area: complaint.area,
    description: complaint.description,
    location: complaint.location,
    priority: complaint.priority,
    status: complaint.status,
    slaHours: complaint.slaHours,
    slaDueAt: complaint.slaDueAt,
    escalationLevel: complaint.escalationLevel,
    closedAt: complaint.closedAt,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt
  };
};

/**
 * File a new civic complaint (CITIZEN only)
 */
const fileComplaint = async (citizenId, complaintData) => {
  // 1. Invoke Automatic Routing Engine to map category to department & SLA
  const routed = await routingService.routeComplaint(complaintData.category);

  // 2. Calculate SLA Due Date
  const slaDueAt = new Date(Date.now() + routed.slaHours * 60 * 60 * 1000);

  // 3. Generate unique reference code
  const referenceCode = await generateReferenceCode();

  // 4. Create Complaint document (Forcing citizenId, status = FILED)
  const complaint = await Complaint.create({
    referenceCode,
    citizenId,
    category: routed.category,
    departmentId: routed.departmentId,
    ward: complaintData.ward.trim(),
    area: complaintData.area.trim(),
    description: complaintData.description.trim(),
    location: complaintData.location || {},
    priority: complaintData.priority || 'MEDIUM',
    status: 'FILED',
    assignedOfficerId: null,
    slaHours: routed.slaHours,
    slaDueAt,
    escalationLevel: 0,
    closedAt: null
  });

  // 5. Create initial audit log in StatusHistory
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus: 'FILED',
    newStatus: 'FILED',
    changedBy: citizenId,
    remarks: 'Complaint filed by citizen'
  });

  await complaint.populate('departmentId', 'name code');

  return formatComplaintResponse(complaint);
};

/**
 * Get complaints filed by the authenticated citizen
 */
const getCitizenComplaints = async (citizenId, queryParams = {}) => {
  const filter = { citizenId };

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
    .populate('assignedOfficerId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    complaints: complaints.map(formatComplaintResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single complaint by ID with authorization check, status history timeline, resolution proofs, & feedback
 */
const getComplaintById = async (complaintId, requestingUser) => {
  const complaint = await Complaint.findById(complaintId)
    .populate('departmentId', 'name code')
    .populate('assignedOfficerId', 'name email phone')
    .populate('citizenId', 'name email phone ward');

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: Citizens can view only their own complaints
  if (requestingUser.role === 'CITIZEN') {
    const citizenDocId = typeof complaint.citizenId === 'object' && complaint.citizenId !== null
      ? complaint.citizenId._id.toString()
      : complaint.citizenId.toString();

    if (citizenDocId !== requestingUser.id.toString()) {
      const error = new Error('You do not have permission to view this complaint');
      error.statusCode = 403;
      throw error;
    }
  }

  // Fetch chronological status history audit trail
  const statusHistory = await StatusHistory.find({ complaintId: complaint._id })
    .populate('changedBy', 'name role')
    .sort({ createdAt: 1 });

  // Fetch resolution proof history across cycles
  const resolutionProofs = await ResolutionProof.find({ complaintId: complaint._id })
    .populate('officerId', 'name email')
    .sort({ resolutionCycle: 1, createdAt: 1 });

  // Fetch feedback record if available
  const feedback = await Feedback.findOne({ complaintId: complaint._id })
    .populate('citizenId', 'name email');

  return {
    complaint: formatComplaintResponse(complaint),
    statusHistory,
    resolutionProofs,
    feedback
  };
};

/**
 * Reopen a complaint (CITIZEN only - complaint owner)
 */
const reopenComplaint = async (complaintId, citizenUser, { reopenReason }) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Ownership Guard
  if (complaint.citizenId.toString() !== citizenUser.id.toString()) {
    const error = new Error('You do not have permission to reopen this complaint');
    error.statusCode = 403;
    throw error;
  }

  // Status Guard: Only RESOLVED or CLOSED complaints can be reopened
  if (!['RESOLVED', 'CLOSED'].includes(complaint.status)) {
    const error = new Error(`Only complaints in RESOLVED or CLOSED status can be reopened. Current status: ${complaint.status}`);
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = complaint.status;
  complaint.status = 'REOPENED';
  complaint.closedAt = null;
  // Preserving original SLA clock (slaDueAt and escalationLevel remain invariant)
  await complaint.save();

  // Create Audit Log in StatusHistory
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus,
    newStatus: 'REOPENED',
    changedBy: citizenUser.id,
    remarks: `Reopened by citizen: ${reopenReason.trim()}`
  });

  // Flag feedback record as reopened if present
  await Feedback.updateOne({ complaintId: complaint._id }, { reopened: true });

  await complaint.populate('departmentId', 'name code');
  await complaint.populate('assignedOfficerId', 'name email phone');

  return formatComplaintResponse(complaint);
};

/**
 * Close a complaint (CITIZEN only - complaint owner)
 */
const closeComplaint = async (complaintId, citizenUser, { remarks }) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  // Ownership Guard
  if (complaint.citizenId.toString() !== citizenUser.id.toString()) {
    const error = new Error('You do not have permission to close this complaint');
    error.statusCode = 403;
    throw error;
  }

  // Status Guard: Only RESOLVED complaints can be closed by citizen
  if (complaint.status !== 'RESOLVED') {
    const error = new Error(`Only complaints in RESOLVED status can be closed. Current status: ${complaint.status}`);
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = complaint.status;
  complaint.status = 'CLOSED';
  complaint.closedAt = new Date();
  await complaint.save();

  // Create Audit Log in StatusHistory
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus,
    newStatus: 'CLOSED',
    changedBy: citizenUser.id,
    remarks: remarks ? remarks.trim() : 'Closed by citizen after resolution'
  });

  await complaint.populate('departmentId', 'name code');
  await complaint.populate('assignedOfficerId', 'name email phone');

  return formatComplaintResponse(complaint);
};

module.exports = {
  fileComplaint,
  getCitizenComplaints,
  getComplaintById,
  reopenComplaint,
  closeComplaint
};

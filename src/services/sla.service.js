const Complaint = require('../models/Complaint');
const Escalation = require('../models/Escalation');

/**
 * Dynamically compute SLA status and remaining time for a complaint
 */
const calculateSlaInfo = (complaint) => {
  const now = new Date();
  const due = new Date(complaint.slaDueAt);
  const diffMs = due - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  const activeStatuses = ['FILED', 'ASSIGNED', 'IN_PROGRESS'];
  const isUnresolved = activeStatuses.includes(complaint.status);
  const isOverdue = isUnresolved && now > due;

  return {
    slaHours: complaint.slaHours,
    slaDueAt: complaint.slaDueAt,
    isOverdue,
    slaStatus: isOverdue ? 'OVERDUE' : 'ON_TIME',
    remainingMinutes: diffMinutes,
    overdueMinutes: isOverdue ? Math.abs(diffMinutes) : 0
  };
};

/**
 * Process SLA breaches and create idempotent Escalation records
 */
const processSlaEscalations = async () => {
  const now = new Date();
  const activeStatuses = ['FILED', 'ASSIGNED', 'IN_PROGRESS'];

  // 1. Find all unresolved complaints where slaDueAt < now
  const overdueComplaints = await Complaint.find({
    status: { $in: activeStatuses },
    slaDueAt: { $lt: now }
  });

  let checkedCount = overdueComplaints.length;
  let escalatedCount = 0;

  for (const complaint of overdueComplaints) {
    // Check Level 1 Escalation
    const openLevel1 = await Escalation.findOne({
      complaintId: complaint._id,
      escalationLevel: 1,
      status: 'OPEN'
    });

    const openLevel2 = await Escalation.findOne({
      complaintId: complaint._id,
      escalationLevel: 2,
      status: 'OPEN'
    });

    if (!openLevel1 && !openLevel2 && complaint.escalationLevel === 0) {
      // Create Level 1 Escalation
      await Escalation.create({
        complaintId: complaint._id,
        departmentId: complaint.departmentId,
        previousOfficerId: complaint.assignedOfficerId || null,
        escalationLevel: 1,
        reason: 'Complaint exceeded category SLA deadline',
        escalatedAt: now,
        status: 'OPEN'
      });

      complaint.escalationLevel = 1;
      await complaint.save();
      escalatedCount++;
      console.log(`[SLA Escalation] Level 1 created for Complaint: ${complaint.referenceCode}`);
    } else if (openLevel1 && !openLevel2 && complaint.escalationLevel === 1) {
      // Check Level 2 Escalation (Triggered 24h post Level 1 escalation or in test mode)
      const hoursSinceLevel1 = (now - new Date(openLevel1.escalatedAt)) / (1000 * 60 * 60);
      
      if (hoursSinceLevel1 >= 24 || process.env.TEST_MODE === 'true') {
        await Escalation.create({
          complaintId: complaint._id,
          departmentId: complaint.departmentId,
          previousOfficerId: complaint.assignedOfficerId || null,
          escalationLevel: 2,
          reason: 'Complaint remains unresolved 24 hours post Level 1 escalation',
          escalatedAt: now,
          status: 'OPEN'
        });

        complaint.escalationLevel = 2;
        await complaint.save();
        escalatedCount++;
        console.log(`[SLA Escalation] Level 2 created for Complaint: ${complaint.referenceCode}`);
      }
    }
  }

  return {
    checked: checkedCount,
    escalated: escalatedCount
  };
};

/**
 * Get escalations with operational filtering (ADMIN only)
 */
const getEscalations = async (queryParams = {}) => {
  const filter = {};

  if (queryParams.level) filter.escalationLevel = parseInt(queryParams.level, 10);
  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.departmentId) filter.departmentId = queryParams.departmentId;

  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const total = await Escalation.countDocuments(filter);
  const escalations = await Escalation.find(filter)
    .populate({
      path: 'complaintId',
      select: 'referenceCode status category ward priority slaDueAt'
    })
    .populate('departmentId', 'name code')
    .populate('previousOfficerId', 'name email phone')
    .sort({ escalatedAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    escalations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single escalation details by ID
 */
const getEscalationById = async (id) => {
  const escalation = await Escalation.findById(id)
    .populate({
      path: 'complaintId',
      select: 'referenceCode status category ward area description priority slaHours slaDueAt createdAt',
      populate: [
        { path: 'citizenId', select: 'name email phone' },
        { path: 'assignedOfficerId', select: 'name email phone' }
      ]
    })
    .populate('departmentId', 'name code description')
    .populate('previousOfficerId', 'name email phone');

  if (!escalation) {
    const error = new Error('Escalation record not found');
    error.statusCode = 404;
    throw error;
  }

  return escalation;
};

module.exports = {
  calculateSlaInfo,
  processSlaEscalations,
  getEscalations,
  getEscalationById
};

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const StatusHistory = require('../models/StatusHistory');

/**
 * Format officer user payload safely
 */
const formatSafeOfficer = (officer) => ({
  id: officer._id,
  name: officer.name,
  email: officer.email,
  phone: officer.phone || null,
  role: officer.role,
  departmentId: officer.departmentId,
  isActive: officer.isActive
});

/**
 * Assign an unassigned complaint to a field officer within the same department (ADMIN only)
 */
const assignComplaintToOfficer = async (complaintId, officerId, adminId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const officer = await User.findById(officerId);
  if (!officer) {
    const error = new Error('Officer user account not found');
    error.statusCode = 404;
    throw error;
  }

  if (officer.role !== 'OFFICER') {
    const error = new Error('Selected user is not an officer');
    error.statusCode = 400;
    throw error;
  }

  if (!officer.isActive) {
    const error = new Error('Selected officer account is inactive');
    error.statusCode = 400;
    throw error;
  }

  if (!officer.departmentId || officer.departmentId.toString() !== complaint.departmentId.toString()) {
    const error = new Error('Officer does not belong to the complaint\'s department');
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = complaint.status;
  complaint.assignedOfficerId = officer._id;

  // Transition status from FILED to ASSIGNED
  if (complaint.status === 'FILED') {
    complaint.status = 'ASSIGNED';
  }

  await complaint.save();

  // Audit trail creation
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus,
    newStatus: complaint.status,
    changedBy: adminId,
    remarks: `Complaint assigned to officer ${officer.name}`
  });

  await complaint.populate('assignedOfficerId', 'name email phone');
  await complaint.populate('departmentId', 'name code');

  return complaint;
};

/**
 * Reassign a complaint to a different officer within the same department (ADMIN only)
 */
const reassignComplaint = async (complaintId, officerId, reason, adminId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const officer = await User.findById(officerId);
  if (!officer) {
    const error = new Error('Officer user account not found');
    error.statusCode = 404;
    throw error;
  }

  if (officer.role !== 'OFFICER') {
    const error = new Error('Selected user is not an officer');
    error.statusCode = 400;
    throw error;
  }

  if (!officer.isActive) {
    const error = new Error('Selected officer account is inactive');
    error.statusCode = 400;
    throw error;
  }

  if (!officer.departmentId || officer.departmentId.toString() !== complaint.departmentId.toString()) {
    const error = new Error('Officer does not belong to the complaint\'s department');
    error.statusCode = 400;
    throw error;
  }

  complaint.assignedOfficerId = officer._id;
  await complaint.save();

  // Audit trail creation preserving current status
  await StatusHistory.create({
    complaintId: complaint._id,
    previousStatus: complaint.status,
    newStatus: complaint.status,
    changedBy: adminId,
    remarks: `Reassigned to officer ${officer.name}. Reason: ${reason.trim()}`
  });

  await complaint.populate('assignedOfficerId', 'name email phone');
  await complaint.populate('departmentId', 'name code');

  return complaint;
};

/**
 * Get active officers belonging to a specific department (ADMIN only)
 */
const getDepartmentOfficers = async (departmentId) => {
  const officers = await User.find({
    role: 'OFFICER',
    isActive: true,
    departmentId
  });

  return officers.map(formatSafeOfficer);
};

module.exports = {
  assignComplaintToOfficer,
  reassignComplaint,
  getDepartmentOfficers
};

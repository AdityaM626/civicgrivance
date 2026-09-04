const mongoose = require('mongoose');

/**
 * Helper to round numbers to specified decimal places (default 2)
 */
const roundTo = (val, decimals = 2) => {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
};

/**
 * Calculate percentage safely with divide-by-zero protection and 2 decimal rounding
 */
const calcPercentage = (numerator, denominator) => {
  if (!denominator || denominator === 0) return 0;
  return roundTo((numerator / denominator) * 100, 2);
};

/**
 * Build reusable MongoDB $match query for complaint reporting pipelines
 */
const buildComplaintMatchQuery = (filters = {}, requestingUser) => {
  const match = {};

  // Officer Department Security Guard
  if (requestingUser.role === 'OFFICER') {
    if (!requestingUser.departmentId) {
      const error = new Error('Officer department assignment missing');
      error.statusCode = 403;
      throw error;
    }

    const officerDeptId = requestingUser.departmentId.toString();

    // Reject attempt by officer to view statistics of a different department
    if (filters.departmentId && filters.departmentId.toString() !== officerDeptId) {
      const error = new Error('You do not have permission to view reporting metrics for another department');
      error.statusCode = 403;
      throw error;
    }

    match.departmentId = new mongoose.Types.ObjectId(officerDeptId);
  } else if (requestingUser.role === 'ADMIN' && filters.departmentId) {
    if (mongoose.Types.ObjectId.isValid(filters.departmentId)) {
      match.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
    }
  }

  // Date Range Filter Semantics (Inclusive start 00:00:00.000 to end 23:59:59.999)
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      match.createdAt.$gte = start;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  // Ward Filter
  if (filters.ward && typeof filters.ward === 'string' && filters.ward.trim()) {
    match.ward = filters.ward.trim();
  }

  // Category Filter
  if (filters.category && typeof filters.category === 'string' && filters.category.trim()) {
    match.category = filters.category.trim();
  }

  // Status Filter
  if (filters.status && typeof filters.status === 'string') {
    match.status = filters.status;
  }

  // Priority Filter
  if (filters.priority && typeof filters.priority === 'string') {
    match.priority = filters.priority;
  }

  return match;
};

module.exports = {
  roundTo,
  calcPercentage,
  buildComplaintMatchQuery
};

const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Escalation = require('../models/Escalation');
const { buildComplaintMatchQuery, roundTo, calcPercentage } = require('../utils/reportFilters');

/**
 * 1. High-level Overview Dashboard Statistics
 */
const getOverviewReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);
  const now = new Date();

  const results = await Complaint.aggregate([
    { $match: match },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        overdue: [
          {
            $match: {
              status: { $in: ['FILED', 'ASSIGNED', 'IN_PROGRESS'] },
              slaDueAt: { $lt: now }
            }
          },
          { $count: 'count' }
        ],
        escalated: [
          { $match: { escalationLevel: { $gt: 0 } } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  const facet = results[0] || {};
  const totalComplaints = facet.total[0]?.count || 0;
  
  const statusMap = {};
  (facet.byStatus || []).forEach((item) => {
    statusMap[item._id] = item.count;
  });

  const filed = statusMap.FILED || 0;
  const assigned = statusMap.ASSIGNED || 0;
  const inProgress = statusMap.IN_PROGRESS || 0;
  const resolved = statusMap.RESOLVED || 0;
  const closed = statusMap.CLOSED || 0;
  const reopened = statusMap.REOPENED || 0;

  const overdue = facet.overdue[0]?.count || 0;
  const escalated = facet.escalated[0]?.count || 0;
  const resolutionRate = calcPercentage(resolved + closed, totalComplaints);

  return {
    totalComplaints,
    filed,
    assigned,
    inProgress,
    resolved,
    closed,
    reopened,
    overdue,
    escalated,
    resolutionRate
  };
};

/**
 * 2. Ward-Wise Complaint Grouping Report
 */
const getWardWiseReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);
  const now = new Date();

  const wardsData = await Complaint.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$ward',
        totalComplaints: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', ['FILED', 'ASSIGNED', 'IN_PROGRESS']] },
                  { $lt: ['$slaDueAt', now] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { totalComplaints: -1 } },
    {
      $project: {
        _id: 0,
        ward: '$_id',
        totalComplaints: 1,
        resolved: 1,
        closed: 1,
        inProgress: 1,
        overdue: 1
      }
    }
  ]);

  return wardsData;
};

/**
 * 3. Department-Wise Complaint Statistics Report
 */
const getDepartmentReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);
  const now = new Date();

  const deptData = await Complaint.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$departmentId',
        totalComplaints: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', ['FILED', 'ASSIGNED', 'IN_PROGRESS']] },
                  { $lt: ['$slaDueAt', now] }
                ]
              },
              1,
              0
            ]
          }
        },
        escalated: {
          $sum: { $cond: [{ $gt: ['$escalationLevel', 0] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'dept'
      }
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $sort: { totalComplaints: -1 } },
    {
      $project: {
        _id: 0,
        departmentId: '$_id',
        department: { $ifNull: ['$dept.name', 'Unassigned Department'] },
        totalComplaints: 1,
        resolved: 1,
        closed: 1,
        inProgress: 1,
        overdue: 1,
        escalated: 1
      }
    }
  ]);

  return deptData;
};

/**
 * 4. Category-Wise Complaint Distribution Report
 */
const getCategoryReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);

  const catData = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, category: '$_id', count: 1 } }
  ]);

  return catData;
};

/**
 * 5. Status Distribution Report
 */
const getStatusReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);

  const statusData = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, status: '$_id', count: 1 } }
  ]);

  return statusData;
};

/**
 * 6. Priority Distribution Report
 */
const getPriorityReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);

  const priorityData = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, priority: '$_id', count: 1 } }
  ]);

  return priorityData;
};

/**
 * 7. SLA Performance & Compliance Report
 */
const getSlaReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);
  const now = new Date();

  const slaData = await Complaint.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'resolutionproofs',
        let: { complaintId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$complaintId', '$$complaintId'] } } },
          { $sort: { resolutionCycle: 1, createdAt: 1 } },
          { $limit: 1 }
        ],
        as: 'firstProof'
      }
    },
    {
      $project: {
        status: 1,
        slaDueAt: 1,
        resolvedAt: {
          $ifNull: [{ $arrayElemAt: ['$firstProof.resolvedAt', 0] }, { $ifNull: ['$closedAt', '$updatedAt'] }]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalComplaints: { $sum: 1 },
        resolvedWithinSla: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', ['RESOLVED', 'CLOSED']] },
                  { $lte: ['$resolvedAt', '$slaDueAt'] }
                ]
              },
              1,
              0
            ]
          }
        },
        resolvedAfterSla: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', ['RESOLVED', 'CLOSED']] },
                  { $gt: ['$resolvedAt', '$slaDueAt'] }
                ]
              },
              1,
              0
            ]
          }
        },
        currentlyOnTime: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED']] },
                  { $gte: ['$slaDueAt', now] }
                ]
              },
              1,
              0
            ]
          }
        },
        currentlyOverdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$status', ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED']] },
                  { $lt: ['$slaDueAt', now] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const stats = slaData[0] || {
    totalComplaints: 0,
    resolvedWithinSla: 0,
    resolvedAfterSla: 0,
    currentlyOnTime: 0,
    currentlyOverdue: 0
  };

  const onTime = stats.resolvedWithinSla + stats.currentlyOnTime;
  const overdue = stats.resolvedAfterSla + stats.currentlyOverdue;
  const complianceRate = calcPercentage(onTime, stats.totalComplaints);

  return {
    totalComplaints: stats.totalComplaints,
    resolvedWithinSla: stats.resolvedWithinSla,
    resolvedAfterSla: stats.resolvedAfterSla,
    currentlyOnTime: stats.currentlyOnTime,
    currentlyOverdue: stats.currentlyOverdue,
    onTime,
    overdue,
    complianceRate
  };
};

/**
 * 8. Escalation Statistics Report
 */
const getEscalationReport = async (filters, requestingUser) => {
  const escMatch = {};

  if (requestingUser.role === 'OFFICER') {
    if (!requestingUser.departmentId) {
      const error = new Error('Officer department assignment missing');
      error.statusCode = 403;
      throw error;
    }
    const officerDeptId = requestingUser.departmentId.toString();
    if (filters.departmentId && filters.departmentId.toString() !== officerDeptId) {
      const error = new Error('You do not have permission to view reporting metrics for another department');
      error.statusCode = 403;
      throw error;
    }
    escMatch.departmentId = new mongoose.Types.ObjectId(officerDeptId);
  } else if (requestingUser.role === 'ADMIN' && filters.departmentId) {
    if (mongoose.Types.ObjectId.isValid(filters.departmentId)) {
      escMatch.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
    }
  }

  if (filters.startDate || filters.endDate) {
    escMatch.createdAt = {};
    if (filters.startDate) {
      const start = new Date(filters.startDate); start.setHours(0, 0, 0, 0);
      escMatch.createdAt.$gte = start;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate); end.setHours(23, 59, 59, 999);
      escMatch.createdAt.$lte = end;
    }
  }

  const escData = await Escalation.aggregate([
    { $match: escMatch },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byLevel: [{ $group: { _id: '$escalationLevel', count: { $sum: 1 } } }]
      }
    }
  ]);

  const facet = escData[0] || {};
  const totalEscalations = facet.total[0]?.count || 0;

  let openEscalations = 0;
  let resolvedEscalations = 0;
  (facet.byStatus || []).forEach((item) => {
    if (item._id === 'OPEN') openEscalations = item.count;
    if (item._id === 'RESOLVED') resolvedEscalations = item.count;
  });

  const levels = (facet.byLevel || []).map((item) => ({
    level: item._id,
    count: item.count
  })).sort((a, b) => a.level - b.level);

  return {
    totalEscalations,
    openEscalations,
    resolvedEscalations,
    levels
  };
};

/**
 * 9. Resolution & Closure Performance Report (with Avg Times)
 */
const getResolutionReport = async (filters, requestingUser) => {
  const match = buildComplaintMatchQuery(filters, requestingUser);

  const resData = await Complaint.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'resolutionproofs',
        let: { complaintId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$complaintId', '$$complaintId'] } } },
          { $sort: { resolutionCycle: 1, createdAt: 1 } },
          { $limit: 1 }
        ],
        as: 'firstProof'
      }
    },
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
              closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
              reopened: { $sum: { $cond: [{ $eq: ['$status', 'REOPENED'] }, 1, 0] } }
            }
          }
        ],
        resolutionTimes: [
          {
            $match: {
              status: { $in: ['RESOLVED', 'CLOSED'] }
            }
          },
          {
            $project: {
              resTimeMs: {
                $subtract: [
                  { $ifNull: [{ $arrayElemAt: ['$firstProof.resolvedAt', 0] }, { $ifNull: ['$closedAt', '$updatedAt'] }] },
                  '$createdAt'
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              avgResTimeMs: { $avg: '$resTimeMs' }
            }
          }
        ],
        closureTimes: [
          {
            $match: {
              status: 'CLOSED',
              closedAt: { $ne: null }
            }
          },
          {
            $project: {
              closureTimeMs: { $subtract: ['$closedAt', '$createdAt'] }
            }
          },
          {
            $group: {
              _id: null,
              avgClosureTimeMs: { $avg: '$closureTimeMs' }
            }
          }
        ]
      }
    }
  ]);

  const facet = resData[0] || {};
  const counts = facet.counts[0] || { total: 0, resolved: 0, closed: 0, reopened: 0 };
  
  const totalComplaints = counts.total;
  const resolved = counts.resolved;
  const closed = counts.closed;
  const reopened = counts.reopened;

  const resolutionRate = calcPercentage(resolved + closed, totalComplaints);
  const closureRate = calcPercentage(closed, totalComplaints);
  const reopenRate = calcPercentage(reopened, totalComplaints);

  const avgResTimeMs = facet.resolutionTimes[0]?.avgResTimeMs || 0;
  const avgClosureTimeMs = facet.closureTimes[0]?.avgClosureTimeMs || 0;

  const averageResolutionTimeHours = roundTo(avgResTimeMs / (1000 * 60 * 60), 2);
  const averageClosureTimeHours = roundTo(avgClosureTimeMs / (1000 * 60 * 60), 2);

  return {
    totalComplaints,
    resolved,
    closed,
    reopened,
    resolutionRate,
    closureRate,
    reopenRate,
    averageResolutionTimeHours,
    averageClosureTimeHours
  };
};

/**
 * 10. Complaint Trends Over Time Report (Daily, Weekly, Monthly)
 */
const getTrendReport = async (filters, requestingUser, groupBy = 'monthly') => {
  const match = buildComplaintMatchQuery(filters, requestingUser);

  let formatStr = '%Y-%m';
  if (groupBy === 'daily') formatStr = '%Y-%m-%d';
  if (groupBy === 'weekly') formatStr = '%Y-W%V';

  const trendData = await Complaint.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: formatStr, date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: '$_id', count: 1 } }
  ]);

  return trendData;
};

module.exports = {
  getOverviewReport,
  getWardWiseReport,
  getDepartmentReport,
  getCategoryReport,
  getStatusReport,
  getPriorityReport,
  getSlaReport,
  getEscalationReport,
  getResolutionReport,
  getTrendReport
};

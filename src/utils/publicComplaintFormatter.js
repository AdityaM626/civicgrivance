/**
 * Public Complaint Status DTO Formatter & Status Description Mappings
 * Ensures strict data privacy by stripping all internal, citizen, and officer personal identifiers.
 */

const STATUS_DESCRIPTIONS = {
  FILED: {
    label: 'Filed',
    description: 'Complaint has been successfully registered.'
  },
  ASSIGNED: {
    label: 'Assigned',
    description: 'Complaint has been assigned to the responsible department/officer.'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Complaint is currently being worked on.'
  },
  RESOLVED: {
    label: 'Resolved',
    description: 'Complaint has been marked as resolved.'
  },
  CLOSED: {
    label: 'Closed',
    description: 'Complaint has been closed.'
  },
  REOPENED: {
    label: 'Reopened',
    description: 'Complaint has been reopened for further action.'
  }
};

/**
 * Format raw complaint & history records into a clean, privacy-safe public tracking DTO
 */
const formatPublicComplaint = (complaint, statusHistory = [], latestResolution = null, slaStatus = 'ON_TIME') => {
  const statusInfo = STATUS_DESCRIPTIONS[complaint.status] || {
    label: complaint.status,
    description: 'Status update available.'
  };

  // Department name exposure (strictly omitting headOfficerId, category arrays, internal IDs)
  const deptName = typeof complaint.departmentId === 'object' && complaint.departmentId !== null
    ? complaint.departmentId.name
    : 'Municipal Department';

  // Transform StatusHistory timeline to contain ONLY status and timestamp (stripping changedBy, user IDs, internal remarks)
  const timeline = statusHistory.map((item) => {
    const itemStatus = item.newStatus || item.status;
    const itemInfo = STATUS_DESCRIPTIONS[itemStatus] || { label: itemStatus };
    return {
      status: itemStatus,
      statusLabel: itemInfo.label,
      timestamp: item.createdAt
    };
  });

  // Public-safe resolution summary (strictly omitting officerId, internal notes, photo metadata)
  let resolutionObj = null;
  if (['RESOLVED', 'CLOSED'].includes(complaint.status)) {
    resolutionObj = {
      status: complaint.status,
      resolvedAt: latestResolution ? latestResolution.resolvedAt : complaint.closedAt || complaint.updatedAt
    };
  }

  return {
    referenceCode: complaint.referenceCode,
    category: complaint.category,
    ward: complaint.ward,
    priority: complaint.priority,
    status: complaint.status,
    statusLabel: statusInfo.label,
    statusDescription: statusInfo.description,
    department: {
      name: deptName
    },
    sla: {
      status: slaStatus
    },
    resolution: resolutionObj,
    filedAt: complaint.createdAt,
    lastUpdatedAt: complaint.updatedAt,
    timeline
  };
};

module.exports = {
  STATUS_DESCRIPTIONS,
  formatPublicComplaint
};

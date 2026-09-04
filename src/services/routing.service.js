const Department = require('../models/Department');

/**
 * Automatic Complaint Routing Engine
 * Maps a complaint category to its responsible active department and SLA configuration
 * @param {string} categoryName - Requested complaint category name
 * @returns {Promise<Object>} { departmentId, departmentName, category, slaHours }
 */
const routeComplaint = async (categoryName) => {
  if (!categoryName || typeof categoryName !== 'string') {
    const error = new Error('Complaint category is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedCategory = categoryName.trim().toLowerCase();

  // Find all active departments
  const activeDepartments = await Department.find({ isActive: true });

  const matches = [];

  for (const dept of activeDepartments) {
    if (!dept.categories || !Array.isArray(dept.categories)) continue;

    for (const cat of dept.categories) {
      if (cat.isActive && cat.name.trim().toLowerCase() === normalizedCategory) {
        matches.push({
          departmentId: dept._id,
          departmentName: dept.name,
          departmentCode: dept.code,
          category: cat.name,
          slaHours: cat.slaHours
        });
      }
    }
  }

  if (matches.length === 0) {
    const error = new Error(`The selected complaint category '${categoryName}' is not available`);
    error.statusCode = 400;
    throw error;
  }

  if (matches.length > 1) {
    const error = new Error(`Ambiguous category configuration: '${categoryName}' maps to multiple active departments`);
    error.statusCode = 400;
    throw error;
  }

  return matches[0];
};

module.exports = {
  routeComplaint
};

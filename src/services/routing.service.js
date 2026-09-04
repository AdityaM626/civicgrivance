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

  // 1. Check exact match
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

  if (matches.length === 1) {
    return matches[0];
  }

  // 2. Check partial substring match if no exact match
  if (matches.length === 0) {
    for (const dept of activeDepartments) {
      if (!dept.categories || !Array.isArray(dept.categories)) continue;

      for (const cat of dept.categories) {
        const catLower = cat.name.trim().toLowerCase();
        if (cat.isActive && (catLower.includes(normalizedCategory) || normalizedCategory.includes(catLower))) {
          return {
            departmentId: dept._id,
            departmentName: dept.name,
            departmentCode: dept.code,
            category: cat.name,
            slaHours: cat.slaHours
          };
        }
      }
    }
  }

  // 3. Fallback routing if category doesn't match predefined list
  const fallbackDept = activeDepartments[0];
  if (fallbackDept) {
    return {
      departmentId: fallbackDept._id,
      departmentName: fallbackDept.name,
      departmentCode: fallbackDept.code,
      category: categoryName.trim(),
      slaHours: 48
    };
  }

  const error = new Error(`No active municipal departments available for routing.`);
  error.statusCode = 400;
  throw error;
};

module.exports = {
  routeComplaint
};

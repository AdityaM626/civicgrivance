const Department = require('../models/Department');

/**
 * Create a new municipal department
 */
const createDepartment = async ({ name, code, description }) => {
  const trimmedName = name.trim();
  const upperCode = code.trim().toUpperCase();

  // Check uniqueness of name or code
  const existing = await Department.findOne({
    $or: [{ name: trimmedName }, { code: upperCode }]
  });

  if (existing) {
    const field = existing.code === upperCode ? 'code' : 'name';
    const error = new Error(`A department with this ${field} already exists`);
    error.statusCode = 409;
    throw error;
  }

  const department = await Department.create({
    name: trimmedName,
    code: upperCode,
    description: description ? description.trim() : '',
    categories: [],
    isActive: true
  });

  return department;
};

/**
 * Retrieve list of departments
 */
const getDepartments = async (includeInactive = false) => {
  const query = includeInactive ? {} : { isActive: true };
  const departments = await Department.find(query).populate('headOfficerId', 'name email phone');
  return departments;
};

/**
 * Get single department by ObjectId
 */
const getDepartmentById = async (id) => {
  const department = await Department.findById(id).populate('headOfficerId', 'name email phone');
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }
  return department;
};

/**
 * Update department metadata (name, description)
 */
const updateDepartment = async (id, { name, description }) => {
  const department = await Department.findById(id);
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  if (name && name.trim() !== department.name) {
    const trimmedName = name.trim();
    const existing = await Department.findOne({ name: trimmedName, _id: { $ne: id } });
    if (existing) {
      const error = new Error('A department with this name already exists');
      error.statusCode = 409;
      throw error;
    }
    department.name = trimmedName;
  }

  if (description !== undefined) {
    department.description = description.trim();
  }

  await department.save();
  return department;
};

/**
 * Deactivate a department (Soft-delete)
 */
const deactivateDepartment = async (id) => {
  const department = await Department.findById(id);
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  department.isActive = false;
  await department.save();
  return department;
};

/**
 * Add a new category SLA mapping to a department
 */
const addCategory = async (departmentId, { name, slaHours }) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const trimmedCategory = name.trim();

  // 1. Check duplicate active category inside this department
  const internalDuplicate = department.categories.find(
    (cat) => cat.isActive && cat.name.toLowerCase() === trimmedCategory.toLowerCase()
  );
  if (internalDuplicate) {
    const error = new Error(`Category '${trimmedCategory}' already exists in this department`);
    error.statusCode = 409;
    throw error;
  }

  // 2. Check duplicate active category across other active departments to avoid routing ambiguity
  const allActiveDepts = await Department.find({ isActive: true, _id: { $ne: departmentId } });
  for (const dept of allActiveDepts) {
    const externalDuplicate = dept.categories.find(
      (cat) => cat.isActive && cat.name.toLowerCase() === trimmedCategory.toLowerCase()
    );
    if (externalDuplicate) {
      const error = new Error(
        `Category '${trimmedCategory}' is already active in department '${dept.name}'. Category names must map uniquely.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  department.categories.push({
    name: trimmedCategory,
    slaHours: parseInt(slaHours, 10),
    isActive: true
  });

  await department.save();
  return department;
};

/**
 * Update an existing category within a department
 */
const updateCategory = async (departmentId, categoryId, { name, slaHours }) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const category = department.categories.id(categoryId);
  if (!category) {
    const error = new Error('Category not found in department');
    error.statusCode = 404;
    throw error;
  }

  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const trimmedCategory = name.trim();
    // Check duplicate in department
    const internalDup = department.categories.find(
      (cat) => cat._id.toString() !== categoryId && cat.isActive && cat.name.toLowerCase() === trimmedCategory.toLowerCase()
    );
    if (internalDup) {
      const error = new Error(`Category '${trimmedCategory}' already exists in this department`);
      error.statusCode = 409;
      throw error;
    }
    category.name = trimmedCategory;
  }

  if (slaHours !== undefined) {
    category.slaHours = parseInt(slaHours, 10);
  }

  await department.save();
  return department;
};

/**
 * Deactivate a category within a department (Soft-delete)
 */
const deactivateCategory = async (departmentId, categoryId) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const category = department.categories.id(categoryId);
  if (!category) {
    const error = new Error('Category not found in department');
    error.statusCode = 404;
    throw error;
  }

  category.isActive = false;
  await department.save();
  return department;
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
  addCategory,
  updateCategory,
  deactivateCategory
};

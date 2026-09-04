const departmentService = require('../services/department.service');

/**
 * Create a new department (ADMIN only)
 * POST /api/v1/departments
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const department = await departmentService.createDepartment({ name, code, description });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * List all departments
 * GET /api/v1/departments
 */
const getDepartments = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user && req.user.role === 'ADMIN';
    const departments = await departmentService.getDepartments(includeInactive);

    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: {
        departments
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Get single department by ID
 * GET /api/v1/departments/:id
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department details retrieved successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Update department metadata (ADMIN only)
 * PATCH /api/v1/departments/:id
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const department = await departmentService.updateDepartment(req.params.id, { name, description });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Deactivate a department (ADMIN only)
 * PATCH /api/v1/departments/:id/deactivate
 */
const deactivateDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.deactivateDepartment(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department deactivated successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Add category to department (ADMIN only)
 * POST /api/v1/departments/:id/categories
 */
const addCategory = async (req, res, next) => {
  try {
    const { name, slaHours } = req.body;
    const department = await departmentService.addCategory(req.params.id, { name, slaHours });

    res.status(201).json({
      success: true,
      message: 'Category added to department successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Update category in department (ADMIN only)
 * PATCH /api/v1/departments/:id/categories/:categoryId
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, slaHours } = req.body;
    const department = await departmentService.updateCategory(req.params.id, req.params.categoryId, { name, slaHours });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Deactivate category in department (ADMIN only)
 * PATCH /api/v1/departments/:id/categories/:categoryId/deactivate
 */
const deactivateCategory = async (req, res, next) => {
  try {
    const department = await departmentService.deactivateCategory(req.params.id, req.params.categoryId);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully',
      data: {
        department
      }
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
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

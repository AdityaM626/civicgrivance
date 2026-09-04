const express = require('express');
const router = express.Router();

const departmentController = require('../controllers/department.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  createDepartmentValidation,
  updateDepartmentValidation,
  addCategoryValidation,
  updateCategoryValidation
} = require('../validators/department.validator');

// Department Routes
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(createDepartmentValidation),
  departmentController.createDepartment
);

router.get(
  '/',
  authenticateToken,
  departmentController.getDepartments
);

router.get(
  '/:id',
  authenticateToken,
  departmentController.getDepartmentById
);

router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(updateDepartmentValidation),
  departmentController.updateDepartment
);

router.patch(
  '/:id/deactivate',
  authenticateToken,
  authorizeRoles('ADMIN'),
  departmentController.deactivateDepartment
);

// Embedded Category Routes
router.post(
  '/:id/categories',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(addCategoryValidation),
  departmentController.addCategory
);

router.patch(
  '/:id/categories/:categoryId',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(updateCategoryValidation),
  departmentController.updateCategory
);

router.patch(
  '/:id/categories/:categoryId/deactivate',
  authenticateToken,
  authorizeRoles('ADMIN'),
  departmentController.deactivateCategory
);

module.exports = router;

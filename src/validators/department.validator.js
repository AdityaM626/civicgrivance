const { body, param } = require('express-validator');

const createDepartmentValidation = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters'),

  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .isString()
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 20 })
    .withMessage('Department code must be between 2 and 20 characters'),

  body('description')
    .optional()
    .isString()
    .trim()
];

const updateDepartmentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID format'),

  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .isString()
    .trim()
];

const addCategoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID format'),

  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('slaHours')
    .notEmpty()
    .withMessage('SLA hours are required')
    .isInt({ min: 1 })
    .withMessage('SLA hours must be an integer of at least 1')
];

const updateCategoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID format'),

  param('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('slaHours')
    .optional()
    .isInt({ min: 1 })
    .withMessage('SLA hours must be an integer of at least 1')
];

module.exports = {
  createDepartmentValidation,
  updateDepartmentValidation,
  addCategoryValidation,
  updateCategoryValidation
};

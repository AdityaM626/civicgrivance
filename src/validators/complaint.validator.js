const { body } = require('express-validator');

const fileComplaintValidation = [
  body('category')
    .notEmpty()
    .withMessage('Complaint category is required')
    .isString()
    .trim(),

  body('ward')
    .notEmpty()
    .withMessage('Ward identifier is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ward identifier must be between 2 and 50 characters'),

  body('area')
    .notEmpty()
    .withMessage('Area is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Area must be between 2 and 100 characters'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('location.address')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim(),

  body('location.latitude')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),

  body('location.longitude')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),

  body('priority')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or CRITICAL')
];

module.exports = {
  fileComplaintValidation
};

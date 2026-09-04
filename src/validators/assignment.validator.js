const { body, param } = require('express-validator');

const assignValidation = [
  param('complaintId')
    .isMongoId()
    .withMessage('Invalid complaint ID format'),

  body('officerId')
    .notEmpty()
    .withMessage('Officer ID is required')
    .isMongoId()
    .withMessage('Invalid officer ID format')
];

const reassignValidation = [
  param('complaintId')
    .isMongoId()
    .withMessage('Invalid complaint ID format'),

  body('officerId')
    .notEmpty()
    .withMessage('Officer ID is required')
    .isMongoId()
    .withMessage('Invalid officer ID format'),

  body('reason')
    .notEmpty()
    .withMessage('Reassignment reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reassignment reason must be between 5 and 500 characters')
];

module.exports = {
  assignValidation,
  reassignValidation
};

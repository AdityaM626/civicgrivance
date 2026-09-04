const { body, param } = require('express-validator');

const resolveComplaintValidation = [
  param('complaintId')
    .isMongoId()
    .withMessage('Invalid complaint ID format'),

  body('notes')
    .notEmpty()
    .withMessage('Resolution notes are required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Resolution notes must be between 10 and 2000 characters'),

  body('photoUrls')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('Photo URLs must be an array of string URLs'),

  body('photoUrls.*')
    .optional()
    .isURL()
    .withMessage('Each photo URL must be a valid URL string')
];

module.exports = {
  resolveComplaintValidation
};

const { body, param } = require('express-validator');

const statusEnum = ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];

const updateStatusValidation = [
  param('complaintId')
    .isMongoId()
    .withMessage('Invalid complaint ID format'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(statusEnum)
    .withMessage(`Status must be one of: ${statusEnum.join(', ')}`),

  body('remarks')
    .notEmpty()
    .withMessage('Remarks are required for status update')
    .isString()
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Remarks must be between 3 and 1000 characters')
];

module.exports = {
  updateStatusValidation
};

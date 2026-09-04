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
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 2, max: 1000 })
    .withMessage('Remarks must be between 2 and 1000 characters'),

  body('note')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
];

module.exports = {
  updateStatusValidation
};

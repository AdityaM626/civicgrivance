const { body } = require('express-validator');

const reopenComplaintValidation = [
  body('reopenReason')
    .notEmpty()
    .withMessage('Reopen reason is required')
    .isString()
    .withMessage('Reopen reason must be a string')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Reopen reason must be at least 10 characters long')
];

module.exports = {
  reopenComplaintValidation
};

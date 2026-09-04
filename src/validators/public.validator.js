const { param } = require('express-validator');

const lookupComplaintValidation = [
  param('referenceCode')
    .notEmpty()
    .withMessage('Complaint reference code is required')
    .isString()
    .withMessage('Reference code must be a string')
    .trim()
    .matches(/^CIV-\d{4}-\d{6}$/i)
    .withMessage('Invalid complaint reference code format (Expected format: CIV-YYYY-XXXXXX)')
];

module.exports = {
  lookupComplaintValidation
};

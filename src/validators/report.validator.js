const { query } = require('express-validator');

const validStatuses = ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const validGroupBys = ['daily', 'weekly', 'monthly'];

const getReportValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO date string (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO date string (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (start > end) {
          throw new Error('startDate cannot be after endDate');
        }
      }
      return true;
    }),
  query('departmentId')
    .optional()
    .isMongoId()
    .withMessage('departmentId must be a valid Mongo ObjectId'),
  query('status')
    .optional()
    .isIn(validStatuses)
    .withMessage(`status must be one of: ${validStatuses.join(', ')}`),
  query('priority')
    .optional()
    .isIn(validPriorities)
    .withMessage(`priority must be one of: ${validPriorities.join(', ')}`),
  query('ward')
    .optional()
    .isString()
    .trim(),
  query('category')
    .optional()
    .isString()
    .trim()
];

const getTrendReportValidation = [
  ...getReportValidation,
  query('groupBy')
    .optional()
    .isIn(validGroupBys)
    .withMessage(`groupBy must be one of: ${validGroupBys.join(', ')}`)
];

module.exports = {
  getReportValidation,
  getTrendReportValidation
};

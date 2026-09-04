const { validationResult } = require('express-validator');

/**
 * Express-validator error handler middleware wrapper
 * Runs provided validation chains and checks validation results.
 * @param {Array} validations - Array of express-validator chains
 */
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors && result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Input validation failed',
      errors: formattedErrors
    });
  };
};

module.exports = {
  validate
};

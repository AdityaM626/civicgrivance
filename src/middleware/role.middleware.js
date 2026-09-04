/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * @param {...string} allowedRoles - List of permitted roles (e.g. 'CITIZEN', 'OFFICER', 'ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'User authentication context missing.'
      });
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedAllowed = allowedRoles.map((role) => role.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};

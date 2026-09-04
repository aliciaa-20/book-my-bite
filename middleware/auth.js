/**
 * Authentication & Authorization Middleware
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

const { verifyToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Verify JWT token from Authorization header (Bearer <token>)
 */
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
        errorCode: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user or attach decoded payload
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account has been deactivated',
        errorCode: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
        errorCode: 'INVALID_TOKEN'
      });
    }
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles 
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization check',
        errorCode: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        errorCode: 'FORBIDDEN'
      });
    }

    next();
  };
};

module.exports = { verifyAuth, authorizeRoles };

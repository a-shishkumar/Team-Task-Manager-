const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const config = require('../config');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookie or Authorization header
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Please log in to access this resource'));
    }

    // Verify token
    const decoded = verifyToken(token, config.jwt.secret);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(ApiError.unauthorized('The user belonging to this token no longer exists'));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(ApiError.unauthorized('Your account has been deactivated'));
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    return next(error);
  }
};

/**
 * Restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to perform this action')
      );
    }
    next();
  };
};

/**
 * Optional auth - attach user if token exists, but don't block
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token, config.jwt.secret);
      req.user = await User.findById(decoded.id);
    }
  } catch (error) {
    // Silently continue without auth
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };

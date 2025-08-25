const authService = require('../services/authService');
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};
const authenticateOwner = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner privileges required.'
      });
    }
    next();
  });
};
const authenticateEmployee = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Employee privileges required.'
      });
    }
    next();
  });
};
const authenticateAny = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    if (!['owner', 'employee'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Valid user role required.'
      });
    }
    next();
  });
};
module.exports = {
  authenticateToken,
  authenticateOwner,
  authenticateEmployee,
  authenticateAny
};

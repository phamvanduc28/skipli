const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  let error = { ...err };
  error.message = err.message;
  console.error(`Error: ${error.message}`);
  if (err.stack) {
    console.error(`Stack: ${err.stack}`);
  }
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }
  if (err.code && err.code.startsWith('auth/')) {
    error = { message: 'Authentication error', statusCode: 401 };
  }
  if (err.code && typeof err.code === 'number' && err.code >= 20000 && err.code < 30000) {
    error = { message: 'SMS service error', statusCode: 500 };
  }
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err 
    })
  });
};
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
module.exports = {
  errorHandler,
  asyncHandler,
  notFound
};

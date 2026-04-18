import ApiError from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message    = err.message || 'Internal server error';
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // 2. Catch JWT Token Errors (e.g., tampered or expired tokens)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token failed';
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
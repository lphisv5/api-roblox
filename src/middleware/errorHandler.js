import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let error = err.error || 'INTERNAL_SERVER_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    error = err.error;
  }

  logger.error('Request error', {
    error: message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  res.status(statusCode).json({
    error,
    message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

import { ValidationError } from 'express-validator';
import { config } from '../config/default.js';
import logger from './logger.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  const stack = config.app.env === 'development' ? err.stack : undefined;
  
  // Handle different error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Authentication Failed';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too Many Requests';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Security: Obfuscate potential system info
  if (statusCode >= 500) {
    message = 'Something went wrong';
  }

  // Structured error logging
  logger.error({
    message: err.message,
    type: err.name,
    path: req.path,
    method: req.method,
    status: statusCode,
    stack: config.app.env === 'development' ? err.stack : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(statusCode).json({
    error: message,
    ...(config.app.env === 'development' && { details: {
      validationErrors: err.errors,
      stack
    }})
  });
};
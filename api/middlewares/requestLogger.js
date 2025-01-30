import morgan from 'morgan';
import { logger } from './logger.js';
import { config } from '../config/default.js';

const requestFilter = (req, prop) => {
  // Redact sensitive headers
  const headers = { ...req.headers };
  if (headers.authorization) headers.authorization = '*****';
  if (headers.cookie) headers.cookie = '*****';
  
  return {
    method: req.method,
    url: req.originalUrl,
    headers,
    body: req.method === 'POST' ? redactSensitive(req.body) : undefined,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    [prop]: req[prop]
  };
};

const redactSensitive = (obj) => {
  // Implement your redaction logic
  if (obj?.password) obj.password = '*****';
  if (obj?.apiKey) obj.apiKey = '*****';
  return obj;
};

export const requestLogger = morgan((tokens, req, res) => {
  const logData = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)} ms`,
    contentLength: tokens.res(req, res, 'content-length'),
    requestId: req.headers['x-request-id']
  };

  logger.http('Request', logData);
  return null; // Disable default Morgan output
}, {
  stream: logger.stream,
  skip: (req) => req.path === '/metrics' // Skip metrics endpoint
});

// Advanced request context middleware
export const requestContext = (req, res, next) => {
  req.context = {
    startTime: Date.now(),
    id: req.headers['x-request-id'] || crypto.randomUUID(),
    user: req.user?.id || 'anonymous',
    clientVersion: req.headers['x-client-version']
  };

  logger.debug('Request started', {
    context: req.context,
    ...requestFilter(req, 'body')
  });

  res.on('finish', () => {
    logger.debug('Request completed', {
      context: req.context,
      duration: Date.now() - req.context.startTime,
      statusCode: res.statusCode,
      ...requestFilter(req, 'body')
    });
  });

  next();
};
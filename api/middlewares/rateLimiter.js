import rateLimit from 'express-rate-limit';
import { config } from '../config/default.js';
import { redisClient } from '../config/redis.js';
import logger from './logger.js';

const rateLimitStore = new rateLimit.RedisStore({
  sendCommand: (...args) => redisClient.call(...args),
  prefix: 'rl_codeengine:'
});

export const apiRateLimiter = rateLimit({
  windowMs: config.security.rateLimit.window,
  max: config.security.rateLimit.max,
  store: rateLimitStore,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: `Too many requests, please try again after ${config.security.rateLimit.window}`
    });
  },
  skip: (req) => req.path === '/health', // Skip health checks
  headers: true,  // Enable `X-RateLimit-*` headers
  legacyHeaders: false
});

// Separate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many login attempts'
});
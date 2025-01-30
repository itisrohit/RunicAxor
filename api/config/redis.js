import Redis from 'ioredis';
import config from './default.js';
import logger from '../middlewares/logger.js';

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  tls: config.redis.tls ? {} : undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000)
};

// Main Redis client
export const redisClient = new Redis(redisConfig);

// BullMQ-specific connection
export const bullConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  tls: config.redis.tls ? {} : undefined
};

// Event listeners
redisClient
  .on('connect', () => logger.info('Redis connected'))
  .on('error', (err) => logger.error('Redis error', err))
  .on('reconnecting', () => logger.warn('Redis reconnecting'))
  .on('end', () => logger.warn('Redis disconnected'));
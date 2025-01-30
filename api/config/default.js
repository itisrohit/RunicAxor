import { config } from 'dotenv';

config(); // Load .env file

export default {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    maxCodeSize: process.env.MAX_CODE_SIZE || '10kb',
    maxInputSize: process.env.MAX_INPUT_SIZE || '1kb',
    supportedLanguages: ['nodejs', 'python', 'cpp']
  },
  
  security: {
    apiKey: process.env.API_KEY,
    rateLimit: {
      window: process.env.RATE_LIMIT_WINDOW || '15m',
      max: process.env.RATE_LIMIT_MAX || 100
    },
    cors: {
      allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
      methods: ['GET', 'POST']
    }
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    tls: process.env.REDIS_TLS === 'true'
  },
  
  docker: {
    memoryLimit: process.env.DOCKER_MEMORY_LIMIT || '100m',
    cpuQuota: process.env.DOCKER_CPU_QUOTA || 100000,
    timeout: process.env.DOCKER_TIMEOUT || 5000,
    pidsLimit: process.env.DOCKER_PIDS_LIMIT || 50
  },
  workers: {
    concurrency: 5,
    timeout: 10000,
    clusterSize: process.env.CPU_COUNT || 2,
    healthPort: 9101,
    maxRetries: 3
  },
  queue: {
    concurrency: process.env.QUEUE_CONCURRENCY || 5,
    retries: process.env.QUEUE_RETRIES || 3,
    backoffDelay: process.env.QUEUE_BACKOFF_DELAY || 1000
  }
};
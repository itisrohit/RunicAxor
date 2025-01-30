import { Queue, Worker } from 'bullmq';
import { bullConnection } from './redis.js';
import config from './default.js';
import logger from '../middlewares/logger.js';

export const executionQueue = new Queue('code-execution', {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: config.queue.retries,
    backoff: {
      type: 'exponential',
      delay: config.queue.backoffDelay
    },
    removeOnComplete: true,
    removeOnFail: 1000
  }
});

export const createWorker = () => new Worker(
  'code-execution',
  async job => {
    try {
      // Worker logic will be injected from services
      return { status: 'processed', jobId: job.id };
    } catch (error) {
      logger.error('Job processing failed', error);
      throw error;
    }
  },
  {
    connection: bullConnection,
    concurrency: config.queue.concurrency,
    limiter: {
      max: 1,
      duration: 1000
    }
  }
);

// Queue metrics
executionQueue.on('completed', job => {
  logger.info(`Job ${job.id} completed`);
});

executionQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed`, { error: err.message });
});
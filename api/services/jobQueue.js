import { Queue, Worker, QueueEvents } from 'bullmq';
import { ExecutionService } from './executionService.js';
import { bullConnection } from '../config/redis.js';
import { config } from '../config/default.js';
import logger from '../middlewares/logger.js';

export class JobQueueService {
  constructor() {
    this.queue = new Queue('code-execution', {
      connection: bullConnection,
      defaultJobOptions: {
        attempts: config.queue.retries,
        backoff: { type: 'exponential', delay: config.queue.backoffDelay },
        removeOnComplete: true,
        removeOnFail: 1000
      }
    });

    this.worker = new Worker('code-execution', this.jobHandler.bind(this), {
      connection: bullConnection,
      concurrency: config.queue.concurrency,
      limiter: {
        max: config.queue.maxJobsPerSecond,
        duration: 1000
      }
    });

    this.events = new QueueEvents('code-execution', { 
      connection: bullConnection 
    });

    this.registerEventListeners();
  }

  async jobHandler(job) {
    const service = new ExecutionService();
    return service.executeCode(job.data);
  }

  registerEventListeners() {
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`, job.returnvalue);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed`, { 
        error: err.message, 
        attempts: job.attemptsMade 
      });
    });

    this.events.on('progress', ({ jobId, data }) => {
      logger.debug(`Job ${jobId} progress`, { progress: data });
    });

    process.on('SIGTERM', async () => {
      await this.worker.close();
      await this.queue.close();
    });
  }

  async addJob(payload, priority = 'normal') {
    return this.queue.add('execute', payload, {
      priority: this.getPriorityValue(priority),
      jobId: crypto.randomUUID()
    });
  }

  getPriorityValue(level) {
    const levels = { low: 3, normal: 2, high: 1 };
    return levels[level] || 2;
  }

  async getJobStatus(jobId) {
    return this.queue.getJob(jobId).then(job => ({
      id: job.id,
      status: await job.getState(),
      progress: job.progress,
      result: job.returnvalue,
      attempts: job.attemptsMade
    }));
  }
}
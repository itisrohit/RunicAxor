import { Worker } from 'bullmq';
import Docker from 'dockerode';
import { config } from '../api/config/default.js';
import logger from '../api/middlewares/logger.js';
import { bullConnection } from '../api/config/redis.js';

const docker = new Docker();
const JOB_CONCURRENCY = config.workers.concurrency || 5;

class JobManager {
  constructor() {
    this.worker = new Worker('code-execution', this.processJob.bind(this), {
      connection: bullConnection,
      concurrency: JOB_CONCURRENCY,
      limiter: {
        max: config.workers.maxRps,
        duration: 1000
      }
    });
  }

  async processJob(job) {
    const { language, code, input } = job.data;
    
    try {
      const container = await docker.createContainer({
        Image: `code-engine-${language}`,
        Cmd: ['sh', '-c', `echo "${code}" | ${this.getExecutorCommand(language)}`],
        HostConfig: {
          Memory: config.docker.memoryLimit,
          CpuQuota: config.docker.cpuQuota,
          NetworkMode: 'none',
          ReadonlyRootfs: true
        }
      });

      const output = await this.runContainer(container);
      return { success: true, output };
    } catch (error) {
      logger.error('Job failed', { jobId: job.id, error });
      throw error;
    }
  }

  getExecutorCommand(lang) {
    return {
      nodejs: 'node --no-deprecation -',
      python: 'python3 -',
      cpp: './compile-wrapper.sh'
    }[lang];
  }

  async runContainer(container) {
    const output = { stdout: '', stderr: '' };
    
    await container.start();
    const stream = await container.logs({ follow: true, stdout: true, stderr: true });
    
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => output.stdout += chunk);
      stream.on('end', () => resolve(output));
      stream.on('error', reject);
    });
  }
}

export default new JobManager();
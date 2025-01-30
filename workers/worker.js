import JobManager from './job-manager.js';
import { metricsEndpoint } from './metrics.js';
import express from 'express';
import { config } from '../api/config/default.js';

// Start metrics server
const app = express();
app.get('/metrics', metricsEndpoint);
app.listen(config.workers.metricsPort, () => {
  console.log(`Worker metrics on port ${config.workers.metricsPort}`);
});

// Start job processing
JobManager.worker.on('ready', () => {
  console.log('Worker ready to process jobs');
});

process.on('SIGTERM', async () => {
  await JobManager.worker.close();
  process.exit(0);
});
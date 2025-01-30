import express from 'express';
import Docker from 'dockerode';
import { redisClient } from '../config/redis.js';
import { responseHelper } from '../utils/responseHelper.js';
import { config } from '../config/default.js';

const router = express.Router();
const docker = new Docker();

const checkDependencies = async () => {
  const results = await Promise.allSettled([
    // Redis health check
    (async () => {
      try {
        const start = Date.now();
        await redisClient.ping();
        return {
          service: 'redis',
          status: 'healthy',
          latency: Date.now() - start
        };
      } catch (error) {
        return {
          service: 'redis',
          status: 'unhealthy',
          error: error.message
        };
      }
    })(),

    // Docker health check
    (async () => {
      try {
        const start = Date.now();
        await docker.ping();
        return {
          service: 'docker',
          status: 'healthy',
          latency: Date.now() - start
        };
      } catch (error) {
        return {
          service: 'docker',
          status: 'unhealthy',
          error: error.message
        };
      }
    })()
  ]);

  return results.map(result => result.value);
};

router.get('/', async (req, res) => {
  const dependencies = await checkDependencies();
  const overallStatus = dependencies.every(d => d.status === 'healthy') 
    ? 'healthy' 
    : 'degraded';

  res.json(responseHelper.success(
    {
      status: overallStatus,
      version: config.app.version,
      uptime: process.uptime(),
      dependencies
    },
    { endpoint: 'health' }
  ));
});

export default router;
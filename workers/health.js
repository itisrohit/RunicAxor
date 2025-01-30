import express from 'express';
import { redisClient } from '../api/config/redis.js';
import { responseHelper } from '../api/utils/responseHelper.js';

const router = express.Router();

router.get('/worker-health', async (req, res) => {
  try {
    const stats = {
      redis: await redisClient.ping().then(() => 'healthy').catch(() => 'unhealthy'),
      queue: await redisClient.xlen('bull:code-execution:wait').then(count => ({ waiting: count })),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    res.json(responseHelper.success(stats));
  } catch (error) {
    res.status(500).json(responseHelper.error(error));
  }
});

export default router;
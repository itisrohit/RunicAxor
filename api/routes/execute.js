import express from 'express';
import { JobQueueService } from '../services/jobQueue.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';
import { validateExecutionRequest, handleValidationErrors } from '../utils/validator.js';
import { responseHelper } from '../utils/responseHelper.js';

const router = express.Router();
const queueService = new JobQueueService();

router.post('/',
  apiRateLimiter,
  validateExecutionRequest,
  handleValidationErrors,
  async (req, res) => {
    try {
      const job = await queueService.addJob(req.body);
      
      res.status(202).json(responseHelper.success(
        {
          jobId: job.id,
          statusUrl: `/api/v1/status/${job.id}`,
          queuePosition: await queueService.queue.getJobCounts()
        },
        { endpoint: 'execute' }
      ));
    } catch (error) {
      res.status(503).json(responseHelper.error(
        new Error('System overloaded - try again later'),
        503
      ));
    }
  }
);

export default router;
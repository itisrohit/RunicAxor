import express from 'express';
import { JobQueueService } from '../services/jobQueue.js';
import { validateIdParam, handleValidationErrors } from '../utils/validator.js';
import { responseHelper } from '../utils/responseHelper.js';

const router = express.Router();
const queueService = new JobQueueService();

router.get('/:id',
  validateIdParam,
  handleValidationErrors,
  async (req, res) => {
    try {
      const status = await queueService.getJobStatus(req.params.id);
      
      if (!status) {
        return res.status(404).json(responseHelper.error(
          new Error('Job not found'),
          404
        ));
      }

      res.json(responseHelper.success(status, { endpoint: 'status' }));
    } catch (error) {
      res.status(500).json(responseHelper.error(
        new Error('Failed to retrieve job status'),
        500
      ));
    }
  }
);

export default router;
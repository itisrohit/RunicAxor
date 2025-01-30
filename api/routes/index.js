import express from 'express';
import executeRouter from './execute.js';
import healthRouter from './health.js';
import statusRouter from './status.js';
import { readFileSync } from 'fs';
import { responseHelper } from '../utils/responseHelper.js';

const router = express.Router();
const packageJson = JSON.parse(readFileSync('./package.json'));

// Base endpoint
router.get('/', (req, res) => {
  res.json(responseHelper.success({
    name: packageJson.name,
    version: packageJson.version,
    documentation: '/api/v1/docs',
    endpoints: [
      '/api/v1/execute',
      '/api/v1/health',
      '/api/v1/status/:id'
    ]
  }));
});

// API v1 routes
router.use('/api/v1/execute', executeRouter);
router.use('/api/v1/health', healthRouter);
router.use('/api/v1/status', statusRouter);

// Documentation redirect
router.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

export default router;
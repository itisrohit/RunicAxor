import { DockerExecution } from './dockerExecution.js';
import { config } from '../config/default.js';
import logger from '../middlewares/logger.js';
import { responseHelper } from '../utils/responseHelper.js';

export class ExecutionService {
  constructor() {
    this.executor = new DockerExecution();
    this.cache = new Map(); // Simple in-memory cache
  }

  async executeCode(payload) {
    const { language, code, input } = payload;
    const cacheKey = this.getCacheKey(language, code, input);
    
    try {
      if (this.cache.has(cacheKey)) {
        return this.handleCacheHit(cacheKey);
      }

      const result = await this.executor.execute({ language, code, input });
      const processed = this.processResult(result);
      
      this.cache.set(cacheKey, processed);
      return responseHelper.success(processed);
      
    } catch (error) {
      logger.error('Execution failed', { error, language });
      return responseHelper.error({
        message: 'Execution failed',
        details: this.sanitizeError(error.message)
      }, 500);
    }
  }

  processResult(result) {
    return {
      output: result.stdout,
      error: result.stderr,
      exitCode: result.exitCode,
      stats: {
        memoryUsed: 0, // Implement actual measurement
        cpuTime: 0
      }
    };
  }

  getCacheKey(lang, code, input) {
    return `${lang}-${Buffer.from(code).toString('base64url')}-${Buffer.from(input).toString('base64url')}`;
  }

  handleCacheHit(cacheKey) {
    logger.debug('Cache hit', { cacheKey });
    return responseHelper.success(this.cache.get(cacheKey), { cached: true });
  }

  sanitizeError(message) {
    return message.replace(/(api_?key|token|password)=[\w-]+/gi, '$1=*****');
  }
}
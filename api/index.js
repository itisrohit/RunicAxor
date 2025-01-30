import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/default.js';
import { securityConfig } from './config/security.js';
import { requestLogger, requestContext, errorHandler } from './middlewares';
import routes from './routes';
import { createWorker } from './config/bullmq.js';
import { redisClient } from './config/redis.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

export class Server {
  constructor() {
    this.app = express();
    this.port = config.app.port;
    this.env = config.app.env;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeWorkers();
  }

  initializeMiddlewares() {
    // Security first
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"]
        }
      }
    }));
    
    this.app.use(cors(securityConfig.corsConfig));
    this.app.use(express.json({ limit: config.app.maxFileSize }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request context and logging
    this.app.use(requestContext);
    this.app.use(requestLogger);
  }

  initializeRoutes() {
    this.app.use('/', routes);
  }

  initializeSwagger() {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.app.get('/openapi.yaml', (req, res) => 
      res.sendFile(path.join(__dirname, '../docs/openapi.yaml'))
    );
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  initializeWorkers() {
    this.worker = createWorker();
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  async gracefulShutdown() {
    console.info('Shutting down gracefully...');
    
    try {
      await this.worker.close();
      await redisClient.quit();
      this.server.close(() => {
        console.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Force shutdown after timeout');
        process.exit(1);
      }, 10000);
    } catch (error) {
      console.error('Graceful shutdown failed', error);
      process.exit(1);
    }
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.info(`
        ██████╗  ██████╗ ██████╗ ███████╗
        ██╔══██╗██╔═══██╗██╔══██╗██╔════╝
        ██║  ██║██║   ██║██████╔╝█████╗  
        ██║  ██║██║   ██║██╔══██╗██╔══╝  
        ██████╔╝╚██████╔╝██║  ██║███████╗
        ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝
        
        Environment: ${this.env}
        API Docs: http://localhost:${this.port}/api-docs
        Health Check: http://localhost:${this.port}/api/v1/health
      `);
    });

    this.server.on('error', (error) => {
      console.error('Server startup failed', error);
      process.exit(1);
    });

    return this.server;
  }
}

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const server = new Server();
  server.start();
}
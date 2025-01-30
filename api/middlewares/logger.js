import winston from 'winston';
import { LokiTransport } from 'winston-loki';
import { config } from '../config/default.js';

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

if (config.app.env === 'production') {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://loki:3100',
      labels: { service: 'code-engine-api' },
      format: winston.format.json(),
      onConnectionError: (err) => console.error('Loki connection error', err)
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

export const logger = winston.createLogger({
  level: config.app.env === 'development' ? 'debug' : 'info',
  transports,
  exceptionHandlers: transports,
  rejectionHandlers: transports,
  exitOnError: false
});

// Morgan stream integration
export const morganStream = {
  write: (message) => {
    const status = parseInt(message.split(' ')[3]);
    if (status >= 400) {
      logger.error(message.trim());
    } else {
      logger.info(message.trim());
    }
  }
};
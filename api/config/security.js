import { body, header } from 'express-validator';
import config from './default.js';

// Input sanitization patterns
const DANGEROUS_PATTERNS = [
  /process\.env/,
  /fs\./,
  /child_process/,
  /eval\(/,
  /require\(/,
  /socket\(/,
  /Function\(/,
  /exec\(/i,
  /spawn\(/i
];

export const securityConfig = {
  // Input validation middleware
  validateInput: [
    body('code').isString().trim().escape()
      .withMessage('Invalid code input')
      .isLength({ max: config.app.maxCodeSize })
      .withMessage('Code exceeds maximum size'),
    
    body('input').optional().isString().trim()
      .isLength({ max: config.app.maxInputSize })
      .withMessage('Input exceeds maximum size'),
    
    body('language').isIn(config.app.supportedLanguages)
      .withMessage('Unsupported language'),
    
    header('x-api-key').exists()
      .withMessage('API key required')
  ],

  // API key validation
  apiKeyValidator: (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== config.security.apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  },

  // Input sanitizer
  sanitizeInput: (input) => {
    if (DANGEROUS_PATTERNS.some(pattern => pattern.test(input))) {
      throw new Error('Potentially dangerous input detected');
    }
    return input.replace(/[^\x20-\x7F]/g, '');
  },

  // Security headers middleware
  securityHeaders: (req, res, next) => {
    res.set({
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'",
      'X-XSS-Protection': '1; mode=block'
    });
    next();
  },

  // CORS configuration
  corsConfig: {
    origin: config.security.cors.allowedOrigins,
    methods: config.security.cors.methods,
    allowedHeaders: ['Content-Type', 'x-api-key'],
    maxAge: 600
  }
};
import { body, param, validationResult } from 'express-validator';
import { config } from '../config/default.js';
import { securityConfig } from '../config/security.js';

/**
 * Code Execution Request Validator
 */
export const validateExecutionRequest = [
  body('code')
    .isString().withMessage('Code must be a string')
    .bail()
    .isLength({ max: config.app.maxCodeSize })
    .withMessage(`Code exceeds maximum size of ${config.app.maxCodeSize}`)
    .customSanitizer(code => code.replace(/[^\x20-\x7F]/g, '')), // ASCII only

  body('language')
    .isIn(config.app.supportedLanguages)
    .withMessage(`Unsupported language. Allowed: ${config.app.supportedLanguages.join(', ')}`),

  body('input')
    .optional()
    .isString()
    .isLength({ max: config.app.maxInputSize })
    .withMessage(`Input exceeds maximum size of ${config.app.maxInputSize}`)
    .customSanitizer(input => securityConfig.sanitizeInput(input)),

  body('files')
    .optional()
    .isArray({ max: 5 }).withMessage('Maximum 5 files allowed')
    .custom(files => files.every(f => 
      f.name && f.content && 
      f.name.length <= 255 &&
      Buffer.byteLength(f.content) <= 1024 * 1024 // 1MB
    )).withMessage('Invalid file structure')
];

/**
 * File Upload Validator
 */
export const validateFileUpload = [
  body('file')
    .custom((_, { req }) => {
      if (!req.file) throw new Error('File required');
      if (req.file.size > config.app.maxFileSize) {
        throw new Error(`File size exceeds ${config.app.maxFileSize}`);
      }
      if (!config.allowedMimeTypes.includes(req.file.mimetype)) {
        throw new Error(`Unsupported file type: ${req.file.mimetype}`);
      }
      return true;
    })
];

/**
 * ID Parameter Validator
 */
export const validateIdParam = [
  param('id')
    .isUUID('4').withMessage('Invalid ID format')
];

/**
 * Validation Error Formatter
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      responseHelper.error({
        message: 'Validation failed',
        errors: errors.array()
      }, 400)
    );
  }
  next();
};

/**
 * Custom Validators
 */
export const customValidators = {
  isAllowedLanguage: (value) => config.app.supportedLanguages.includes(value),
  isSafeFilename: (value) => /^[\w\-.]{1,255}$/.test(value),
  isExecutionInput: (value) => 
    Buffer.byteLength(value) <= config.app.maxInputSize
};
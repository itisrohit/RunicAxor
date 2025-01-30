import { config } from '../config/default.js';

/**
 * Standard API response formatter
 */
export const responseHelper = {
  success: (data, meta = {}) => ({
    success: true,
    data: filterSensitive(data),
    meta: {
      timestamp: new Date().toISOString(),
      env: config.app.env,
      ...meta
    }
  }),

  error: (error, code) => ({
    success: false,
    error: {
      code: code || 500,
      message: error.message,
      details: config.app.env === 'development' ? error.stack : undefined,
      validation: error.errors
    }
  }),

  paginated: (items, pagination) => ({
    success: true,
    data: filterSensitive(items),
    pagination: {
      total: pagination.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    }
  })
};

// Security: Filter sensitive fields from responses
const filterSensitive = (data) => {
  if (!data) return data;
  
  const redact = (obj) => {
    const sensitive = ['password', 'token', 'apiKey', 'secret'];
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !sensitive.includes(key))
    );
  };

  return Array.isArray(data) 
    ? data.map(redact)
    : redact(data);
};
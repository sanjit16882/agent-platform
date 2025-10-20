import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Request validation middleware factory
 */
export function validateRequest(schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    try {
      // Validate request body
      if (schema.body) {
        const { error } = schema.body.validate(req.body);
        if (error) {
          errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      // Validate query parameters
      if (schema.query) {
        const { error } = schema.query.validate(req.query);
        if (error) {
          errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      // Validate path parameters
      if (schema.params) {
        const { error } = schema.params.validate(req.params);
        if (error) {
          errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      // Validate headers
      if (schema.headers) {
        const { error } = schema.headers.validate(req.headers);
        if (error) {
          errors.push(`Headers: ${error.details.map(d => d.message).join(', ')}`);
        }
      }

      if (errors.length > 0) {
        throw new AppError(
          'Request validation failed',
          400,
          'VALIDATION_ERROR',
          { errors }
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Validation middleware error:', error);
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
      }
    }
  };
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    next(new AppError('Input sanitization failed', 400, 'SANITIZATION_ERROR'));
  }
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize a string to prevent XSS and injection attacks
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  return str
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove or escape potentially dangerous characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=/gi, '')
    // Limit length to prevent DoS
    .substring(0, 10000);
}

/**
 * Content-Type validation middleware
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation for GET requests and requests without body
    if (req.method === 'GET' || req.method === 'HEAD' || !req.body) {
      return next();
    }

    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      throw new AppError(
        'Content-Type header is required',
        400,
        'MISSING_CONTENT_TYPE'
      );
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      throw new AppError(
        `Unsupported Content-Type. Allowed types: ${allowedTypes.join(', ')}`,
        415,
        'UNSUPPORTED_CONTENT_TYPE',
        { contentType, allowedTypes }
      );
    }

    next();
  };
}

/**
 * Request size validation middleware
 */
export function validateRequestSize(maxSizeBytes: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      
      if (size > maxSizeBytes) {
        throw new AppError(
          `Request too large. Maximum size: ${maxSizeBytes} bytes`,
          413,
          'REQUEST_TOO_LARGE',
          { size, maxSize: maxSizeBytes }
        );
      }
    }

    next();
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // ID parameter validation
  id: Joi.object({
    id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).required()
  }),

  // Agent ID parameter validation
  agentId: Joi.object({
    agentId: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).required()
  }),

  // Execution ID parameter validation
  executionId: Joi.object({
    executionId: Joi.string().pattern(/^exec_[a-zA-Z0-9]+$/).required()
  }),

  // API Key ID parameter validation
  keyId: Joi.object({
    keyId: Joi.string().pattern(/^ak_[a-zA-Z0-9]+$/).required()
  }),

  // Search query validation
  search: Joi.object({
    search: Joi.string().min(1).max(100).optional(),
    category: Joi.string().min(1).max(50).optional(),
    status: Joi.string().valid('active', 'inactive', 'deprecated').optional()
  }),

  // Execution query validation
  executionQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('queued', 'running', 'completed', 'failed', 'timeout', 'cancelled').optional(),
    agentId: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).optional()
  })
};

/**
 * Validate execution input based on agent schema
 */
export function validateAgentInput(agentInputSchema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { inputs } = req.body;

      if (!inputs || typeof inputs !== 'object') {
        throw new AppError(
          'Agent inputs are required and must be an object',
          400,
          'INVALID_INPUTS'
        );
      }

      // Basic validation against agent schema
      if (agentInputSchema.required) {
        for (const field of agentInputSchema.required) {
          if (!(field in inputs)) {
            throw new AppError(
              `Required field '${field}' is missing from inputs`,
              400,
              'MISSING_REQUIRED_FIELD',
              { field, required: agentInputSchema.required }
            );
          }
        }
      }

      // Validate field types if schema provides them
      if (agentInputSchema.properties) {
        for (const [field, schema] of Object.entries(agentInputSchema.properties)) {
          if (field in inputs) {
            const fieldSchema = schema as any;
            const value = inputs[field];

            // Basic type validation
            if (fieldSchema.type && typeof value !== fieldSchema.type) {
              throw new AppError(
                `Field '${field}' must be of type ${fieldSchema.type}`,
                400,
                'INVALID_FIELD_TYPE',
                { field, expectedType: fieldSchema.type, actualType: typeof value }
              );
            }

            // Enum validation
            if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
              throw new AppError(
                `Field '${field}' must be one of: ${fieldSchema.enum.join(', ')}`,
                400,
                'INVALID_ENUM_VALUE',
                { field, value, allowedValues: fieldSchema.enum }
              );
            }
          }
        }
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Agent input validation error:', error);
        next(new AppError('Input validation failed', 400, 'VALIDATION_ERROR'));
      }
    }
  };
}
import { Request, Response } from 'express';
import Joi from 'joi';
import { ApiKey, CreateApiKeyRequest, ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from '../models/ApiKey';
import { ApiKeyRepository } from '../repositories/ApiKeyRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  private apiKeyRepo: ApiKeyRepository;
  private userRepo: UserRepository;

  constructor() {
    this.apiKeyRepo = new ApiKeyRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Validation schema for API key creation
   */
  private createApiKeySchema = Joi.object({
    name: Joi.string().min(1).max(100).required()
      .description('API key name for identification'),
    permissions: Joi.array().items(Joi.string().valid(...ALL_PERMISSIONS)).optional()
      .description('Array of permissions for the API key'),
    rateLimit: Joi.number().integer().min(1).max(10000).optional()
      .description('Rate limit per hour for this API key'),
    expiresAt: Joi.date().greater('now').optional()
      .description('Expiration date for the API key'),
    metadata: Joi.object().optional()
      .description('Additional metadata for the API key')
  });

  /**
   * Generate a new API key
   */
  generateApiKey = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const { error, value } = this.createApiKeySchema.validate(req.body);
    if (error) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        details: error.details.map(d => d.message)
      });
    }

    const createRequest: CreateApiKeyRequest = {
      name: value.name,
      permissions: value.permissions || DEFAULT_PERMISSIONS,
      rateLimit: value.rateLimit || 1000,
      expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
      metadata: value.metadata
    };

    // Ensure user exists
    if (!req.user) {
      throw new AppError('User context required', 401, 'AUTH_REQUIRED');
    }

    try {
      // Generate the actual API key value
      const apiKeyValue = ApiKey.generateApiKey();
      
      // Create API key in database
      const apiKey = await this.apiKeyRepo.create(req.user.id, apiKeyValue, createRequest);

      logger.info('API key generated', {
        userId: req.user.id,
        apiKeyId: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions
      });

      // Return the API key value (only time it's shown)
      res.status(201).json({
        message: 'API key created successfully',
        apiKey: {
          ...apiKey.toResponse(),
          key: apiKeyValue // Only returned once!
        },
        warning: 'Store this API key securely. It will not be shown again.'
      });
    } catch (error) {
      logger.error('Failed to generate API key:', error);
      throw new AppError('Failed to create API key', 500, 'CREATION_FAILED');
    }
  });

  /**
   * List user's API keys
   */
  listApiKeys = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User context required', 401, 'AUTH_REQUIRED');
    }

    try {
      const apiKeys = await this.apiKeyRepo.findByUserId(req.user.id);
      const usage = await this.apiKeyRepo.getUsageStats(req.user.id);

      res.json({
        apiKeys: apiKeys.map(key => key.toResponse()),
        usage,
        total: apiKeys.length
      });
    } catch (error) {
      logger.error('Failed to list API keys:', error);
      throw new AppError('Failed to retrieve API keys', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Get specific API key details
   */
  getApiKey = asyncHandler(async (req: Request, res: Response) => {
    const { keyId } = req.params;

    if (!req.user) {
      throw new AppError('User context required', 401, 'AUTH_REQUIRED');
    }

    try {
      const apiKey = await this.apiKeyRepo.findById(keyId);
      
      if (!apiKey) {
        throw new AppError('API key not found', 404, 'API_KEY_NOT_FOUND');
      }

      // Check ownership (non-admin users can only see their own keys)
      if (!req.user.isAdmin() && apiKey.userId !== req.user.id) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      res.json({
        apiKey: apiKey.toResponse()
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to get API key:', error);
      throw new AppError('Failed to retrieve API key', 500, 'RETRIEVAL_FAILED');
    }
  });

  /**
   * Revoke an API key
   */
  revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
    const { keyId } = req.params;

    if (!req.user) {
      throw new AppError('User context required', 401, 'AUTH_REQUIRED');
    }

    try {
      const apiKey = await this.apiKeyRepo.findById(keyId);
      
      if (!apiKey) {
        throw new AppError('API key not found', 404, 'API_KEY_NOT_FOUND');
      }

      // Check ownership (non-admin users can only revoke their own keys)
      if (!req.user.isAdmin() && apiKey.userId !== req.user.id) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      // Revoke the key
      const success = await this.apiKeyRepo.revoke(keyId);
      
      if (!success) {
        throw new AppError('Failed to revoke API key', 500, 'REVOCATION_FAILED');
      }

      logger.info('API key revoked', {
        userId: req.user.id,
        apiKeyId: keyId,
        revokedBy: req.user.id
      });

      res.json({
        message: 'API key revoked successfully',
        apiKeyId: keyId
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to revoke API key:', error);
      throw new AppError('Failed to revoke API key', 500, 'REVOCATION_FAILED');
    }
  });

  /**
   * Get API key permissions and descriptions
   */
  getPermissions = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      permissions: ALL_PERMISSIONS,
      defaults: DEFAULT_PERMISSIONS,
      descriptions: {
        'agent:read': 'View agent details and list agents',
        'agent:execute': 'Execute agents',
        'agent:create': 'Create new agents',
        'agent:update': 'Update existing agents',
        'agent:delete': 'Delete agents',
        'execution:read': 'View execution status and results',
        'execution:cancel': 'Cancel running executions',
        'webhook:create': 'Create webhook subscriptions',
        'webhook:read': 'View webhook configurations',
        'webhook:update': 'Update webhook configurations',
        'webhook:delete': 'Delete webhook subscriptions',
        'apikey:read': 'View API key information',
        'apikey:create': 'Create new API keys',
        'apikey:revoke': 'Revoke API keys',
        '*': 'Full administrative access'
      }
    });
  });

  /**
   * Get current user info (from API key)
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.apiKey) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    res.json({
      user: req.user.toResponse(),
      apiKey: {
        id: req.apiKey.id,
        name: req.apiKey.name,
        permissions: req.apiKey.permissions,
        rateLimit: req.apiKey.rateLimit,
        lastUsedAt: req.apiKey.lastUsedAt
      }
    });
  });

  /**
   * Admin only: Get all API keys
   */
  getAllApiKeys = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin()) {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    try {
      // This would need to be implemented in the repository
      const allKeys = await this.apiKeyRepo.findAllActive(limit + offset);
      const paginatedKeys = allKeys.slice(offset, offset + limit);
      const totalStats = await this.apiKeyRepo.getUsageStats();

      res.json({
        apiKeys: paginatedKeys.map(key => key.toResponse()),
        pagination: {
          page,
          limit,
          total: allKeys.length,
          pages: Math.ceil(allKeys.length / limit)
        },
        stats: totalStats
      });
    } catch (error) {
      logger.error('Failed to get all API keys:', error);
      throw new AppError('Failed to retrieve API keys', 500, 'RETRIEVAL_FAILED');
    }
  });
}
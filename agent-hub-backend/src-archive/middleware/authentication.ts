import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../models/ApiKey';
import { User } from '../models/User';
import { ApiKeyRepository } from '../repositories/ApiKeyRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';
import { auditService } from '../services/AuditService';

// Extend Express Request interface to include user and apiKey
declare global {
  namespace Express {
    interface Request {
      user?: User;
      apiKey?: ApiKey;
    }
  }
}

export class AuthenticationService {
  private apiKeyRepo: ApiKeyRepository;
  private userRepo: UserRepository;

  constructor() {
    this.apiKeyRepo = new ApiKeyRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Find API key by checking against all active keys
   * This is a simplified approach - in production you'd want better optimization
   */
  private async findApiKeyByValue(apiKeyValue: string): Promise<ApiKey | null> {
    // Get all active API keys and check each one
    // This is not optimal for large numbers of keys, but works for our use case
    const activeKeys = await this.apiKeyRepo.findAllActive();
    
    for (const key of activeKeys) {
      if (await ApiKey.verifyApiKey(apiKeyValue, key.keyHash)) {
        return key;
      }
    }
    
    return null;
  }

  /**
   * Extract API key from request headers
   */
  private extractApiKey(req: Request): string | null {
    // Check X-API-Key header first
    const apiKeyHeader = req.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Check Authorization header with Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Validate API key and load user context
   */
  async validateApiKey(apiKeyValue: string): Promise<{ user: User; apiKey: ApiKey }> {
    try {
      // For this implementation, we'll use a direct approach
      // In production, you'd want to optimize this with caching and better indexing
      
      let matchedApiKey: ApiKey | null = null;
      
      // Since we can't reverse hash the API key, we need to check against stored hashes
      // This is a simplified approach - we'll check by trying to validate against recent keys
      
      // First, try to find by creating a hash and checking (this won't work with bcrypt)
      // Instead, we'll need to implement a different approach
      
      // For now, let's use a direct database query approach
      // We'll store the first few characters of the key for quick lookup
      
      // Extract key prefix for faster lookup
      const keyPrefix = apiKeyValue.substring(0, 8); // First 8 characters
      
      // This is a simplified approach - in production you'd want better security
      matchedApiKey = await this.findApiKeyByValue(apiKeyValue);

      if (!matchedApiKey) {
        throw new AppError('Invalid API key', 401, 'INVALID_API_KEY');
      }

      // Check if API key is valid (not expired, not revoked)
      if (!matchedApiKey.isValid()) {
        const reason = matchedApiKey.revoked ? 'revoked' : 'expired';
        throw new AppError(`API key is ${reason}`, 401, 'INVALID_API_KEY', { reason });
      }

      // Load user
      const user = await this.userRepo.findById(matchedApiKey.userId);
      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      // Update last used timestamp (async, don't wait)
      this.apiKeyRepo.updateLastUsed(matchedApiKey.id).catch(err => {
        logger.warn('Failed to update API key last used timestamp:', err);
      });

      return { user, apiKey: matchedApiKey };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('API key validation error:', error);
      throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
    }
  }

  /**
   * Authentication middleware
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKeyValue = this.extractApiKey(req);
      
      if (!apiKeyValue) {
        throw new AppError('API key required', 401, 'API_KEY_REQUIRED', {
          hint: 'Provide API key in X-API-Key header or Authorization: Bearer <key>'
        });
      }

      const { user, apiKey } = await this.validateApiKey(apiKeyValue);
      
      // Attach user and API key to request
      req.user = user;
      req.apiKey = apiKey;

      // Log successful authentication
      logger.debug('Authentication successful', {
        userId: user.id,
        apiKeyId: apiKey.id,
        userRole: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Audit log successful authentication
      auditService.logAuthentication(
        true,
        user.id,
        apiKey.id,
        req.ip,
        req.get('User-Agent'),
        req.requestId
      ).catch(err => logger.warn('Failed to log authentication audit:', err));

      next();
    } catch (error) {
      // Log authentication failure
      logger.warn('Authentication failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Audit log failed authentication
      auditService.logAuthentication(
        false,
        undefined,
        undefined,
        req.ip,
        req.get('User-Agent'),
        req.requestId,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ).catch(err => logger.warn('Failed to log authentication audit:', err));

      next(error);
    }
  };

  /**
   * Authorization middleware - check permissions
   */
  authorize = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user || !req.apiKey) {
          throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
        }

        // Check if API key has required permission
        if (!req.apiKey.hasPermission(requiredPermission)) {
          throw new AppError(
            `Permission denied. Required: ${requiredPermission}`,
            403,
            'PERMISSION_DENIED',
            { required: requiredPermission, available: req.apiKey.permissions }
          );
        }

        // Check if user role allows this action
        if (!req.user.canPerform(requiredPermission)) {
          throw new AppError(
            `User role '${req.user.role}' cannot perform this action`,
            403,
            'ROLE_PERMISSION_DENIED',
            { userRole: req.user.role, required: requiredPermission }
          );
        }

        next();
      } catch (error) {
        logger.warn('Authorization failed', {
          userId: req.user?.id,
          userRole: req.user?.role,
          apiKeyId: req.apiKey?.id,
          requiredPermission,
          availablePermissions: req.apiKey?.permissions,
          ip: req.ip,
          url: req.url,
          method: req.method
        });

        next(error);
      }
    };
  };

  /**
   * Optional authentication middleware (doesn't fail if no API key)
   */
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKeyValue = this.extractApiKey(req);
      
      if (apiKeyValue) {
        const { user, apiKey } = await this.validateApiKey(apiKeyValue);
        req.user = user;
        req.apiKey = apiKey;
      }

      next();
    } catch (error) {
      // For optional auth, we don't fail on auth errors
      logger.debug('Optional authentication failed, continuing without auth', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        url: req.url
      });
      next();
    }
  };

  /**
   * Admin-only middleware
   */
  requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      if (!req.user.isAdmin()) {
        throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Create singleton instance
export const authService = new AuthenticationService();

// Export middleware functions
export const authenticate = authService.authenticate;
export const authorize = authService.authorize;
export const optionalAuthenticate = authService.optionalAuthenticate;
export const requireAdmin = authService.requireAdmin;
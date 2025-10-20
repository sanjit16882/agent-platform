import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'"
  );

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * IP whitelist/blacklist middleware
 */
export function ipFilter(options: {
  whitelist?: string[];
  blacklist?: string[];
  trustProxy?: boolean;
}) {
  const { whitelist, blacklist, trustProxy = true } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const clientIp = trustProxy ? 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip :
        req.ip;

      // Check blacklist first
      if (blacklist && blacklist.includes(clientIp)) {
        logger.warn('Blocked request from blacklisted IP', { ip: clientIp });
        throw new AppError('Access denied', 403, 'IP_BLOCKED');
      }

      // Check whitelist if configured
      if (whitelist && whitelist.length > 0 && !whitelist.includes(clientIp)) {
        logger.warn('Blocked request from non-whitelisted IP', { ip: clientIp });
        throw new AppError('Access denied', 403, 'IP_NOT_WHITELISTED');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Request origin validation
 */
export function validateOrigin(allowedOrigins: string[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('Origin') || req.get('Referer');
    
    if (!origin) {
      // Allow requests without origin (e.g., direct API calls)
      return next();
    }

    if (allowedOrigins.length === 0) {
      // No restrictions if no origins specified
      return next();
    }

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.startsWith('*.')) {
        // Wildcard subdomain matching
        const domain = allowed.substring(2);
        return origin.endsWith(domain);
      }
      return origin === allowed || origin.startsWith(allowed + '/');
    });

    if (!isAllowed) {
      logger.warn('Blocked request from unauthorized origin', { 
        origin, 
        allowedOrigins 
      });
      throw new AppError('Unauthorized origin', 403, 'UNAUTHORIZED_ORIGIN');
    }

    next();
  };
}

/**
 * User-Agent validation (basic bot detection)
 */
export function validateUserAgent(req: Request, res: Response, next: NextFunction): void {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    logger.warn('Request without User-Agent header', { ip: req.ip });
    // Don't block, just log for monitoring
  }

  // Basic bot detection patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i
  ];

  const isSuspicious = userAgent && suspiciousPatterns.some(pattern => 
    pattern.test(userAgent)
  );

  if (isSuspicious) {
    logger.info('Suspicious User-Agent detected', { 
      userAgent, 
      ip: req.ip,
      url: req.url 
    });
    
    // Add flag for potential rate limiting adjustment
    req.headers['x-suspicious-ua'] = 'true';
  }

  next();
}

/**
 * Request method validation
 */
export function validateMethod(allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!allowedMethods.includes(req.method)) {
      throw new AppError(
        `Method ${req.method} not allowed`,
        405,
        'METHOD_NOT_ALLOWED',
        { method: req.method, allowedMethods }
      );
    }

    next();
  };
}

/**
 * Request timeout middleware
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          timeout: timeoutMs
        });

        res.status(408).json({
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * API versioning middleware
 */
export function apiVersioning(supportedVersions: string[] = ['v1']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Extract version from URL path (e.g., /api/v1/...)
    const versionMatch = req.path.match(/^\/api\/([^\/]+)/);
    const requestedVersion = versionMatch ? versionMatch[1] : 'v1';

    if (!supportedVersions.includes(requestedVersion)) {
      throw new AppError(
        `API version ${requestedVersion} not supported`,
        400,
        'UNSUPPORTED_API_VERSION',
        { 
          requestedVersion, 
          supportedVersions,
          hint: `Use one of: ${supportedVersions.map(v => `/api/${v}`).join(', ')}`
        }
      );
    }

    // Add version info to request
    req.apiVersion = requestedVersion;

    next();
  };
}

/**
 * Request ID middleware (for tracing)
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.get('X-Request-ID') || 
                   req.get('X-Correlation-ID') || 
                   generateRequestId();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return 'req_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Comprehensive security middleware stack
 */
export function securityMiddleware(options: {
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  allowedOrigins?: string[];
  requestTimeoutMs?: number;
  trustProxy?: boolean;
} = {}) {
  const {
    ipWhitelist,
    ipBlacklist,
    allowedOrigins,
    requestTimeoutMs = 30000,
    trustProxy = true
  } = options;

  const middlewares = [
    requestId,
    securityHeaders,
    validateUserAgent,
    requestTimeout(requestTimeoutMs),
    apiVersioning()
  ];

  // Add IP filtering if configured
  if (ipWhitelist || ipBlacklist) {
    middlewares.push(ipFilter({ 
      whitelist: ipWhitelist, 
      blacklist: ipBlacklist, 
      trustProxy 
    }));
  }

  // Add origin validation if configured
  if (allowedOrigins) {
    middlewares.push(validateOrigin(allowedOrigins));
  }

  return middlewares;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      apiVersion?: string;
    }
  }
}
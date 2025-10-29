import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { securityMiddleware } from './middleware/security';
import { createIpRateLimit } from './middleware/rateLimiting';
import { sanitizeInput, validateContentType, validateRequestSize } from './middleware/validation';
import { apiRoutes } from './routes';
import { swaggerSetup } from './config/swagger';
import { initializeDatabase } from './database/connection';
import { initializeRedis } from './config/redis';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env['PORT'] || 3002;

// Basic security with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Enhanced security middleware stack
const corsOrigin = process.env['CORS_ORIGIN'];
securityMiddleware({
  allowedOrigins: corsOrigin ? [corsOrigin] : [],
  requestTimeoutMs: 30000,
  trustProxy: true
}).forEach(middleware => app.use(middleware));

// CORS configuration
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  credentials: process.env['CORS_CREDENTIALS'] === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Request validation and sanitization
app.use(validateRequestSize(10 * 1024 * 1024)); // 10MB limit
app.use(validateContentType(['application/json', 'application/x-www-form-urlencoded']));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Rate limiting for unauthenticated endpoints
app.use('/api/v1/agents', createIpRateLimit({ maxRequests: 50, windowMs: 60000 }));
app.use('/api/docs', createIpRateLimit({ maxRequests: 10, windowMs: 60000 }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// API documentation
swaggerSetup(app);

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Initialize Redis (optional - will fallback to in-memory if not available)
    try {
      await initializeRedis();
      logger.info('Redis initialized successfully');
    } catch (error) {
      logger.warn('Redis initialization failed, using in-memory rate limiting:', error);
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`AgentHub API Gateway started on port ${PORT}`);
      logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server };
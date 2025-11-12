/**
 * Health Check Routes
 * 
 * Provides health and readiness endpoints for the testing service
 */

const express = require('express');
const router = express.Router();
const { config } = require('../config/testing');

// In-memory health status
let healthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: 0,
  checks: {}
};

/**
 * Check database connection
 * @param {object} db - Database connection
 * @returns {Promise<boolean>} - Connection status
 */
async function checkDatabaseConnection(db) {
  return new Promise((resolve) => {
    if (!db) {
      resolve(false);
      return;
    }
    
    const timeout = setTimeout(() => {
      resolve(false);
    }, config.health.dbTimeout);
    
    db.get('SELECT 1', (err) => {
      clearTimeout(timeout);
      resolve(!err);
    });
  });
}

/**
 * Check file system access
 * @returns {Promise<boolean>} - File system status
 */
async function checkFileSystem() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const testFile = path.join(__dirname, '../data/.health_check');
    await fs.writeFile(testFile, 'ok');
    await fs.unlink(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * GET /health
 * 
 * Health check endpoint for monitoring
 * Returns overall service health status
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Get database connection from app locals
    const db = req.app.locals.db;
    
    // Perform health checks
    const checks = {
      database: await checkDatabaseConnection(db),
      fileSystem: await checkFileSystem(),
      memory: process.memoryUsage().heapUsed < process.memoryUsage().heapTotal * 0.9,
    };
    
    // Determine overall status
    const allHealthy = Object.values(checks).every(check => check === true);
    const status = allHealthy ? 'healthy' : 'unhealthy';
    
    // Update health status
    healthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      checks,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Return appropriate status code
    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /ready
 * 
 * Readiness check endpoint for Kubernetes/load balancers
 * Returns whether service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Check critical dependencies
    const dbReady = await checkDatabaseConnection(db);
    
    if (dbReady) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        reason: 'Database not ready'
      });
    }
    
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /live
 * 
 * Liveness check endpoint for Kubernetes
 * Returns whether service is alive (basic check)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /metrics
 * 
 * Basic metrics endpoint
 * Returns service metrics for monitoring
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  
  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid
  });
});

module.exports = router;

// Request monitoring middleware to track dashboard request patterns
import express from 'express';

interface RequestStats {
  endpoint: string;
  count: number;
  lastRequest: Date;
  averageInterval: number;
  requestTimes: number[];
}

class RequestMonitor {
  private stats = new Map<string, RequestStats>();
  private readonly MAX_HISTORY = 10; // Keep last 10 request times for average calculation

  logRequest(endpoint: string): void {
    const now = Date.now();
    const existing = this.stats.get(endpoint);

    if (existing) {
      // Calculate interval since last request
      const interval = now - existing.lastRequest.getTime();
      
      // Update request times history
      existing.requestTimes.push(interval);
      if (existing.requestTimes.length > this.MAX_HISTORY) {
        existing.requestTimes.shift();
      }

      // Calculate average interval
      const avgInterval = existing.requestTimes.reduce((sum, time) => sum + time, 0) / existing.requestTimes.length;

      // Update stats
      existing.count++;
      existing.lastRequest = new Date(now);
      existing.averageInterval = avgInterval;

      // Log warning if requests are too frequent
      if (avgInterval < 30000) { // Less than 30 seconds
        console.warn(`⚠️ Frequent requests detected for ${endpoint}: avg interval ${(avgInterval / 1000).toFixed(1)}s`);
      }
    } else {
      // First request for this endpoint
      this.stats.set(endpoint, {
        endpoint,
        count: 1,
        lastRequest: new Date(now),
        averageInterval: 0,
        requestTimes: []
      });
    }
  }

  getStats(): RequestStats[] {
    return Array.from(this.stats.values());
  }

  getStatsForEndpoint(endpoint: string): RequestStats | undefined {
    return this.stats.get(endpoint);
  }

  resetStats(): void {
    this.stats.clear();
    console.log('📊 Request monitoring stats reset');
  }

  // Get endpoints with potentially excessive request patterns
  getProblematicEndpoints(): RequestStats[] {
    return Array.from(this.stats.values()).filter(stat => 
      stat.averageInterval > 0 && stat.averageInterval < 60000 && stat.count > 5
    );
  }
}

const requestMonitor = new RequestMonitor();

// Middleware function
export const requestMonitorMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Only monitor dashboard-related endpoints
  const dashboardEndpoints = [
    '/api/v1/finops/dashboard',
    '/api/v1/analytics/executions',
    '/api/v1/cloudwatch/metrics',
    '/api/v1/agents'
  ];

  if (dashboardEndpoints.some(endpoint => req.path.includes(endpoint))) {
    requestMonitor.logRequest(req.path);
  }

  next();
};

// Stats endpoint for monitoring
export const getRequestStats = (_req: express.Request, res: express.Response) => {
  const stats = requestMonitor.getStats();
  const problematic = requestMonitor.getProblematicEndpoints();

  res.json({
    success: true,
    data: {
      allEndpoints: stats,
      problematicEndpoints: problematic,
      summary: {
        totalEndpoints: stats.length,
        problematicCount: problematic.length,
        timestamp: new Date().toISOString()
      }
    }
  });
};

export { requestMonitor };
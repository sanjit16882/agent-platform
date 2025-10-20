import { execute } from '../database/connection';
import { logger } from '../utils/logger';

export interface AuditLogEntry {
  userId?: string;
  apiKeyId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Log an audit event
   */
  async logEvent(entry: AuditLogEntry): Promise<void> {
    const id = this.generateId();
    
    const sql = `
      INSERT INTO audit_logs (
        id, user_id, api_key_id, action, resource_type, resource_id,
        ip_address, user_agent, request_id, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      entry.userId || null,
      entry.apiKeyId || null,
      entry.action,
      entry.resourceType,
      entry.resourceId || null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.requestId || null,
      entry.details ? JSON.stringify(entry.details) : null,
      new Date().toISOString()
    ];

    try {
      await execute(sql, params);
      
      logger.debug('Audit event logged', {
        id,
        action: entry.action,
        resourceType: entry.resourceType,
        userId: entry.userId
      });
    } catch (error) {
      // Don't throw errors for audit logging failures
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    success: boolean,
    userId?: string,
    apiKeyId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      apiKeyId,
      action: success ? 'auth.success' : 'auth.failure',
      resourceType: 'authentication',
      ipAddress,
      userAgent,
      requestId,
      details
    });
  }

  /**
   * Log API key operations
   */
  async logApiKeyOperation(
    action: 'create' | 'revoke' | 'access',
    userId: string,
    apiKeyId: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      apiKeyId,
      action: `apikey.${action}`,
      resourceType: 'api_key',
      resourceId: apiKeyId,
      ipAddress,
      userAgent,
      requestId,
      details
    });
  }

  /**
   * Log agent execution events
   */
  async logAgentExecution(
    action: 'start' | 'complete' | 'fail' | 'cancel',
    userId: string,
    agentId: string,
    executionId: string,
    apiKeyId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      apiKeyId,
      action: `execution.${action}`,
      resourceType: 'agent_execution',
      resourceId: executionId,
      ipAddress,
      userAgent,
      requestId,
      details: {
        agentId,
        executionId,
        ...details
      }
    });
  }

  /**
   * Log rate limiting events
   */
  async logRateLimit(
    userId?: string,
    apiKeyId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      apiKeyId,
      action: 'rate_limit.exceeded',
      resourceType: 'rate_limit',
      ipAddress,
      userAgent,
      requestId,
      details
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    violation: string,
    userId?: string,
    apiKeyId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      apiKeyId,
      action: `security.${violation}`,
      resourceType: 'security',
      ipAddress,
      userAgent,
      requestId,
      details
    });
  }

  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(options: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = options;

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (resourceType) {
      sql += ' AND resource_type = ?';
      params.push(resourceType);
    }

    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate.toISOString());
    }

    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate.toISOString());
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const { query } = await import('../database/connection');
      const rows = await query(sql, params);
      
      return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        apiKeyId: row.api_key_id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        requestId: row.request_id,
        details: row.details ? JSON.parse(row.details) : null,
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw new Error('Failed to retrieve audit logs');
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number;
    authEvents: number;
    executionEvents: number;
    securityEvents: number;
    rateLimitEvents: number;
  }> {
    const timeframeSql = {
      hour: "datetime('now', '-1 hour')",
      day: "datetime('now', '-1 day')",
      week: "datetime('now', '-7 days')",
      month: "datetime('now', '-30 days')"
    };

    const sql = `
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN action LIKE 'auth.%' THEN 1 ELSE 0 END) as auth_events,
        SUM(CASE WHEN action LIKE 'execution.%' THEN 1 ELSE 0 END) as execution_events,
        SUM(CASE WHEN action LIKE 'security.%' THEN 1 ELSE 0 END) as security_events,
        SUM(CASE WHEN action LIKE 'rate_limit.%' THEN 1 ELSE 0 END) as rate_limit_events
      FROM audit_logs 
      WHERE created_at >= ${timeframeSql[timeframe]}
    `;

    try {
      const { queryOne } = await import('../database/connection');
      const row = await queryOne(sql);
      
      return {
        totalEvents: row?.total_events || 0,
        authEvents: row?.auth_events || 0,
        executionEvents: row?.execution_events || 0,
        securityEvents: row?.security_events || 0,
        rateLimitEvents: row?.rate_limit_events || 0
      };
    } catch (error) {
      logger.error('Failed to get audit stats:', error);
      throw new Error('Failed to retrieve audit statistics');
    }
  }

  /**
   * Generate unique audit log ID
   */
  private generateId(): string {
    return 'audit_' + require('crypto').randomBytes(16).toString('hex');
  }
}

// Export singleton instance
export const auditService = new AuditService();
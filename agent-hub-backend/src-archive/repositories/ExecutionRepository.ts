import { Execution, ExecutionData, CreateExecutionRequest } from '../models/Execution';
import { query, queryOne, execute } from '../database/connection';
import { logger } from '../utils/logger';

export class ExecutionRepository {
  /**
   * Create a new execution
   */
  async create(userId: string, apiKeyId: string | undefined, request: CreateExecutionRequest): Promise<Execution> {
    const id = Execution.generateId();
    const now = new Date();

    const data: ExecutionData = {
      id,
      agentId: request.agentId,
      userId,
      apiKeyId,
      inputs: request.inputs,
      status: 'queued',
      progress: 0,
      sync: request.sync || false,
      timeout: request.timeout || 300,
      createdAt: now,
      metadata: request.metadata
    };

    const sql = `
      INSERT INTO executions (
        id, agent_id, user_id, api_key_id, inputs, status, progress,
        sync, timeout, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.id,
      data.agentId,
      data.userId,
      data.apiKeyId || null,
      JSON.stringify(data.inputs),
      data.status,
      data.progress,
      data.sync ? 1 : 0,
      data.timeout,
      data.createdAt.toISOString(),
      data.metadata ? JSON.stringify(data.metadata) : null
    ];

    try {
      await execute(sql, params);
      logger.info('Execution created', { 
        id: data.id, 
        agentId: data.agentId, 
        userId, 
        sync: data.sync 
      });
      return new Execution(data);
    } catch (error) {
      logger.error('Failed to create execution:', error);
      throw new Error('Failed to create execution');
    }
  }

  /**
   * Find execution by ID
   */
  async findById(id: string): Promise<Execution | null> {
    const sql = `
      SELECT * FROM executions 
      WHERE id = ?
    `;

    try {
      const row = await queryOne<any>(sql, [id]);
      if (!row) {
        return null;
      }

      return this.mapRowToExecution(row);
    } catch (error) {
      logger.error('Failed to find execution by ID:', error);
      throw new Error('Failed to find execution');
    }
  }

  /**
   * Find executions by user ID
   */
  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Execution[]> {
    const sql = `
      SELECT * FROM executions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query<any>(sql, [userId, limit, offset]);
      return rows.map(row => this.mapRowToExecution(row));
    } catch (error) {
      logger.error('Failed to find executions by user ID:', error);
      throw new Error('Failed to find executions');
    }
  }

  /**
   * Find executions by agent ID
   */
  async findByAgentId(agentId: string, limit: number = 50, offset: number = 0): Promise<Execution[]> {
    const sql = `
      SELECT * FROM executions 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query<any>(sql, [agentId, limit, offset]);
      return rows.map(row => this.mapRowToExecution(row));
    } catch (error) {
      logger.error('Failed to find executions by agent ID:', error);
      throw new Error('Failed to find executions');
    }
  }

  /**
   * Update execution
   */
  async update(execution: Execution): Promise<void> {
    const data = execution.toDatabase();
    
    const sql = `
      UPDATE executions 
      SET status = ?, progress = ?, results = ?, error = ?, 
          started_at = ?, completed_at = ?, duration = ?
      WHERE id = ?
    `;

    const params = [
      data.status,
      data.progress,
      data.results ? JSON.stringify(data.results) : null,
      data.error || null,
      data.startedAt?.toISOString() || null,
      data.completedAt?.toISOString() || null,
      data.duration || null,
      data.id
    ];

    try {
      await execute(sql, params);
      logger.debug('Execution updated', { id: execution.id, status: execution.status });
    } catch (error) {
      logger.error('Failed to update execution:', error);
      throw new Error('Failed to update execution');
    }
  }

  /**
   * Find running executions (for timeout cleanup)
   */
  async findRunning(): Promise<Execution[]> {
    const sql = `
      SELECT * FROM executions 
      WHERE status IN ('queued', 'running')
      ORDER BY created_at ASC
    `;

    try {
      const rows = await query<any>(sql);
      return rows.map(row => this.mapRowToExecution(row));
    } catch (error) {
      logger.error('Failed to find running executions:', error);
      throw new Error('Failed to find running executions');
    }
  }

  /**
   * Find timed out executions
   */
  async findTimedOut(): Promise<Execution[]> {
    const sql = `
      SELECT * FROM executions 
      WHERE status IN ('queued', 'running') 
      AND datetime(created_at, '+' || timeout || ' seconds') < datetime('now')
    `;

    try {
      const rows = await query<any>(sql);
      return rows.map(row => this.mapRowToExecution(row));
    } catch (error) {
      logger.error('Failed to find timed out executions:', error);
      throw new Error('Failed to find timed out executions');
    }
  }

  /**
   * Get execution statistics
   */
  async getStats(userId?: string): Promise<{
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    timeout: number;
    cancelled: number;
  }> {
    const baseWhere = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId] : [];

    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM executions 
      ${baseWhere}
    `;

    try {
      const row = await queryOne<any>(sql, params);
      return {
        total: row?.total || 0,
        queued: row?.queued || 0,
        running: row?.running || 0,
        completed: row?.completed || 0,
        failed: row?.failed || 0,
        timeout: row?.timeout || 0,
        cancelled: row?.cancelled || 0
      };
    } catch (error) {
      logger.error('Failed to get execution stats:', error);
      throw new Error('Failed to get execution statistics');
    }
  }

  /**
   * Delete old executions (cleanup)
   */
  async deleteOld(olderThanDays: number = 30): Promise<number> {
    const sql = `
      DELETE FROM executions 
      WHERE created_at < datetime('now', '-' || ? || ' days')
      AND status IN ('completed', 'failed', 'timeout', 'cancelled')
    `;

    try {
      const result = await execute(sql, [olderThanDays]);
      
      if (result.changes > 0) {
        logger.info('Deleted old executions', { count: result.changes, olderThanDays });
      }
      
      return result.changes;
    } catch (error) {
      logger.error('Failed to delete old executions:', error);
      throw new Error('Failed to delete old executions');
    }
  }

  /**
   * Map database row to Execution instance
   */
  private mapRowToExecution(row: any): Execution {
    const data: ExecutionData = {
      id: row.id,
      agentId: row.agent_id,
      userId: row.user_id,
      apiKeyId: row.api_key_id || undefined,
      inputs: JSON.parse(row.inputs),
      status: row.status,
      progress: row.progress,
      results: row.results ? JSON.parse(row.results) : undefined,
      error: row.error || undefined,
      sync: row.sync === 1,
      timeout: row.timeout,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      duration: row.duration || undefined,
      createdAt: new Date(row.created_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };

    return new Execution(data);
  }
}
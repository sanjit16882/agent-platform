import { ApiKey, ApiKeyData, CreateApiKeyRequest } from '../models/ApiKey';
import { query, queryOne, execute } from '../database/connection';
import { logger } from '../utils/logger';

export class ApiKeyRepository {
  /**
   * Create a new API key
   */
  async create(userId: string, apiKey: string, request: CreateApiKeyRequest): Promise<ApiKey> {
    const id = ApiKey.generateId();
    const keyHash = await ApiKey.hashApiKey(apiKey);
    const now = new Date();

    const data: ApiKeyData = {
      id,
      userId,
      name: request.name,
      keyHash,
      permissions: request.permissions || ['agent:read', 'agent:execute', 'execution:read'],
      rateLimit: request.rateLimit || 1000,
      createdAt: now,
      expiresAt: request.expiresAt || null,
      lastUsedAt: null,
      revoked: false,
      metadata: request.metadata
    };

    const sql = `
      INSERT INTO api_keys (
        id, user_id, name, key_hash, permissions, rate_limit,
        created_at, expires_at, last_used_at, revoked, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.id,
      data.userId,
      data.name,
      data.keyHash,
      JSON.stringify(data.permissions),
      data.rateLimit,
      data.createdAt.toISOString(),
      data.expiresAt?.toISOString() || null,
      data.lastUsedAt?.toISOString() || null,
      data.revoked ? 1 : 0,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];

    try {
      await execute(sql, params);
      logger.info('API key created', { id: data.id, userId, name: data.name });
      return new ApiKey(data);
    } catch (error) {
      logger.error('Failed to create API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  /**
   * Find API key by hash
   */
  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const sql = `
      SELECT * FROM api_keys 
      WHERE key_hash = ? AND revoked = 0
    `;

    try {
      const row = await queryOne<any>(sql, [keyHash]);
      if (!row) {
        return null;
      }

      return this.mapRowToApiKey(row);
    } catch (error) {
      logger.error('Failed to find API key by hash:', error);
      throw new Error('Failed to find API key');
    }
  }

  /**
   * Find API key by ID
   */
  async findById(id: string): Promise<ApiKey | null> {
    const sql = `
      SELECT * FROM api_keys 
      WHERE id = ?
    `;

    try {
      const row = await queryOne<any>(sql, [id]);
      if (!row) {
        return null;
      }

      return this.mapRowToApiKey(row);
    } catch (error) {
      logger.error('Failed to find API key by ID:', error);
      throw new Error('Failed to find API key');
    }
  }

  /**
   * Find all API keys for a user
   */
  async findByUserId(userId: string): Promise<ApiKey[]> {
    const sql = `
      SELECT * FROM api_keys 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    try {
      const rows = await query<any>(sql, [userId]);
      return rows.map(row => this.mapRowToApiKey(row));
    } catch (error) {
      logger.error('Failed to find API keys by user ID:', error);
      throw new Error('Failed to find API keys');
    }
  }

  /**
   * Update API key last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    const sql = `
      UPDATE api_keys 
      SET last_used_at = ? 
      WHERE id = ?
    `;

    try {
      await execute(sql, [new Date().toISOString(), id]);
    } catch (error) {
      logger.error('Failed to update API key last used:', error);
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Revoke an API key
   */
  async revoke(id: string): Promise<boolean> {
    const sql = `
      UPDATE api_keys 
      SET revoked = 1 
      WHERE id = ?
    `;

    try {
      const result = await execute(sql, [id]);
      const success = result.changes > 0;
      
      if (success) {
        logger.info('API key revoked', { id });
      }
      
      return success;
    } catch (error) {
      logger.error('Failed to revoke API key:', error);
      throw new Error('Failed to revoke API key');
    }
  }

  /**
   * Delete expired API keys
   */
  async deleteExpired(): Promise<number> {
    const sql = `
      DELETE FROM api_keys 
      WHERE expires_at IS NOT NULL AND expires_at < ?
    `;

    try {
      const result = await execute(sql, [new Date().toISOString()]);
      
      if (result.changes > 0) {
        logger.info('Deleted expired API keys', { count: result.changes });
      }
      
      return result.changes;
    } catch (error) {
      logger.error('Failed to delete expired API keys:', error);
      throw new Error('Failed to delete expired API keys');
    }
  }

  /**
   * Find all active API keys (for authentication validation)
   */
  async findAllActive(limit: number = 1000): Promise<ApiKey[]> {
    const sql = `
      SELECT * FROM api_keys 
      WHERE revoked = 0 AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY last_used_at DESC, created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query<any>(sql, [new Date().toISOString(), limit]);
      return rows.map(row => this.mapRowToApiKey(row));
    } catch (error) {
      logger.error('Failed to find active API keys:', error);
      throw new Error('Failed to find active API keys');
    }
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(userId?: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
  }> {
    const baseWhere = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId] : [];

    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN revoked = 0 AND (expires_at IS NULL OR expires_at > ?) THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= ? THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN revoked = 1 THEN 1 ELSE 0 END) as revoked
      FROM api_keys 
      ${baseWhere}
    `;

    const now = new Date().toISOString();
    const queryParams = [now, now, ...params];

    try {
      const row = await queryOne<any>(sql, queryParams);
      return {
        total: row?.total || 0,
        active: row?.active || 0,
        expired: row?.expired || 0,
        revoked: row?.revoked || 0
      };
    } catch (error) {
      logger.error('Failed to get API key usage stats:', error);
      throw new Error('Failed to get usage statistics');
    }
  }

  /**
   * Map database row to ApiKey instance
   */
  private mapRowToApiKey(row: any): ApiKey {
    const data: ApiKeyData = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      keyHash: row.key_hash,
      permissions: JSON.parse(row.permissions),
      rateLimit: row.rate_limit,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
      revoked: row.revoked === 1,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };

    return new ApiKey(data);
  }
}
import { User, UserData, CreateUserRequest } from '../models/User';
import { query, queryOne, execute } from '../database/connection';
import { logger } from '../utils/logger';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(request: CreateUserRequest): Promise<User> {
    const id = User.generateId();
    const now = new Date();

    const data: UserData = {
      id,
      email: request.email,
      name: request.name,
      role: request.role || 'user',
      createdAt: now,
      updatedAt: now,
      active: true,
      metadata: request.metadata
    };

    const sql = `
      INSERT INTO users (
        id, email, name, role, created_at, updated_at, active, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.id,
      data.email,
      data.name,
      data.role,
      data.createdAt.toISOString(),
      data.updatedAt.toISOString(),
      data.active ? 1 : 0,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];

    try {
      await execute(sql, params);
      logger.info('User created', { id: data.id, email: data.email });
      return new User(data);
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT * FROM users 
      WHERE id = ? AND active = 1
    `;

    try {
      const row = await queryOne<any>(sql, [id]);
      if (!row) {
        return null;
      }

      return this.mapRowToUser(row);
    } catch (error) {
      logger.error('Failed to find user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT * FROM users 
      WHERE email = ? AND active = 1
    `;

    try {
      const row = await queryOne<any>(sql, [email]);
      if (!row) {
        return null;
      }

      return this.mapRowToUser(row);
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find all users (admin only)
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const sql = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query<any>(sql, [limit, offset]);
      return rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      logger.error('Failed to find all users:', error);
      throw new Error('Failed to find users');
    }
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<Pick<UserData, 'name' | 'role' | 'active' | 'metadata'>>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    user.update(updates);
    const userData = user.toDatabase();

    const sql = `
      UPDATE users 
      SET name = ?, role = ?, active = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `;

    const params = [
      userData.name,
      userData.role,
      userData.active ? 1 : 0,
      userData.metadata ? JSON.stringify(userData.metadata) : null,
      userData.updatedAt.toISOString(),
      id
    ];

    try {
      const result = await execute(sql, params);
      
      if (result.changes > 0) {
        logger.info('User updated', { id });
        return user;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(id: string): Promise<boolean> {
    const sql = `
      UPDATE users 
      SET active = 0, updated_at = ?
      WHERE id = ?
    `;

    try {
      const result = await execute(sql, [new Date().toISOString(), id]);
      const success = result.changes > 0;
      
      if (success) {
        logger.info('User deactivated', { id });
      }
      
      return success;
    } catch (error) {
      logger.error('Failed to deactivate user:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    admins: number;
    users: number;
    viewers: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN role = 'admin' AND active = 1 THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'user' AND active = 1 THEN 1 ELSE 0 END) as users,
        SUM(CASE WHEN role = 'viewer' AND active = 1 THEN 1 ELSE 0 END) as viewers
      FROM users
    `;

    try {
      const row = await queryOne<any>(sql);
      return {
        total: row?.total || 0,
        active: row?.active || 0,
        admins: row?.admins || 0,
        users: row?.users || 0,
        viewers: row?.viewers || 0
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  /**
   * Map database row to User instance
   */
  private mapRowToUser(row: any): User {
    const data: UserData = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      active: row.active === 1,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };

    return new User(data);
  }
}
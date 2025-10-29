export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  metadata?: Record<string, any>;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role?: 'admin' | 'user' | 'viewer';
  metadata?: Record<string, any>;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly role: 'admin' | 'user' | 'viewer';
  public readonly createdAt: Date;
  public updatedAt: Date;
  public active: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(data: UserData) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.active = data.active;
    this.metadata = data.metadata;
  }

  /**
   * Generate a unique user ID
   */
  static generateId(): string {
    return 'user_' + require('crypto').randomBytes(16).toString('hex');
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Check if user can perform a specific action
   */
  canPerform(action: string): boolean {
    switch (this.role) {
      case 'admin':
        return true; // Admin can do everything
      case 'user':
        return ![
          'user:create',
          'user:delete',
          'system:configure'
        ].includes(action);
      case 'viewer':
        return action.includes(':read') || action.includes(':view');
      default:
        return false;
    }
  }

  /**
   * Update user information
   */
  update(updates: Partial<Pick<UserData, 'name' | 'role' | 'active' | 'metadata'>>): void {
    if (updates.name !== undefined) {
      (this as any).name = updates.name;
    }
    if (updates.role !== undefined) {
      (this as any).role = updates.role;
    }
    if (updates.active !== undefined) {
      this.active = updates.active;
    }
    if (updates.metadata !== undefined) {
      (this as any).metadata = updates.metadata;
    }
    this.updatedAt = new Date();
  }

  /**
   * Convert to response format
   */
  toResponse(): UserResponse {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      active: this.active
    };
  }

  /**
   * Convert to database format
   */
  toDatabase(): UserData {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      active: this.active,
      metadata: this.metadata
    };
  }
}
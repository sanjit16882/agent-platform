import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  rateLimit: number;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revoked: boolean;
  metadata?: Record<string, any>;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  rateLimit?: number;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revoked: boolean;
  // Note: keyHash is never returned in responses for security
}

export class ApiKey {
  public readonly id: string;
  public readonly userId: string;
  public readonly name: string;
  public readonly keyHash: string;
  public readonly permissions: string[];
  public readonly rateLimit: number;
  public readonly createdAt: Date;
  public readonly expiresAt: Date | null;
  public lastUsedAt: Date | null;
  public revoked: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(data: ApiKeyData) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.keyHash = data.keyHash;
    this.permissions = data.permissions;
    this.rateLimit = data.rateLimit;
    this.createdAt = data.createdAt;
    this.expiresAt = data.expiresAt;
    this.lastUsedAt = data.lastUsedAt;
    this.revoked = data.revoked;
    this.metadata = data.metadata;
  }

  /**
   * Generate a new API key with secure random bytes
   */
  static generateApiKey(): string {
    const prefix = process.env.API_KEY_PREFIX || 'ak_';
    const keyLength = parseInt(process.env.API_KEY_LENGTH || '32');
    const randomBytes = crypto.randomBytes(keyLength);
    return prefix + randomBytes.toString('hex');
  }

  /**
   * Hash an API key for secure storage
   */
  static async hashApiKey(apiKey: string): Promise<string> {
    const saltRounds = parseInt(process.env.API_KEY_HASH_ROUNDS || '10');
    return bcrypt.hash(apiKey, saltRounds);
  }

  /**
   * Verify an API key against its hash
   */
  static async verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
    return bcrypt.compare(apiKey, hash);
  }

  /**
   * Generate a unique API key ID
   */
  static generateId(): string {
    return 'ak_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Check if the API key is valid (not expired, not revoked)
   */
  isValid(): boolean {
    if (this.revoked) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if the API key has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission) || this.permissions.includes('*');
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }

  /**
   * Revoke the API key
   */
  revoke(): void {
    this.revoked = true;
  }

  /**
   * Convert to response format (excludes sensitive data)
   */
  toResponse(): ApiKeyResponse {
    return {
      id: this.id,
      name: this.name,
      permissions: this.permissions,
      rateLimit: this.rateLimit,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      lastUsedAt: this.lastUsedAt,
      revoked: this.revoked
    };
  }

  /**
   * Convert to database format
   */
  toDatabase(): ApiKeyData {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      keyHash: this.keyHash,
      permissions: this.permissions,
      rateLimit: this.rateLimit,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      lastUsedAt: this.lastUsedAt,
      revoked: this.revoked,
      metadata: this.metadata
    };
  }
}

// Default permissions for API keys
export const DEFAULT_PERMISSIONS = [
  'agent:read',
  'agent:execute',
  'execution:read'
];

// All available permissions
export const ALL_PERMISSIONS = [
  'agent:read',
  'agent:execute',
  'agent:create',
  'agent:update',
  'agent:delete',
  'execution:read',
  'execution:cancel',
  'webhook:create',
  'webhook:read',
  'webhook:update',
  'webhook:delete',
  'apikey:read',
  'apikey:create',
  'apikey:revoke',
  '*' // Admin permission
];

// Permission descriptions for documentation
export const PERMISSION_DESCRIPTIONS = {
  'agent:read': 'View agent details and list agents',
  'agent:execute': 'Execute agents',
  'agent:create': 'Create new agents',
  'agent:update': 'Update existing agents',
  'agent:delete': 'Delete agents',
  'execution:read': 'View execution status and results',
  'execution:cancel': 'Cancel running executions',
  'webhook:create': 'Create webhook subscriptions',
  'webhook:read': 'View webhook configurations',
  'webhook:update': 'Update webhook configurations',
  'webhook:delete': 'Delete webhook subscriptions',
  'apikey:read': 'View API key information',
  'apikey:create': 'Create new API keys',
  'apikey:revoke': 'Revoke API keys',
  '*': 'Full administrative access'
};
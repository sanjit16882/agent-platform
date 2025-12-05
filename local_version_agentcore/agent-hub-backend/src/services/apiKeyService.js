// Simple API Key Management Service
const crypto = require('crypto');

class APIKeyService {
  constructor() {
    // In-memory storage for demo (in production, use database)
    this.apiKeys = new Map();
    this.keyUsage = new Map();
    
    // Generate some demo keys
    this.generateDemoKeys();
  }

  generateDemoKeys() {
    // Create system API key for internal frontend operations
    const systemKey = 'sk-agenthub-system-internal-frontend-key';
    this.apiKeys.set(systemKey, {
      userId: 'system',
      name: 'System Internal Key',
      permissions: ['*'], // Full permissions for system operations
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      status: 'active'
    });

    // Create some demo API keys for testing
    const demoKeys = [
      {
        userId: 'demo-user-1',
        name: 'Demo Development Key',
        permissions: ['agents.read', 'agents.execute', 's3.read']
      },
      {
        userId: 'demo-user-2', 
        name: 'Demo Production Key',
        permissions: ['agents.read', 'agents.execute', 's3.read', 's3.write']
      }
    ];

    demoKeys.forEach(keyData => {
      const apiKey = this.generateAPIKey();
      this.apiKeys.set(apiKey, {
        ...keyData,
        createdAt: new Date(),
        lastUsed: null,
        usageCount: 0,
        status: 'active'
      });
    });

    console.log('✅ Demo API keys generated (including system key)');
  }

  generateAPIKey() {
    // Generate a secure API key
    const prefix = 'sk-agenthub';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}-${randomBytes}`;
  }

  createAPIKey(userId, name, permissions = []) {
    const apiKey = this.generateAPIKey();
    
    const keyData = {
      userId,
      name,
      permissions,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      status: 'active'
    };

    this.apiKeys.set(apiKey, keyData);
    
    console.log(`🔑 API key created for user ${userId}: ${name}`);
    
    return {
      apiKey,
      ...keyData
    };
  }

  validateAPIKey(apiKey) {
    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    // Remove 'Bearer ' prefix if present
    const cleanKey = apiKey.replace(/^Bearer\s+/, '');
    
    const keyData = this.apiKeys.get(cleanKey);
    
    if (!keyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (keyData.status !== 'active') {
      return { valid: false, error: 'API key is inactive' };
    }

    // Update usage statistics
    keyData.lastUsed = new Date();
    keyData.usageCount += 1;
    
    return {
      valid: true,
      keyData: {
        userId: keyData.userId,
        name: keyData.name,
        permissions: keyData.permissions
      }
    };
  }

  hasPermission(apiKey, permission) {
    const validation = this.validateAPIKey(apiKey);
    if (!validation.valid) {
      return false;
    }

    return validation.keyData.permissions.includes(permission) || 
           validation.keyData.permissions.includes('*');
  }

  listAPIKeys(userId) {
    const userKeys = [];
    
    for (const [key, data] of this.apiKeys.entries()) {
      if (data.userId === userId) {
        userKeys.push({
          keyId: key.substring(0, 20) + '...',
          name: data.name,
          permissions: data.permissions,
          createdAt: data.createdAt,
          lastUsed: data.lastUsed,
          usageCount: data.usageCount,
          status: data.status
        });
      }
    }
    
    return userKeys;
  }

  getAllKeys() {
    const allKeys = [];
    
    for (const [key, data] of this.apiKeys.entries()) {
      allKeys.push({
        keyId: key.substring(0, 20) + '...',
        fullKey: key, // Include full key for demo purposes
        userId: data.userId,
        name: data.name,
        permissions: data.permissions,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        usageCount: data.usageCount,
        status: data.status
      });
    }
    
    return allKeys;
  }

  revokeAPIKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (keyData) {
      keyData.status = 'revoked';
      return true;
    }
    return false;
  }

  getUsageStats() {
    const stats = {
      totalKeys: this.apiKeys.size,
      activeKeys: 0,
      revokedKeys: 0,
      totalUsage: 0,
      recentUsage: 0
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [key, data] of this.apiKeys.entries()) {
      if (data.status === 'active') {
        stats.activeKeys++;
      } else if (data.status === 'revoked') {
        stats.revokedKeys++;
      }
      
      stats.totalUsage += data.usageCount;
      
      if (data.lastUsed && data.lastUsed > oneDayAgo) {
        stats.recentUsage += data.usageCount;
      }
    }

    return stats;
  }
}

module.exports = APIKeyService;
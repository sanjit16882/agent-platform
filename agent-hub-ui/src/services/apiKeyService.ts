// API Key Management Service for Frontend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export interface APIKey {
  apiKey: string;
  keyId?: string;
  fullKey?: string;
  userId: string;
  name: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  status: string;
}

export interface APIKeyStats {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  totalUsage: number;
  recentUsage: number;
}

class APIKeyManagementService {
  private baseUrl = `${API_BASE_URL}/api/v1/auth`;

  /**
   * Generate a new API key
   */
  async generateAPIKey(name: string, userId: string, permissions?: string[]): Promise<APIKey> {
    try {
      const response = await fetch(`${this.baseUrl}/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          userId,
          permissions: permissions || ['agents.read', 'agents.execute']
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate API key');
      }

      return data.data;
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  }

  /**
   * List all API keys
   */
  async listAPIKeys(): Promise<APIKey[]> {
    try {
      const response = await fetch(`${this.baseUrl}/keys`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to list API keys');
      }

      return data.data;
    } catch (error) {
      console.error('Error listing API keys:', error);
      throw error;
    }
  }

  /**
   * Get API key usage statistics
   */
  async getAPIKeyStats(): Promise<APIKeyStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get API key stats');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting API key stats:', error);
      throw error;
    }
  }

  /**
   * Validate an API key
   */
  async validateAPIKey(apiKey: string): Promise<{ valid: boolean; keyData?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to validate API key');
      }

      return data.data;
    } catch (error) {
      console.error('Error validating API key:', error);
      throw error;
    }
  }

  /**
   * Generate a demo API key for testing
   */
  async generateDemoKey(): Promise<APIKey> {
    const timestamp = Date.now();
    const userId = `demo-user-${timestamp}`;
    const name = `Demo Key ${new Date().toLocaleString()}`;
    
    return this.generateAPIKey(name, userId, [
      'agents.read',
      'agents.execute', 
      's3.read',
      's3.write'
    ]);
  }

  /**
   * Test API key with actual endpoint
   */
  async testAPIKey(apiKey: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: `API key is valid! Found ${data.count} agents.`,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.error || 'API key test failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `API key test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get available permissions
   */
  getAvailablePermissions(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'agents.read',
        label: 'Read Agents',
        description: 'List and view agent information'
      },
      {
        value: 'agents.execute',
        label: 'Execute Agents',
        description: 'Run agent executions'
      },
      {
        value: 's3.read',
        label: 'Read S3 Agents',
        description: 'List and view custom S3 agents'
      },
      {
        value: 's3.write',
        label: 'Write S3 Agents',
        description: 'Create and modify custom S3 agents'
      },
      {
        value: 'admin',
        label: 'Admin Access',
        description: 'Full administrative access'
      }
    ];
  }
}

export const apiKeyService = new APIKeyManagementService();
export default apiKeyService;
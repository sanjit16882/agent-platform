const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export interface S3Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  purpose?: string;
  customProcessingLogic?: string;
  inputSchema?: any;
  outputSchema?: any;
  capabilities?: string[];
}

class S3AgentService {
  private baseUrl = `${API_BASE_URL}/api/v1/agents/s3`;

  /**
   * Get all agents from S3
   */
  async getAllAgents(): Promise<S3Agent[]> {
    try {
      console.log('🔍 S3AgentService: Fetching from URL:', this.baseUrl);
      
      const response = await fetch(this.baseUrl);
      console.log('✅ S3 API response status:', response.status);
      
      const data = await response.json();
      console.log('✅ S3 API response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch agents');
      }
      
      const agents = data.data || [];
      console.log('✅ S3 agents parsed:', agents.length, agents);
      
      return agents;
    } catch (error) {
      console.error('❌ Error fetching agents from S3:', error);
      throw error;
    }
  }

  /**
   * Get specific agent from S3
   */
  async getAgent(agentId: string): Promise<S3Agent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}`);
      const data = await response.json();
      
      if (!data.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.error || 'Failed to fetch agent');
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error fetching agent ${agentId} from S3:`, error);
      throw error;
    }
  }

  /**
   * Save agent to S3
   */
  async saveAgent(agent: Partial<S3Agent>): Promise<S3Agent> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save agent');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error saving agent to S3:', error);
      throw error;
    }
  }

  /**
   * Update agent in S3
   */
  async updateAgent(agentId: string, updates: Partial<S3Agent>): Promise<S3Agent> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update agent');
      }
      
      return data.data;
    } catch (error) {
      console.error(`Error updating agent ${agentId} in S3:`, error);
      throw error;
    }
  }

  /**
   * Delete agent from S3
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete agent');
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting agent ${agentId} from S3:`, error);
      throw error;
    }
  }

  /**
   * Migrate agents from localStorage to S3
   */
  async migrateFromLocalStorage(localStorageAgents: any[]): Promise<S3Agent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agents: localStorageAgents }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to migrate agents');
      }
      
      console.log(`✅ Migration complete: ${data.migrated}/${data.total} agents migrated`);
      return data.data;
    } catch (error) {
      console.error('Error migrating agents to S3:', error);
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch agent stats');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      throw error;
    }
  }

  /**
   * Convert localStorage agent format to S3 format
   */
  convertLocalStorageAgent(localAgent: any): Partial<S3Agent> {
    return {
      id: localAgent.id,
      name: localAgent.name || 'Unnamed Agent',
      description: localAgent.description || 'Custom agent',
      category: localAgent.category || 'Custom',
      status: localAgent.status || 'active',
      purpose: localAgent.purpose,
      customProcessingLogic: localAgent.customProcessingLogic,
      inputSchema: localAgent.inputSchema,
      outputSchema: localAgent.outputSchema,
      capabilities: localAgent.capabilities || []
    };
  }
}

export const s3AgentService = new S3AgentService();
export default s3AgentService;
// Real Agent API Service - Replaces mock execution with actual backend calls

export interface AgentConfig {
  id: string;
  name: string;
  category: 'QE' | 'DevOps' | 'Security' | 'Business';
  type: 'production' | 'demo';
  capabilities: string[];
  inputSchema: any;
  outputSchema: any;
}

export interface ExecutionRequest {
  inputs: {
    requirements?: string;
    input?: string;
    analysisType?: string;
    outputFormat?: string;
    framework?: string;
    infrastructureData?: string;
    codeOrConfig?: string;
    businessData?: string;
    scanType?: string;
    [key: string]: any; // Allow additional properties
  };
  sync?: boolean;
  timeout?: number;
  metadata?: any;
}

export interface ExecutionResult {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  results?: any;
  duration?: number;
  sync?: boolean;
  message?: string;
  statusUrl?: string;
  resultsUrl?: string;
  error?: string;
}

class AgentApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback to our backend server
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  }

  async getAgents(): Promise<AgentConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<AgentConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.agent : null;
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw error;
    }
  }

  async executeAgent(agentId: string, request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both sync and async responses
      if (response.status === 202) {
        // Asynchronous execution
        return {
          executionId: data.executionId,
          status: data.status,
          message: data.message,
          statusUrl: data.statusUrl,
          resultsUrl: data.resultsUrl
        };
      } else {
        // Synchronous execution
        return {
          executionId: data.executionId,
          status: data.status,
          results: data.results,
          duration: data.duration,
          sync: data.sync
        };
      }
    } catch (error) {
      console.error('Error executing agent:', error);
      throw error;
    }
  }

  async getExecution(executionId: string): Promise<ExecutionResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching execution:', error);
      throw error;
    }
  }

  async getAgentStats(agentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      throw error;
    }
  }

  async getUserExecutions(limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/executions?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.getUserId()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching user executions:', error);
      throw error;
    }
  }

  // Helper method to get user ID (you can customize this based on your auth system)
  private getUserId(): string {
    // For now, generate a simple user ID based on session
    let userId = localStorage.getItem('agent-hub-user-id');
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('agent-hub-user-id', userId);
    }
    return userId;
  }

  // Test connection to the API
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connected to:', data.service || 'Agent API');
        return true;
      }
      return false;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export const agentApiService = new AgentApiService();
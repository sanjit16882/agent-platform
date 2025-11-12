// API Configuration for Agent Hub UI
export const API_CONFIG = {
  // Backend API (Intelligence Layer + Production Agents)
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3002',
  
  // API Endpoints
  ENDPOINTS: {
    // Intelligence Layer
    INTELLIGENCE: {
      ANALYZE_QUERY: '/api/intelligence/analyze-query',
      EXECUTE_AGENT: '/api/intelligence/execute-agent',
      SUBMIT_FEEDBACK: '/api/intelligence/submit-feedback',
      LEARNING_INSIGHTS: '/api/intelligence/learning-insights',
      STATS: '/api/intelligence/stats',
      AGENTS: '/api/intelligence/agents'
    },
    
    // Production Agents
    AGENTS: {
      LIST: '/api/v1/agents',
      EXECUTE: '/api/v1/agents/{agentId}/execute',
      GET: '/api/v1/agents/{agentId}',
      S3_LIST: '/api/v1/agents/s3',
      S3_GET: '/api/v1/agents/s3/{agentId}',
      S3_SAVE: '/api/v1/agents/s3',
      S3_UPDATE: '/api/v1/agents/s3/{agentId}',
      S3_DELETE: '/api/v1/agents/s3/{agentId}'
    },
    
    // DevOps
    DEVOPS: {
      ANALYZE: '/api/devops/analyze',
      OPTIMIZE: '/api/devops/optimize',
      MONITOR: '/api/devops/monitor'
    },
    
    // MCP Servers
    MCP: {
      DATABASE: {
        STATUS: '/api/v1/mcp/database/status',
        EXECUTE_QUERY: '/api/v1/mcp/database/execute-query',
        GET_SCHEMA: '/api/v1/mcp/database/get-schema',
        GET_TABLE_INFO: '/api/v1/mcp/database/get-table-info',
        LIST_CONNECTIONS: '/api/v1/mcp/database/list-connections',
        TEST_CONNECTION: '/api/v1/mcp/database/test-connection'
      },
      GIT: {
        STATUS: '/api/v1/mcp/git/status',
        GIT_STATUS: '/api/v1/mcp/git/git-status',
        GIT_LOG: '/api/v1/mcp/git/git-log',
        GIT_DIFF: '/api/v1/mcp/git/git-diff',
        GIT_BRANCHES: '/api/v1/mcp/git/git-branches',
        LIST_REPOSITORIES: '/api/v1/mcp/git/list-repositories'
      },
      FILESYSTEM: {
        STATUS: '/api/v1/mcp/filesystem/status',
        READ_FILE: '/api/v1/mcp/filesystem/read-file',
        LIST_DIRECTORY: '/api/v1/mcp/filesystem/list-directory',
        GET_FILE_INFO: '/api/v1/mcp/filesystem/get-file-info',
        SEARCH_FILES: '/api/v1/mcp/filesystem/search-files'
      }
    },

    // Health & Auth
    HEALTH: '/health',
    AUTH: {
      KEYS: '/api/v1/auth/keys',
      VALIDATE: '/api/v1/auth/validate',
      STATS: '/api/v1/auth/stats'
    }
  }
};

// API Helper Functions
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.BACKEND_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      this.defaultHeaders['Authorization'] = apiKey;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Intelligence Layer Methods
  async analyzeQuery(query: string, userId?: string, context?: any) {
    return this.request(API_CONFIG.ENDPOINTS.INTELLIGENCE.ANALYZE_QUERY, {
      method: 'POST',
      body: JSON.stringify({
        query,
        userId: userId || localStorage.getItem('userId') || 'anonymous',
        sessionId: sessionStorage.getItem('sessionId'),
        projectContext: context?.projectContext,
        currentWorkspace: context?.currentWorkspace
      }),
    });
  }

  async executeAgent(agentId: string, inputs: any, userId?: string, executionStrategy?: string) {
    return this.request(API_CONFIG.ENDPOINTS.INTELLIGENCE.EXECUTE_AGENT, {
      method: 'POST',
      body: JSON.stringify({
        agentId,
        inputs,
        userId: userId || localStorage.getItem('userId') || 'anonymous',
        sessionId: sessionStorage.getItem('sessionId'),
        executionStrategy
      }),
    });
  }

  async submitFeedback(feedbackData: {
    userId?: string;
    query?: string;
    recommendedAgent: string;
    actualAgent?: string;
    feedback: 'positive' | 'negative' | 'neutral';
    rating?: number;
    category?: string;
    comment?: string;
    interactionId?: string;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.INTELLIGENCE.SUBMIT_FEEDBACK, {
      method: 'POST',
      body: JSON.stringify({
        ...feedbackData,
        userId: feedbackData.userId || localStorage.getItem('userId') || 'anonymous'
      }),
    });
  }

  async getLearningInsights(userId?: string) {
    const user = userId || localStorage.getItem('userId') || 'anonymous';
    return this.request(API_CONFIG.ENDPOINTS.INTELLIGENCE.LEARNING_INSIGHTS.replace('{userId}', user));
  }

  async getIntelligenceStats() {
    return this.request(API_CONFIG.ENDPOINTS.INTELLIGENCE.STATS);
  }

  async getAvailableAgents() {
    return this.request(API_CONFIG.ENDPOINTS.INTELLIGENCE.AGENTS);
  }

  // Production Agents Methods
  async listAgents() {
    return this.request(API_CONFIG.ENDPOINTS.AGENTS.LIST);
  }

  async executeProductionAgent(agentId: string, inputs: any) {
    const endpoint = API_CONFIG.ENDPOINTS.AGENTS.EXECUTE.replace('{agentId}', agentId);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  }

  async getAgent(agentId: string) {
    const endpoint = API_CONFIG.ENDPOINTS.AGENTS.GET.replace('{agentId}', agentId);
    return this.request(endpoint);
  }

  // S3 Agents Methods
  async listS3Agents() {
    return this.request(API_CONFIG.ENDPOINTS.AGENTS.S3_LIST);
  }

  async getS3Agent(agentId: string) {
    const endpoint = API_CONFIG.ENDPOINTS.AGENTS.S3_GET.replace('{agentId}', agentId);
    return this.request(endpoint);
  }

  async saveS3Agent(agentData: any) {
    return this.request(API_CONFIG.ENDPOINTS.AGENTS.S3_SAVE, {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  async updateS3Agent(agentId: string, updates: any) {
    const endpoint = API_CONFIG.ENDPOINTS.AGENTS.S3_UPDATE.replace('{agentId}', agentId);
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteS3Agent(agentId: string) {
    const endpoint = API_CONFIG.ENDPOINTS.AGENTS.S3_DELETE.replace('{agentId}', agentId);
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // DevOps Methods
  async analyzeDevOps(data: any) {
    return this.request(API_CONFIG.ENDPOINTS.DEVOPS.ANALYZE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async optimizeInfrastructure(data: any) {
    return this.request(API_CONFIG.ENDPOINTS.DEVOPS.OPTIMIZE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async monitorInfrastructure(data: any) {
    return this.request(API_CONFIG.ENDPOINTS.DEVOPS.MONITOR, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health Check
  async healthCheck() {
    return this.request(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Auth Methods
  async createApiKey(name: string, permissions: string[], userId: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.KEYS, {
      method: 'POST',
      body: JSON.stringify({ name, permissions, userId }),
    });
  }

  async validateApiKey(apiKey: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.VALIDATE, {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  async getAuthStats() {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.STATS);
  }

  // MCP Methods
  async getMCPDatabaseStatus() {
    return this.request(API_CONFIG.ENDPOINTS.MCP.DATABASE.STATUS);
  }

  async executeMCPDatabaseQuery(query: string, connection?: string, parameters?: any[]) {
    return this.request(API_CONFIG.ENDPOINTS.MCP.DATABASE.EXECUTE_QUERY, {
      method: 'POST',
      body: JSON.stringify({ query, connection, parameters }),
    });
  }

  async getMCPDatabaseSchema(connection?: string) {
    return this.request(API_CONFIG.ENDPOINTS.MCP.DATABASE.GET_SCHEMA, {
      method: 'POST',
      body: JSON.stringify({ connection }),
    });
  }

  async getMCPGitStatus() {
    return this.request(API_CONFIG.ENDPOINTS.MCP.GIT.STATUS);
  }

  async getMCPGitRepositoryStatus(repository?: string) {
    return this.request(API_CONFIG.ENDPOINTS.MCP.GIT.GIT_STATUS, {
      method: 'POST',
      body: JSON.stringify({ repository }),
    });
  }

  async getMCPGitLog(repository?: string, limit?: number, branch?: string) {
    return this.request(API_CONFIG.ENDPOINTS.MCP.GIT.GIT_LOG, {
      method: 'POST',
      body: JSON.stringify({ repository, limit, branch }),
    });
  }

  async getMCPFileSystemStatus() {
    return this.request(API_CONFIG.ENDPOINTS.MCP.FILESYSTEM.STATUS);
  }

  async readMCPFile(path: string) {
    return this.request(API_CONFIG.ENDPOINTS.MCP.FILESYSTEM.READ_FILE, {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async listMCPDirectory(path: string) {
    return this.request(API_CONFIG.ENDPOINTS.MCP.FILESYSTEM.LIST_DIRECTORY, {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const intelligenceApi = {
  analyzeQuery: (query: string, userId?: string, context?: any) => 
    apiClient.analyzeQuery(query, userId, context),
  
  executeAgent: (agentId: string, inputs: any, userId?: string, strategy?: string) => 
    apiClient.executeAgent(agentId, inputs, userId, strategy),
  
  submitFeedback: (feedbackData: any) => 
    apiClient.submitFeedback(feedbackData),
  
  getLearningInsights: (userId?: string) => 
    apiClient.getLearningInsights(userId),
  
  getStats: () => 
    apiClient.getIntelligenceStats(),
  
  getAgents: () => 
    apiClient.getAvailableAgents()
};

export const agentsApi = {
  list: () => apiClient.listAgents(),
  execute: (agentId: string, inputs: any) => apiClient.executeProductionAgent(agentId, inputs),
  get: (agentId: string) => apiClient.getAgent(agentId)
};

export const s3Api = {
  list: () => apiClient.listS3Agents(),
  get: (agentId: string) => apiClient.getS3Agent(agentId),
  save: (agentData: any) => apiClient.saveS3Agent(agentData),
  update: (agentId: string, updates: any) => apiClient.updateS3Agent(agentId, updates),
  delete: (agentId: string) => apiClient.deleteS3Agent(agentId)
};

export const devopsApi = {
  analyze: (data: any) => apiClient.analyzeDevOps(data),
  optimize: (data: any) => apiClient.optimizeInfrastructure(data),
  monitor: (data: any) => apiClient.monitorInfrastructure(data)
};

export const mcpApi = {
  database: {
    status: () => apiClient.getMCPDatabaseStatus(),
    executeQuery: (query: string, connection?: string, parameters?: any[]) => 
      apiClient.executeMCPDatabaseQuery(query, connection, parameters),
    getSchema: (connection?: string) => apiClient.getMCPDatabaseSchema(connection)
  },
  git: {
    status: () => apiClient.getMCPGitStatus(),
    repositoryStatus: (repository?: string) => apiClient.getMCPGitRepositoryStatus(repository),
    log: (repository?: string, limit?: number, branch?: string) => 
      apiClient.getMCPGitLog(repository, limit, branch)
  },
  filesystem: {
    status: () => apiClient.getMCPFileSystemStatus(),
    readFile: (path: string) => apiClient.readMCPFile(path),
    listDirectory: (path: string) => apiClient.listMCPDirectory(path)
  }
};
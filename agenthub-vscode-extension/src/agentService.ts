import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';
import { Agent, AgentExecutionResult, AgentHubConfig } from './types';

export class AgentService {
  private client: AxiosInstance;
  private config: AgentHubConfig;

  constructor() {
    this.config = this.loadConfig();
    this.client = this.createClient();
    
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('agenthub')) {
        this.config = this.loadConfig();
        this.client = this.createClient();
      }
    });
  }

  private loadConfig(): AgentHubConfig {
    const config = vscode.workspace.getConfiguration('agenthub');
    return {
      apiUrl: config.get('apiUrl', 'http://localhost:3002'),
      apiKey: config.get('apiKey', ''),
      defaultAgent: config.get('defaultAgent', ''),
      autoGenerateTests: config.get('autoGenerateTests', false),
      autoSecurityScan: config.get('autoSecurityScan', true),
      showStatusBar: config.get('showStatusBar', true),
      outputLevel: config.get('outputLevel', 'normal')
    };
  }

  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  async listAgents(): Promise<Agent[]> {
    try {
      const response = await this.client.get('/api/agents');
      return response.data.agents || [];
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return [];
    }
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const response = await this.client.get(`/api/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch agent ${agentId}:`, error);
      return null;
    }
  }

  async executeAgent(agentId: string, input: any): Promise<AgentExecutionResult> {
    try {
      const response = await this.client.post(`/api/agents/${agentId}/execute`, {
        input
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {},
        error: error.response?.data?.message || error.message || 'Unknown error'
      };
    }
  }

  async generateTests(filePath: string, sourceCode: string, options: any = {}): Promise<AgentExecutionResult> {
    return this.executeAgent('test-generator', {
      source_code: sourceCode,
      file_path: filePath,
      context: {
        ...options,
        language: this.detectLanguage(filePath),
        framework: options.framework || 'jest'
      }
    });
  }

  async analyzeSecurity(filePath: string, sourceCode: string, options: any = {}): Promise<AgentExecutionResult> {
    return this.executeAgent('security-scanner', {
      source_code: sourceCode,
      file_path: filePath,
      context: {
        ...options,
        language: this.detectLanguage(filePath),
        severity: options.severity || 'medium'
      }
    });
  }

  async analyzeFailure(errorMessage: string, contextFiles: string[] = []): Promise<AgentExecutionResult> {
    return this.executeAgent('failure-analyzer', {
      error_data: errorMessage,
      context_files: contextFiles,
      options: {
        include_suggestions: true,
        include_root_cause: true
      }
    });
  }

  async generateDocumentation(filePath: string, sourceCode: string, options: any = {}): Promise<AgentExecutionResult> {
    return this.executeAgent('documentation-generator', {
      source_code: sourceCode,
      file_path: filePath,
      context: {
        ...options,
        language: this.detectLanguage(filePath),
        format: options.format || 'markdown'
      }
    });
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cs':
        return 'csharp';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      default:
        return 'unknown';
    }
  }

  getConfig(): AgentHubConfig {
    return { ...this.config };
  }
}
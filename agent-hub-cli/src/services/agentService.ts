import axios, { AxiosInstance } from 'axios';
import { configManager } from '../config';
import { AgentExecutionRequest, AgentExecutionResponse } from '../types';

export class AgentService {
  private client: AxiosInstance;

  constructor() {
    const config = configManager.getConfig();
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
  }

  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    try {
      const response = await this.client.post(`/api/agents/${request.agentId}/execute`, {
        input: request.input
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

  async listAgents(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/agents');
      return response.data.agents || [];
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return [];
    }
  }

  async getAgent(agentId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/agents/${agentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch agent ${agentId}: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const agentService = new AgentService();
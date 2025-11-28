import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${config.apiUrl}/api/v1/testing`,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      timeout: 30000
    });
  }

  // Test Management
  async listTests(params?: { category?: string; tags?: string; agentType?: string }) {
    const response = await this.client.get('/tests', { params });
    return response.data;
  }

  async createTest(testData: any) {
    const response = await this.client.post('/tests', testData);
    return response.data;
  }

  async getTest(testId: string) {
    const response = await this.client.get(`/tests/${testId}`);
    return response.data;
  }

  async updateTest(testId: string, testData: any) {
    const response = await this.client.put(`/tests/${testId}`, testData);
    return response.data;
  }

  async deleteTest(testId: string) {
    const response = await this.client.delete(`/tests/${testId}`);
    return response.data;
  }

  // Test Execution
  async executeTests(executionData: any) {
    const response = await this.client.post('/execute', executionData);
    return response.data;
  }

  async getExecutionStatus(runId: string) {
    const response = await this.client.get(`/execute/${runId}`);
    return response.data;
  }

  async executeBatch(batchData: any) {
    const response = await this.client.post('/execute/batch', batchData);
    return response.data;
  }

  // Results & Analytics
  async listRuns(params?: any) {
    const response = await this.client.get('/runs', { params });
    return response.data;
  }

  async getAnalytics(params?: { agentId?: string; days?: number }) {
    const response = await this.client.get('/analytics', { params });
    return response.data;
  }

  // Helper method to wait for completion
  async waitForCompletion(runId: string, options: { timeout?: number; pollInterval?: number } = {}) {
    const timeout = options.timeout || 300000; // 5 minutes default
    const pollInterval = options.pollInterval || 2000; // 2 seconds default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getExecutionStatus(runId);
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Timeout waiting for test completion');
  }
}

export const apiClient = new ApiClient();

/**
 * Testing API Service
 * Connects frontend to backend testing services
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api/testing';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  agentId: string;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  name: string;
  input: any;
  expectedOutput: any;
  category: string;
}

export interface TestRun {
  id: string;
  suiteId?: string; // Optional for backward compatibility
  categoryId?: string; // From backend
  categoryName?: string; // From backend
  agentIds?: string[]; // From backend
  status: 'running' | 'completed' | 'failed';
  results?: TestResult[];
  startTime: string;
  endTime?: string | null;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  metrics?: any;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: any;
  score: number;
  executionTime: number;
  error?: string;
}

class TestingApiService {
  // Test Suites
  async getTestSuites(): Promise<TestSuite[]> {
    const response = await fetch(`${API_BASE_URL}/suites/universal`);
    if (!response.ok) throw new Error('Failed to fetch test suites');
    const data = await response.json();
    return data.categories || [];
  }

  async createTestSuite(suite: Partial<TestSuite>): Promise<TestSuite> {
    const response = await fetch(`${API_BASE_URL}/test-suites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suite)
    });
    if (!response.ok) throw new Error('Failed to create test suite');
    return response.json();
  }

  async getTestSuite(id: string): Promise<TestSuite> {
    const response = await fetch(`${API_BASE_URL}/test-suites/${id}`);
    if (!response.ok) throw new Error('Failed to fetch test suite');
    return response.json();
  }

  // Test Runs
  async runTests(suiteId: string): Promise<TestRun> {
    const response = await fetch(`${API_BASE_URL}/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suiteId })
    });
    if (!response.ok) throw new Error('Failed to start test run');
    return response.json();
  }

  async getTestRuns(suiteId?: string): Promise<TestRun[]> {
    const url = suiteId 
      ? `${API_BASE_URL}/test-runs?suiteId=${suiteId}`
      : `${API_BASE_URL}/test-runs`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch test runs');
    const data = await response.json();
    return data.runs || [];
  }

  async getTestRun(id: string): Promise<TestRun> {
    const response = await fetch(`${API_BASE_URL}/test-runs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch test run');
    const data = await response.json();
    // Merge run and results into a single object
    if (data.run && data.results) {
      return { ...data.run, results: data.results };
    }
    return data.run || data;
  }

  // Metrics
  async getMetrics(agentId?: string, days?: number): Promise<any> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    if (days) params.append('days', days.toString());
    
    const url = `${API_BASE_URL}/metrics${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    const data = await response.json();
    return data.metrics || data;
  }

  // Insights
  async getInsights(agentId?: string): Promise<any> {
    const url = agentId
      ? `${API_BASE_URL}/insights?agentId=${agentId}`
      : `${API_BASE_URL}/insights`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch insights');
    const data = await response.json();
    return data.insights || data;
  }
}

export const testingApi = new TestingApiService();

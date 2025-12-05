/**
 * Agent Testing Summary Service
 * Fetches testing summary data for agents to display in catalog and executor pages
 * This is a focused service for displaying test results, not for running tests
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export interface AgentTestingSummary {
  agentId: string;
  bestModel: {
    name: string;
    modelId: string;
    score: number;
    passRate: number;
  } | null;
  lastTested: string | null;
  totalTests: number;
  modelComparison: Array<{
    model: string;
    modelId: string;
    score: number;
    passRate: number;
  }>;
  hasTestData: boolean;
}

export interface AgentTestingDetailed extends AgentTestingSummary {
  models: Array<{
    modelId: string;
    modelName: string;
    overallScore: number;
    passRate: number;
    totalCost: number;
    avgSpeed: number;
    categoryScores: {
      hallucination?: number;
      functional?: number;
      safety?: number;
      intent_detection?: number;
      emotional?: number;
      [key: string]: number | undefined;
    };
    testResults: Array<{
      testName: string;
      score: number;
      passed: boolean;
    }>;
  }>;
}

class AgentTestingSummaryService {
  /**
   * Get testing summary for an agent (for Agent Catalog)
   */
  async getAgentTestingSummary(agentId: string): Promise<AgentTestingSummary> {
    try {
      // Fetch recent test runs for this agent
      const response = await axios.get(`${API_BASE_URL}/api/testing/agents/${agentId}/runs`, {
        params: { limit: 20 }
      });

      if (!response.data.success || !response.data.data || response.data.data.length === 0) {
        return this.getEmptySummary(agentId);
      }

      const runs = response.data.data;
      
      // Group runs by model to calculate average scores
      const modelStats = new Map<string, {
        scores: number[];
        passRates: number[];
        totalTests: number;
        passedTests: number;
      }>();

      runs.forEach((run: any) => {
        const modelId = run.model_id || run.modelId || 'unknown';
        
        if (!modelStats.has(modelId)) {
          modelStats.set(modelId, {
            scores: [],
            passRates: [],
            totalTests: 0,
            passedTests: 0
          });
        }

        const stats = modelStats.get(modelId)!;
        stats.scores.push(run.overall_score || run.overallScore || 0);
        stats.passRates.push(run.summary?.pass_rate || run.passRate || 0);
        stats.totalTests += run.summary?.total || run.totalTests || 0;
        stats.passedTests += run.summary?.passed || run.passedTests || 0;
      });

      // Calculate averages and create model comparison
      const modelComparison = Array.from(modelStats.entries()).map(([modelId, stats]) => {
        const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
        const avgPassRate = stats.passRates.reduce((a, b) => a + b, 0) / stats.passRates.length;
        
        return {
          model: this.getModelDisplayName(modelId),
          modelId,
          score: Math.round(avgScore * 10) / 10,
          passRate: Math.round(avgPassRate * 10) / 10
        };
      });

      // Sort by score descending
      modelComparison.sort((a, b) => b.score - a.score);

      // Get top 3 models
      const top3Models = modelComparison.slice(0, 3);

      // Best model is the first one
      const bestModel = modelComparison.length > 0 ? {
        name: modelComparison[0].model,
        modelId: modelComparison[0].modelId,
        score: modelComparison[0].score,
        passRate: modelComparison[0].passRate
      } : null;

      // Get most recent test date
      const lastTested = runs[0]?.timestamp || runs[0]?.created_at || null;

      // Count total unique tests
      const totalTests = Math.max(...runs.map((r: any) => r.summary?.total || r.totalTests || 0));

      return {
        agentId,
        bestModel,
        lastTested,
        totalTests,
        modelComparison: top3Models,
        hasTestData: true
      };

    } catch (error) {
      console.error(`Error fetching testing summary for agent ${agentId}:`, error);
      return this.getEmptySummary(agentId);
    }
  }

  /**
   * Get detailed testing data for an agent (for Agent Executor)
   */
  async getAgentTestingDetailed(agentId: string): Promise<AgentTestingDetailed> {
    try {
      const summary = await this.getAgentTestingSummary(agentId);
      
      // Fetch all test runs for detailed analysis
      const response = await axios.get(`${API_BASE_URL}/api/testing/agents/${agentId}/runs`, {
        params: { limit: 50 }
      });

      if (!response.data.success || !response.data.data || response.data.data.length === 0) {
        return {
          ...summary,
          models: []
        };
      }

      const runs = response.data.data;

      // Group by model and aggregate detailed stats
      const modelDetailsMap = new Map<string, any>();

      runs.forEach((run: any) => {
        const modelId = run.model_id || run.modelId || 'unknown';
        
        if (!modelDetailsMap.has(modelId)) {
          modelDetailsMap.set(modelId, {
            modelId,
            modelName: this.getModelDisplayName(modelId),
            scores: [],
            passRates: [],
            costs: [],
            durations: [],
            categoryScoresArray: [],
            testResultsMap: new Map<string, { scores: number[]; passed: number; failed: number }>()
          });
        }

        const details = modelDetailsMap.get(modelId)!;
        details.scores.push(run.overall_score || run.overallScore || 0);
        details.passRates.push(run.summary?.pass_rate || run.passRate || 0);
        details.costs.push(run.cost || 0);
        details.durations.push(run.duration || 0);

        // Aggregate category scores
        if (run.scores_by_category || run.scoresByCategory) {
          details.categoryScoresArray.push(run.scores_by_category || run.scoresByCategory);
        }

        // Aggregate test results
        if (run.results && Array.isArray(run.results)) {
          run.results.forEach((result: any) => {
            const testName = result.test_name || result.testName || 'Unknown Test';
            if (!details.testResultsMap.has(testName)) {
              details.testResultsMap.set(testName, { scores: [], passed: 0, failed: 0 });
            }
            const testStats = details.testResultsMap.get(testName)!;
            testStats.scores.push(result.score || 0);
            if (result.passed) {
              testStats.passed++;
            } else {
              testStats.failed++;
            }
          });
        }
      });

      // Convert to final format
      const models = Array.from(modelDetailsMap.values()).map(details => {
        const avgScore = details.scores.reduce((a: number, b: number) => a + b, 0) / details.scores.length;
        const avgPassRate = details.passRates.reduce((a: number, b: number) => a + b, 0) / details.passRates.length;
        const totalCost = details.costs.reduce((a: number, b: number) => a + b, 0);
        const avgSpeed = details.durations.reduce((a: number, b: number) => a + b, 0) / details.durations.length;

        // Average category scores
        const categoryScores: any = {};
        if (details.categoryScoresArray.length > 0) {
          const allCategories = new Set<string>();
          details.categoryScoresArray.forEach((scores: any) => {
            Object.keys(scores).forEach(cat => allCategories.add(cat));
          });

          allCategories.forEach(category => {
            const categoryValues = details.categoryScoresArray
              .map((scores: any) => scores[category]?.score || scores[category] || 0)
              .filter((v: number) => v > 0);
            
            if (categoryValues.length > 0) {
              categoryScores[category] = Math.round(
                (categoryValues.reduce((a: number, b: number) => a + b, 0) / categoryValues.length) * 10
              ) / 10;
            }
          });
        }

        // Average test results
        const testResults: Array<{ testName: string; score: number; passed: boolean }> = [];
        details.testResultsMap.forEach((stats: any, testName: string) => {
          const avgScore = stats.scores.reduce((a: number, b: number) => a + b, 0) / stats.scores.length;
          const passed = stats.passed > stats.failed;
          testResults.push({
            testName,
            score: Math.round(avgScore * 10) / 10,
            passed
          });
        });

        return {
          modelId: details.modelId,
          modelName: details.modelName,
          overallScore: Math.round(avgScore * 10) / 10,
          passRate: Math.round(avgPassRate * 10) / 10,
          totalCost: Math.round(totalCost * 100) / 100,
          avgSpeed: Math.round(avgSpeed * 10) / 10,
          categoryScores,
          testResults
        };
      });

      // Sort by overall score
      models.sort((a, b) => b.overallScore - a.overallScore);

      return {
        ...summary,
        models
      };

    } catch (error) {
      console.error(`Error fetching detailed testing data for agent ${agentId}:`, error);
      const summary = await this.getAgentTestingSummary(agentId);
      return {
        ...summary,
        models: []
      };
    }
  }

  /**
   * Get empty summary when no test data exists
   */
  private getEmptySummary(agentId: string): AgentTestingSummary {
    return {
      agentId,
      bestModel: null,
      lastTested: null,
      totalTests: 0,
      modelComparison: [],
      hasTestData: false
    };
  }

  /**
   * Convert model ID to display name
   */
  private getModelDisplayName(modelId: string): string {
    // Handle missing or unknown model IDs
    if (!modelId || modelId === 'unknown' || modelId === 'null' || modelId === 'undefined') {
      return 'Model Not Specified';
    }

    const modelNames: Record<string, string> = {
      'anthropic.claude-3-5-sonnet-20240620-v1:0': 'Claude 3.5 Sonnet',
      'anthropic.claude-3-sonnet-20240229-v1:0': 'Claude 3 Sonnet',
      'anthropic.claude-3-haiku-20240307-v1:0': 'Claude 3 Haiku',
      'anthropic.claude-v2:1': 'Claude 2.1',
      'anthropic.claude-v2': 'Claude 2',
      'amazon.titan-text-express-v1': 'Titan Text Express',
      'amazon.titan-text-lite-v1': 'Titan Text Lite',
      'meta.llama3-70b-instruct-v1:0': 'Llama 3 70B',
      'meta.llama3-8b-instruct-v1:0': 'Llama 3 8B',
      'mistral.mistral-7b-instruct-v0:2': 'Mistral 7B',
      'mistral.mixtral-8x7b-instruct-v0:1': 'Mixtral 8x7B'
    };

    return modelNames[modelId] || modelId.split('.').pop()?.split('-').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ') || modelId;
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(timestamp: string | null): string {
    if (!timestamp) return 'Never tested';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return then.toLocaleDateString();
  }
}

export const agentTestingService = new AgentTestingSummaryService();

// Export for backward compatibility
export default agentTestingService;

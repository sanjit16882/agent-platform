/**
 * Multi-Agent Workflow Service
 * Handles API calls for multi-agent collaboration
 */

const API_BASE_URL = 'http://localhost:3002/api/v1';

export interface WorkflowTask {
  type: string;
  input: string;
  agentSequence: string[];
  metadata?: Record<string, any>;
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  status: 'success' | 'failed';
  output: any;
  duration: number;
  timestamp: string;
  error?: string;
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  results: AgentResult[];
  summary: {
    workflowId: string;
    type: string;
    status: string;
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
    totalDuration: string;
    startTime: string;
    endTime: string;
    agentSequence: string[];
  };
  error?: string;
}

class MultiAgentService {
  /**
   * Execute a multi-agent workflow
   */
  async executeWorkflow(task: WorkflowTask): Promise<WorkflowResult> {
    try {
      console.log('🚀 [Frontend] Executing workflow:', {
        type: task.type,
        agentCount: task.agentSequence.length,
        agents: task.agentSequence,
        codeLength: task.input.length
      });

      const response = await fetch(`${API_BASE_URL}/multi-agent/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      console.log('📡 [Frontend] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Frontend] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [Frontend] Workflow result:', {
        success: data.success,
        workflowId: data.workflowId,
        resultCount: data.results?.length
      });
      return data;
    } catch (error) {
      console.error('❌ [Frontend] Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(): Promise<WorkflowResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/multi-agent/workflows`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.workflows || [];
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      return [];
    }
  }

  /**
   * Get specific workflow details
   */
  async getWorkflow(workflowId: string): Promise<WorkflowResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/multi-agent/workflows/${workflowId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.workflow;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      return null;
    }
  }
}

export const multiAgentService = new MultiAgentService();

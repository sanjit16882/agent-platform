// Progress Service for real-time execution tracking
export interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // in seconds
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}

export interface StreamData {
  type: 'log' | 'result' | 'error';
  content: string;
  timestamp: Date;
}

export interface ExecutionProgress {
  id: string;
  agentId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: ExecutionStep[];
  currentStep: number;
  startTime: Date;
  estimatedCompletion?: Date;
  logs: StreamData[];
  progress: number; // 0-100
}

export class ProgressService {
  private executions: Map<string, ExecutionProgress> = new Map();
  private listeners: Map<string, ((progress: ExecutionProgress) => void)[]> = new Map();

  // Start a new execution with defined steps
  startExecution(executionId: string, agentId: string, steps: ExecutionStep[]): ExecutionProgress {
    const execution: ExecutionProgress = {
      id: executionId,
      agentId,
      userId: 'current-user', // TODO: Get from auth context
      status: 'running',
      steps: steps.map(step => ({ ...step, status: 'pending' })),
      currentStep: 0,
      startTime: new Date(),
      logs: [],
      progress: 0
    };

    // Calculate estimated completion time
    const totalDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    execution.estimatedCompletion = new Date(Date.now() + totalDuration * 1000);

    this.executions.set(executionId, execution);
    this.notifyListeners(executionId, execution);

    // Start the first step
    if (steps.length > 0) {
      this.updateStepStatus(executionId, steps[0].id, 'running');
    }

    return execution;
  }

  // Update the status of a specific step
  updateStepStatus(executionId: string, stepId: string, status: ExecutionStep['status']): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const stepIndex = execution.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const step = execution.steps[stepIndex];
    step.status = status;

    if (status === 'running') {
      step.startTime = new Date();
      execution.currentStep = stepIndex;
    } else if (status === 'completed' || status === 'failed') {
      step.endTime = new Date();
      
      // Update progress percentage
      const completedSteps = execution.steps.filter(s => s.status === 'completed').length;
      execution.progress = Math.round((completedSteps / execution.steps.length) * 100);

      // Start next step if current step completed successfully
      if (status === 'completed' && stepIndex < execution.steps.length - 1) {
        const nextStep = execution.steps[stepIndex + 1];
        setTimeout(() => {
          this.updateStepStatus(executionId, nextStep.id, 'running');
        }, 500); // Small delay for better UX
      }

      // Check if all steps are completed
      if (completedSteps === execution.steps.length) {
        execution.status = 'completed';
        execution.progress = 100;
      } else if (status === 'failed') {
        execution.status = 'failed';
      }
    }

    this.executions.set(executionId, execution);
    this.notifyListeners(executionId, execution);
  }

  // Add streaming data (logs, partial results, etc.)
  streamData(executionId: string, data: StreamData): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.logs.push(data);
    
    // Keep only last 100 log entries to prevent memory issues
    if (execution.logs.length > 100) {
      execution.logs = execution.logs.slice(-100);
    }

    this.executions.set(executionId, execution);
    this.notifyListeners(executionId, execution);
  }

  // Complete execution with final result
  completeExecution(executionId: string, success: boolean = true): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = success ? 'completed' : 'failed';
    execution.progress = success ? 100 : execution.progress;

    // Mark all remaining steps as completed or failed
    execution.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'running') {
        step.status = success ? 'completed' : 'failed';
        step.endTime = new Date();
      }
    });

    this.executions.set(executionId, execution);
    this.notifyListeners(executionId, execution);
  }

  // Subscribe to progress updates for a specific execution
  subscribe(executionId: string, callback: (progress: ExecutionProgress) => void): () => void {
    if (!this.listeners.has(executionId)) {
      this.listeners.set(executionId, []);
    }
    
    this.listeners.get(executionId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(executionId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Get current execution state
  getExecution(executionId: string): ExecutionProgress | undefined {
    return this.executions.get(executionId);
  }

  // Get all executions (for analytics)
  getAllExecutions(): ExecutionProgress[] {
    return Array.from(this.executions.values());
  }

  private notifyListeners(executionId: string, execution: ExecutionProgress): void {
    const callbacks = this.listeners.get(executionId);
    if (callbacks) {
      callbacks.forEach(callback => callback(execution));
    }
  }

  // Simulate realistic execution steps for different agent types
  static getDefaultSteps(agentCategory: string): ExecutionStep[] {
    const baseSteps: Record<string, ExecutionStep[]> = {
      'QE': [
        { id: 'analyze', name: 'Analyzing Requirements', description: 'Parsing input and identifying test scenarios', estimatedDuration: 3, status: 'pending' },
        { id: 'generate', name: 'Generating Test Cases', description: 'Creating comprehensive test automation code', estimatedDuration: 8, status: 'pending' },
        { id: 'validate', name: 'Validating Output', description: 'Checking generated tests for completeness', estimatedDuration: 2, status: 'pending' },
        { id: 'package', name: 'Packaging Results', description: 'Preparing downloadable test files', estimatedDuration: 1, status: 'pending' }
      ],
      'DevOps': [
        { id: 'scan', name: 'Infrastructure Scan', description: 'Analyzing system configuration and logs', estimatedDuration: 4, status: 'pending' },
        { id: 'diagnose', name: 'Issue Diagnosis', description: 'Identifying root causes and bottlenecks', estimatedDuration: 6, status: 'pending' },
        { id: 'recommend', name: 'Generating Recommendations', description: 'Creating actionable improvement suggestions', estimatedDuration: 3, status: 'pending' },
        { id: 'report', name: 'Building Report', description: 'Compiling comprehensive analysis report', estimatedDuration: 2, status: 'pending' }
      ],
      'Security': [
        { id: 'initialize', name: 'Initializing Scan', description: 'Setting up security scanning tools', estimatedDuration: 2, status: 'pending' },
        { id: 'scan', name: 'Vulnerability Scan', description: 'Running comprehensive security analysis', estimatedDuration: 10, status: 'pending' },
        { id: 'analyze', name: 'Threat Analysis', description: 'Analyzing discovered vulnerabilities', estimatedDuration: 4, status: 'pending' },
        { id: 'report', name: 'Security Report', description: 'Generating detailed security assessment', estimatedDuration: 2, status: 'pending' }
      ],
      'Business': [
        { id: 'ingest', name: 'Data Ingestion', description: 'Loading and validating business data', estimatedDuration: 3, status: 'pending' },
        { id: 'process', name: 'Data Processing', description: 'Applying business logic and calculations', estimatedDuration: 7, status: 'pending' },
        { id: 'analyze', name: 'Business Analysis', description: 'Generating insights and recommendations', estimatedDuration: 5, status: 'pending' },
        { id: 'visualize', name: 'Creating Visualizations', description: 'Building charts and dashboards', estimatedDuration: 3, status: 'pending' }
      ]
    };

    return baseSteps[agentCategory] || [
      { id: 'process', name: 'Processing Request', description: 'Analyzing input and generating response', estimatedDuration: 5, status: 'pending' },
      { id: 'finalize', name: 'Finalizing Results', description: 'Preparing output for delivery', estimatedDuration: 2, status: 'pending' }
    ];
  }
}

// Global progress service instance
export const progressService = new ProgressService();
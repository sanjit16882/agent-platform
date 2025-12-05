// Agent Orchestration Service - Runtime execution and coordination
import { 
  HybridAgent, 
  AgentComponent, 
  ExecutionContext, 
  ExecutionLog, 
  ExecutionMetrics,
  OrchestrationConfig,
  DataFlowConfig,
  DataMapping,
  OrchestrationCondition
} from '../types/hybridAgent';

export interface ComponentExecution {
  componentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  retryCount: number;
  logs: ExecutionLog[];
  metrics: Partial<ExecutionMetrics>;
}

export interface OrchestrationState {
  executionId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentPhase: 'initialization' | 'execution' | 'finalization' | 'cleanup';
  componentExecutions: Map<string, ComponentExecution>;
  globalData: Record<string, any>;
  executionOrder: string[];
  parallelGroups: string[][];
  completedComponents: Set<string>;
  failedComponents: Set<string>;
  skippedComponents: Set<string>;
  retryQueue: string[];
  startTime: string;
  endTime?: string;
  totalRetries: number;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
}

class AgentOrchestrationService {
  private activeExecutions = new Map<string, OrchestrationState>();
  private executionCallbacks = new Map<string, (state: OrchestrationState) => void>();

  // Main orchestration methods
  async executeAgent(agent: HybridAgent, inputs: Record<string, any>, userId: string): Promise<string> {
    const executionId = this.generateExecutionId();
    const startTime = new Date().toISOString();

    // Initialize orchestration state
    const state: OrchestrationState = {
      executionId,
      agentId: agent.id,
      status: 'pending',
      currentPhase: 'initialization',
      componentExecutions: new Map(),
      globalData: { ...inputs },
      executionOrder: [],
      parallelGroups: [],
      completedComponents: new Set(),
      failedComponents: new Set(),
      skippedComponents: new Set(),
      retryQueue: [],
      startTime,
      totalRetries: 0,
      logs: [],
      metrics: {
        duration: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        networkIO: 0,
        storageIO: 0,
        cost: 0,
        errors: 0,
        retries: 0
      }
    };

    this.activeExecutions.set(executionId, state);

    // Start orchestration
    this.startOrchestration(agent, state, userId);

    return executionId;
  }

  private async startOrchestration(agent: HybridAgent, state: OrchestrationState, userId: string): Promise<void> {
    try {
      this.log(state, 'info', 'orchestrator', `Starting agent execution: ${agent.name}`);
      
      // Phase 1: Initialization
      state.currentPhase = 'initialization';
      await this.initializeExecution(agent, state);

      // Phase 2: Execution
      state.currentPhase = 'execution';
      state.status = 'running';
      await this.executeComponents(agent, state);

      // Phase 3: Finalization
      state.currentPhase = 'finalization';
      await this.finalizeExecution(agent, state);

      // Phase 4: Cleanup
      state.currentPhase = 'cleanup';
      await this.cleanupExecution(state);

      state.status = 'completed';
      state.endTime = new Date().toISOString();
      state.metrics.duration = Date.now() - new Date(state.startTime).getTime();

      this.log(state, 'info', 'orchestrator', 'Agent execution completed successfully');

    } catch (error) {
      state.status = 'failed';
      state.endTime = new Date().toISOString();
      state.metrics.duration = Date.now() - new Date(state.startTime).getTime();
      state.metrics.errors++;

      this.log(state, 'error', 'orchestrator', `Agent execution failed: ${error}`);
    } finally {
      this.notifyExecutionComplete(state);
    }
  }

  private async initializeExecution(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    // Initialize component executions
    for (const component of agent.config.components) {
      const componentExecution: ComponentExecution = {
        componentId: component.id,
        status: 'pending',
        inputs: {},
        outputs: {},
        retryCount: 0,
        logs: [],
        metrics: {}
      };
      state.componentExecutions.set(component.id, componentExecution);
    }

    // Calculate execution order based on dependencies
    state.executionOrder = this.calculateExecutionOrder(agent.config.components);
    state.parallelGroups = this.calculateParallelGroups(agent.config.components, agent.config.orchestration);

    this.log(state, 'info', 'orchestrator', `Execution order calculated: ${state.executionOrder.join(' -> ')}`);
  }

  private async executeComponents(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    const orchestration = agent.config.orchestration;

    switch (orchestration.mode) {
      case 'sequential':
        await this.executeSequential(agent, state);
        break;
      case 'parallel':
        await this.executeParallel(agent, state);
        break;
      case 'conditional':
        await this.executeConditional(agent, state);
        break;
      case 'loop':
        await this.executeLoop(agent, state);
        break;
      default:
        throw new Error(`Unsupported orchestration mode: ${orchestration.mode}`);
    }
  }

  private async executeSequential(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    for (const componentId of state.executionOrder) {
      if (state.status === 'cancelled') break;

      const component = agent.config.components.find(c => c.id === componentId);
      if (!component) continue;

      // Check if component should be skipped based on conditions
      if (await this.shouldSkipComponent(component, state, agent.config.orchestration.conditions)) {
        this.skipComponent(componentId, state);
        continue;
      }

      await this.executeComponent(component, state, agent.config.dataFlow);
    }
  }

  private async executeParallel(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    const maxParallelism = agent.config.orchestration.parallelism || agent.config.components.length;
    
    for (const group of state.parallelGroups) {
      if (state.status === 'cancelled') break;

      const groupSize = Math.min(group.length, maxParallelism);
      const batches = this.createBatches(group, groupSize);

      for (const batch of batches) {
        const promises = batch.map(async (componentId) => {
          const component = agent.config.components.find(c => c.id === componentId);
          if (!component) return;

          if (await this.shouldSkipComponent(component, state, agent.config.orchestration.conditions)) {
            this.skipComponent(componentId, state);
            return;
          }

          return this.executeComponent(component, state, agent.config.dataFlow);
        });

        await Promise.all(promises);
      }
    }
  }

  private async executeConditional(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    const conditions = agent.config.orchestration.conditions;
    let currentComponentId = state.executionOrder[0];

    while (currentComponentId && state.status !== 'cancelled') {
      const component = agent.config.components.find(c => c.id === currentComponentId);
      if (!component) break;

      // Execute current component
      await this.executeComponent(component, state, agent.config.dataFlow);

      // Find next component based on conditions
      const nextComponentId = await this.getNextComponent(currentComponentId, state, conditions);
      if (nextComponentId) {
        currentComponentId = nextComponentId;
      } else {
        break; // No more components to execute
      }
    }
  }

  private async executeLoop(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    const maxIterations = 100; // Safety limit
    let iteration = 0;

    while (iteration < maxIterations && state.status !== 'cancelled') {
      let shouldContinue = false;

      for (const componentId of state.executionOrder) {
        const component = agent.config.components.find(c => c.id === componentId);
        if (!component) continue;

        await this.executeComponent(component, state, agent.config.dataFlow);

        // Check loop conditions
        const loopCondition = agent.config.orchestration.conditions.find(c => c.componentId === componentId);
        if (loopCondition) {
          const conditionResult = await this.evaluateCondition(loopCondition.condition, state);
          if (conditionResult) {
            shouldContinue = true;
          }
        }
      }

      if (!shouldContinue) break;
      iteration++;
    }

    if (iteration >= maxIterations) {
      this.log(state, 'warn', 'orchestrator', 'Loop execution reached maximum iterations limit');
    }
  }

  private async executeComponent(component: AgentComponent, state: OrchestrationState, dataFlow: DataFlowConfig): Promise<void> {
    const execution = state.componentExecutions.get(component.id);
    if (!execution) return;

    try {
      execution.status = 'running';
      execution.startTime = new Date().toISOString();

      this.log(state, 'info', component.id, `Starting component execution: ${component.name}`);

      // Prepare inputs
      execution.inputs = await this.prepareComponentInputs(component, state, dataFlow);

      // Execute component based on type
      execution.outputs = await this.executeComponentByType(component, execution.inputs, state);

      // Process outputs
      await this.processComponentOutputs(component, execution.outputs, state, dataFlow);

      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      state.completedComponents.add(component.id);

      this.log(state, 'info', component.id, `Component execution completed successfully`);

    } catch (error) {
      execution.error = error instanceof Error ? error.message : String(error);
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      state.failedComponents.add(component.id);
      state.metrics.errors++;

      this.log(state, 'error', component.id, `Component execution failed: ${execution.error}`);

      // Handle retry logic
      const orchestration = state.componentExecutions.get(component.id);
      if (orchestration && execution.retryCount < 3) { // Default max retries
        execution.retryCount++;
        state.totalRetries++;
        state.metrics.retries++;
        state.retryQueue.push(component.id);
        
        this.log(state, 'warn', component.id, `Retrying component execution (attempt ${execution.retryCount + 1})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * execution.retryCount));
        
        // Retry execution
        await this.executeComponent(component, state, dataFlow);
      } else {
        throw error; // Re-throw if max retries exceeded
      }
    }
  }

  private async executeComponentByType(component: AgentComponent, inputs: Record<string, any>, state: OrchestrationState): Promise<Record<string, any>> {
    switch (component.type) {
      case 'llm':
        return this.executeLLMComponent(component, inputs, state);
      case 'rpa':
        return this.executeRPAComponent(component, inputs, state);
      case 'selenium':
        return this.executeSeleniumComponent(component, inputs, state);
      case 'custom':
        return this.executeCustomComponent(component, inputs, state);
      default:
        throw new Error(`Unsupported component type: ${component.type}`);
    }
  }

  private async executeLLMComponent(component: AgentComponent, inputs: Record<string, any>, state: OrchestrationState): Promise<Record<string, any>> {
    // Mock LLM execution - in production, this would call actual LLM APIs
    this.log(state, 'info', component.id, 'Executing LLM component');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    return {
      response: `Mock LLM response for inputs: ${JSON.stringify(inputs)}`,
      tokens_used: 150,
      model: 'gpt-4',
      confidence: 0.85
    };
  }

  private async executeRPAComponent(component: AgentComponent, inputs: Record<string, any>, state: OrchestrationState): Promise<Record<string, any>> {
    // Mock RPA execution
    this.log(state, 'info', component.id, 'Executing RPA component');
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
    
    return {
      success: true,
      steps_completed: 5,
      data_processed: inputs,
      screenshot: 'base64_screenshot_data'
    };
  }

  private async executeSeleniumComponent(component: AgentComponent, inputs: Record<string, any>, state: OrchestrationState): Promise<Record<string, any>> {
    // Mock Selenium execution
    this.log(state, 'info', component.id, 'Executing Selenium component');
    
    await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate processing time
    
    return {
      test_results: {
        passed: 8,
        failed: 1,
        skipped: 0,
        total: 9
      },
      screenshots: ['screenshot1.png', 'screenshot2.png'],
      report_url: '/reports/selenium-report.html'
    };
  }

  private async executeCustomComponent(component: AgentComponent, inputs: Record<string, any>, state: OrchestrationState): Promise<Record<string, any>> {
    // Mock custom component execution
    this.log(state, 'info', component.id, 'Executing custom component');
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
    
    return {
      result: 'Custom component executed successfully',
      processed_data: inputs,
      execution_time: 1500
    };
  }

  // Utility methods
  private calculateExecutionOrder(components: AgentComponent[]): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (componentId: string) => {
      if (visited.has(componentId)) return;
      
      const component = components.find(c => c.id === componentId);
      if (!component) return;

      // Visit dependencies first
      for (const depId of component.dependencies) {
        visit(depId);
      }

      visited.add(componentId);
      order.push(componentId);
    };

    // Start with components that have no dependencies
    const rootComponents = components.filter(c => c.dependencies.length === 0);
    for (const component of rootComponents) {
      visit(component.id);
    }

    // Visit remaining components
    for (const component of components) {
      visit(component.id);
    }

    return order;
  }

  private calculateParallelGroups(components: AgentComponent[], orchestration: OrchestrationConfig): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    // Group components by dependency level
    let currentLevel = components.filter(c => c.dependencies.length === 0);
    
    while (currentLevel.length > 0) {
      const groupIds = currentLevel.map(c => c.id);
      groups.push(groupIds);
      
      for (const id of groupIds) {
        processed.add(id);
      }

      // Find next level
      currentLevel = components.filter(c => 
        !processed.has(c.id) && 
        c.dependencies.every(depId => processed.has(depId))
      );
    }

    return groups;
  }

  private async prepareComponentInputs(component: AgentComponent, state: OrchestrationState, dataFlow: DataFlowConfig): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {};

    for (const input of component.inputs) {
      if (input.source === 'user' || input.source === 'constant') {
        inputs[input.name] = state.globalData[input.name] || input.defaultValue;
      } else if (input.source === 'component' && input.sourceId) {
        const sourceExecution = state.componentExecutions.get(input.sourceId);
        if (sourceExecution && sourceExecution.outputs) {
          inputs[input.name] = sourceExecution.outputs[input.name];
        }
      }

      // Apply data transformations
      const mapping = dataFlow.mappings.find(m => 
        m.to.componentId === component.id && m.to.inputName === input.name
      );
      
      if (mapping && mapping.transformation) {
        const transformation = dataFlow.transformations.find(t => t.name === mapping.transformation);
        if (transformation) {
          inputs[input.name] = await this.applyTransformation(inputs[input.name], transformation);
        }
      }
    }

    return inputs;
  }

  private async processComponentOutputs(component: AgentComponent, outputs: Record<string, any>, state: OrchestrationState, dataFlow: DataFlowConfig): Promise<void> {
    // Store outputs in global data if needed
    for (const [key, value] of Object.entries(outputs)) {
      const globalKey = `${component.id}.${key}`;
      state.globalData[globalKey] = value;
    }

    // Process data mappings
    for (const mapping of dataFlow.mappings) {
      if (mapping.from.componentId === component.id) {
        const outputValue = outputs[mapping.from.outputName];
        if (outputValue !== undefined) {
          state.globalData[`${mapping.to.componentId}.${mapping.to.inputName}`] = outputValue;
        }
      }
    }
  }

  private async applyTransformation(data: any, transformation: any): Promise<any> {
    // Mock transformation - in production, this would execute actual transformation code
    return data;
  }

  private async shouldSkipComponent(component: AgentComponent, state: OrchestrationState, conditions: OrchestrationCondition[]): Promise<boolean> {
    const condition = conditions.find(c => c.componentId === component.id);
    if (!condition) return false;

    const result = await this.evaluateCondition(condition.condition, state);
    return result ? condition.onTrue === 'skip' : condition.onFalse === 'skip';
  }

  private async evaluateCondition(condition: string, state: OrchestrationState): Promise<boolean> {
    // Mock condition evaluation - in production, this would use a safe JavaScript evaluator
    return Math.random() > 0.5;
  }

  private async getNextComponent(currentId: string, state: OrchestrationState, conditions: OrchestrationCondition[]): Promise<string | null> {
    const condition = conditions.find(c => c.componentId === currentId);
    if (!condition) return null;

    const result = await this.evaluateCondition(condition.condition, state);
    const action = result ? condition.onTrue : condition.onFalse;

    if (action === 'branch' && condition.branchTo) {
      return condition.branchTo;
    }

    return null;
  }

  private skipComponent(componentId: string, state: OrchestrationState): void {
    const execution = state.componentExecutions.get(componentId);
    if (execution) {
      execution.status = 'skipped';
      state.skippedComponents.add(componentId);
      this.log(state, 'info', componentId, 'Component skipped based on conditions');
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async finalizeExecution(agent: HybridAgent, state: OrchestrationState): Promise<void> {
    // Collect final outputs
    const finalOutputs: Record<string, any> = {};
    
    for (const [componentId, execution] of Array.from(state.componentExecutions.entries())) {
      if (execution.status === 'completed') {
        for (const [key, value] of Object.entries(execution.outputs)) {
          finalOutputs[`${componentId}.${key}`] = value;
        }
      }
    }

    state.globalData.finalOutputs = finalOutputs;
    this.log(state, 'info', 'orchestrator', 'Execution finalized');
  }

  private async cleanupExecution(state: OrchestrationState): Promise<void> {
    // Cleanup temporary resources, close connections, etc.
    this.log(state, 'info', 'orchestrator', 'Cleanup completed');
  }

  private log(state: OrchestrationState, level: 'debug' | 'info' | 'warn' | 'error', component: string, message: string, data?: any): void {
    const logEntry: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data
    };

    state.logs.push(logEntry);
    console.log(`[${level.toUpperCase()}] ${component}: ${message}`, data || '');
  }

  private notifyExecutionComplete(state: OrchestrationState): void {
    const callback = this.executionCallbacks.get(state.executionId);
    if (callback) {
      callback(state);
      this.executionCallbacks.delete(state.executionId);
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getExecutionState(executionId: string): OrchestrationState | null {
    return this.activeExecutions.get(executionId) || null;
  }

  cancelExecution(executionId: string): boolean {
    const state = this.activeExecutions.get(executionId);
    if (state && state.status === 'running') {
      state.status = 'cancelled';
      this.log(state, 'warn', 'orchestrator', 'Execution cancelled by user');
      return true;
    }
    return false;
  }

  onExecutionComplete(executionId: string, callback: (state: OrchestrationState) => void): void {
    this.executionCallbacks.set(executionId, callback);
  }

  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  cleanupCompletedExecutions(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [executionId, state] of Array.from(this.activeExecutions.entries())) {
      if (state.status !== 'running' && new Date(state.startTime).getTime() < cutoffTime) {
        this.activeExecutions.delete(executionId);
      }
    }
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();
export default agentOrchestrationService;
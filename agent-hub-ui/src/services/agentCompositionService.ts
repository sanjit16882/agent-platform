// Agent Composition Service - Hybrid Agent Creation and Management
import { 
  HybridAgent, 
  AgentComponent, 
  AgentType, 
  ExecutionContext,
  LLMAgentConfig,
  RPAAgentConfig,
  SeleniumAgentConfig,
  CustomAgentConfig,
  HybridAgentConfig,
  OrchestrationConfig,
  DataFlowConfig
} from '../types/hybridAgent';

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';

export interface ComponentTemplate {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  defaultConfig: any;
  requiredInputs: string[];
  providedOutputs: string[];
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface AgentCompositionRequest {
  name: string;
  description: string;
  components: ComponentRequest[];
  orchestration: OrchestrationConfig;
  dataFlow: DataFlowConfig;
}

export interface ComponentRequest {
  type: AgentType;
  name: string;
  config: any;
  position: { x: number; y: number };
}

class AgentCompositionService {
  // Component Templates
  getComponentTemplates(): ComponentTemplate[] {
    return [
      // LLM Components
      {
        id: 'llm-text-analyzer',
        type: 'llm',
        name: 'Text Analyzer',
        description: 'Analyzes text content using LLM',
        defaultConfig: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a helpful text analyzer.',
          userPromptTemplate: 'Analyze this text: {input}',
          responseFormat: 'json'
        },
        requiredInputs: ['text'],
        providedOutputs: ['analysis', 'sentiment', 'summary'],
        category: 'Natural Language Processing',
        complexity: 'simple'
      },
      {
        id: 'llm-code-generator',
        type: 'llm',
        name: 'Code Generator',
        description: 'Generates code based on requirements',
        defaultConfig: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 2000,
          systemPrompt: 'You are an expert software developer.',
          userPromptTemplate: 'Generate {language} code for: {requirements}',
          responseFormat: 'text'
        },
        requiredInputs: ['requirements', 'language'],
        providedOutputs: ['code', 'documentation', 'tests'],
        category: 'Code Generation',
        complexity: 'medium'
      },
      
      // RPA Components
      {
        id: 'rpa-web-form-filler',
        type: 'rpa',
        name: 'Web Form Filler',
        description: 'Automatically fills web forms',
        defaultConfig: {
          platform: 'custom',
          workflow: {
            steps: [
              { id: '1', type: 'navigate', selector: '', action: 'goto', data: '{url}' },
              { id: '2', type: 'type', selector: 'input[name="email"]', action: 'fill', data: '{email}' },
              { id: '3', type: 'click', selector: 'button[type="submit"]', action: 'click', data: null }
            ],
            flowControl: 'sequential',
            timeout: 30000,
            retryPolicy: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2, maxDelay: 10000 }
          },
          variables: [],
          errorHandling: { onError: 'retry', maxRetries: 3, retryDelay: 1000, logLevel: 'error' },
          scheduling: { enabled: false, timezone: 'UTC', maxConcurrent: 1 }
        },
        requiredInputs: ['url', 'formData'],
        providedOutputs: ['success', 'responseData', 'screenshot'],
        category: 'Web Automation',
        complexity: 'medium'
      },
      {
        id: 'rpa-file-processor',
        type: 'rpa',
        name: 'File Processor',
        description: 'Processes files (CSV, Excel, PDF)',
        defaultConfig: {
          platform: 'custom',
          workflow: {
            steps: [
              { id: '1', type: 'file-operation', selector: '', action: 'read', data: '{filePath}' },
              { id: '2', type: 'condition', selector: '', action: 'validate', data: '{validationRules}' },
              { id: '3', type: 'file-operation', selector: '', action: 'write', data: '{outputPath}' }
            ],
            flowControl: 'sequential',
            timeout: 60000,
            retryPolicy: { maxRetries: 2, retryDelay: 2000, backoffMultiplier: 1.5, maxDelay: 8000 }
          },
          variables: [],
          errorHandling: { onError: 'escalate', maxRetries: 2, retryDelay: 2000, logLevel: 'info' },
          scheduling: { enabled: false, timezone: 'UTC', maxConcurrent: 5 }
        },
        requiredInputs: ['filePath', 'processingRules'],
        providedOutputs: ['processedData', 'summary', 'errors'],
        category: 'File Processing',
        complexity: 'medium'
      },
      
      // Selenium Components
      {
        id: 'selenium-web-ui-tester',
        type: 'selenium',
        name: 'Web UI Tester',
        description: 'Tests web application UI',
        defaultConfig: {
          browser: 'chrome',
          headless: true,
          windowSize: { width: 1920, height: 1080 },
          timeout: 30000,
          testSuite: {
            tests: [
              {
                id: 'test-1',
                name: 'Login Test',
                description: 'Test user login functionality',
                steps: [
                  { id: '1', type: 'navigate', selector: '', selectorType: 'id', action: 'goto', data: '{baseUrl}/login' },
                  { id: '2', type: 'type', selector: 'username', selectorType: 'id', action: 'fill', data: '{username}' },
                  { id: '3', type: 'type', selector: 'password', selectorType: 'id', action: 'fill', data: '{password}' },
                  { id: '4', type: 'click', selector: 'login-button', selectorType: 'id', action: 'click' }
                ],
                assertions: [
                  { type: 'url', expected: '{baseUrl}/dashboard', operator: 'contains' }
                ],
                priority: 'high'
              }
            ],
            setup: [],
            teardown: []
          },
          reporting: {
            screenshots: true,
            video: false,
            htmlReport: true,
            junitXml: true,
            customReports: []
          }
        },
        requiredInputs: ['baseUrl', 'testData'],
        providedOutputs: ['testResults', 'screenshots', 'report'],
        category: 'Quality Assurance',
        complexity: 'complex'
      },
      
      // Custom Components
      {
        id: 'custom-api-integrator',
        type: 'custom',
        name: 'API Integrator',
        description: 'Integrates with external APIs',
        defaultConfig: {
          runtime: 'nodejs',
          entryPoint: 'index.js',
          code: `
const axios = require('axios');

module.exports = async function(inputs) {
  const { url, method, headers, data } = inputs;
  
  try {
    const response = await axios({
      method: method || 'GET',
      url,
      headers: headers || {},
      data: data || {}
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 0
    };
  }
};
          `,
          dependencies: ['axios'],
          environment: {},
          resources: { cpu: '100m', memory: '128Mi', storage: '1Gi' },
          networking: { ports: [], allowedOutbound: ['*'], vpnRequired: false }
        },
        requiredInputs: ['url', 'method'],
        providedOutputs: ['response', 'success', 'error'],
        category: 'Integration',
        complexity: 'simple'
      },
      {
        id: 'custom-data-transformer',
        type: 'custom',
        name: 'Data Transformer',
        description: 'Transforms data between formats',
        defaultConfig: {
          runtime: 'python',
          entryPoint: 'transform.py',
          code: `
import json
import pandas as pd
from typing import Dict, Any

def main(inputs: Dict[str, Any]) -> Dict[str, Any]:
    data = inputs.get('data')
    source_format = inputs.get('source_format', 'json')
    target_format = inputs.get('target_format', 'json')
    
    try:
        # Convert source data to DataFrame
        if source_format == 'json':
            df = pd.DataFrame(data)
        elif source_format == 'csv':
            df = pd.read_csv(data)
        else:
            raise ValueError(f"Unsupported source format: {source_format}")
        
        # Transform data (example: basic cleaning)
        df = df.dropna()
        df = df.drop_duplicates()
        
        # Convert to target format
        if target_format == 'json':
            result = df.to_json(orient='records')
        elif target_format == 'csv':
            result = df.to_csv(index=False)
        else:
            raise ValueError(f"Unsupported target format: {target_format}")
        
        return {
            'success': True,
            'data': result,
            'rows_processed': len(df),
            'format': target_format
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
          `,
          dependencies: ['pandas', 'numpy'],
          environment: {},
          resources: { cpu: '200m', memory: '256Mi', storage: '2Gi' },
          networking: { ports: [], allowedOutbound: [], vpnRequired: false }
        },
        requiredInputs: ['data', 'source_format', 'target_format'],
        providedOutputs: ['transformed_data', 'success', 'metadata'],
        category: 'Data Processing',
        complexity: 'medium'
      }
    ];
  }

  // Agent Composition
  async createHybridAgent(request: AgentCompositionRequest): Promise<HybridAgent> {
    try {
      console.log('Creating hybrid agent with request:', request);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/hybrid/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify(request)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to create hybrid agent: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      return data.data;
    } catch (error) {
      console.error('Failed to create hybrid agent:', error);
      throw error;
    }
  }

  async validateAgentComposition(components: AgentComponent[]): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate component dependencies
    const componentIds = new Set(components.map(c => c.id));
    for (const component of components) {
      for (const depId of component.dependencies) {
        if (!componentIds.has(depId)) {
          errors.push(`Component ${component.name} depends on non-existent component ${depId}`);
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (componentId: string): boolean => {
      if (recursionStack.has(componentId)) return true;
      if (visited.has(componentId)) return false;

      visited.add(componentId);
      recursionStack.add(componentId);

      const component = components.find(c => c.id === componentId);
      if (component) {
        for (const depId of component.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }

      recursionStack.delete(componentId);
      return false;
    };

    for (const component of components) {
      if (hasCycle(component.id)) {
        errors.push(`Circular dependency detected involving component ${component.name}`);
        break;
      }
    }

    // Validate data flow
    for (const component of components) {
      for (const input of component.inputs) {
        if (input.required && input.source === 'component' && input.sourceId) {
          const sourceComponent = components.find(c => c.id === input.sourceId);
          if (sourceComponent) {
            const hasOutput = sourceComponent.outputs.some(o => o.name === input.name);
            if (!hasOutput) {
              errors.push(`Component ${component.name} expects input ${input.name} from ${sourceComponent.name}, but it doesn't provide this output`);
            }
          }
        }
      }
    }

    // Performance warnings
    const complexComponents = components.filter(c => 
      (c.type === 'llm' && (c.config as LLMAgentConfig).maxTokens > 2000) ||
      (c.type === 'selenium' && (c.config as SeleniumAgentConfig).testSuite.tests.length > 10)
    );
    
    if (complexComponents.length > 3) {
      warnings.push('Agent has many complex components, which may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Component Management
  async getComponentById(componentId: string): Promise<AgentComponent | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/components/${componentId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get component:', error);
      return null;
    }
  }

  async saveComponent(component: AgentComponent): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(component)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save component:', error);
      return false;
    }
  }

  // Agent Execution
  async executeHybridAgent(agentId: string, inputs: Record<string, any>): Promise<ExecutionContext> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/hybrid/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ inputs })
      });

      if (!response.ok) {
        throw new Error(`Failed to execute agent: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to execute hybrid agent:', error);
      throw error;
    }
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionContext | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/executions/${executionId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get execution status:', error);
      return null;
    }
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/executions/${executionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      return false;
    }
  }

  // Utility Methods
  generateComponentId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAgentId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  estimateExecutionTime(components: AgentComponent[]): number {
    let totalTime = 0;
    
    for (const component of components) {
      switch (component.type) {
        case 'llm':
          const llmConfig = component.config as LLMAgentConfig;
          totalTime += Math.ceil(llmConfig.maxTokens / 100) * 2; // ~2 seconds per 100 tokens
          break;
        case 'rpa':
          const rpaConfig = component.config as RPAAgentConfig;
          totalTime += rpaConfig.workflow.steps.length * 3; // ~3 seconds per step
          break;
        case 'selenium':
          const seleniumConfig = component.config as SeleniumAgentConfig;
          totalTime += seleniumConfig.testSuite.tests.reduce((sum, test) => sum + test.steps.length * 2, 0);
          break;
        case 'custom':
          totalTime += 10; // Default 10 seconds for custom components
          break;
        default:
          totalTime += 5;
      }
    }
    
    return totalTime;
  }

  estimateResourceUsage(components: AgentComponent[]): { cpu: string; memory: string; storage: string } {
    let totalCpu = 0;
    let totalMemory = 0;
    let totalStorage = 0;

    for (const component of components) {
      switch (component.type) {
        case 'llm':
          totalCpu += 200; // 200m CPU
          totalMemory += 512; // 512Mi memory
          totalStorage += 100; // 100Mi storage
          break;
        case 'rpa':
          totalCpu += 100;
          totalMemory += 256;
          totalStorage += 200;
          break;
        case 'selenium':
          totalCpu += 500; // Browser needs more CPU
          totalMemory += 1024; // Browser needs more memory
          totalStorage += 500;
          break;
        case 'custom':
          const customConfig = component.config as CustomAgentConfig;
          totalCpu += parseInt(customConfig.resources.cpu.replace('m', ''));
          totalMemory += parseInt(customConfig.resources.memory.replace('Mi', ''));
          totalStorage += parseInt(customConfig.resources.storage.replace('Mi', ''));
          break;
      }
    }

    return {
      cpu: `${totalCpu}m`,
      memory: `${totalMemory}Mi`,
      storage: `${totalStorage}Mi`
    };
  }
}

export const agentCompositionService = new AgentCompositionService();
export default agentCompositionService;
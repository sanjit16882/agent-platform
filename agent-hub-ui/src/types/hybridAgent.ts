// Hybrid Agent Architecture - Core Types and Interfaces

export type AgentType = 'llm' | 'rpa' | 'selenium' | 'custom' | 'hybrid';

export type ExecutionMode = 'sequential' | 'parallel' | 'conditional' | 'loop';

export interface BaseAgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  type: AgentType;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  category: string;
}

// LLM Agent Configuration
export interface LLMAgentConfig {
  provider: 'openai' | 'anthropic' | 'azure-openai' | 'custom';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  responseFormat: 'text' | 'json' | 'structured';
  tools?: LLMTool[];
  memoryEnabled: boolean;
  contextWindow: number;
}

export interface LLMTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  function: string; // Function code or reference
}

// RPA Agent Configuration
export interface RPAAgentConfig {
  platform: 'uipath' | 'automation-anywhere' | 'blue-prism' | 'power-automate' | 'custom';
  workflow: RPAWorkflow;
  variables: RPAVariable[];
  errorHandling: RPAErrorHandling;
  scheduling: RPAScheduling;
}

export interface RPAWorkflow {
  steps: RPAStep[];
  flowControl: ExecutionMode;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface RPAStep {
  id: string;
  type: 'click' | 'type' | 'read' | 'wait' | 'condition' | 'loop' | 'api-call' | 'file-operation';
  selector: string;
  action: string;
  data?: any;
  conditions?: RPACondition[];
  errorHandling?: 'continue' | 'retry' | 'stop' | 'escalate';
}

export interface RPAVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  scope: 'global' | 'local' | 'session';
}

export interface RPACondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists' | 'not-exists';
  value: any;
  action: 'continue' | 'skip' | 'branch' | 'stop';
}

export interface RPAErrorHandling {
  onError: 'continue' | 'retry' | 'stop' | 'escalate';
  maxRetries: number;
  retryDelay: number;
  escalationEmail?: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface RPAScheduling {
  enabled: boolean;
  cron?: string;
  timezone: string;
  maxConcurrent: number;
}

// Selenium Agent Configuration
export interface SeleniumAgentConfig {
  browser: 'chrome' | 'firefox' | 'safari' | 'edge';
  headless: boolean;
  windowSize: { width: number; height: number };
  timeout: number;
  testSuite: SeleniumTestSuite;
  reporting: SeleniumReporting;
}

export interface SeleniumTestSuite {
  tests: SeleniumTest[];
  setup: SeleniumStep[];
  teardown: SeleniumStep[];
  dataProvider?: string; // CSV, JSON, or API endpoint
}

export interface SeleniumTest {
  id: string;
  name: string;
  description: string;
  steps: SeleniumStep[];
  assertions: SeleniumAssertion[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SeleniumStep {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'select' | 'wait' | 'scroll' | 'screenshot' | 'execute-script';
  selector: string;
  selectorType: 'id' | 'class' | 'xpath' | 'css' | 'name' | 'tag';
  action: string;
  data?: any;
  timeout?: number;
  screenshot?: boolean;
}

export interface SeleniumAssertion {
  type: 'text' | 'attribute' | 'element-exists' | 'element-visible' | 'url' | 'title';
  selector?: string;
  expected: any;
  operator: 'equals' | 'contains' | 'starts-with' | 'ends-with' | 'greater' | 'less';
}

export interface SeleniumReporting {
  screenshots: boolean;
  video: boolean;
  htmlReport: boolean;
  junitXml: boolean;
  customReports: string[];
}

// Custom Agent Configuration
export interface CustomAgentConfig {
  runtime: 'nodejs' | 'python' | 'java' | 'dotnet' | 'go' | 'docker';
  entryPoint: string;
  code: string;
  dependencies: string[];
  environment: Record<string, string>;
  resources: ResourceRequirements;
  networking: NetworkingConfig;
}

export interface ResourceRequirements {
  cpu: string; // e.g., "100m", "1"
  memory: string; // e.g., "128Mi", "1Gi"
  storage: string; // e.g., "1Gi"
  gpu?: boolean;
}

export interface NetworkingConfig {
  ports: number[];
  allowedOutbound: string[];
  vpnRequired: boolean;
  securityGroup?: string;
}

// Hybrid Agent Configuration (combines multiple types)
export interface HybridAgentConfig {
  components: AgentComponent[];
  orchestration: OrchestrationConfig;
  dataFlow: DataFlowConfig;
  errorHandling: HybridErrorHandling;
}

export interface AgentComponent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  config: LLMAgentConfig | RPAAgentConfig | SeleniumAgentConfig | CustomAgentConfig;
  inputs: ComponentInput[];
  outputs: ComponentOutput[];
  dependencies: string[]; // IDs of components this depends on
}

export interface ComponentInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  required: boolean;
  source?: 'user' | 'component' | 'external' | 'constant';
  sourceId?: string; // Component ID or external source
  defaultValue?: any;
  validation?: InputValidation;
}

export interface ComponentOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  description: string;
  format?: 'json' | 'csv' | 'xml' | 'text' | 'binary';
}

export interface InputValidation {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  allowedValues?: any[];
}

export interface OrchestrationConfig {
  mode: ExecutionMode;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  parallelism: number; // Max parallel components
  conditions: OrchestrationCondition[];
}

export interface OrchestrationCondition {
  componentId: string;
  condition: string; // JavaScript expression
  onTrue: 'continue' | 'skip' | 'branch' | 'stop';
  onFalse: 'continue' | 'skip' | 'branch' | 'stop';
  branchTo?: string; // Component ID to branch to
}

export interface DataFlowConfig {
  mappings: DataMapping[];
  transformations: DataTransformation[];
  storage: DataStorageConfig;
}

export interface DataMapping {
  from: { componentId: string; outputName: string };
  to: { componentId: string; inputName: string };
  transformation?: string; // Transformation function name
}

export interface DataTransformation {
  name: string;
  type: 'javascript' | 'jq' | 'jsonpath' | 'regex' | 'custom';
  code: string;
  description: string;
}

export interface DataStorageConfig {
  persistent: boolean;
  encryption: boolean;
  retention: number; // Days
  location: 'memory' | 'disk' | 'database' | 'cloud';
}

export interface HybridErrorHandling {
  strategy: 'fail-fast' | 'continue-on-error' | 'retry-failed' | 'escalate';
  maxRetries: number;
  retryDelay: number;
  escalationRules: EscalationRule[];
  notifications: NotificationConfig[];
}

export interface EscalationRule {
  condition: string; // JavaScript expression
  action: 'email' | 'slack' | 'webhook' | 'sms' | 'ticket';
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  target: string;
  events: ('start' | 'success' | 'error' | 'timeout' | 'retry')[];
  template?: string;
}

// Common interfaces
export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

// Complete Agent Definition
export interface HybridAgent extends BaseAgentConfig {
  config: HybridAgentConfig;
  metadata: AgentMetadata;
  deployment: DeploymentConfig;
  monitoring: MonitoringConfig;
}

export interface AgentMetadata {
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedRuntime: number; // seconds
  resourceUsage: 'low' | 'medium' | 'high';
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  complianceFlags: string[];
  businessValue: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  cloud: 'aws' | 'azure' | 'gcp' | 'on-premise' | 'hybrid';
  region: string;
  scaling: ScalingConfig;
  security: SecurityConfig;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

export interface SecurityConfig {
  networkPolicy: string;
  serviceAccount: string;
  secrets: string[];
  rbac: string[];
  encryption: boolean;
}

export interface MonitoringConfig {
  metrics: string[];
  alerts: AlertConfig[];
  logging: LoggingConfig;
  tracing: boolean;
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  structured: boolean;
  retention: number; // days
  exportTo: string[];
}

// Execution Context
export interface ExecutionContext {
  executionId: string;
  agentId: string;
  userId: string;
  environment: string;
  inputs: Record<string, any>;
  startTime: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentComponent?: string;
  progress: number; // 0-100
  logs: ExecutionLog[];
  outputs: Record<string, any>;
  metrics: ExecutionMetrics;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  data?: any;
}

export interface ExecutionMetrics {
  duration: number;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  storageIO: number;
  cost: number;
  errors: number;
  retries: number;
}

// Agent Builder Types
export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: AgentType;
  complexity: 'simple' | 'medium' | 'complex';
  template: Partial<HybridAgent>;
  customizationPoints: CustomizationPoint[];
  examples: AgentExample[];
}

export interface CustomizationPoint {
  path: string; // JSON path to the field
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'code';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: InputValidation;
}

export interface AgentExample {
  name: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
  useCase: string;
}

// Visual Workflow Designer Types
export interface ComponentNode {
  id: string;
  component: AgentComponent;
  position: { x: number; y: number };
  selected: boolean;
}

export interface Connection {
  from: { componentId: string; outputName: string };
  to: { componentId: string; inputName: string };
}
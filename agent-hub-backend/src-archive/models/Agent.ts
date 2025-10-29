// New interfaces for NLP-generated agents
export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  triggers: TriggerConfig[];
  actions: ActionConfig[];
  connectors: ConnectorConfig[];
  parameters: ParameterConfig[];
  schedule?: ScheduleConfig;
  metadata?: Record<string, any>;
}

export interface TriggerConfig {
  id: string;
  type: 'schedule' | 'manual' | 'event' | 'webhook';
  name: string;
  config: Record<string, any>;
}

export interface ActionConfig {
  id: string;
  type: 'data-sync' | 'monitoring' | 'data-analysis' | 'notification' | 'transformation';
  name: string;
  config: Record<string, any>;
  parameters: ParameterConfig[];
}

export interface ConnectorConfig {
  id: string;
  type: 'github' | 'slack' | 'aws-s3' | 'jira' | 'email' | 'database';
  name: string;
  config: Record<string, any>;
  credentials?: Record<string, string>;
}

export interface ParameterConfig {
  name: string;
  type: string;
  value: any;
  required: boolean;
  description: string;
}

export interface ScheduleConfig {
  type: 'cron' | 'interval';
  expression?: string; // for cron
  interval?: number; // for interval
  unit?: 'minutes' | 'hours' | 'days'; // for interval
  timezone?: string;
}

export interface AgentIntent {
  action: string;
  sources: DataSource[];
  targets: DataTarget[];
  schedule?: ScheduleConfig;
  conditions?: Condition[];
  parameters: Record<string, any>;
}

export interface DataSource {
  type: 'aws-s3' | 'github' | 'slack' | 'database' | 'api' | 'file';
  name: string;
  config: Record<string, any>;
}

export interface DataTarget {
  type: 'aws-s3' | 'github' | 'slack' | 'database' | 'api' | 'file' | 'email';
  name: string;
  config: Record<string, any>;
}

export interface Condition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
}

// Existing interface
export interface AgentData {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: 'active' | 'inactive' | 'deprecated';
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  executionConfig: {
    defaultTimeout: number;
    maxTimeout: number;
    requiresAuth: boolean;
    allowedRoles: string[];
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: 'active' | 'inactive' | 'deprecated';
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  executionConfig: {
    defaultTimeout: number;
    maxTimeout: number;
    requiresAuth: boolean;
    allowedRoles: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export class Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly category: string;
  public readonly version: string;
  public readonly status: 'active' | 'inactive' | 'deprecated';
  public readonly inputSchema: Record<string, any>;
  public readonly outputSchema: Record<string, any>;
  public readonly executionConfig: {
    defaultTimeout: number;
    maxTimeout: number;
    requiresAuth: boolean;
    allowedRoles: string[];
  };
  public readonly metadata?: Record<string, any>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: AgentData) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.version = data.version;
    this.status = data.status;
    this.inputSchema = data.inputSchema;
    this.outputSchema = data.outputSchema;
    this.executionConfig = data.executionConfig;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Check if agent is available for execution
   */
  isAvailable(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if user role is allowed to execute this agent
   */
  canExecute(userRole: string): boolean {
    if (!this.executionConfig.requiresAuth) {
      return true;
    }
    
    return this.executionConfig.allowedRoles.includes(userRole) || 
           this.executionConfig.allowedRoles.includes('*');
  }

  /**
   * Validate input against schema
   */
  validateInput(input: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation - in production you'd use a proper JSON schema validator
    if (this.inputSchema.required) {
      for (const field of this.inputSchema.required) {
        if (!(field in input)) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get maximum allowed timeout for this agent
   */
  getMaxTimeout(): number {
    return this.executionConfig.maxTimeout;
  }

  /**
   * Get default timeout for this agent
   */
  getDefaultTimeout(): number {
    return this.executionConfig.defaultTimeout;
  }

  /**
   * Convert to response format
   */
  toResponse(): AgentResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      status: this.status,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      executionConfig: this.executionConfig,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convert to database format
   */
  toDatabase(): AgentData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      status: this.status,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      executionConfig: this.executionConfig,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
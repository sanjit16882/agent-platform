import { ParsedIntent, DataSource, DataTarget, Condition } from './IntentParser';
import { AgentConfig, TriggerConfig, ActionConfig, ConnectorConfig, ParameterConfig, ScheduleConfig } from '../../models/Agent';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface Suggestion {
  type: 'parameter' | 'connector' | 'schedule' | 'action';
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  impact: 'performance' | 'reliability' | 'cost' | 'security';
}

export class ConfigGenerator {
  private connectorTemplates: Map<string, ConnectorConfig> = new Map();
  private actionTemplates: Map<string, ActionConfig[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Connector templates
    this.connectorTemplates.set('github', {
      id: 'github-connector',
      type: 'github',
      name: 'GitHub Connector',
      config: {
        authentication: 'token',
        baseUrl: 'https://api.github.com',
        timeout: 30000,
        retryAttempts: 3
      },
      credentials: {
        tokenKey: 'GITHUB_TOKEN'
      }
    });

    this.connectorTemplates.set('slack', {
      id: 'slack-connector',
      type: 'slack',
      name: 'Slack Connector',
      config: {
        authentication: 'bot_token',
        timeout: 15000,
        retryAttempts: 2
      },
      credentials: {
        tokenKey: 'SLACK_BOT_TOKEN'
      }
    });

    this.connectorTemplates.set('aws-s3', {
      id: 's3-connector',
      type: 'aws-s3',
      name: 'AWS S3 Connector',
      config: {
        region: 'us-east-1',
        timeout: 60000,
        retryAttempts: 3,
        signatureVersion: 'v4'
      },
      credentials: {
        accessKeyId: 'AWS_ACCESS_KEY_ID',
        secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
      }
    });

    this.connectorTemplates.set('jira', {
      id: 'jira-connector',
      type: 'jira',
      name: 'Jira Connector',
      config: {
        authentication: 'basic',
        timeout: 30000,
        retryAttempts: 2
      },
      credentials: {
        username: 'JIRA_USERNAME',
        apiToken: 'JIRA_API_TOKEN',
        baseUrl: 'JIRA_BASE_URL'
      }
    });

    // Action templates
    this.actionTemplates.set('sync', [
      {
        id: 'sync-action',
        type: 'data-sync',
        name: 'Data Synchronization',
        config: {
          direction: 'bidirectional',
          conflictResolution: 'latest_wins',
          batchSize: 100,
          validateData: true
        },
        parameters: []
      }
    ]);

    this.actionTemplates.set('monitor', [
      {
        id: 'monitor-action',
        type: 'monitoring',
        name: 'Resource Monitoring',
        config: {
          checkInterval: 300, // 5 minutes
          alertThreshold: 1,
          includeMetrics: true,
          persistResults: true
        },
        parameters: []
      }
    ]);

    this.actionTemplates.set('analyze', [
      {
        id: 'analyze-action',
        type: 'data-analysis',
        name: 'Data Analysis',
        config: {
          outputFormat: 'json',
          includeMetrics: true,
          generateSummary: true,
          persistResults: true
        },
        parameters: []
      }
    ]);

    this.actionTemplates.set('notify', [
      {
        id: 'notify-action',
        type: 'notification',
        name: 'Notification',
        config: {
          priority: 'normal',
          includeDetails: true,
          retryOnFailure: true,
          maxRetries: 3
        },
        parameters: []
      }
    ]);
  }

  async generateConfig(intent: ParsedIntent): Promise<AgentConfig> {
    // Generate basic agent metadata
    const agentName = this.generateAgentName(intent);
    const description = this.generateDescription(intent);

    // Generate triggers based on schedule or event-based
    const triggers = this.generateTriggers(intent);

    // Generate actions based on intent
    const actions = this.generateActions(intent);

    // Generate connectors for sources and targets
    const connectors = this.generateConnectors(intent);

    // Generate parameters
    const parameters = this.generateParameters(intent);

    const config: AgentConfig = {
      name: agentName,
      description: description,
      version: '1.0.0',
      triggers: triggers,
      actions: actions,
      connectors: connectors,
      parameters: parameters,
      schedule: intent.schedule,
      metadata: {
        createdFrom: 'natural-language',
        originalDescription: intent.action,
        confidence: intent.confidence,
        generatedAt: new Date().toISOString()
      }
    };

    return config;
  }

  async validateConfig(config: AgentConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate basic structure
    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Agent name is required',
        severity: 'error'
      });
    }

    if (!config.triggers || config.triggers.length === 0) {
      errors.push({
        field: 'triggers',
        message: 'At least one trigger is required',
        severity: 'error'
      });
    }

    if (!config.actions || config.actions.length === 0) {
      errors.push({
        field: 'actions',
        message: 'At least one action is required',
        severity: 'error'
      });
    }

    // Validate connectors
    for (const connector of config.connectors || []) {
      if (!connector.type) {
        errors.push({
          field: `connectors.${connector.id}`,
          message: 'Connector type is required',
          severity: 'error'
        });
      }

      if (!connector.credentials) {
        warnings.push({
          field: `connectors.${connector.id}`,
          message: 'Connector credentials not configured',
          suggestion: 'Configure credentials in the connector settings'
        });
      }
    }

    // Validate schedule if present
    if (config.schedule) {
      const scheduleValidation = this.validateSchedule(config.schedule);
      errors.push(...scheduleValidation.errors);
      warnings.push(...scheduleValidation.warnings);
    }

    // Validate action-connector compatibility
    const compatibilityValidation = this.validateActionConnectorCompatibility(config);
    errors.push(...compatibilityValidation.errors);
    warnings.push(...compatibilityValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async suggestImprovements(config: AgentConfig): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Performance suggestions
    if (config.schedule?.type === 'interval' && config.schedule.interval < 60) {
      suggestions.push({
        type: 'schedule',
        field: 'schedule.interval',
        currentValue: config.schedule.interval,
        suggestedValue: 300, // 5 minutes
        reason: 'Very frequent polling can impact performance and increase costs',
        impact: 'performance'
      });
    }

    // Security suggestions
    for (const connector of config.connectors || []) {
      if (connector.type === 'aws-s3' && !connector.config?.encryption) {
        suggestions.push({
          type: 'connector',
          field: `connectors.${connector.id}.config.encryption`,
          currentValue: false,
          suggestedValue: true,
          reason: 'Enable encryption for sensitive data in S3',
          impact: 'security'
        });
      }
    }

    // Reliability suggestions
    for (const action of config.actions || []) {
      if (!action.config?.retryOnFailure) {
        suggestions.push({
          type: 'action',
          field: `actions.${action.id}.config.retryOnFailure`,
          currentValue: false,
          suggestedValue: true,
          reason: 'Enable retry logic for better reliability',
          impact: 'reliability'
        });
      }
    }

    // Cost optimization suggestions
    if (config.actions?.some(a => a.type === 'data-analysis') && 
        !config.parameters?.some(p => p.name === 'batchSize')) {
      suggestions.push({
        type: 'parameter',
        field: 'parameters.batchSize',
        currentValue: undefined,
        suggestedValue: 100,
        reason: 'Process data in batches to optimize resource usage',
        impact: 'cost'
      });
    }

    return suggestions;
  }

  private generateAgentName(intent: ParsedIntent): string {
    const action = intent.action.charAt(0).toUpperCase() + intent.action.slice(1);
    const sources = intent.sources.map(s => s.name).join('-');
    const targets = intent.targets.map(t => t.name).join('-');
    
    if (sources && targets) {
      return `${action} ${sources} to ${targets}`;
    } else if (sources) {
      return `${action} ${sources}`;
    } else {
      return `${action} Agent`;
    }
  }

  private generateDescription(intent: ParsedIntent): string {
    let description = `Automatically ${intent.action}s`;
    
    if (intent.sources.length > 0) {
      description += ` data from ${intent.sources.map(s => s.name).join(', ')}`;
    }
    
    if (intent.targets.length > 0) {
      description += ` to ${intent.targets.map(t => t.name).join(', ')}`;
    }
    
    if (intent.schedule) {
      if (intent.schedule.type === 'cron') {
        description += ` on a scheduled basis`;
      } else {
        description += ` every ${intent.schedule.interval} ${intent.schedule.unit}`;
      }
    }
    
    return description + '.';
  }

  private generateTriggers(intent: ParsedIntent): TriggerConfig[] {
    const triggers: TriggerConfig[] = [];

    if (intent.schedule) {
      triggers.push({
        id: 'schedule-trigger',
        type: 'schedule',
        name: 'Scheduled Trigger',
        config: {
          schedule: intent.schedule,
          timezone: intent.schedule.timezone || 'UTC'
        }
      });
    } else {
      // Default to manual trigger if no schedule specified
      triggers.push({
        id: 'manual-trigger',
        type: 'manual',
        name: 'Manual Trigger',
        config: {
          requireConfirmation: false
        }
      });
    }

    // Add event-based triggers if conditions are present
    if (intent.conditions && intent.conditions.length > 0) {
      triggers.push({
        id: 'event-trigger',
        type: 'event',
        name: 'Event-based Trigger',
        config: {
          conditions: intent.conditions,
          evaluationMode: 'all' // all conditions must be met
        }
      });
    }

    return triggers;
  }

  private generateActions(intent: ParsedIntent): ActionConfig[] {
    const actionTemplates = this.actionTemplates.get(intent.action) || [];
    const actions: ActionConfig[] = [];

    for (const template of actionTemplates) {
      const action: ActionConfig = {
        ...template,
        id: `${template.id}-${Date.now()}`,
        config: {
          ...template.config,
          ...intent.parameters
        }
      };

      // Customize action based on sources and targets
      if (intent.action === 'sync') {
        action.config.sources = intent.sources.map(s => s.name);
        action.config.targets = intent.targets.map(t => t.name);
      }

      actions.push(action);
    }

    return actions;
  }

  private generateConnectors(intent: ParsedIntent): ConnectorConfig[] {
    const connectors: ConnectorConfig[] = [];
    const usedTypes = new Set<string>();

    // Add connectors for sources
    for (const source of intent.sources) {
      if (!usedTypes.has(source.type)) {
        const template = this.connectorTemplates.get(source.type);
        if (template) {
          connectors.push({
            ...template,
            id: `${source.type}-${Date.now()}`,
            config: {
              ...template.config,
              ...source.config
            }
          });
          usedTypes.add(source.type);
        }
      }
    }

    // Add connectors for targets
    for (const target of intent.targets) {
      if (!usedTypes.has(target.type)) {
        const template = this.connectorTemplates.get(target.type);
        if (template) {
          connectors.push({
            ...template,
            id: `${target.type}-${Date.now()}`,
            config: {
              ...template.config,
              ...target.config
            }
          });
          usedTypes.add(target.type);
        }
      }
    }

    return connectors;
  }

  private generateParameters(intent: ParsedIntent): ParameterConfig[] {
    const parameters: ParameterConfig[] = [];

    // Add parameters from intent
    for (const [key, value] of Object.entries(intent.parameters)) {
      parameters.push({
        name: key,
        type: typeof value,
        value: value,
        required: false,
        description: `Auto-generated parameter: ${key}`
      });
    }

    // Add common parameters based on action type
    switch (intent.action) {
      case 'sync':
        parameters.push({
          name: 'batchSize',
          type: 'number',
          value: 100,
          required: false,
          description: 'Number of items to process in each batch'
        });
        break;
      case 'monitor':
        parameters.push({
          name: 'alertThreshold',
          type: 'number',
          value: 1,
          required: false,
          description: 'Number of issues before triggering an alert'
        });
        break;
    }

    return parameters;
  }

  private validateSchedule(schedule: ScheduleConfig): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (schedule.type === 'cron') {
      if (!schedule.expression) {
        errors.push({
          field: 'schedule.expression',
          message: 'Cron expression is required for cron schedule',
          severity: 'error'
        });
      } else if (!this.isValidCronExpression(schedule.expression)) {
        errors.push({
          field: 'schedule.expression',
          message: 'Invalid cron expression format',
          severity: 'error'
        });
      }
    }

    if (schedule.type === 'interval') {
      if (!schedule.interval || schedule.interval <= 0) {
        errors.push({
          field: 'schedule.interval',
          message: 'Interval must be a positive number',
          severity: 'error'
        });
      } else if (schedule.interval < 60) {
        warnings.push({
          field: 'schedule.interval',
          message: 'Very frequent intervals may impact performance',
          suggestion: 'Consider using intervals of 5 minutes or more'
        });
      }
    }

    return { errors, warnings };
  }

  private validateActionConnectorCompatibility(config: AgentConfig): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if required connectors are available for actions
    for (const action of config.actions || []) {
      if (action.type === 'data-sync') {
        const requiredConnectors = this.getRequiredConnectorsForSync(action);
        for (const requiredType of requiredConnectors) {
          const hasConnector = config.connectors?.some(c => c.type === requiredType);
          if (!hasConnector) {
            errors.push({
              field: `actions.${action.id}`,
              message: `Missing required connector of type: ${requiredType}`,
              severity: 'error'
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  private getRequiredConnectorsForSync(action: ActionConfig): string[] {
    const sources = action.config?.sources || [];
    const targets = action.config?.targets || [];
    
    // This is a simplified version - in reality, you'd map source/target names to connector types
    return [...sources, ...targets];
  }

  private isValidCronExpression(expression: string): boolean {
    // Basic cron validation - in production, use a proper cron parser
    const parts = expression.split(' ');
    return parts.length === 5 || parts.length === 6;
  }
}
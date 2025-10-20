import { AgentConfig, TriggerConfig, ActionConfig, ConnectorConfig, ParameterConfig, ScheduleConfig } from '../../models/Agent';
import { ValidationResult, ValidationError, ValidationWarning, Suggestion } from './ConfigGenerator';

export interface ConfigEditRequest {
  configId?: string;
  field: string;
  value: any;
  operation: 'update' | 'add' | 'remove';
}

export interface ConfigRefinementRequest {
  originalConfig: AgentConfig;
  refinementDescription: string;
  preserveExisting?: boolean;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  baseConfig: Partial<AgentConfig>;
  requiredFields: string[];
  optionalFields: string[];
}

export class ConfigEditor {
  private templates: Map<string, ConfigTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Sync Agent Template
    this.templates.set('sync-agent', {
      id: 'sync-agent',
      name: 'Data Synchronization Agent',
      description: 'Synchronizes data between two or more sources',
      category: 'data-sync',
      baseConfig: {
        version: '1.0.0',
        triggers: [{
          id: 'sync-trigger',
          type: 'schedule',
          name: 'Sync Schedule',
          config: { interval: 3600 } // 1 hour default
        }],
        actions: [{
          id: 'sync-action',
          type: 'data-sync',
          name: 'Data Synchronization',
          config: {
            direction: 'bidirectional',
            conflictResolution: 'latest_wins',
            batchSize: 100
          },
          parameters: []
        }]
      },
      requiredFields: ['name', 'description', 'triggers', 'actions'],
      optionalFields: ['schedule', 'connectors', 'parameters']
    });

    // Monitor Agent Template
    this.templates.set('monitor-agent', {
      id: 'monitor-agent',
      name: 'Monitoring Agent',
      description: 'Monitors resources and sends alerts',
      category: 'monitoring',
      baseConfig: {
        version: '1.0.0',
        triggers: [{
          id: 'monitor-trigger',
          type: 'schedule',
          name: 'Monitor Schedule',
          config: { interval: 300 } // 5 minutes default
        }],
        actions: [{
          id: 'monitor-action',
          type: 'monitoring',
          name: 'Resource Monitoring',
          config: {
            checkInterval: 300,
            alertThreshold: 1,
            includeMetrics: true
          },
          parameters: []
        }]
      },
      requiredFields: ['name', 'description', 'triggers', 'actions'],
      optionalFields: ['schedule', 'connectors', 'parameters']
    });

    // Notification Agent Template
    this.templates.set('notify-agent', {
      id: 'notify-agent',
      name: 'Notification Agent',
      description: 'Sends notifications and alerts',
      category: 'notification',
      baseConfig: {
        version: '1.0.0',
        triggers: [{
          id: 'notify-trigger',
          type: 'event',
          name: 'Event Trigger',
          config: { eventType: 'webhook' }
        }],
        actions: [{
          id: 'notify-action',
          type: 'notification',
          name: 'Send Notification',
          config: {
            priority: 'normal',
            includeDetails: true,
            retryOnFailure: true
          },
          parameters: []
        }]
      },
      requiredFields: ['name', 'description', 'triggers', 'actions'],
      optionalFields: ['schedule', 'connectors', 'parameters']
    });
  }

  /**
   * Edit a specific field in the agent configuration
   */
  async editConfig(config: AgentConfig, editRequest: ConfigEditRequest): Promise<AgentConfig> {
    const updatedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

    try {
      switch (editRequest.operation) {
        case 'update':
          this.updateConfigField(updatedConfig, editRequest.field, editRequest.value);
          break;
        case 'add':
          this.addConfigField(updatedConfig, editRequest.field, editRequest.value);
          break;
        case 'remove':
          this.removeConfigField(updatedConfig, editRequest.field);
          break;
      }

      // Update metadata
      updatedConfig.metadata = {
        ...updatedConfig.metadata,
        lastModified: new Date().toISOString(),
        editHistory: [
          ...(updatedConfig.metadata?.editHistory || []),
          {
            timestamp: new Date().toISOString(),
            operation: editRequest.operation,
            field: editRequest.field,
            value: editRequest.value
          }
        ]
      };

      return updatedConfig;
    } catch (error) {
      throw new Error(`Failed to edit configuration: ${error.message}`);
    }
  }

  /**
   * Refine configuration based on natural language description
   */
  async refineConfig(refinementRequest: ConfigRefinementRequest): Promise<AgentConfig> {
    const { originalConfig, refinementDescription, preserveExisting = true } = refinementRequest;
    
    // Parse refinement intent
    const refinementIntent = await this.parseRefinementIntent(refinementDescription);
    
    let refinedConfig = preserveExisting 
      ? JSON.parse(JSON.stringify(originalConfig)) // Deep clone
      : this.createBaseConfig();

    // Apply refinements
    if (refinementIntent.schedule) {
      refinedConfig.schedule = refinementIntent.schedule;
      this.updateTriggersForSchedule(refinedConfig, refinementIntent.schedule);
    }

    if (refinementIntent.parameters) {
      refinedConfig.parameters = this.mergeParameters(
        refinedConfig.parameters || [],
        refinementIntent.parameters
      );
    }

    if (refinementIntent.connectors) {
      refinedConfig.connectors = this.mergeConnectors(
        refinedConfig.connectors || [],
        refinementIntent.connectors
      );
    }

    if (refinementIntent.actions) {
      refinedConfig.actions = this.mergeActions(
        refinedConfig.actions || [],
        refinementIntent.actions
      );
    }

    // Update metadata
    refinedConfig.metadata = {
      ...refinedConfig.metadata,
      lastRefinement: new Date().toISOString(),
      refinementHistory: [
        ...(refinedConfig.metadata?.refinementHistory || []),
        {
          timestamp: new Date().toISOString(),
          description: refinementDescription,
          changes: refinementIntent
        }
      ]
    };

    return refinedConfig;
  }

  /**
   * Generate configuration from template
   */
  async generateFromTemplate(templateId: string, customizations: Partial<AgentConfig> = {}): Promise<AgentConfig> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }

    const config: AgentConfig = {
      name: customizations.name || `${template.name} Instance`,
      description: customizations.description || template.description,
      version: '1.0.0',
      triggers: [],
      actions: [],
      connectors: [],
      parameters: [],
      ...template.baseConfig,
      ...customizations,
      metadata: {
        generatedFrom: 'template',
        templateId: templateId,
        templateName: template.name,
        createdAt: new Date().toISOString(),
        ...customizations.metadata
      }
    };

    return config;
  }

  /**
   * Validate configuration with detailed feedback
   */
  async validateConfigDetailed(config: AgentConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Agent name is required and cannot be empty',
        severity: 'error'
      });
    }

    if (!config.description || config.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Agent description is required and cannot be empty',
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

    // Validate triggers
    config.triggers?.forEach((trigger, index) => {
      if (!trigger.type) {
        errors.push({
          field: `triggers[${index}].type`,
          message: 'Trigger type is required',
          severity: 'error'
        });
      }

      if (trigger.type === 'schedule' && !trigger.config?.interval && !config.schedule) {
        warnings.push({
          field: `triggers[${index}]`,
          message: 'Schedule trigger should have interval or global schedule configured',
          suggestion: 'Add interval to trigger config or set global schedule'
        });
      }
    });

    // Validate actions
    config.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push({
          field: `actions[${index}].type`,
          message: 'Action type is required',
          severity: 'error'
        });
      }

      if (!action.name || action.name.trim().length === 0) {
        errors.push({
          field: `actions[${index}].name`,
          message: 'Action name is required',
          severity: 'error'
        });
      }
    });

    // Validate connectors
    config.connectors?.forEach((connector, index) => {
      if (!connector.type) {
        errors.push({
          field: `connectors[${index}].type`,
          message: 'Connector type is required',
          severity: 'error'
        });
      }

      if (!connector.credentials && this.requiresCredentials(connector.type)) {
        warnings.push({
          field: `connectors[${index}].credentials`,
          message: `${connector.type} connector typically requires credentials`,
          suggestion: 'Configure credentials for this connector'
        });
      }
    });

    // Performance warnings
    if (config.schedule?.type === 'interval' && config.schedule.interval < 60) {
      warnings.push({
        field: 'schedule.interval',
        message: 'Very frequent intervals may impact performance',
        suggestion: 'Consider using intervals of 1 minute or more'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available templates
   */
  getTemplates(): ConfigTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by category
   */
  getTemplatesByCategory(category: string): ConfigTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  // Private helper methods
  private updateConfigField(config: AgentConfig, field: string, value: any): void {
    const fieldPath = field.split('.');
    let current = config as any;
    
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }
    
    current[fieldPath[fieldPath.length - 1]] = value;
  }

  private addConfigField(config: AgentConfig, field: string, value: any): void {
    if (field === 'triggers') {
      config.triggers = config.triggers || [];
      config.triggers.push(value);
    } else if (field === 'actions') {
      config.actions = config.actions || [];
      config.actions.push(value);
    } else if (field === 'connectors') {
      config.connectors = config.connectors || [];
      config.connectors.push(value);
    } else if (field === 'parameters') {
      config.parameters = config.parameters || [];
      config.parameters.push(value);
    } else {
      this.updateConfigField(config, field, value);
    }
  }

  private removeConfigField(config: AgentConfig, field: string): void {
    const fieldPath = field.split('.');
    
    if (fieldPath.length === 1) {
      delete (config as any)[field];
    } else {
      // Handle nested field removal
      let current = config as any;
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) return;
        current = current[fieldPath[i]];
      }
      delete current[fieldPath[fieldPath.length - 1]];
    }
  }

  private async parseRefinementIntent(description: string): Promise<any> {
    // Simple refinement parsing - in production, this would be more sophisticated
    const intent: any = {};

    // Schedule refinements
    if (description.includes('every') || description.includes('daily') || description.includes('hourly')) {
      if (description.includes('daily')) {
        intent.schedule = { type: 'cron', expression: '0 9 * * *', timezone: 'UTC' };
      } else if (description.includes('hourly')) {
        intent.schedule = { type: 'interval', interval: 3600, unit: 'seconds' };
      }
    }

    // Parameter refinements
    if (description.includes('batch size') || description.includes('batchSize')) {
      const match = description.match(/batch\s*size\s*(?:of\s*)?(\d+)/i);
      if (match) {
        intent.parameters = [{ name: 'batchSize', type: 'number', value: parseInt(match[1]) }];
      }
    }

    return intent;
  }

  private createBaseConfig(): AgentConfig {
    return {
      name: 'New Agent',
      description: 'Agent created through refinement',
      version: '1.0.0',
      triggers: [],
      actions: [],
      connectors: [],
      parameters: []
    };
  }

  private updateTriggersForSchedule(config: AgentConfig, schedule: ScheduleConfig): void {
    config.triggers?.forEach(trigger => {
      if (trigger.type === 'schedule') {
        trigger.config = {
          ...trigger.config,
          schedule: schedule
        };
      }
    });
  }

  private mergeParameters(existing: ParameterConfig[], newParams: ParameterConfig[]): ParameterConfig[] {
    const merged = [...existing];
    
    newParams.forEach(newParam => {
      const existingIndex = merged.findIndex(p => p.name === newParam.name);
      if (existingIndex >= 0) {
        merged[existingIndex] = newParam;
      } else {
        merged.push(newParam);
      }
    });
    
    return merged;
  }

  private mergeConnectors(existing: ConnectorConfig[], newConnectors: ConnectorConfig[]): ConnectorConfig[] {
    const merged = [...existing];
    
    newConnectors.forEach(newConnector => {
      const existingIndex = merged.findIndex(c => c.type === newConnector.type);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...newConnector };
      } else {
        merged.push(newConnector);
      }
    });
    
    return merged;
  }

  private mergeActions(existing: ActionConfig[], newActions: ActionConfig[]): ActionConfig[] {
    const merged = [...existing];
    
    newActions.forEach(newAction => {
      const existingIndex = merged.findIndex(a => a.type === newAction.type);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...newAction };
      } else {
        merged.push(newAction);
      }
    });
    
    return merged;
  }

  private requiresCredentials(connectorType: string): boolean {
    const credentialRequiredTypes = ['github', 'slack', 'aws-s3', 'jira', 'email'];
    return credentialRequiredTypes.includes(connectorType);
  }
}

export const configEditor = new ConfigEditor();
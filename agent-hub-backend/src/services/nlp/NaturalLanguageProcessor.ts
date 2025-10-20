import { IntentParser, ParsedIntent } from './IntentParser';
import { ConfigGenerator, ValidationResult, Suggestion } from './ConfigGenerator';
import { AgentConfig } from '../../models/Agent';

export interface NLPProcessingResult {
  intent: ParsedIntent;
  config: AgentConfig;
  validation: ValidationResult;
  suggestions: Suggestion[];
  processingTime: number;
}

export interface NLPProcessingOptions {
  includeValidation?: boolean;
  includeSuggestions?: boolean;
  customTemplates?: Record<string, any>;
}

export class NaturalLanguageProcessor {
  private intentParser: IntentParser;
  private configGenerator: ConfigGenerator;

  constructor() {
    this.intentParser = new IntentParser();
    this.configGenerator = new ConfigGenerator();
  }

  /**
   * Main method to process natural language description into agent configuration
   */
  async processDescription(
    description: string, 
    options: NLPProcessingOptions = {}
  ): Promise<NLPProcessingResult> {
    const startTime = Date.now();

    try {
      // Step 1: Parse the natural language intent
      const intent = await this.intentParser.parseIntent(description);

      // Step 2: Generate agent configuration from intent
      const config = await this.configGenerator.generateConfig(intent);

      // Step 3: Validate configuration (if requested)
      let validation: ValidationResult = { isValid: true, errors: [], warnings: [] };
      if (options.includeValidation !== false) {
        validation = await this.configGenerator.validateConfig(config);
      }

      // Step 4: Generate improvement suggestions (if requested)
      let suggestions: Suggestion[] = [];
      if (options.includeSuggestions !== false) {
        suggestions = await this.configGenerator.suggestImprovements(config);
      }

      const processingTime = Date.now() - startTime;

      return {
        intent,
        config,
        validation,
        suggestions,
        processingTime
      };
    } catch (error) {
      throw new Error(`NLP processing failed: ${error.message}`);
    }
  }

  /**
   * Parse natural language intent only (without generating full config)
   */
  async parseIntent(description: string): Promise<ParsedIntent> {
    return await this.intentParser.parseIntent(description);
  }

  /**
   * Generate agent configuration from parsed intent
   */
  async generateConfig(intent: ParsedIntent): Promise<AgentConfig> {
    return await this.configGenerator.generateConfig(intent);
  }

  /**
   * Validate an existing agent configuration
   */
  async validateConfig(config: AgentConfig): Promise<ValidationResult> {
    return await this.configGenerator.validateConfig(config);
  }

  /**
   * Get improvement suggestions for an existing configuration
   */
  async suggestImprovements(config: AgentConfig): Promise<Suggestion[]> {
    return await this.configGenerator.suggestImprovements(config);
  }

  /**
   * Refine an existing configuration based on additional natural language input
   */
  async refineConfig(
    existingConfig: AgentConfig, 
    refinementDescription: string
  ): Promise<AgentConfig> {
    // Parse the refinement intent
    const refinementIntent = await this.intentParser.parseIntent(refinementDescription);

    // Apply refinements to existing config
    const refinedConfig = this.applyRefinements(existingConfig, refinementIntent);

    return refinedConfig;
  }

  /**
   * Get examples of natural language descriptions that can be processed
   */
  getExamples(): string[] {
    return [
      "Build me an agent that syncs Jira and Slack daily at 5 PM",
      "Monitor GitHub repository for new pull requests and notify team in Slack",
      "Analyze S3 bucket files every hour and generate summary reports",
      "Copy files from GitHub to S3 when new releases are created",
      "Send weekly status updates to Slack channel every Friday at 9 AM",
      "Watch for critical issues in Jira and immediately alert the team",
      "Sync customer data between database and S3 every 30 minutes",
      "Process incoming emails and create Jira tickets for support requests",
      "Monitor system metrics and send alerts when thresholds are exceeded",
      "Generate daily reports from database and email to stakeholders"
    ];
  }

  /**
   * Get supported action types and their descriptions
   */
  getSupportedActions(): Record<string, string> {
    return {
      'sync': 'Synchronize data between two or more sources',
      'monitor': 'Watch for changes or conditions and trigger alerts',
      'analyze': 'Process and analyze data to generate insights',
      'notify': 'Send notifications or alerts to users or systems',
      'process': 'Transform or manipulate data according to rules',
      'backup': 'Create backups of data or configurations',
      'deploy': 'Deploy applications or configurations to environments',
      'test': 'Run automated tests and report results'
    };
  }

  /**
   * Get supported connector types and their capabilities
   */
  getSupportedConnectors(): Record<string, { description: string, capabilities: string[] }> {
    return {
      'github': {
        description: 'Connect to GitHub repositories and APIs',
        capabilities: ['Repository operations', 'Pull request management', 'Webhook handling', 'Issue tracking']
      },
      'slack': {
        description: 'Integrate with Slack for messaging and notifications',
        capabilities: ['Send messages', 'Monitor channels', 'User interactions', 'File sharing']
      },
      'aws-s3': {
        description: 'Access AWS S3 for file storage and management',
        capabilities: ['File upload/download', 'Bucket operations', 'Metadata management', 'Access control']
      },
      'jira': {
        description: 'Connect to Jira for issue and project management',
        capabilities: ['Issue creation/updates', 'Project management', 'Workflow automation', 'Reporting']
      },
      'email': {
        description: 'Send and receive emails',
        capabilities: ['Send notifications', 'Process incoming emails', 'Attachment handling', 'Template support']
      },
      'database': {
        description: 'Connect to various database systems',
        capabilities: ['Query execution', 'Data synchronization', 'Schema management', 'Backup operations']
      }
    };
  }

  private applyRefinements(config: AgentConfig, refinementIntent: ParsedIntent): AgentConfig {
    const refinedConfig = { ...config };

    // Apply schedule refinements
    if (refinementIntent.schedule) {
      refinedConfig.schedule = refinementIntent.schedule;
    }

    // Apply parameter refinements
    if (Object.keys(refinementIntent.parameters).length > 0) {
      refinedConfig.parameters = refinedConfig.parameters || [];
      
      for (const [key, value] of Object.entries(refinementIntent.parameters)) {
        const existingParam = refinedConfig.parameters.find(p => p.name === key);
        if (existingParam) {
          existingParam.value = value;
        } else {
          refinedConfig.parameters.push({
            name: key,
            type: typeof value,
            value: value,
            required: false,
            description: `Refined parameter: ${key}`
          });
        }
      }
    }

    // Apply connector refinements
    if (refinementIntent.sources.length > 0 || refinementIntent.targets.length > 0) {
      // This would involve more complex logic to merge new sources/targets
      // For now, we'll just update the metadata to indicate refinement
      refinedConfig.metadata = {
        ...refinedConfig.metadata,
        lastRefinement: new Date().toISOString(),
        refinementCount: (refinedConfig.metadata?.refinementCount || 0) + 1
      };
    }

    return refinedConfig;
  }
}

// Export singleton instance
export const nlpProcessor = new NaturalLanguageProcessor();
import { AgentIntent, AgentConfig, ParameterConfig, TriggerConfig, ActionConfig, ConnectorConfig, ScheduleConfig } from '../../models/Agent';

export interface ParsedIntent {
  action: string;
  sources: DataSource[];
  targets: DataTarget[];
  schedule?: ScheduleConfig;
  conditions?: Condition[];
  parameters: Record<string, any>;
  confidence: number;
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

export class IntentParser {
  private actionPatterns: Map<string, RegExp[]> = new Map();
  private sourcePatterns: Map<string, RegExp[]> = new Map();
  private targetPatterns: Map<string, RegExp[]> = new Map();
  private schedulePatterns: RegExp[] = [];

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Action patterns
    this.actionPatterns.set('sync', [
      /sync\s+(.+?)\s+(?:with|to|and)\s+(.+)/i,
      /synchronize\s+(.+?)\s+(?:with|to|and)\s+(.+)/i,
      /copy\s+(.+?)\s+(?:to|into)\s+(.+)/i
    ]);

    this.actionPatterns.set('monitor', [
      /monitor\s+(.+?)(?:\s+for\s+(.+))?/i,
      /watch\s+(.+?)(?:\s+for\s+(.+))?/i,
      /track\s+(.+?)(?:\s+for\s+(.+))?/i
    ]);

    this.actionPatterns.set('analyze', [
      /analyze\s+(.+?)(?:\s+for\s+(.+))?/i,
      /process\s+(.+?)(?:\s+for\s+(.+))?/i,
      /review\s+(.+?)(?:\s+for\s+(.+))?/i
    ]);

    this.actionPatterns.set('notify', [
      /notify\s+(.+?)\s+(?:when|if|about)\s+(.+)/i,
      /send\s+(.+?)\s+(?:when|if|about)\s+(.+)/i,
      /alert\s+(.+?)\s+(?:when|if|about)\s+(.+)/i
    ]);

    // Source patterns
    this.sourcePatterns.set('github', [
      /github\s+(?:repo|repository)\s+(.+)/i,
      /git\s+(?:repo|repository)\s+(.+)/i,
      /(?:from\s+)?github\s+(.+)/i
    ]);

    this.sourcePatterns.set('slack', [
      /slack\s+(?:channel\s+)?(.+)/i,
      /(?:from\s+)?slack\s+(.+)/i
    ]);

    this.sourcePatterns.set('aws-s3', [
      /s3\s+bucket\s+(.+)/i,
      /aws\s+s3\s+(.+)/i,
      /(?:from\s+)?s3\s+(.+)/i
    ]);

    this.sourcePatterns.set('jira', [
      /jira\s+(?:project\s+)?(.+)/i,
      /(?:from\s+)?jira\s+(.+)/i
    ]);

    // Target patterns
    this.targetPatterns.set('slack', [
      /(?:to\s+)?slack\s+(?:channel\s+)?(.+)/i,
      /(?:in\s+)?slack\s+(.+)/i
    ]);

    this.targetPatterns.set('github', [
      /(?:to\s+)?github\s+(?:repo|repository)\s+(.+)/i,
      /(?:to\s+)?git\s+(?:repo|repository)\s+(.+)/i
    ]);

    this.targetPatterns.set('aws-s3', [
      /(?:to\s+)?s3\s+bucket\s+(.+)/i,
      /(?:to\s+)?aws\s+s3\s+(.+)/i
    ]);

    this.targetPatterns.set('email', [
      /(?:to\s+)?email\s+(.+)/i,
      /(?:via\s+)?email\s+(.+)/i
    ]);

    // Schedule patterns
    this.schedulePatterns = [
      /daily\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /every\s+day\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /weekly\s+on\s+(\w+)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /every\s+(\d+)\s+(minutes?|hours?|days?)/i,
      /at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    ];
  }

  async parseIntent(description: string): Promise<ParsedIntent> {
    const normalizedDescription = description.toLowerCase().trim();
    
    // Parse action
    const action = this.extractAction(normalizedDescription);
    
    // Parse sources and targets
    const sources = this.extractSources(normalizedDescription);
    const targets = this.extractTargets(normalizedDescription);
    
    // Parse schedule
    const schedule = this.extractSchedule(normalizedDescription);
    
    // Parse conditions
    const conditions = this.extractConditions(normalizedDescription);
    
    // Extract parameters
    const parameters = this.extractParameters(normalizedDescription, action);
    
    // Calculate confidence based on how many components we successfully parsed
    const confidence = this.calculateConfidence(action, sources, targets, schedule);

    return {
      action,
      sources,
      targets,
      schedule,
      conditions,
      parameters,
      confidence
    };
  }

  private extractAction(description: string): string {
    for (const [action, patterns] of this.actionPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(description)) {
          return action;
        }
      }
    }
    
    // Default action based on keywords
    if (description.includes('copy') || description.includes('move')) return 'sync';
    if (description.includes('watch') || description.includes('check')) return 'monitor';
    if (description.includes('process') || description.includes('transform')) return 'analyze';
    if (description.includes('send') || description.includes('message')) return 'notify';
    
    return 'process'; // Default action
  }

  private extractSources(description: string): DataSource[] {
    const sources: DataSource[] = [];
    
    for (const [sourceType, patterns] of this.sourcePatterns) {
      for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) {
          sources.push({
            type: sourceType as any,
            name: match[1]?.trim() || sourceType,
            config: this.getDefaultSourceConfig(sourceType)
          });
        }
      }
    }
    
    return sources;
  }

  private extractTargets(description: string): DataTarget[] {
    const targets: DataTarget[] = [];
    
    for (const [targetType, patterns] of this.targetPatterns) {
      for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) {
          targets.push({
            type: targetType as any,
            name: match[1]?.trim() || targetType,
            config: this.getDefaultTargetConfig(targetType)
          });
        }
      }
    }
    
    return targets;
  }

  private extractSchedule(description: string): ScheduleConfig | undefined {
    for (const pattern of this.schedulePatterns) {
      const match = description.match(pattern);
      if (match) {
        return this.parseScheduleMatch(match);
      }
    }
    
    return undefined;
  }

  private parseScheduleMatch(match: RegExpMatchArray): ScheduleConfig {
    const fullMatch = match[0].toLowerCase();
    
    if (fullMatch.includes('daily') || fullMatch.includes('every day')) {
      return {
        type: 'cron',
        expression: this.timeToCron(match[1] || '9:00 AM'),
        timezone: 'UTC'
      };
    }
    
    if (fullMatch.includes('weekly')) {
      const day = match[1];
      const time = match[2] || '9:00 AM';
      return {
        type: 'cron',
        expression: this.weeklyToCron(day, time),
        timezone: 'UTC'
      };
    }
    
    if (fullMatch.includes('every')) {
      const interval = parseInt(match[1]);
      const unit = match[2];
      return {
        type: 'interval',
        interval: this.convertToMinutes(interval, unit),
        unit: 'minutes'
      };
    }
    
    // Default to daily at specified time
    return {
      type: 'cron',
      expression: this.timeToCron(match[1] || '9:00 AM'),
      timezone: 'UTC'
    };
  }

  private extractConditions(description: string): Condition[] {
    const conditions: Condition[] = [];
    
    // Look for conditional patterns
    const conditionalPatterns = [
      /when\s+(.+?)\s+(equals?|contains?|is\s+greater\s+than|is\s+less\s+than|exists?)\s+(.+)/i,
      /if\s+(.+?)\s+(equals?|contains?|is\s+greater\s+than|is\s+less\s+than|exists?)\s+(.+)/i
    ];
    
    for (const pattern of conditionalPatterns) {
      const match = description.match(pattern);
      if (match) {
        conditions.push({
          field: match[1].trim(),
          operator: this.normalizeOperator(match[2]),
          value: match[3].trim()
        });
      }
    }
    
    return conditions;
  }

  private extractParameters(description: string, action: string): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract common parameters based on action type
    switch (action) {
      case 'sync':
        parameters.bidirectional = description.includes('bidirectional') || description.includes('both ways');
        parameters.overwrite = description.includes('overwrite') || description.includes('replace');
        break;
      case 'monitor':
        parameters.alertThreshold = this.extractNumber(description, 'threshold') || 1;
        parameters.checkInterval = this.extractNumber(description, 'every') || 5;
        break;
      case 'analyze':
        parameters.outputFormat = description.includes('json') ? 'json' : 'text';
        parameters.includeMetrics = description.includes('metrics') || description.includes('statistics');
        break;
      case 'notify':
        parameters.priority = description.includes('urgent') || description.includes('critical') ? 'high' : 'normal';
        parameters.includeDetails = !description.includes('summary only');
        break;
    }
    
    return parameters;
  }

  private calculateConfidence(action: string, sources: DataSource[], targets: DataTarget[], schedule?: ScheduleConfig): number {
    let confidence = 0;
    
    // Base confidence for having an action
    confidence += 0.3;
    
    // Confidence for sources
    if (sources.length > 0) confidence += 0.25;
    
    // Confidence for targets
    if (targets.length > 0) confidence += 0.25;
    
    // Confidence for schedule
    if (schedule) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private getDefaultSourceConfig(sourceType: string): Record<string, any> {
    switch (sourceType) {
      case 'github':
        return { branch: 'main', path: '/' };
      case 'slack':
        return { includeThreads: false };
      case 'aws-s3':
        return { region: 'us-east-1' };
      case 'jira':
        return { project: '', status: 'open' };
      default:
        return {};
    }
  }

  private getDefaultTargetConfig(targetType: string): Record<string, any> {
    switch (targetType) {
      case 'slack':
        return { mentionUsers: false };
      case 'github':
        return { createPR: false };
      case 'aws-s3':
        return { region: 'us-east-1', acl: 'private' };
      case 'email':
        return { format: 'html' };
      default:
        return {};
    }
  }

  private timeToCron(timeStr: string): string {
    // Convert time string like "5:00 PM" to cron expression
    const time = timeStr.replace(/\s+/g, '').toLowerCase();
    let hour = 9;
    let minute = 0;
    
    const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?(?:(am|pm))?/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1]);
      minute = parseInt(timeMatch[2] || '0');
      
      if (timeMatch[3] === 'pm' && hour !== 12) hour += 12;
      if (timeMatch[3] === 'am' && hour === 12) hour = 0;
    }
    
    return `${minute} ${hour} * * *`;
  }

  private weeklyToCron(day: string, time: string): string {
    const dayMap: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const dayNum = dayMap[day.toLowerCase()] || 1;
    const timeCron = this.timeToCron(time);
    const [minute, hour] = timeCron.split(' ');
    
    return `${minute} ${hour} * * ${dayNum}`;
  }

  private convertToMinutes(interval: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'minute':
      case 'minutes':
        return interval;
      case 'hour':
      case 'hours':
        return interval * 60;
      case 'day':
      case 'days':
        return interval * 24 * 60;
      default:
        return interval;
    }
  }

  private normalizeOperator(operator: string): 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' {
    const op = operator.toLowerCase().replace(/\s+/g, '_');
    
    if (op.includes('equal')) return 'equals';
    if (op.includes('contain')) return 'contains';
    if (op.includes('greater')) return 'greater_than';
    if (op.includes('less')) return 'less_than';
    if (op.includes('exist')) return 'exists';
    
    return 'equals';
  }

  private extractNumber(description: string, context: string): number | null {
    const pattern = new RegExp(`${context}\\s+(\\d+)`, 'i');
    const match = description.match(pattern);
    return match ? parseInt(match[1]) : null;
  }
}
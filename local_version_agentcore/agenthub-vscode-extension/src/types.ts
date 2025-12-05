export interface AgentHubConfig {
  apiUrl: string;
  apiKey?: string;
  defaultAgent?: string;
  autoGenerateTests: boolean;
  autoSecurityScan: boolean;
  showStatusBar: boolean;
  outputLevel: 'minimal' | 'normal' | 'verbose';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  components?: any[];
  inputSchema?: any;
  outputSchema?: any;
}

export interface AgentExecutionResult {
  success: boolean;
  data: {
    analysis?: any;
    suggestions?: string[];
    generated_code?: string;
    test_cases?: string;
    security_issues?: SecurityIssue[];
    performance_metrics?: any;
  };
  error?: string;
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file: string;
  line?: number;
  suggestion?: string;
}

export interface OperationHistory {
  id: string;
  timestamp: Date;
  operation: string;
  file?: string;
  agent: string;
  success: boolean;
  duration: number;
  result?: string;
}
export interface AgentConfig {
  apiUrl: string;
  apiKey?: string;
  defaultAgent?: string;
  timeout: number;
}

export interface AgentExecutionRequest {
  agentId: string;
  input: {
    source_code?: string;
    file_path?: string;
    files?: string[];
    error_data?: string;
    context_files?: string[];
    profile_data?: string;
    context?: Record<string, any>;
    options?: Record<string, any>;
  };
}

export interface AgentExecutionResponse {
  success: boolean;
  data: {
    analysis?: any;
    suggestions?: string[];
    generated_code?: string;
    test_cases?: string;
    security_issues?: any[];
    performance_metrics?: any;
  };
  error?: string;
}

export interface CLICommand {
  name: string;
  description: string;
  options: CLIOption[];
  action: (args: any, options: any) => Promise<void>;
}

export interface CLIOption {
  flag: string;
  description: string;
  required?: boolean;
  default?: any;
}

export interface ProjectContext {
  rootPath: string;
  packageJson?: any;
  gitRepo?: string;
  language?: string;
  framework?: string;
  testFramework?: string;
}
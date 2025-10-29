export interface Agent {
  agent_id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
  average_rating: number;
  created_at: string;
  agent_type: 'production' | 'demo' | 'hybrid' | 'builtin';
  configuration_status?: 'complete' | 'partial' | 'not_started';
  status?: 'active' | 'inactive' | 'configuring' | 'error';
}

export interface AgentConfiguration {
  basic: {
    name: string;
    description: string;
    category: string;
    tags: string[];
  };
  runtime: {
    timeout: number;
    memory_size: number;
    environment_variables: Record<string, string>;
    runtime_version: string;
  };
  schema: {
    input_schema: any; // JSONSchema
    output_schema: any; // JSONSchema
    examples: ConfigurationExample[];
  };
  deployment: {
    auto_scaling: boolean;
    min_instances: number;
    max_instances: number;
    health_check_path: string;
    monitoring_enabled: boolean;
  };
  validation: {
    last_validated: string;
    validation_status: 'valid' | 'invalid' | 'pending';
    validation_errors: ValidationError[];
  };
}

export interface ConfigurationExample {
  name: string;
  description: string;
  input: any;
  expected_output: any;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ConfigurationStep {
  id: string;
  title: string;
  description: string;
  fields: ConfigurationField[];
  validation_rules: ValidationRule[];
  is_required: boolean;
  is_complete: boolean;
  depends_on?: string[];
}

export interface ConfigurationField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'json' | 'boolean';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  value?: any;
  error?: string;
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'range' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}
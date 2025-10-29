// Data Mapping and Transformation Types
export interface DataField {
  id: string;
  name: string;
  type: DataType;
  description?: string;
  required: boolean;
  defaultValue?: any;
  constraints?: FieldConstraints;
  schema?: any; // JSON Schema for complex types
}

export type DataType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'date' 
  | 'email' 
  | 'url' 
  | 'json' 
  | 'file' 
  | 'any';

export interface FieldConstraints {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
}

export interface DataMapping {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  sourceField: string;
  targetField: string;
  transformation?: DataTransformation;
  validation?: ValidationRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataTransformation {
  id: string;
  type: TransformationType;
  config: TransformationConfig;
  description?: string;
}

export type TransformationType = 
  | 'direct' 
  | 'format' 
  | 'convert' 
  | 'filter' 
  | 'aggregate' 
  | 'split' 
  | 'join' 
  | 'conditional' 
  | 'custom';

export interface TransformationConfig {
  // Direct mapping (no transformation)
  direct?: {};
  
  // Format transformation
  format?: {
    template: string; // e.g., "${firstName} ${lastName}"
    dateFormat?: string;
    numberFormat?: string;
  };
  
  // Type conversion
  convert?: {
    fromType: DataType;
    toType: DataType;
    options?: any;
  };
  
  // Filter transformation
  filter?: {
    condition: string; // JavaScript expression
    keepMatching: boolean;
  };
  
  // Aggregation
  aggregate?: {
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'concat';
    groupBy?: string[];
  };
  
  // Split transformation
  split?: {
    delimiter: string;
    index?: number; // Which part to take
  };
  
  // Join transformation
  join?: {
    separator: string;
    fields: string[];
  };
  
  // Conditional transformation
  conditional?: {
    condition: string; // JavaScript expression
    trueValue: any;
    falseValue: any;
  };
  
  // Custom JavaScript transformation
  custom?: {
    code: string; // JavaScript function body
    parameters?: string[];
  };
}

export interface ValidationRule {
  id: string;
  type: ValidationType;
  config: ValidationConfig;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

export type ValidationType = 
  | 'required' 
  | 'type' 
  | 'range' 
  | 'pattern' 
  | 'custom' 
  | 'schema';

export interface ValidationConfig {
  required?: {};
  type?: { expectedType: DataType };
  range?: { min?: number; max?: number };
  pattern?: { regex: string };
  custom?: { code: string };
  schema?: { jsonSchema: any };
}

export interface MappingValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  fieldId: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  fieldId: string;
  message: string;
  suggestion?: string;
}

export interface DataPreview {
  sourceData: any;
  transformedData: any;
  errors: ValidationError[];
  executionTime: number;
  sampleSize: number;
}

export interface MappingSession {
  id: string;
  sourceComponent: {
    id: string;
    name: string;
    outputs: DataField[];
  };
  targetComponent: {
    id: string;
    name: string;
    inputs: DataField[];
  };
  mappings: DataMapping[];
  isComplete: boolean;
  lastModified: Date;
}
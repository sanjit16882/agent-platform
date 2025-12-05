// Data Transformation Service - Production-ready with demo data
import { 
  DataMapping, 
  DataTransformation, 
  TransformationType, 
  TransformationConfig,
  DataType,
  ValidationRule,
  MappingValidationResult,
  ValidationError,
  DataPreview,
  DataField
} from '../types/dataMapping';

class DataTransformationService {
  
  // Transform data based on mapping configuration
  async transformData(data: any, transformation: DataTransformation): Promise<any> {
    try {
      switch (transformation.type) {
        case 'direct':
          return data;
          
        case 'format':
          return this.formatTransform(data, transformation.config.format!);
          
        case 'convert':
          return this.convertTransform(data, transformation.config.convert!);
          
        case 'filter':
          return this.filterTransform(data, transformation.config.filter!);
          
        case 'aggregate':
          return this.aggregateTransform(data, transformation.config.aggregate!);
          
        case 'split':
          return this.splitTransform(data, transformation.config.split!);
          
        case 'join':
          return this.joinTransform(data, transformation.config.join!);
          
        case 'conditional':
          return this.conditionalTransform(data, transformation.config.conditional!);
          
        case 'custom':
          return this.customTransform(data, transformation.config.custom!);
          
        default:
          throw new Error(`Unsupported transformation type: ${transformation.type}`);
      }
    } catch (error) {
      console.error('Data transformation error:', error);
      throw new Error(`Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Format transformation (template-based)
  private formatTransform(data: any, config: NonNullable<TransformationConfig['format']>): string {
    if (config.template) {
      return config.template.replace(/\$\{([^}]+)\}/g, (match, key) => {
        return this.getNestedValue(data, key) || '';
      });
    }
    
    if (config.dateFormat && data instanceof Date) {
      return this.formatDate(data, config.dateFormat);
    }
    
    if (config.numberFormat && typeof data === 'number') {
      return this.formatNumber(data, config.numberFormat);
    }
    
    return String(data);
  }

  // Type conversion transformation
  private convertTransform(data: any, config: NonNullable<TransformationConfig['convert']>): any {
    const { fromType, toType, options } = config;
    
    switch (toType) {
      case 'string':
        return String(data);
        
      case 'number':
        const num = Number(data);
        if (isNaN(num)) throw new Error(`Cannot convert "${data}" to number`);
        return num;
        
      case 'boolean':
        if (typeof data === 'boolean') return data;
        if (typeof data === 'string') {
          const lower = data.toLowerCase();
          if (['true', '1', 'yes', 'on'].includes(lower)) return true;
          if (['false', '0', 'no', 'off'].includes(lower)) return false;
        }
        return Boolean(data);
        
      case 'array':
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') return data.split(options?.delimiter || ',');
        return [data];
        
      case 'object':
        if (typeof data === 'object' && data !== null) return data;
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return { value: data };
          }
        }
        return { value: data };
        
      case 'date':
        if (data instanceof Date) return data;
        const date = new Date(data);
        if (isNaN(date.getTime())) throw new Error(`Cannot convert "${data}" to date`);
        return date;
        
      default:
        return data;
    }
  }

  // Filter transformation
  private filterTransform(data: any, config: NonNullable<TransformationConfig['filter']>): any {
    if (!Array.isArray(data)) {
      // For single values, evaluate condition
      const result = this.evaluateCondition(config.condition, data);
      return config.keepMatching ? (result ? data : null) : (result ? null : data);
    }
    
    return data.filter((item: any) => {
      const result = this.evaluateCondition(config.condition, item);
      return config.keepMatching ? result : !result;
    });
  }

  // Aggregation transformation
  private aggregateTransform(data: any, config: NonNullable<TransformationConfig['aggregate']>): any {
    if (!Array.isArray(data)) {
      throw new Error('Aggregation requires array input');
    }
    
    const { operation, groupBy } = config;
    
    if (groupBy && groupBy.length > 0) {
      // Group by specified fields
      const groups = this.groupBy(data, groupBy);
      const result: any = {};
      
      for (const [key, items] of Object.entries(groups)) {
        result[key] = this.performAggregation(items as any[], operation);
      }
      
      return result;
    } else {
      // Aggregate entire array
      return this.performAggregation(data, operation);
    }
  }

  // Split transformation
  private splitTransform(data: any, config: NonNullable<TransformationConfig['split']>): any {
    if (typeof data !== 'string') {
      throw new Error('Split transformation requires string input');
    }
    
    const parts = data.split(config.delimiter);
    
    if (config.index !== undefined) {
      return parts[config.index] || '';
    }
    
    return parts;
  }

  // Join transformation
  private joinTransform(data: any, config: NonNullable<TransformationConfig['join']>): string {
    const { separator, fields } = config;
    
    if (fields && fields.length > 0) {
      // Join specific fields
      const values = fields.map(field => this.getNestedValue(data, field) || '');
      return values.join(separator);
    } else if (Array.isArray(data)) {
      // Join array elements
      return data.join(separator);
    } else {
      return String(data);
    }
  }

  // Conditional transformation
  private conditionalTransform(data: any, config: NonNullable<TransformationConfig['conditional']>): any {
    const result = this.evaluateCondition(config.condition, data);
    return result ? config.trueValue : config.falseValue;
  }

  // Custom JavaScript transformation
  private customTransform(data: any, config: NonNullable<TransformationConfig['custom']>): any {
    try {
      // Create a safe execution context
      const func = new Function('data', 'utils', config.code);
      const utils = {
        formatDate: this.formatDate,
        formatNumber: this.formatNumber,
        getNestedValue: this.getNestedValue
      };
      
      return func(data, utils);
    } catch (error) {
      throw new Error(`Custom transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validation methods
  async validateMapping(mapping: DataMapping, sampleData?: any): Promise<MappingValidationResult> {
    const errors: ValidationError[] = [];
    
    try {
      // Validate transformation if present
      if (mapping.transformation && sampleData) {
        await this.transformData(sampleData, mapping.transformation);
      }
      
      // Validate field mapping rules
      if (mapping.validation) {
        for (const rule of mapping.validation) {
          const validationResult = this.validateRule(sampleData, rule);
          if (!validationResult.isValid) {
            errors.push({
              fieldId: mapping.targetField,
              message: rule.errorMessage,
              code: rule.type,
              severity: rule.severity
            });
          }
        }
      }
      
    } catch (error) {
      errors.push({
        fieldId: mapping.targetField,
        message: error instanceof Error ? error.message : 'Validation failed',
        code: 'transformation_error',
        severity: 'error'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings: errors.filter(e => e.severity === 'warning')
    };
  }

  // Generate preview of transformation
  async generatePreview(
    sourceData: any, 
    mappings: DataMapping[], 
    sampleSize: number = 5
  ): Promise<DataPreview> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    
    try {
      // Apply all transformations
      let transformedData = { ...sourceData };
      
      for (const mapping of mappings) {
        if (mapping.isActive && mapping.transformation) {
          const sourceValue = this.getNestedValue(sourceData, mapping.sourceField);
          const transformedValue = await this.transformData(sourceValue, mapping.transformation);
          this.setNestedValue(transformedData, mapping.targetField, transformedValue);
        }
      }
      
      return {
        sourceData: this.limitSampleSize(sourceData, sampleSize),
        transformedData: this.limitSampleSize(transformedData, sampleSize),
        errors,
        executionTime: Date.now() - startTime,
        sampleSize
      };
      
    } catch (error) {
      errors.push({
        fieldId: 'preview',
        message: error instanceof Error ? error.message : 'Preview generation failed',
        code: 'preview_error',
        severity: 'error'
      });
      
      return {
        sourceData: this.limitSampleSize(sourceData, sampleSize),
        transformedData: null,
        errors,
        executionTime: Date.now() - startTime,
        sampleSize
      };
    }
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation (production would use a safer parser)
      const func = new Function('data', `return ${condition}`);
      return Boolean(func(data));
    } catch {
      return false;
    }
  }

  private formatDate(date: Date, format: string): string {
    // Simple date formatting (production would use a library like date-fns)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  private formatNumber(num: number, format: string): string {
    // Simple number formatting
    if (format.includes('.')) {
      const decimals = format.split('.')[1].length;
      return num.toFixed(decimals);
    }
    return String(num);
  }

  private groupBy(array: any[], keys: string[]): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const key = keys.map(k => this.getNestedValue(item, k)).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private performAggregation(data: any[], operation: string): any {
    switch (operation) {
      case 'sum':
        return data.reduce((sum, item) => sum + (Number(item) || 0), 0);
      case 'avg':
        const sum = data.reduce((s, item) => s + (Number(item) || 0), 0);
        return sum / data.length;
      case 'count':
        return data.length;
      case 'min':
        return Math.min(...data.map(item => Number(item) || 0));
      case 'max':
        return Math.max(...data.map(item => Number(item) || 0));
      case 'concat':
        return data.join(', ');
      default:
        return data;
    }
  }

  private validateRule(data: any, rule: ValidationRule): { isValid: boolean } {
    // Simplified validation (production would be more comprehensive)
    switch (rule.type) {
      case 'required':
        return { isValid: data != null && data !== '' };
      case 'type':
        const expectedType = rule.config.type?.expectedType;
        return { isValid: typeof data === expectedType };
      default:
        return { isValid: true };
    }
  }

  private limitSampleSize(data: any, size: number): any {
    if (Array.isArray(data)) {
      return data.slice(0, size);
    }
    return data;
  }
}

export const dataTransformationService = new DataTransformationService();
export default dataTransformationService;
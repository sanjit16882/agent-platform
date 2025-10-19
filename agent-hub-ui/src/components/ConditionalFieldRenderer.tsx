import React, { useState, useEffect } from 'react';
import { Alert, Badge } from 'react-bootstrap';
import { TemplateParameter } from '../services/templateService';

interface ConditionalFieldRendererProps {
  parameters: TemplateParameter[];
  values: Record<string, any>;
  children: (visibleParameters: TemplateParameter[]) => React.ReactNode;
  onVisibilityChange?: (parameter: string, isVisible: boolean) => void;
}

const ConditionalFieldRenderer: React.FC<ConditionalFieldRendererProps> = ({
  parameters,
  values,
  children,
  onVisibilityChange
}) => {
  const [visibleParameters, setVisibleParameters] = useState<TemplateParameter[]>([]);
  const [conditionalStates, setConditionalStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newVisibleParameters = parameters.filter(param => {
      const isVisible = evaluateConditionalLogic(param, values);
      
      // Notify parent of visibility changes
      if (onVisibilityChange && conditionalStates[param.name] !== isVisible) {
        onVisibilityChange(param.name, isVisible);
      }
      
      return isVisible;
    });
    
    setVisibleParameters(newVisibleParameters);
    
    // Update conditional states
    const newStates: Record<string, boolean> = {};
    parameters.forEach(param => {
      newStates[param.name] = evaluateConditionalLogic(param, values);
    });
    setConditionalStates(newStates);
    
  }, [parameters, values]);

  const evaluateConditionalLogic = (parameter: TemplateParameter, currentValues: Record<string, any>): boolean => {
    // If no conditional logic, always show
    if (!parameter.conditional) {
      return true;
    }

    const { showIf, hideIf, requiredIf } = parameter.conditional;

    try {
      // Evaluate showIf condition
      if (showIf) {
        const shouldShow = evaluateExpression(showIf, currentValues);
        if (!shouldShow) return false;
      }

      // Evaluate hideIf condition
      if (hideIf) {
        const shouldHide = evaluateExpression(hideIf, currentValues);
        if (shouldHide) return false;
      }

      // For requiredIf, we still show the field but mark it as conditionally required
      return true;

    } catch (error) {
      console.warn(`Error evaluating conditional logic for ${parameter.name}:`, error);
      return true; // Show field if evaluation fails
    }
  };

  const evaluateExpression = (expression: string, currentValues: Record<string, any>): boolean => {
    try {
      // Create a safe evaluation context
      const context = { ...currentValues };
      
      // Replace parameter names with their values in the expression
      let processedExpression = expression;
      
      // Handle common patterns
      Object.keys(context).forEach(key => {
        const value = context[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        
        if (typeof value === 'string') {
          processedExpression = processedExpression.replace(regex, `"${value}"`);
        } else if (typeof value === 'boolean') {
          processedExpression = processedExpression.replace(regex, value.toString());
        } else if (typeof value === 'number') {
          processedExpression = processedExpression.replace(regex, value.toString());
        } else if (Array.isArray(value)) {
          processedExpression = processedExpression.replace(regex, JSON.stringify(value));
        } else {
          processedExpression = processedExpression.replace(regex, 'null');
        }
      });

      // Handle common operators and functions
      processedExpression = processedExpression
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||')
        .replace(/\bNOT\b/g, '!')
        .replace(/\bequals\b/g, '===')
        .replace(/\bcontains\b/g, '.includes')
        .replace(/\bempty\b/g, '=== ""')
        .replace(/\bnotEmpty\b/g, '!== ""');

      // Use Function constructor for safer evaluation than eval
      const func = new Function('return ' + processedExpression);
      return Boolean(func());

    } catch (error) {
      console.warn(`Failed to evaluate expression: ${expression}`, error);
      return true; // Default to showing the field
    }
  };

  const isConditionallyRequired = (parameter: TemplateParameter): boolean => {
    if (!parameter.conditional?.requiredIf) {
      return parameter.required;
    }

    try {
      const isRequired = evaluateExpression(parameter.conditional.requiredIf, values);
      return parameter.required || isRequired;
    } catch (error) {
      return parameter.required;
    }
  };

  const getConditionalInfo = (parameter: TemplateParameter) => {
    if (!parameter.conditional) return null;

    const info = [];
    
    if (parameter.conditional.showIf) {
      info.push(`Show when: ${parameter.conditional.showIf}`);
    }
    
    if (parameter.conditional.hideIf) {
      info.push(`Hide when: ${parameter.conditional.hideIf}`);
    }
    
    if (parameter.conditional.requiredIf) {
      info.push(`Required when: ${parameter.conditional.requiredIf}`);
    }

    return info;
  };

  const getHiddenParametersInfo = () => {
    const hiddenParams = parameters.filter(param => !conditionalStates[param.name]);
    return hiddenParams;
  };

  const enhancedParameters = visibleParameters.map(param => ({
    ...param,
    required: isConditionallyRequired(param),
    conditionalInfo: getConditionalInfo(param)
  }));

  const hiddenParameters = getHiddenParametersInfo();

  return (
    <div className="conditional-field-renderer">
      {/* Hidden Parameters Info */}
      {hiddenParameters.length > 0 && (
        <Alert variant="info" className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <strong>📋 Conditional Fields</strong>
              <div className="small">
                {hiddenParameters.length} field(s) are hidden based on your current selections
              </div>
            </div>
            <Badge bg="info">{hiddenParameters.length} hidden</Badge>
          </div>
          
          <details className="mt-2">
            <summary className="small text-muted" style={{ cursor: 'pointer' }}>
              View hidden fields
            </summary>
            <div className="mt-2">
              {hiddenParameters.map(param => (
                <div key={param.name} className="small text-muted mb-1">
                  • <strong>{param.name}</strong>
                  {param.conditional && (
                    <div className="ms-3">
                      {getConditionalInfo(param)?.map((info, index) => (
                        <div key={index} className="text-muted small">
                          {info}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        </Alert>
      )}

      {/* Conditional Logic Debug Info (Development Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-3">
          <summary className="small text-muted" style={{ cursor: 'pointer' }}>
            🔧 Debug: Conditional Logic States
          </summary>
          <div className="mt-2 p-2 bg-light rounded">
            <div className="small">
              <strong>Current Values:</strong>
              <pre className="small">{JSON.stringify(values, null, 2)}</pre>
            </div>
            <div className="small mt-2">
              <strong>Field Visibility:</strong>
              {Object.entries(conditionalStates).map(([field, visible]) => (
                <div key={field} className="d-flex justify-content-between">
                  <span>{field}:</span>
                  <Badge bg={visible ? 'success' : 'secondary'}>
                    {visible ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* Render visible parameters */}
      {children(enhancedParameters)}

      {/* Conditional Logic Help */}
      {parameters.some(p => p.conditional) && (
        <Alert variant="light" className="mt-3">
          <div className="small">
            <strong>💡 About Conditional Fields:</strong>
            <ul className="mb-0 mt-1">
              <li>Some fields may appear or disappear based on your selections</li>
              <li>Required status may change based on other field values</li>
              <li>Hidden fields won't be included in the final configuration</li>
            </ul>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default ConditionalFieldRenderer;
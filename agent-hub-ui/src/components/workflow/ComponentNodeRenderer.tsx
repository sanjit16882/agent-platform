import React from 'react';
import { ComponentNode } from '../../types/hybridAgent';
import { getPortTypeColor } from '../../utils/connectionValidation';
import './WorkflowCanvas.css';

interface ComponentNodeRendererProps {
  node: ComponentNode;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onConnectionStart: (nodeId: string, portName: string, portType: 'input' | 'output', event: React.MouseEvent) => void;
  onConnectionEnd: (nodeId: string, portName: string, portType: 'input' | 'output') => void;
  onDelete?: (nodeId: string) => void;
  readonly?: boolean;
}

const ComponentNodeRenderer: React.FC<ComponentNodeRendererProps> = ({
  node,
  selected,
  onMouseDown,
  onConnectionStart,
  onConnectionEnd,
  onDelete,
  readonly = false
}) => {
  const getTypeIcon = (type: string) => {
    const icons = {
      'llm': '🧠',
      'rpa': '🤖',
      'selenium': '🔍',
      'custom': '⚙️',
      'hybrid': '🔗'
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'llm': '#1976d2',
      'rpa': '#388e3c',
      'selenium': '#f57c00',
      'custom': '#7b1fa2',
      'hybrid': '#616161'
    };
    return colors[type as keyof typeof colors] || '#616161';
  };

  const handlePortMouseDown = (e: React.MouseEvent, portName: string, portType: 'input' | 'output') => {
    e.stopPropagation();
    if (readonly) return;
    
    console.log('Port mouse down:', node.id, portName, portType);
    onConnectionStart(node.id, portName, portType, e);
  };

  const handlePortMouseUp = (e: React.MouseEvent, portName: string, portType: 'input' | 'output') => {
    e.stopPropagation();
    if (readonly) return;
    
    console.log('Port mouse up:', node.id, portName, portType);
    onConnectionEnd(node.id, portName, portType);
  };

  return (
    <div
      className={`component-node ${selected ? 'selected' : ''} ${readonly ? 'readonly' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        borderColor: selected ? getTypeColor(node.component.type) : undefined
      }}
      onMouseDown={onMouseDown}
    >
      {/* Node Header */}
      <div className="component-node-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>{getTypeIcon(node.component.type)}</span>
          <h4 className="component-node-title">{node.component.name}</h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className={`component-node-type ${node.component.type}`}
            style={{ 
              backgroundColor: `${getTypeColor(node.component.type)}15`,
              color: getTypeColor(node.component.type)
            }}
          >
            {node.component.type}
          </span>
          {!readonly && onDelete && (
            <button 
              className="component-node-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              title="Delete component"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Node Content */}
      <div className="component-node-content">
        {node.component.config && Object.keys(node.component.config).length > 0 && (
          <div style={{ fontSize: '11px', color: '#888' }}>
            {Object.entries(node.component.config).slice(0, 2).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {String(value).substring(0, 20)}
                {String(value).length > 20 ? '...' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input/Output Ports */}
      <div className="component-node-ports">
        {/* Debug: Show port counts */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
            Inputs: {node.component.inputs?.length || 0}, Outputs: {node.component.outputs?.length || 0}
          </div>
        )}
        
        {/* Input Ports */}
        <div className="component-ports inputs">
          {node.component.inputs?.map((input, index) => (
            <div
              key={`input-${index}`}
              className="component-port input"
              title={`Input: ${input.name} (${input.type})`}
              onMouseDown={(e) => handlePortMouseDown(e, input.name, 'input')}
              onMouseUp={(e) => handlePortMouseUp(e, input.name, 'input')}
              style={{
                borderColor: getPortTypeColor(input.type),
                backgroundColor: input.required ? getPortTypeColor(input.type) + '20' : 'transparent'
              }}
            />
          ))}
        </div>

        {/* Output Ports */}
        <div className="component-ports outputs">
          {node.component.outputs?.map((output, index) => (
            <div
              key={`output-${index}`}
              className="component-port output"
              title={`Output: ${output.name} (${output.type})`}
              onMouseDown={(e) => handlePortMouseDown(e, output.name, 'output')}
              onMouseUp={(e) => handlePortMouseUp(e, output.name, 'output')}
              style={{
                borderColor: getPortTypeColor(output.type),
                backgroundColor: getPortTypeColor(output.type) + '40'
              }}
            />
          ))}
        </div>
      </div>

      {/* Node Status Indicator */}
      {(node.component.config as any)?.status && (
        <div 
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: (node.component.config as any).status === 'active' ? '#28a745' : '#6c757d',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title={`Status: ${(node.component.config as any).status}`}
        />
      )}
    </div>
  );
};

export default ComponentNodeRenderer;
import { ComponentNode, Connection } from '../types/hybridAgent';

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateConnection(
  fromNode: ComponentNode,
  fromPort: string,
  toNode: ComponentNode,
  toPort: string,
  existingConnections: Connection[]
): ConnectionValidationResult {
  // Check if nodes are different
  if (fromNode.id === toNode.id) {
    return { isValid: false, reason: 'Cannot connect a component to itself' };
  }

  // Check if connection already exists
  const connectionExists = existingConnections.some(conn =>
    conn.from.componentId === fromNode.id &&
    conn.from.outputName === fromPort &&
    conn.to.componentId === toNode.id &&
    conn.to.inputName === toPort
  );

  if (connectionExists) {
    return { isValid: false, reason: 'Connection already exists' };
  }

  // Check if input port is already connected
  const inputAlreadyConnected = existingConnections.some(conn =>
    conn.to.componentId === toNode.id &&
    conn.to.inputName === toPort
  );

  if (inputAlreadyConnected) {
    return { isValid: false, reason: 'Input port already has a connection' };
  }

  // Find the output and input definitions
  const outputDef = fromNode.component.outputs?.find(output => output.name === fromPort);
  const inputDef = toNode.component.inputs?.find(input => input.name === toPort);

  if (!outputDef) {
    return { isValid: false, reason: `Output port '${fromPort}' not found` };
  }

  if (!inputDef) {
    return { isValid: false, reason: `Input port '${toPort}' not found` };
  }

  // Check type compatibility
  if (!areTypesCompatible(outputDef.type, inputDef.type)) {
    return { isValid: false, reason: `Type mismatch: ${outputDef.type} → ${inputDef.type}` };
  }

  return { isValid: true };
}

function areTypesCompatible(outputType: string, inputType: string): boolean {
  // Exact match
  if (outputType === inputType) {
    return true;
  }

  // Compatible type mappings
  const compatibilityMap: { [key: string]: string[] } = {
    'string': ['string', 'object'],
    'number': ['number', 'string'],
    'boolean': ['boolean', 'string'],
    'object': ['object', 'string'],
    'array': ['array', 'object', 'string'],
    'file': ['file', 'string']
  };

  const compatibleTypes = compatibilityMap[outputType] || [];
  return compatibleTypes.includes(inputType);
}

export function getConnectionValidationMessage(result: ConnectionValidationResult): string {
  if (result.isValid) {
    return 'Valid connection';
  }
  return result.reason || 'Invalid connection';
}

export function getPortTypeColor(type: string): string {
  const colors: { [key: string]: string } = {
    'string': '#28a745',
    'number': '#007bff',
    'boolean': '#6f42c1',
    'object': '#fd7e14',
    'array': '#20c997',
    'file': '#6c757d'
  };
  return colors[type] || '#6c757d';
}
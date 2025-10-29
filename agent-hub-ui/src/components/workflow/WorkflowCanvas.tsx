import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ComponentNode, Connection } from '../../types/hybridAgent';
import ComponentNodeRenderer from './ComponentNodeRenderer';
import ConnectionRenderer from './ConnectionRenderer';
import { validateConnection } from '../../utils/connectionValidation';
import './WorkflowCanvas.css';

interface WorkflowCanvasProps {
  nodes: ComponentNode[];
  connections: Connection[];
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionCreate: (connection: Connection) => void;
  onConnectionDelete: (connectionId: string) => void;
  selectedNodeId: string | null;
  readonly?: boolean;
}

interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  showGrid: boolean;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  connections,
  onNodeMove,
  onNodeSelect,
  onNodeDelete,
  onConnectionCreate,
  onConnectionDelete,
  selectedNodeId,
  readonly = false
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    showGrid: true
  });

  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection creation state
  const [connectionDrag, setConnectionDrag] = useState<{
    isActive: boolean;
    startPort: { nodeId: string; portName: string; portType: 'input' | 'output' } | null;
    currentPosition: { x: number; y: number };
  }>({
    isActive: false,
    startPort: null,
    currentPosition: { x: 0, y: 0 }
  });

  // Connection creation functions
  const handleConnectionStart = useCallback((nodeId: string, portName: string, portType: 'input' | 'output', event: React.MouseEvent) => {
    if (readonly) return;
    
    console.log('Connection start:', nodeId, portName, portType);
    event.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (event.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const canvasY = (event.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

    console.log('Setting connection drag active:', { canvasX, canvasY });
    setConnectionDrag({
      isActive: true,
      startPort: { nodeId, portName, portType },
      currentPosition: { x: canvasX, y: canvasY }
    });
  }, [canvasState, readonly]);

  const handleConnectionDrag = useCallback((event: React.MouseEvent) => {
    if (!connectionDrag.isActive) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (event.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const canvasY = (event.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

    setConnectionDrag(prev => ({
      ...prev,
      currentPosition: { x: canvasX, y: canvasY }
    }));
  }, [connectionDrag.isActive, canvasState]);

  const handleConnectionEnd = useCallback((nodeId?: string, portName?: string, portType?: 'input' | 'output') => {
    if (!connectionDrag.isActive || !connectionDrag.startPort) {
      setConnectionDrag({ isActive: false, startPort: null, currentPosition: { x: 0, y: 0 } });
      return;
    }

    // If dropped on a valid port, create connection
    if (nodeId && portName && portType) {
      const startPort = connectionDrag.startPort;
      
      // Validate connection (output to input only, different nodes)
      if (startPort.portType !== portType && startPort.nodeId !== nodeId) {
        const fromNode = nodes.find(n => n.id === (startPort.portType === 'output' ? startPort.nodeId : nodeId));
        const toNode = nodes.find(n => n.id === (startPort.portType === 'output' ? nodeId : startPort.nodeId));
        
        if (fromNode && toNode) {
          const fromPortName = startPort.portType === 'output' ? startPort.portName : portName;
          const toPortName = startPort.portType === 'output' ? portName : startPort.portName;
          
          // Validate the connection
          const validation = validateConnection(fromNode, fromPortName, toNode, toPortName, connections);
          
          if (validation.isValid) {
            const connection: Connection = {
              from: { componentId: fromNode.id, outputName: fromPortName },
              to: { componentId: toNode.id, inputName: toPortName }
            };
            
            onConnectionCreate(connection);
          } else {
            // Show validation error (you could add a toast notification here)
            console.warn('Connection validation failed:', validation.reason);
          }
        }
      }
    }

    setConnectionDrag({ isActive: false, startPort: null, currentPosition: { x: 0, y: 0 } });
  }, [connectionDrag, onConnectionCreate, nodes, connections]);

  // Helper function to get port position
  const getPortPosition = useCallback((nodeId: string, portName: string, portType: 'input' | 'output') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const nodeWidth = 160;
    const nodeHeight = 100;
    const portSize = 12;

    let x = node.position.x;
    let y = node.position.y + nodeHeight / 2;

    if (portType === 'output') {
      x += nodeWidth + portSize / 2;
    } else {
      x -= portSize / 2;
    }

    return { x, y };
  }, [nodes]);

  // Handle canvas zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasState(prev => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(3, prev.zoom * delta))
      }));
    }
  }, []);

  // Handle canvas pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left
      e.preventDefault();
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { x: e.clientX - prev.pan.x, y: e.clientY - prev.pan.y }
      }));
    } else if (e.button === 0 && e.target === canvasRef.current) {
      // Click on empty canvas - deselect nodes
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasState.isDragging) {
      setCanvasState(prev => ({
        ...prev,
        pan: {
          x: e.clientX - prev.dragStart.x,
          y: e.clientY - prev.dragStart.y
        }
      }));
    } else if (connectionDrag.isActive) {
      handleConnectionDrag(e);
    }
  }, [canvasState.isDragging, connectionDrag.isActive, handleConnectionDrag]);

  const handleMouseUp = useCallback(() => {
    setCanvasState(prev => ({ ...prev, isDragging: false }));
    if (connectionDrag.isActive) {
      handleConnectionEnd();
    }
  }, [connectionDrag.isActive, handleConnectionEnd]);

  // Handle node dragging
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readonly) return;
    
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const canvasY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

    setDraggedNode(nodeId);
    setDragOffset({
      x: canvasX - node.position.x,
      y: canvasY - node.position.y
    });
    onNodeSelect(nodeId);
  }, [nodes, canvasState, onNodeSelect, readonly]);

  const handleNodeMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedNode || readonly) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const canvasY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;

    // Snap to grid
    const gridSize = 20;
    const snappedX = Math.round((canvasX - dragOffset.x) / gridSize) * gridSize;
    const snappedY = Math.round((canvasY - dragOffset.y) / gridSize) * gridSize;

    onNodeMove(draggedNode, { x: snappedX, y: snappedY });
  }, [draggedNode, canvasState, dragOffset, onNodeMove, readonly]);

  const handleNodeMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodeId && !readonly) {
        onNodeDelete(selectedNodeId);
      } else if (e.key === 'Escape') {
        onNodeSelect(null);
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
            break;
          case '=':
          case '+':
            e.preventDefault();
            setCanvasState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }));
            break;
          case '-':
            e.preventDefault();
            setCanvasState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, onNodeDelete, onNodeSelect, readonly]);

  // Canvas transform style
  const canvasTransform = `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`;

  return (
    <div className="workflow-canvas-container">
      {/* Canvas Controls */}
      <div className="canvas-controls">
        <div className="zoom-controls">
          <button 
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}
            title="Zoom In (Ctrl/Cmd + +)"
          >
            +
          </button>
          <span>{Math.round(canvasState.zoom * 100)}%</span>
          <button 
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
            title="Zoom Out (Ctrl/Cmd + -)"
          >
            -
          </button>
          <button 
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
            title="Reset View (Ctrl/Cmd + 0)"
          >
            Reset
          </button>
        </div>
        
        <div className="view-controls">
          <label>
            <input
              type="checkbox"
              checked={canvasState.showGrid}
              onChange={(e) => setCanvasState(prev => ({ ...prev, showGrid: e.target.checked }))}
            />
            Grid
          </label>
        </div>
        
        <div className="action-controls">
          <button 
            onClick={() => {/* TODO: Implement undo */}}
            disabled={true}
            title="Undo (Ctrl/Cmd + Z)"
          >
            ↶
          </button>
          <button 
            onClick={() => {/* TODO: Implement redo */}}
            disabled={true}
            title="Redo (Ctrl/Cmd + Y)"
          >
            ↷
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className={`workflow-canvas ${canvasState.isDragging ? 'dragging' : ''} ${canvasState.showGrid ? 'show-grid' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={draggedNode ? handleNodeMouseMove : handleMouseMove}
        onMouseUp={draggedNode ? handleNodeMouseUp : handleMouseUp}
        style={{ cursor: canvasState.isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Grid Pattern */}
        {canvasState.showGrid && (
          <div className="grid-pattern" style={{ transform: canvasTransform }} />
        )}

        {/* Canvas Content */}
        <div className="canvas-content" style={{ transform: canvasTransform }}>
          {/* Render Connections */}
          <svg className="connections-layer">
            {connections.map((connection, index) => {
              const fromNode = nodes.find(n => n.id === connection.from.componentId);
              const toNode = nodes.find(n => n.id === connection.to.componentId);
              
              if (!fromNode || !toNode) return null;

              return (
                <ConnectionRenderer
                  key={`${connection.from.componentId}-${connection.to.componentId}-${index}`}
                  connection={connection}
                  fromPosition={fromNode.position}
                  toPosition={toNode.position}
                  onDelete={() => onConnectionDelete(`${connection.from.componentId}-${connection.to.componentId}`)}
                  readonly={readonly}
                />
              );
            })}
          </svg>

          {/* Render Nodes */}
          {nodes.map(node => (
            <ComponentNodeRenderer
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
              readonly={readonly}
            />
          ))}

          {/* Render Active Connection Drag */}
          {connectionDrag.isActive && connectionDrag.startPort && (
            <svg className="connections-layer" style={{ pointerEvents: 'none' }}>
              <line
                x1={getPortPosition(connectionDrag.startPort.nodeId, connectionDrag.startPort.portName, connectionDrag.startPort.portType).x}
                y1={getPortPosition(connectionDrag.startPort.nodeId, connectionDrag.startPort.portName, connectionDrag.startPort.portType).y}
                x2={connectionDrag.currentPosition.x}
                y2={connectionDrag.currentPosition.y}
                stroke="#007bff"
                strokeWidth="3"
                strokeDasharray="8,4"
                className="connection-drag-line"
              />
              {/* Add a circle at the end to show where the connection would end */}
              <circle
                cx={connectionDrag.currentPosition.x}
                cy={connectionDrag.currentPosition.y}
                r="6"
                fill="#007bff"
                opacity="0.7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Canvas Info */}
      <div className="canvas-info">
        <span>Nodes: {nodes.length}</span>
        <span>Connections: {connections.length}</span>
        <span>Zoom: {Math.round(canvasState.zoom * 100)}%</span>
        {process.env.NODE_ENV === 'development' && connectionDrag.isActive && (
          <span style={{ color: '#007bff', fontWeight: 'bold' }}>
            Connecting: {connectionDrag.startPort?.nodeId} ({connectionDrag.startPort?.portType})
          </span>
        )}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
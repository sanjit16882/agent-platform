import React, { useRef, useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { ComponentNode, Connection } from '../../types/hybridAgent';

// React Icons compatibility fix - using createElement
const { createElement } = React;
const icons = require('react-icons/fa');

const FaExpand = (props: any) => createElement(icons.FaExpand, props);
const FaCompress = (props: any) => createElement(icons.FaCompress, props);
const FaEye = (props: any) => createElement(icons.FaEye, props);
const FaEyeSlash = (props: any) => createElement(icons.FaEyeSlash, props);

interface WorkflowMinimapProps {
  nodes: ComponentNode[];
  connections: Connection[];
  canvasSize: { width: number; height: number };
  viewport: {
    zoom: number;
    pan: { x: number; y: number };
  };
  onViewportChange: (viewport: { zoom: number; pan: { x: number; y: number } }) => void;
  className?: string;
}

interface MinimapState {
  isExpanded: boolean;
  isVisible: boolean;
  isDragging: boolean;
}

const WorkflowMinimap: React.FC<WorkflowMinimapProps> = ({
  nodes,
  connections,
  canvasSize,
  viewport,
  onViewportChange,
  className = ''
}) => {
  const minimapRef = useRef<SVGSVGElement>(null);
  const [minimapState, setMinimapState] = useState<MinimapState>({
    isExpanded: false,
    isVisible: true,
    isDragging: false
  });

  // Minimap dimensions
  const minimapWidth = minimapState.isExpanded ? 300 : 200;
  const minimapHeight = minimapState.isExpanded ? 200 : 150;
  
  // Calculate the bounds of all nodes
  const getWorkflowBounds = () => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeWidth = 200; // Approximate node width
      const nodeHeight = 100; // Approximate node height
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add some padding
    const padding = 50;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    };
  };

  const workflowBounds = getWorkflowBounds();
  const workflowWidth = workflowBounds.maxX - workflowBounds.minX;
  const workflowHeight = workflowBounds.maxY - workflowBounds.minY;

  // Calculate scale to fit workflow in minimap
  const scaleX = minimapWidth / workflowWidth;
  const scaleY = minimapHeight / workflowHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

  // Convert world coordinates to minimap coordinates
  const worldToMinimap = (worldX: number, worldY: number) => {
    return {
      x: (worldX - workflowBounds.minX) * scale,
      y: (worldY - workflowBounds.minY) * scale
    };
  };

  // Convert minimap coordinates to world coordinates
  const minimapToWorld = (minimapX: number, minimapY: number) => {
    return {
      x: (minimapX / scale) + workflowBounds.minX,
      y: (minimapY / scale) + workflowBounds.minY
    };
  };

  // Calculate viewport rectangle in minimap coordinates
  const getViewportRect = () => {
    const viewportWorldX = -viewport.pan.x / viewport.zoom;
    const viewportWorldY = -viewport.pan.y / viewport.zoom;
    const viewportWorldWidth = canvasSize.width / viewport.zoom;
    const viewportWorldHeight = canvasSize.height / viewport.zoom;

    const topLeft = worldToMinimap(viewportWorldX, viewportWorldY);
    const bottomRight = worldToMinimap(
      viewportWorldX + viewportWorldWidth,
      viewportWorldY + viewportWorldHeight
    );

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  };

  const viewportRect = getViewportRect();

  // Handle minimap click/drag to pan viewport
  const handleMinimapMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const minimapX = event.clientX - rect.left;
    const minimapY = event.clientY - rect.top;

    // Convert to world coordinates
    const worldPos = minimapToWorld(minimapX, minimapY);

    // Center the viewport on this position
    const newPan = {
      x: -(worldPos.x * viewport.zoom) + (canvasSize.width / 2),
      y: -(worldPos.y * viewport.zoom) + (canvasSize.height / 2)
    };

    onViewportChange({
      zoom: viewport.zoom,
      pan: newPan
    });

    setMinimapState(prev => ({ ...prev, isDragging: true }));
  };

  const handleMinimapMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!minimapState.isDragging || !minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const minimapX = event.clientX - rect.left;
    const minimapY = event.clientY - rect.top;

    const worldPos = minimapToWorld(minimapX, minimapY);

    const newPan = {
      x: -(worldPos.x * viewport.zoom) + (canvasSize.width / 2),
      y: -(worldPos.y * viewport.zoom) + (canvasSize.height / 2)
    };

    onViewportChange({
      zoom: viewport.zoom,
      pan: newPan
    });
  };

  const handleMinimapMouseUp = () => {
    setMinimapState(prev => ({ ...prev, isDragging: false }));
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setMinimapState(prev => ({ ...prev, isDragging: false }));
    };

    if (minimapState.isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [minimapState.isDragging]);

  // Get node color based on type
  const getNodeColor = (nodeType: string) => {
    const colors: Record<string, string> = {
      'llm_processor': '#4CAF50',
      'data_processor': '#2196F3',
      'api_caller': '#FF9800',
      'file_processor': '#9C27B0',
      'validator': '#F44336',
      'transformer': '#00BCD4',
      'aggregator': '#795548',
      'filter': '#607D8B'
    };
    return colors[nodeType] || '#757575';
  };

  if (!minimapState.isVisible) {
    return (
      <div className={`minimap-container ${className}`} style={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setMinimapState(prev => ({ ...prev, isVisible: true }))}
          title="Show Minimap"
        >
          <FaEye />
        </Button>
      </div>
    );
  }

  return (
    <div className={`minimap-container ${className}`} style={{ position: 'absolute', bottom: 20, right: 20 }}>
      <Card style={{ width: minimapWidth + 40, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Card.Header className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <small className="fw-bold">Workflow Overview</small>
            <div className="d-flex gap-1">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setMinimapState(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
                title={minimapState.isExpanded ? "Collapse" : "Expand"}
              >
                {minimapState.isExpanded ? <FaCompress /> : <FaExpand />}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setMinimapState(prev => ({ ...prev, isVisible: false }))}
                title="Hide Minimap"
              >
                <FaEyeSlash />
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-2">
          <svg
            ref={minimapRef}
            width={minimapWidth}
            height={minimapHeight}
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              cursor: minimapState.isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMinimapMouseDown}
            onMouseMove={handleMinimapMouseMove}
            onMouseUp={handleMinimapMouseUp}
          >
            {/* Background */}
            <rect
              width={minimapWidth}
              height={minimapHeight}
              fill="#f8f9fa"
            />

            {/* Grid pattern */}
            <defs>
              <pattern
                id="minimap-grid"
                width={20 * scale}
                height={20 * scale}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${20 * scale} 0 L 0 0 0 ${20 * scale}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              width={minimapWidth}
              height={minimapHeight}
              fill="url(#minimap-grid)"
            />

            {/* Connections */}
            {connections.map(connection => {
              const sourceNode = nodes.find(n => n.id === connection.from?.componentId);
              const targetNode = nodes.find(n => n.id === connection.to?.componentId);
              
              if (!sourceNode || !targetNode) return null;

              const sourcePos = worldToMinimap(
                sourceNode.position.x + 100, // Center of node
                sourceNode.position.y + 50
              );
              const targetPos = worldToMinimap(
                targetNode.position.x + 100,
                targetNode.position.y + 50
              );

              return (
                <line
                  key={`${connection.from?.componentId}-${connection.to?.componentId}`}
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="#666"
                  strokeWidth="1"
                  opacity="0.6"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const pos = worldToMinimap(node.position.x, node.position.y);
              const nodeWidth = 200 * scale;
              const nodeHeight = 100 * scale;

              return (
                <g key={node.id}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={Math.max(nodeWidth, 4)} // Minimum size for visibility
                    height={Math.max(nodeHeight, 4)}
                    fill={getNodeColor(node.component.type)}
                    stroke="#333"
                    strokeWidth="0.5"
                    rx="2"
                  />
                  {/* Node label (only show if expanded and node is large enough) */}
                  {minimapState.isExpanded && nodeWidth > 20 && (
                    <text
                      x={pos.x + nodeWidth / 2}
                      y={pos.y + nodeHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="8"
                      fill="white"
                      fontWeight="bold"
                    >
                      {node.component.name?.substring(0, 8) || node.component.type.substring(0, 8)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Viewport rectangle */}
            <rect
              x={Math.max(0, Math.min(viewportRect.x, minimapWidth))}
              y={Math.max(0, Math.min(viewportRect.y, minimapHeight))}
              width={Math.max(0, Math.min(viewportRect.width, minimapWidth - Math.max(0, viewportRect.x)))}
              height={Math.max(0, Math.min(viewportRect.height, minimapHeight - Math.max(0, viewportRect.y)))}
              fill="rgba(0, 123, 255, 0.2)"
              stroke="#007bff"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          </svg>

          {/* Minimap Info */}
          <div className="mt-2 d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {nodes.length} components
            </small>
            <small className="text-muted">
              Zoom: {(viewport.zoom * 100).toFixed(0)}%
            </small>
          </div>

          {/* Quick Actions */}
          {minimapState.isExpanded && (
            <div className="mt-2 d-flex gap-1">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onViewportChange({ zoom: 1, pan: { x: 0, y: 0 } })}
                title="Reset View"
              >
                Reset
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  // Fit all nodes in view
                  const padding = 50;
                  const availableWidth = canvasSize.width - padding * 2;
                  const availableHeight = canvasSize.height - padding * 2;
                  
                  const scaleToFitX = availableWidth / workflowWidth;
                  const scaleToFitY = availableHeight / workflowHeight;
                  const scaleToFit = Math.min(scaleToFitX, scaleToFitY, 1);
                  
                  const centerX = workflowBounds.minX + workflowWidth / 2;
                  const centerY = workflowBounds.minY + workflowHeight / 2;
                  
                  onViewportChange({
                    zoom: scaleToFit,
                    pan: {
                      x: -(centerX * scaleToFit) + (canvasSize.width / 2),
                      y: -(centerY * scaleToFit) + (canvasSize.height / 2)
                    }
                  });
                }}
                title="Fit to View"
              >
                Fit All
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default WorkflowMinimap;
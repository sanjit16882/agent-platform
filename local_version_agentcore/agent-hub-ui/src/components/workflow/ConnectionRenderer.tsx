import React from 'react';
import { Connection } from '../../types/hybridAgent';

interface ConnectionRendererProps {
  connection: Connection;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  onDelete: () => void;
  readonly?: boolean;
  selected?: boolean;
}

const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  connection,
  fromPosition,
  toPosition,
  onDelete,
  readonly = false,
  selected = false
}) => {
  // Calculate connection points
  const nodeWidth = 160;
  const nodeHeight = 100;
  
  const startX = fromPosition.x + nodeWidth;
  const startY = fromPosition.y + nodeHeight / 2;
  const endX = toPosition.x;
  const endY = toPosition.y + nodeHeight / 2;

  // Create bezier curve path
  const controlPointOffset = Math.abs(endX - startX) * 0.5;
  const controlPoint1X = startX + controlPointOffset;
  const controlPoint1Y = startY;
  const controlPoint2X = endX - controlPointOffset;
  const controlPoint2Y = endY;

  const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

  // Calculate arrow position and rotation
  const arrowSize = 8;
  const arrowAngle = Math.atan2(endY - controlPoint2Y, endX - controlPoint2X);
  const arrowX = endX - arrowSize;
  const arrowY = endY;

  const handleConnectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readonly) {
      // Show connection context menu or select connection
      console.log('Connection clicked:', connection);
    }
  };

  const handleConnectionDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readonly) {
      onDelete();
    }
  };

  return (
    <g className="connection-group">
      {/* Connection Path */}
      <path
        d={pathData}
        className={`connection-line ${selected ? 'selected' : ''}`}
        onClick={handleConnectionClick}
        onDoubleClick={handleConnectionDoubleClick}
        style={{
          pointerEvents: readonly ? 'none' : 'stroke',
          stroke: selected ? '#007bff' : '#666',
          strokeWidth: selected ? 3 : 2
        }}
      />

      {/* Arrow Head */}
      <polygon
        points={`${arrowX},${arrowY - arrowSize/2} ${arrowX + arrowSize},${arrowY} ${arrowX},${arrowY + arrowSize/2}`}
        className={`connection-arrow ${selected ? 'selected' : ''}`}
        style={{
          fill: selected ? '#007bff' : '#666',
          transform: `rotate(${arrowAngle}rad)`,
          transformOrigin: `${arrowX + arrowSize/2}px ${arrowY}px`
        }}
      />

      {/* Connection Label */}
      <text
        x={(startX + endX) / 2}
        y={(startY + endY) / 2 - 10}
        className="connection-label"
        style={{
          fontSize: '10px',
          fill: '#666',
          textAnchor: 'middle',
          pointerEvents: 'none',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {connection.from.outputName} → {connection.to.inputName}
      </text>

      {/* Delete Button (on hover) */}
      {!readonly && (
        <g className="connection-delete" style={{ opacity: 0 }}>
          <circle
            cx={(startX + endX) / 2}
            cy={(startY + endY) / 2}
            r="8"
            fill="#dc3545"
            stroke="#ffffff"
            strokeWidth="2"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ cursor: 'pointer' }}
          />
          <text
            x={(startX + endX) / 2}
            y={(startY + endY) / 2 + 3}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            style={{ pointerEvents: 'none', fontWeight: 'bold' }}
          >
            ×
          </text>
        </g>
      )}


    </g>
  );
};

export default ConnectionRenderer;
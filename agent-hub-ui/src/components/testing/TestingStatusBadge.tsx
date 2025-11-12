/**
 * Testing Status Badge Component
 * 
 * Displays testing status for agents in the catalog
 * Implements Task 16.3: Create TestingStatusBadge component
 */

import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface TestingStatus {
  lastTestRun?: string;
  passRate?: number;
  totalTests?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor' | 'not-tested';
}

interface TestingStatusBadgeProps {
  status?: TestingStatus;
  size?: 'sm' | 'md' | 'lg';
}

const TestingStatusBadge: React.FC<TestingStatusBadgeProps> = ({ status, size = 'sm' }) => {
  if (!status || status.quality === 'not-tested') {
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>No tests run yet</Tooltip>}
      >
        <Badge bg="secondary" style={{ fontSize: size === 'sm' ? '0.7rem' : '0.8rem' }}>
          🧪 Not Tested
        </Badge>
      </OverlayTrigger>
    );
  }

  const getQualityConfig = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return { bg: 'success', icon: '✅', text: 'Excellent' };
      case 'good':
        return { bg: 'info', icon: '✓', text: 'Good' };
      case 'fair':
        return { bg: 'warning', icon: '⚠', text: 'Fair' };
      case 'poor':
        return { bg: 'danger', icon: '✗', text: 'Needs Attention' };
      default:
        return { bg: 'secondary', icon: '○', text: 'Unknown' };
    }
  };

  const config = getQualityConfig(status.quality || 'not-tested');

  const tooltipContent = (
    <div>
      <div><strong>Quality:</strong> {config.text}</div>
      {status.passRate !== undefined && (
        <div><strong>Pass Rate:</strong> {status.passRate}%</div>
      )}
      {status.totalTests !== undefined && (
        <div><strong>Total Tests:</strong> {status.totalTests}</div>
      )}
      {status.lastTestRun && (
        <div><strong>Last Run:</strong> {new Date(status.lastTestRun).toLocaleString()}</div>
      )}
    </div>
  );

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{tooltipContent}</Tooltip>}
    >
      <Badge 
        bg={config.bg} 
        style={{ 
          fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
          cursor: 'pointer'
        }}
      >
        {config.icon} {status.passRate !== undefined ? `${status.passRate}%` : config.text}
      </Badge>
    </OverlayTrigger>
  );
};

export default TestingStatusBadge;

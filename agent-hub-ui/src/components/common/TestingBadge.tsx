import React from 'react';
import Badge from './Badge';
import { theme } from '../../styles/theme';

interface TestingBadgeProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'not-tested';
  passRate?: number;
  compact?: boolean;
}

/**
 * TestingBadge Component
 * 
 * Displays a color-coded badge indicating agent testing status and quality.
 * Used in Agent Catalog to show which agents have been tested.
 */
const TestingBadge: React.FC<TestingBadgeProps> = ({ 
  quality, 
  passRate, 
  compact = false 
}) => {
  // Don't show badge if agent hasn't been tested
  if (quality === 'not-tested') {
    return null;
  }

  // Map quality to badge variant (color)
  const getVariant = (): 'success' | 'primary' | 'warning' | 'danger' | 'secondary' => {
    switch (quality) {
      case 'excellent': return 'success';  // Green - 90%+ pass rate
      case 'good': return 'primary';       // Blue - 75-89% pass rate
      case 'fair': return 'warning';       // Orange - 60-74% pass rate
      case 'poor': return 'danger';        // Red - <60% pass rate
      default: return 'secondary';
    }
  };

  // Map quality to icon
  const getIcon = (): string => {
    switch (quality) {
      case 'excellent': return '⭐';
      case 'good': return '✓';
      case 'fair': return '⚠';
      case 'poor': return '✗';
      default: return '?';
    }
  };

  // Map quality to label
  const getLabel = (): string => {
    if (compact) return '';
    return 'Tested';
  };

  return (
    <Badge 
      variant={getVariant()}
      title={passRate !== undefined ? `Pass Rate: ${passRate}%` : 'Agent has been tested'}
      style={{
        cursor: 'help',
        fontSize: theme.typography.fontSize.xs
      }}
    >
      {getIcon()} {getLabel()}
    </Badge>
  );
};

export default TestingBadge;

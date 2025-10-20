import React from 'react';
import Badge from '../common/Badge';
import { FilterStats } from '../../hooks/useFilters';

interface FilterIndicatorProps {
  stats: FilterStats;
  onClearFilters: () => void;
  showDetails?: boolean;
}

const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  stats,
  onClearFilters,
  showDetails = false
}) => {
  if (!stats.hasActiveFilters) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '6px',
    marginBottom: '16px'
  };

  const textStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#0c4a6e',
    margin: 0
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const clearButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #0ea5e9',
    color: '#0ea5e9',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: 'auto'
  };

  const getFilterSummary = (): string => {
    const parts: string[] = [];
    
    if (stats.filterBreakdown.search) {
      parts.push('search');
    }
    if (stats.filterBreakdown.categories > 0) {
      parts.push(`${stats.filterBreakdown.categories} category${stats.filterBreakdown.categories !== 1 ? 'ies' : 'y'}`);
    }
    if (stats.filterBreakdown.statuses > 0) {
      parts.push(`${stats.filterBreakdown.statuses} status${stats.filterBreakdown.statuses !== 1 ? 'es' : ''}`);
    }
    if (stats.filterBreakdown.deploymentStatuses > 0) {
      parts.push(`${stats.filterBreakdown.deploymentStatuses} deployment${stats.filterBreakdown.deploymentStatuses !== 1 ? 's' : ''}`);
    }
    if (stats.filterBreakdown.healthStatuses > 0) {
      parts.push(`${stats.filterBreakdown.healthStatuses} health status${stats.filterBreakdown.healthStatuses !== 1 ? 'es' : ''}`);
    }

    return parts.join(', ');
  };

  return (
    <div style={containerStyle}>
      <div style={statsStyle}>
        <span style={textStyle}>
          Showing {stats.filteredAgents} of {stats.totalAgents} agents
        </span>
        
        {showDetails && (
          <>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ ...textStyle, fontSize: '12px' }}>
              Filtered by: {getFilterSummary()}
            </span>
          </>
        )}

        <Badge variant="info">
          {stats.activeFilterCount} filter{stats.activeFilterCount !== 1 ? 's' : ''} active
        </Badge>
      </div>

      <button
        onClick={onClearFilters}
        style={clearButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0ea5e9';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#0ea5e9';
        }}
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterIndicator;
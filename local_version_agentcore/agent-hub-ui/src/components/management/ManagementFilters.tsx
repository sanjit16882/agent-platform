import React, { useState } from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { ManagementFiltersProps, FilterState } from '../../types/management';

const ManagementFilters: React.FC<ManagementFiltersProps> = ({
  categories,
  statuses,
  selectedFilters,
  selectedAgents,
  onFilterChange,
  onBulkOperation,
  bulkOperationsEnabled
}) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDeploymentDropdown, setShowDeploymentDropdown] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0'
  };

  const filterSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const filterLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    minWidth: 'fit-content'
  };

  const dropdownContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block'
  };

  const dropdownButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '120px',
    justifyContent: 'space-between'
  };

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto'
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid #f3f4f6'
  };

  const dropdownItemHoverStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb'
  };

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  };

  const activeFiltersStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center'
  };

  const bulkActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginLeft: 'auto',
    padding: '8px 16px',
    backgroundColor: '#dbeafe',
    borderRadius: '6px',
    border: '1px solid #93c5fd'
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...selectedFilters.categories, category]
      : selectedFilters.categories.filter(c => c !== category);
    
    onFilterChange({
      ...selectedFilters,
      categories: newCategories
    });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...selectedFilters.statuses, status as any]
      : selectedFilters.statuses.filter(s => s !== status);
    
    onFilterChange({
      ...selectedFilters,
      statuses: newStatuses
    });
  };

  const handleDeploymentStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...selectedFilters.deploymentStatuses, status as any]
      : selectedFilters.deploymentStatuses.filter(s => s !== status);
    
    onFilterChange({
      ...selectedFilters,
      deploymentStatuses: newStatuses
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      categories: [],
      statuses: [],
      deploymentStatuses: [],
      healthStatuses: [],
      searchQuery: ''
    });
  };

  const getActiveFilterCount = () => {
    return selectedFilters.categories.length + 
           selectedFilters.statuses.length + 
           selectedFilters.deploymentStatuses.length + 
           selectedFilters.healthStatuses.length;
  };

  const deploymentStatuses = ['deployed', 'not_deployed', 'deploying', 'failed'];
  const agentStatuses = ['deployed', 'validated', 'pending_validation', 'validation_failed', 'draft'];

  return (
    <div style={containerStyle}>
      {/* Category Filter */}
      <div style={filterSectionStyle}>
        <span style={filterLabelStyle}>Category:</span>
        <div style={dropdownContainerStyle}>
          <button
            style={dropdownButtonStyle}
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <span>
              {selectedFilters.categories.length > 0 
                ? `${selectedFilters.categories.length} selected`
                : 'All Categories'
              }
            </span>
            <span>{showCategoryDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showCategoryDropdown && (
            <div style={dropdownMenuStyle}>
              {categories.map(category => (
                <div
                  key={category}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor!;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    style={checkboxStyle}
                    checked={selectedFilters.categories.includes(category)}
                    onChange={(e) => handleCategoryChange(category, e.target.checked)}
                  />
                  <span>{category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div style={filterSectionStyle}>
        <span style={filterLabelStyle}>Status:</span>
        <div style={dropdownContainerStyle}>
          <button
            style={dropdownButtonStyle}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span>
              {selectedFilters.statuses.length > 0 
                ? `${selectedFilters.statuses.length} selected`
                : 'All Statuses'
              }
            </span>
            <span>{showStatusDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showStatusDropdown && (
            <div style={dropdownMenuStyle}>
              {agentStatuses.map(status => (
                <div
                  key={status}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor!;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    style={checkboxStyle}
                    checked={selectedFilters.statuses.includes(status as any)}
                    onChange={(e) => handleStatusChange(status, e.target.checked)}
                  />
                  <span style={{ textTransform: 'capitalize' }}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deployment Status Filter */}
      <div style={filterSectionStyle}>
        <span style={filterLabelStyle}>Deployment:</span>
        <div style={dropdownContainerStyle}>
          <button
            style={dropdownButtonStyle}
            onClick={() => setShowDeploymentDropdown(!showDeploymentDropdown)}
          >
            <span>
              {selectedFilters.deploymentStatuses.length > 0 
                ? `${selectedFilters.deploymentStatuses.length} selected`
                : 'All Deployments'
              }
            </span>
            <span>{showDeploymentDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showDeploymentDropdown && (
            <div style={dropdownMenuStyle}>
              {deploymentStatuses.map(status => (
                <div
                  key={status}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor!;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    style={checkboxStyle}
                    checked={selectedFilters.deploymentStatuses.includes(status as any)}
                    onChange={(e) => handleDeploymentStatusChange(status, e.target.checked)}
                  />
                  <span style={{ textTransform: 'capitalize' }}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div style={activeFiltersStyle}>
          <span style={filterLabelStyle}>Active filters:</span>
          {selectedFilters.categories.map(category => (
            <Badge key={`cat-${category}`} variant="info">
              {category}
              <button
                onClick={() => handleCategoryChange(category, false)}
                style={{
                  marginLeft: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
            </Badge>
          ))}
          {selectedFilters.statuses.map(status => (
            <Badge key={`status-${status}`} variant="primary">
              {status.replace('_', ' ')}
              <button
                onClick={() => handleStatusChange(status, false)}
                style={{
                  marginLeft: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
            </Badge>
          ))}
          {selectedFilters.deploymentStatuses.map(status => (
            <Badge key={`deploy-${status}`} variant="success">
              {status.replace('_', ' ')}
              <button
                onClick={() => handleDeploymentStatusChange(status, false)}
                style={{
                  marginLeft: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
            </Badge>
          ))}
          <Button
            variant="secondary"
            onClick={clearAllFilters}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Bulk Operations */}
      {bulkOperationsEnabled && selectedAgents.length > 0 && (
        <div style={bulkActionsStyle}>
          <span style={filterLabelStyle}>
            {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="primary"
            onClick={() => onBulkOperation({
              type: 'deploy',
              label: 'Deploy Selected',
              icon: '🚀',
              variant: 'success',
              requiresConfirmation: true,
              applicableStatuses: ['validated']
            })}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            🚀 Deploy
          </Button>
          <Button
            variant="secondary"
            onClick={() => onBulkOperation({
              type: 'health-check',
              label: 'Health Check',
              icon: '🏥',
              variant: 'info',
              requiresConfirmation: false,
              applicableStatuses: ['deployed']
            })}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            🏥 Health Check
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              // Clear selection - this would be handled by parent component
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManagementFilters;
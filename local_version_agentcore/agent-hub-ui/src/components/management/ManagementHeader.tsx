import React, { useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { ManagementHeaderProps } from '../../types/management';
import { useDebounce } from '../../hooks/useAgentManagement';

const ManagementHeader: React.FC<ManagementHeaderProps> = ({
  onSearch,
  onRefresh,
  onRegisterAgent,
  searchQuery,
  isRefreshing
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Call onSearch when debounced value changes
  React.useEffect(() => {
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '24px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '30px',
    fontWeight: 700,
    color: '#2563eb',
    margin: 0,
    marginBottom: '8px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#64748b',
    margin: 0,
    marginBottom: '24px'
  };

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    flexWrap: 'wrap'
  };

  const leftSectionStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '300px'
  };

  const rightSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap'
  };

  const searchContainerStyle: React.CSSProperties = {
    position: 'relative',
    maxWidth: '400px',
    width: '100%'
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: localSearchQuery ? '40px' : '16px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  const searchInputFocusStyle: React.CSSProperties = {
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
  };

  const clearButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#64748b',
    fontSize: '16px',
    display: localSearchQuery ? 'block' : 'none'
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    fontSize: '16px',
    pointerEvents: 'none'
  };

  const searchInputWithIconStyle: React.CSSProperties = {
    ...searchInputStyle,
    paddingLeft: '40px'
  };

  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div style={headerStyle}>
      <div style={headerRowStyle}>
        <div style={leftSectionStyle}>
          <h1 style={titleStyle}>Agent Management</h1>
          <p style={subtitleStyle}>Manage agent lifecycle, deployment, and monitoring</p>
          
          <div style={searchContainerStyle}>
            <div style={searchIconStyle}>🔍</div>
            <input
              type="text"
              placeholder="Search agents by name, description, or category..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                ...searchInputWithIconStyle,
                ...(searchFocused ? searchInputFocusStyle : {})
              }}
            />
            <button
              onClick={handleClearSearch}
              style={clearButtonStyle}
              title="Clear search"
            >
              ×
            </button>
          </div>
        </div>

        <div style={rightSectionStyle}>
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ minWidth: '100px' }}
          >
            {isRefreshing ? '⏳' : '↻'} Refresh
          </Button>
          
          <Button
            variant="primary"
            onClick={onRegisterAgent}
            style={{ minWidth: '160px' }}
          >
            + Register New Agent
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagementHeader;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Agent, FilterState, ManagementState, SortConfig, BulkOperation, OperationStatus } from '../types/management';

// Custom hook for debounced search
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for agent filtering and search
export const useAgentFiltering = (agents: Agent[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    statuses: [],
    deploymentStatuses: [],
    healthStatuses: [],
    searchQuery: ''
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.category.toLowerCase().includes(query) ||
        agent.author.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(agent => 
        filters.categories.includes(agent.category)
      );
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(agent => 
        filters.statuses.includes(agent.status)
      );
    }

    // Apply deployment status filter
    if (filters.deploymentStatuses.length > 0) {
      filtered = filtered.filter(agent => 
        filters.deploymentStatuses.includes(agent.deployment_status)
      );
    }

    // Apply health status filter
    if (filters.healthStatuses.length > 0) {
      filtered = filtered.filter(agent => 
        filters.healthStatuses.includes(agent.health.status)
      );
    }

    return filtered;
  }, [agents, debouncedSearchQuery, filters]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      categories: [],
      statuses: [],
      deploymentStatuses: [],
      healthStatuses: [],
      searchQuery: ''
    });
  }, []);

  const updateFilter = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredAgents,
    clearFilters,
    updateFilter,
    hasActiveFilters: debouncedSearchQuery || 
      filters.categories.length > 0 || 
      filters.statuses.length > 0 || 
      filters.deploymentStatuses.length > 0 || 
      filters.healthStatuses.length > 0
  };
};

// Custom hook for agent selection and bulk operations
export const useAgentSelection = (agents: Agent[]) => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [bulkOperationProgress, setBulkOperationProgress] = useState<Record<string, OperationStatus>>({});

  const selectAgent = useCallback((agentId: string, selected: boolean) => {
    setSelectedAgents(prev => {
      if (selected) {
        return [...prev, agentId];
      } else {
        return prev.filter(id => id !== agentId);
      }
    });
  }, []);

  const selectAllAgents = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedAgents(agents.map(agent => agent.agent_id));
    } else {
      setSelectedAgents([]);
    }
  }, [agents]);

  const clearSelection = useCallback(() => {
    setSelectedAgents([]);
    setBulkOperationProgress({});
  }, []);

  const isAgentSelected = useCallback((agentId: string) => {
    return selectedAgents.includes(agentId);
  }, [selectedAgents]);

  const areAllAgentsSelected = useMemo(() => {
    return agents.length > 0 && selectedAgents.length === agents.length;
  }, [agents.length, selectedAgents.length]);

  const areSomeAgentsSelected = useMemo(() => {
    return selectedAgents.length > 0 && selectedAgents.length < agents.length;
  }, [selectedAgents.length, agents.length]);

  return {
    selectedAgents,
    selectAgent,
    selectAllAgents,
    clearSelection,
    isAgentSelected,
    areAllAgentsSelected,
    areSomeAgentsSelected,
    bulkOperationProgress,
    setBulkOperationProgress
  };
};

// Custom hook for sorting
export const useAgentSorting = (agents: Agent[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc'
  });

  const sortedAgents = useMemo(() => {
    const sorted = [...agents].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [agents, sortConfig]);

  const handleSort = useCallback((field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  return {
    sortConfig,
    sortedAgents,
    handleSort
  };
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj) || '';
};

// Custom hook for real-time updates
export const useRealTimeUpdates = (onUpdate: (agents: Agent[]) => void) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());

  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      // Simulate polling for updates
      setLastUpdate(new Date().toISOString());
      // In a real implementation, this would make an API call
      // onUpdate(updatedAgents);
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isEnabled, onUpdate]);

  const toggleUpdates = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    isEnabled,
    connectionStatus,
    lastUpdate,
    toggleUpdates,
    setConnectionStatus
  };
};

// Main agent management hook that combines all functionality
export const useAgentManagement = (initialAgents: Agent[] = []) => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtering = useAgentFiltering(agents);
  const sorting = useAgentSorting(filtering.filteredAgents);
  const selection = useAgentSelection(sorting.sortedAgents);
  const realTimeUpdates = useRealTimeUpdates(setAgents);

  const refreshAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real implementation, this would fetch from API
      // const updatedAgents = await fetchAgents();
      // setAgents(updatedAgents);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh agents');
      setIsLoading(false);
    }
  }, []);

  const updateAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => 
      agent.agent_id === agentId ? { ...agent, ...updates } : agent
    ));
  }, []);

  const performBulkOperation = useCallback(async (operation: BulkOperation) => {
    const selectedAgentIds = selection.selectedAgents;
    
    // Initialize progress tracking
    const initialProgress: Record<string, OperationStatus> = {};
    selectedAgentIds.forEach(id => {
      initialProgress[id] = 'pending';
    });
    selection.setBulkOperationProgress(initialProgress);

    // Simulate bulk operation
    for (const agentId of selectedAgentIds) {
      try {
        // In a real implementation, this would make API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        selection.setBulkOperationProgress(prev => ({
          ...prev,
          [agentId]: 'success'
        }));
      } catch (error) {
        selection.setBulkOperationProgress(prev => ({
          ...prev,
          [agentId]: 'error'
        }));
      }
    }

    // Clear selection after operation completes
    setTimeout(() => {
      selection.clearSelection();
    }, 2000);
  }, [selection]);

  return {
    // Data
    agents,
    setAgents,
    displayedAgents: sorting.sortedAgents,
    isLoading,
    error,

    // Filtering
    ...filtering,

    // Sorting
    ...sorting,

    // Selection
    ...selection,

    // Real-time updates
    ...realTimeUpdates,

    // Actions
    refreshAgents,
    updateAgent,
    performBulkOperation
  };
};
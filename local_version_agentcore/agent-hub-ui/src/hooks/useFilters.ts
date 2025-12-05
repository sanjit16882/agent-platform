import { useState, useCallback, useMemo } from 'react';
import { Agent, FilterState, AgentStatus, DeploymentStatus, HealthStatus } from '../types/management';

export interface FilterOptions {
  categories: string[];
  statuses: AgentStatus[];
  deploymentStatuses: DeploymentStatus[];
  healthStatuses: HealthStatus[];
}

export interface FilterStats {
  totalAgents: number;
  filteredAgents: number;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  filterBreakdown: {
    categories: number;
    statuses: number;
    deploymentStatuses: number;
    healthStatuses: number;
    search: boolean;
  };
}

export const useFilters = (agents: Agent[], searchQuery: string = '') => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    statuses: [],
    deploymentStatuses: [],
    healthStatuses: [],
    searchQuery: ''
  });

  // Get available filter options from agents
  const filterOptions = useMemo((): FilterOptions => {
    const categories = Array.from(new Set(agents.map(agent => agent.category))).sort();
    const statuses = Array.from(new Set(agents.map(agent => agent.status))).sort();
    const deploymentStatuses = Array.from(new Set(agents.map(agent => agent.deployment_status))).sort();
    const healthStatuses = Array.from(new Set(agents.map(agent => agent.health.status))).sort();

    return {
      categories,
      statuses,
      deploymentStatuses,
      healthStatuses
    };
  }, [agents]);

  // Apply all filters to agents
  const filteredAgents = useMemo(() => {
    let filtered = [...agents];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.category.toLowerCase().includes(query) ||
        agent.author.toLowerCase().includes(query) ||
        agent.agent_id.toLowerCase().includes(query)
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
  }, [agents, searchQuery, filters]);

  // Calculate filter statistics
  const filterStats = useMemo((): FilterStats => {
    const activeFilterCount = 
      filters.categories.length + 
      filters.statuses.length + 
      filters.deploymentStatuses.length + 
      filters.healthStatuses.length;

    const hasActiveFilters = activeFilterCount > 0 || !!searchQuery;

    return {
      totalAgents: agents.length,
      filteredAgents: filteredAgents.length,
      activeFilterCount,
      hasActiveFilters,
      filterBreakdown: {
        categories: filters.categories.length,
        statuses: filters.statuses.length,
        deploymentStatuses: filters.deploymentStatuses.length,
        healthStatuses: filters.healthStatuses.length,
        search: !!searchQuery
      }
    };
  }, [agents.length, filteredAgents.length, filters, searchQuery]);

  // Filter update functions
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const addCategoryFilter = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: [...prev.categories, category]
    }));
  }, []);

  const removeCategoryFilter = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  }, []);

  const toggleCategoryFilter = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  }, []);

  const addStatusFilter = useCallback((status: AgentStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: [...prev.statuses, status]
    }));
  }, []);

  const removeStatusFilter = useCallback((status: AgentStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.filter(s => s !== status)
    }));
  }, []);

  const toggleStatusFilter = useCallback((status: AgentStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  }, []);

  const addDeploymentStatusFilter = useCallback((status: DeploymentStatus) => {
    setFilters(prev => ({
      ...prev,
      deploymentStatuses: [...prev.deploymentStatuses, status]
    }));
  }, []);

  const removeDeploymentStatusFilter = useCallback((status: DeploymentStatus) => {
    setFilters(prev => ({
      ...prev,
      deploymentStatuses: prev.deploymentStatuses.filter(s => s !== status)
    }));
  }, []);

  const toggleDeploymentStatusFilter = useCallback((status: DeploymentStatus) => {
    setFilters(prev => ({
      ...prev,
      deploymentStatuses: prev.deploymentStatuses.includes(status)
        ? prev.deploymentStatuses.filter(s => s !== status)
        : [...prev.deploymentStatuses, status]
    }));
  }, []);

  const addHealthStatusFilter = useCallback((status: HealthStatus) => {
    setFilters(prev => ({
      ...prev,
      healthStatuses: [...prev.healthStatuses, status]
    }));
  }, []);

  const removeHealthStatusFilter = useCallback((status: HealthStatus) => {
    setFilters(prev => ({
      ...prev,
      healthStatuses: prev.healthStatuses.filter(s => s !== status)
    }));
  }, []);

  const toggleHealthStatusFilter = useCallback((status: HealthStatus) => {
    setFilters(prev => ({
      ...prev,
      healthStatuses: prev.healthStatuses.includes(status)
        ? prev.healthStatuses.filter(s => s !== status)
        : [...prev.healthStatuses, status]
    }));
  }, []);

  // Clear functions
  const clearAllFilters = useCallback(() => {
    setFilters({
      categories: [],
      statuses: [],
      deploymentStatuses: [],
      healthStatuses: [],
      searchQuery: ''
    });
  }, []);

  const clearCategoryFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, categories: [] }));
  }, []);

  const clearStatusFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, statuses: [] }));
  }, []);

  const clearDeploymentStatusFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, deploymentStatuses: [] }));
  }, []);

  const clearHealthStatusFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, healthStatuses: [] }));
  }, []);

  // Preset filter functions
  const showOnlyDeployed = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      deploymentStatuses: ['deployed']
    }));
  }, []);

  const showOnlyHealthy = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      healthStatuses: ['healthy']
    }));
  }, []);

  const showProblematicAgents = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      healthStatuses: ['degraded', 'unhealthy'],
      statuses: ['validation_failed']
    }));
  }, []);

  // Filter validation
  const isFilterApplicable = useCallback((filterType: keyof FilterState, value: string): boolean => {
    switch (filterType) {
      case 'categories':
        return filterOptions.categories.includes(value);
      case 'statuses':
        return filterOptions.statuses.includes(value as AgentStatus);
      case 'deploymentStatuses':
        return filterOptions.deploymentStatuses.includes(value as DeploymentStatus);
      case 'healthStatuses':
        return filterOptions.healthStatuses.includes(value as HealthStatus);
      default:
        return false;
    }
  }, [filterOptions]);

  // Get agents that would be affected by adding a filter
  const getFilterPreview = useCallback((filterType: keyof FilterState, value: string): Agent[] => {
    const tempFilters = { ...filters };
    
    switch (filterType) {
      case 'categories':
        tempFilters.categories = [...tempFilters.categories, value];
        break;
      case 'statuses':
        tempFilters.statuses = [...tempFilters.statuses, value as AgentStatus];
        break;
      case 'deploymentStatuses':
        tempFilters.deploymentStatuses = [...tempFilters.deploymentStatuses, value as DeploymentStatus];
        break;
      case 'healthStatuses':
        tempFilters.healthStatuses = [...tempFilters.healthStatuses, value as HealthStatus];
        break;
    }

    // Apply preview filters (simplified version of main filter logic)
    let preview = [...agents];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      preview = preview.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.category.toLowerCase().includes(query) ||
        agent.author.toLowerCase().includes(query)
      );
    }

    if (tempFilters.categories.length > 0) {
      preview = preview.filter(agent => tempFilters.categories.includes(agent.category));
    }

    if (tempFilters.statuses.length > 0) {
      preview = preview.filter(agent => tempFilters.statuses.includes(agent.status));
    }

    if (tempFilters.deploymentStatuses.length > 0) {
      preview = preview.filter(agent => tempFilters.deploymentStatuses.includes(agent.deployment_status));
    }

    if (tempFilters.healthStatuses.length > 0) {
      preview = preview.filter(agent => tempFilters.healthStatuses.includes(agent.health.status));
    }

    return preview;
  }, [agents, filters, searchQuery]);

  return {
    // State
    filters,
    filteredAgents,
    filterOptions,
    filterStats,

    // Update functions
    updateFilters,
    setFilters,

    // Category functions
    addCategoryFilter,
    removeCategoryFilter,
    toggleCategoryFilter,
    clearCategoryFilters,

    // Status functions
    addStatusFilter,
    removeStatusFilter,
    toggleStatusFilter,
    clearStatusFilters,

    // Deployment status functions
    addDeploymentStatusFilter,
    removeDeploymentStatusFilter,
    toggleDeploymentStatusFilter,
    clearDeploymentStatusFilters,

    // Health status functions
    addHealthStatusFilter,
    removeHealthStatusFilter,
    toggleHealthStatusFilter,
    clearHealthStatusFilters,

    // Clear functions
    clearAllFilters,

    // Preset functions
    showOnlyDeployed,
    showOnlyHealthy,
    showProblematicAgents,

    // Utility functions
    isFilterApplicable,
    getFilterPreview
  };
};
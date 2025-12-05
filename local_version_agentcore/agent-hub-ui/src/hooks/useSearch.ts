import { useState, useEffect, useMemo } from 'react';
import { Agent } from '../types/management';

export interface SearchResult {
  agent: Agent;
  matchedFields: string[];
  relevanceScore: number;
}

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  searchFields?: (keyof Agent)[];
  highlightMatches?: boolean;
}

export const useSearch = (
  agents: Agent[],
  options: UseSearchOptions = {}
) => {
  const {
    debounceMs = 300,
    minQueryLength = 1,
    searchFields = ['name', 'description', 'category', 'author'],
    highlightMatches = false
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Perform the search
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
      return agents.map(agent => ({
        agent,
        matchedFields: [],
        relevanceScore: 0
      }));
    }

    const queryLower = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    agents.forEach(agent => {
      const matchedFields: string[] = [];
      let relevanceScore = 0;

      // Search in specified fields
      searchFields.forEach(field => {
        const fieldValue = String(agent[field] || '').toLowerCase();
        
        if (fieldValue.includes(queryLower)) {
          matchedFields.push(field);
          
          // Calculate relevance score
          if (fieldValue.startsWith(queryLower)) {
            relevanceScore += 10; // Higher score for prefix matches
          } else if (fieldValue.includes(` ${queryLower}`)) {
            relevanceScore += 5; // Medium score for word boundary matches
          } else {
            relevanceScore += 1; // Lower score for substring matches
          }

          // Boost score for exact matches
          if (fieldValue === queryLower) {
            relevanceScore += 20;
          }

          // Boost score for name matches (more important field)
          if (field === 'name') {
            relevanceScore *= 2;
          }
        }
      });

      // Also search in nested fields
      const healthStatus = agent.health?.status?.toLowerCase() || '';
      if (healthStatus.includes(queryLower)) {
        matchedFields.push('health.status');
        relevanceScore += 1;
      }

      const deploymentStatus = agent.deployment_status?.toLowerCase() || '';
      if (deploymentStatus.includes(queryLower)) {
        matchedFields.push('deployment_status');
        relevanceScore += 1;
      }

      // Only include agents with matches
      if (matchedFields.length > 0) {
        results.push({
          agent,
          matchedFields,
          relevanceScore
        });
      }
    });

    // Sort by relevance score (highest first)
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [agents, debouncedQuery, minQueryLength, searchFields]);

  // Extract just the agents for easier use
  const filteredAgents = useMemo(() => {
    return searchResults.map(result => result.agent);
  }, [searchResults]);

  // Highlight function for search terms
  const highlightText = (text: string, className: string = 'search-highlight'): string => {
    if (!debouncedQuery || !highlightMatches) return text;
    
    const regex = new RegExp(`(${debouncedQuery})`, 'gi');
    return text.replace(regex, `<span class="${className}">$1</span>`);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  // Get search statistics
  const searchStats = useMemo(() => {
    const totalAgents = agents.length;
    const matchedAgents = filteredAgents.length;
    const hasQuery = debouncedQuery.length >= minQueryLength;
    
    return {
      totalAgents,
      matchedAgents,
      hasQuery,
      isFiltered: hasQuery && matchedAgents < totalAgents,
      matchPercentage: totalAgents > 0 ? (matchedAgents / totalAgents) * 100 : 0
    };
  }, [agents.length, filteredAgents.length, debouncedQuery.length, minQueryLength]);

  return {
    // Query state
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    
    // Results
    searchResults,
    filteredAgents,
    
    // Utilities
    highlightText,
    clearSearch,
    searchStats,
    
    // State checks
    hasQuery: debouncedQuery.length >= minQueryLength,
    isEmpty: filteredAgents.length === 0 && debouncedQuery.length >= minQueryLength
  };
};

// Advanced search hook with multiple criteria
export interface AdvancedSearchCriteria {
  query?: string;
  categories?: string[];
  statuses?: string[];
  deploymentStatuses?: string[];
  healthStatuses?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  metricsFilter?: {
    minSuccessRate?: number;
    maxResponseTime?: number;
    minAvailability?: number;
  };
}

export const useAdvancedSearch = (
  agents: Agent[],
  criteria: AdvancedSearchCriteria,
  options: UseSearchOptions = {}
) => {
  const basicSearch = useSearch(agents, options);
  
  const advancedFilteredAgents = useMemo(() => {
    let filtered = criteria.query ? basicSearch.filteredAgents : agents;

    // Apply category filter
    if (criteria.categories && criteria.categories.length > 0) {
      filtered = filtered.filter(agent => 
        criteria.categories!.includes(agent.category)
      );
    }

    // Apply status filter
    if (criteria.statuses && criteria.statuses.length > 0) {
      filtered = filtered.filter(agent => 
        criteria.statuses!.includes(agent.status)
      );
    }

    // Apply deployment status filter
    if (criteria.deploymentStatuses && criteria.deploymentStatuses.length > 0) {
      filtered = filtered.filter(agent => 
        criteria.deploymentStatuses!.includes(agent.deployment_status)
      );
    }

    // Apply health status filter
    if (criteria.healthStatuses && criteria.healthStatuses.length > 0) {
      filtered = filtered.filter(agent => 
        criteria.healthStatuses!.includes(agent.health.status)
      );
    }

    // Apply date range filter
    if (criteria.dateRange) {
      filtered = filtered.filter(agent => {
        const createdDate = new Date(agent.created_at);
        return createdDate >= criteria.dateRange!.start && 
               createdDate <= criteria.dateRange!.end;
      });
    }

    // Apply metrics filter
    if (criteria.metricsFilter) {
      filtered = filtered.filter(agent => {
        const metrics = agent.metrics;
        const health = agent.health;
        
        if (criteria.metricsFilter!.minSuccessRate !== undefined && 
            metrics.success_rate < criteria.metricsFilter!.minSuccessRate) {
          return false;
        }
        
        if (criteria.metricsFilter!.maxResponseTime !== undefined && 
            health.response_time_ms > criteria.metricsFilter!.maxResponseTime) {
          return false;
        }
        
        if (criteria.metricsFilter!.minAvailability !== undefined && 
            health.availability < criteria.metricsFilter!.minAvailability) {
          return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [basicSearch.filteredAgents, agents, criteria]);

  return {
    ...basicSearch,
    filteredAgents: advancedFilteredAgents,
    setQuery: (query: string) => basicSearch.setQuery(query)
  };
};
// Centralized Dashboard Data Service to prevent excessive backend requests
// This service implements caching and request throttling to reduce backend load

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface RequestQueue {
  [key: string]: Promise<any>;
}

class DashboardDataService {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue: RequestQueue = {};
  private readonly DEFAULT_CACHE_DURATION = 60000; // 1 minute default cache
  private readonly REQUEST_THROTTLE_DURATION = 5000; // 5 seconds minimum between requests

  /**
   * Get data with caching and request throttling
   */
  async getData<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    cacheDuration: number = this.DEFAULT_CACHE_DURATION
  ): Promise<T> {
    // Check if we have valid cached data
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      console.log(`📋 Using cached data for ${key}`);
      return cached.data;
    }

    // Check if there's already a request in progress for this key
    if (this.requestQueue[key] !== undefined) {
      console.log(`⏳ Request already in progress for ${key}, waiting...`);
      return this.requestQueue[key];
    }

    // Check if we should throttle this request
    if (cached && Date.now() - cached.timestamp < this.REQUEST_THROTTLE_DURATION) {
      console.log(`🚫 Request throttled for ${key}, using stale cache`);
      return cached.data;
    }

    // Make the request
    console.log(`🔄 Fetching fresh data for ${key}`);
    const requestPromise = this.makeRequest(key, fetcher, cacheDuration);
    this.requestQueue[key] = requestPromise;

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the request queue
      delete this.requestQueue[key];
    }
  }

  private async makeRequest<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    cacheDuration: number
  ): Promise<T> {
    try {
      const data = await fetcher();
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + cacheDuration
      });

      console.log(`✅ Cached fresh data for ${key}`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch data for ${key}:`, error);
      
      // Return stale cache if available
      const staleCache = this.cache.get(key);
      if (staleCache) {
        console.log(`📋 Returning stale cache for ${key} due to error`);
        return staleCache.data;
      }
      
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidateCache(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Invalidated cache for ${key}`);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.cache.clear();
    console.log(`🗑️ Cleared all dashboard cache`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; keys: string[] } {
    return {
      totalEntries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Preload data for multiple keys
   */
  async preloadData(requests: Array<{ key: string; fetcher: () => Promise<any>; cacheDuration?: number }>): Promise<void> {
    const promises = requests.map(({ key, fetcher, cacheDuration }) => 
      this.getData(key, fetcher, cacheDuration).catch(error => {
        console.warn(`Failed to preload ${key}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log(`📦 Preloaded ${requests.length} data sources`);
  }
}

// Export singleton instance
export const dashboardDataService = new DashboardDataService();

// Common data fetchers with proper error handling
export const dataFetchers = {
  finOpsData: async () => {
    const response = await fetch('http://localhost:3002/api/v1/finops/dashboard');
    if (!response.ok) {
      throw new Error(`FinOps API error: ${response.status}`);
    }
    return response.json();
  },

  analyticsData: async () => {
    const response = await fetch('http://localhost:3002/api/v1/analytics/executions');
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
    return response.json();
  },

  agentsData: async () => {
    const response = await fetch('http://localhost:3002/api/v1/agents');
    if (!response.ok) {
      throw new Error(`Agents API error: ${response.status}`);
    }
    return response.json();
  },

  cloudWatchMetrics: async () => {
    const response = await fetch('http://localhost:3002/api/v1/cloudwatch/metrics');
    if (!response.ok) {
      throw new Error(`CloudWatch API error: ${response.status}`);
    }
    return response.json();
  }
};

// Cache duration constants
export const CACHE_DURATIONS = {
  FINOPS_DATA: 300000,      // 5 minutes - financial data doesn't change frequently
  ANALYTICS_DATA: 120000,   // 2 minutes - analytics can be slightly stale
  AGENTS_DATA: 180000,      // 3 minutes - agent list changes infrequently
  CLOUDWATCH_METRICS: 90000 // 1.5 minutes - metrics need to be relatively fresh
};
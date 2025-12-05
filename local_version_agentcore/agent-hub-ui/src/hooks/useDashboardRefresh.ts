import { useEffect, useRef, useCallback } from 'react';

interface UseDashboardRefreshOptions {
  refreshInterval?: number;
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
}

/**
 * Custom hook to manage dashboard refresh intervals with proper cleanup
 * and the ability to pause/resume refreshing
 */
export const useDashboardRefresh = ({
  refreshInterval = 300000, // Default 5 minutes
  enabled = true,
  onRefresh
}: UseDashboardRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabledRef = useRef(enabled);

  // Update enabled state
  isEnabledRef.current = enabled;

  const startRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isEnabledRef.current && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (isEnabledRef.current) {
          onRefresh();
        }
      }, refreshInterval);
    }
  }, [refreshInterval, onRefresh]);

  const stopRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const manualRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  // Start refresh on mount and when dependencies change
  useEffect(() => {
    // Initial load
    onRefresh();
    
    // Start interval
    startRefresh();

    // Cleanup on unmount
    return () => {
      stopRefresh();
    };
  }, [onRefresh, startRefresh, stopRefresh]);

  // Handle visibility change to pause/resume when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRefresh();
      } else if (isEnabledRef.current) {
        startRefresh();
        // Refresh immediately when tab becomes active
        onRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startRefresh, stopRefresh, onRefresh]);

  return {
    manualRefresh,
    stopRefresh,
    startRefresh
  };
};
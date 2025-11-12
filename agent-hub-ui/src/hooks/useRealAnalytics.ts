// Hook to integrate real analytics tracking with agent executions
import { useEffect } from 'react';
import { realAnalyticsService } from '../services/realAnalyticsService';

export const useRealAnalytics = () => {
  // Track agent execution
  const trackExecution = (execution: any) => {
    realAnalyticsService.trackExecution(execution);
  };

  // Track page view
  const trackPageView = (page: string) => {
    // Could be extended to track page views
    console.log(`Page view tracked: ${page}`);
  };

  // Track user action
  const trackUserAction = (action: string, metadata?: any) => {
    // Could be extended to track user actions
    console.log(`User action tracked: ${action}`, metadata);
  };

  return {
    trackExecution,
    trackPageView,
    trackUserAction
  };
};

// Hook to automatically track executions from AgentExecutor
export const useExecutionTracking = () => {
  const { trackExecution } = useRealAnalytics();

  useEffect(() => {
    // Listen for execution events
    const handleExecutionComplete = (event: CustomEvent) => {
      trackExecution(event.detail);
    };

    window.addEventListener('agentExecutionComplete', handleExecutionComplete as EventListener);
    
    return () => {
      window.removeEventListener('agentExecutionComplete', handleExecutionComplete as EventListener);
    };
  }, [trackExecution]);

  return { trackExecution };
};
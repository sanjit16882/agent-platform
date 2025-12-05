import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ExecutionProgress, ProgressService, progressService } from '../services/progressService';

// Progress Context State
interface ProgressState {
  executions: Record<string, ExecutionProgress>;
  activeExecution: string | null;
}

// Progress Actions
type ProgressAction = 
  | { type: 'SET_EXECUTION'; payload: { id: string; execution: ExecutionProgress } }
  | { type: 'SET_ACTIVE_EXECUTION'; payload: string | null }
  | { type: 'CLEAR_EXECUTION'; payload: string }
  | { type: 'CLEAR_ALL' };

// Progress Reducer
const progressReducer = (state: ProgressState, action: ProgressAction): ProgressState => {
  switch (action.type) {
    case 'SET_EXECUTION':
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: action.payload.execution
        }
      };
    
    case 'SET_ACTIVE_EXECUTION':
      return {
        ...state,
        activeExecution: action.payload
      };
    
    case 'CLEAR_EXECUTION':
      const { [action.payload]: removed, ...remainingExecutions } = state.executions;
      return {
        ...state,
        executions: remainingExecutions,
        activeExecution: state.activeExecution === action.payload ? null : state.activeExecution
      };
    
    case 'CLEAR_ALL':
      return {
        executions: {},
        activeExecution: null
      };
    
    default:
      return state;
  }
};

// Progress Context
interface ProgressContextType {
  state: ProgressState;
  startExecution: (executionId: string, agentId: string, agentCategory: string) => void;
  getExecution: (executionId: string) => ExecutionProgress | undefined;
  getActiveExecution: () => ExecutionProgress | undefined;
  clearExecution: (executionId: string) => void;
  clearAllExecutions: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Progress Provider Component
interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, {
    executions: {},
    activeExecution: null
  });

  const startExecution = (executionId: string, agentId: string, agentCategory: string) => {
    // Get default steps for the agent category
    const steps = ProgressService.getDefaultSteps(agentCategory);
    
    // Start execution in the service
    const execution = progressService.startExecution(executionId, agentId, steps);
    
    // Update context state
    dispatch({ type: 'SET_EXECUTION', payload: { id: executionId, execution } });
    dispatch({ type: 'SET_ACTIVE_EXECUTION', payload: executionId });

    // Subscribe to progress updates
    const unsubscribe = progressService.subscribe(executionId, (updatedExecution) => {
      dispatch({ type: 'SET_EXECUTION', payload: { id: executionId, execution: updatedExecution } });
    });

    // Auto-cleanup subscription when execution completes
    const checkCompletion = () => {
      const currentExecution = progressService.getExecution(executionId);
      if (currentExecution && (currentExecution.status === 'completed' || currentExecution.status === 'failed')) {
        setTimeout(() => {
          unsubscribe();
        }, 5000); // Keep subscription for 5 seconds after completion for final updates
      } else {
        setTimeout(checkCompletion, 1000);
      }
    };
    checkCompletion();
  };

  const getExecution = (executionId: string): ExecutionProgress | undefined => {
    return state.executions[executionId];
  };

  const getActiveExecution = (): ExecutionProgress | undefined => {
    return state.activeExecution ? state.executions[state.activeExecution] : undefined;
  };

  const clearExecution = (executionId: string) => {
    dispatch({ type: 'CLEAR_EXECUTION', payload: executionId });
  };

  const clearAllExecutions = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const contextValue: ProgressContextType = {
    state,
    startExecution,
    getExecution,
    getActiveExecution,
    clearExecution,
    clearAllExecutions
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Custom hook to use Progress Context
export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Hook for specific execution
export const useExecution = (executionId: string | null): ExecutionProgress | undefined => {
  const { getExecution } = useProgress();
  return executionId ? getExecution(executionId) : undefined;
};
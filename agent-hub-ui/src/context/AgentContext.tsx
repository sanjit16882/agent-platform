import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DeployedAgent {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'deploying' | 'active' | 'inactive' | 'error';
  deployedAt: string;
  category: string;
  executionCount: number;
  lastExecuted?: string;
  dockerImage?: string;
  author: string;
  tags: string[];
  framework: string;
  pricing: {
    costPerExecution: number;
    estimatedRuntime: string;
  };
  capabilities: string[];
  inputSchema?: any;
  outputSchema?: any;
}

interface AgentContextType {
  deployedAgents: DeployedAgent[];
  addDeployedAgent: (agent: DeployedAgent) => void;
  updateDeployedAgent: (id: string, updates: Partial<DeployedAgent>) => void;
  removeDeployedAgent: (id: string) => void;
  getActiveAgentsCount: () => number;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: ReactNode;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  // Initialize state from localStorage
  const [deployedAgents, setDeployedAgents] = useState<DeployedAgent[]>(() => {
    try {
      const saved = localStorage.getItem('deployedAgents');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading deployed agents from localStorage:', error);
      return [];
    }
  });



  // Helper function to save to localStorage
  const saveToLocalStorage = (agents: DeployedAgent[]) => {
    try {
      localStorage.setItem('deployedAgents', JSON.stringify(agents));
    } catch (error) {
      console.error('Error saving deployed agents to localStorage:', error);
    }
  };

  const addDeployedAgent = (agent: DeployedAgent) => {
    const newAgents = [...deployedAgents, agent];
    setDeployedAgents(newAgents);
    saveToLocalStorage(newAgents);
  };

  const updateDeployedAgent = (id: string, updates: Partial<DeployedAgent>) => {
    const newAgents = deployedAgents.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    );
    setDeployedAgents(newAgents);
    saveToLocalStorage(newAgents);
  };

  const removeDeployedAgent = (id: string) => {
    const newAgents = deployedAgents.filter(agent => agent.id !== id);
    setDeployedAgents(newAgents);
    saveToLocalStorage(newAgents);
  };

  const getActiveAgentsCount = () => {
    return deployedAgents.filter(agent => agent.status === 'active').length;
  };

  // Debug function - expose to window for console debugging
  useEffect(() => {
    (window as any).debugAgents = () => {
      console.log('=== AGENT DEBUG INFO ===');
      console.log('Deployed agents count:', deployedAgents.length);
      console.log('Active agents count:', getActiveAgentsCount());
      console.log('All deployed agents:', deployedAgents);
      console.log('localStorage data:', localStorage.getItem('deployedAgents'));
      console.log('========================');
    };
  }, [deployedAgents]);

  const value: AgentContextType = {
    deployedAgents,
    addDeployedAgent,
    updateDeployedAgent,
    removeDeployedAgent,
    getActiveAgentsCount
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};
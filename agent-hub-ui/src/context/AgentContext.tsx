import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { s3AgentService, S3Agent } from '../services/s3AgentService';

export interface DeployedAgent {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'deploying' | 'active' | 'inactive' | 'error';
  deployedAt: string;
  createdAt: string; // Added for S3 compatibility
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
  // S3 Agent properties
  purpose?: string;
  customProcessingLogic?: string;
}

interface AgentContextType {
  deployedAgents: DeployedAgent[];
  addDeployedAgent: (agent: DeployedAgent) => void;
  updateDeployedAgent: (id: string, updates: Partial<DeployedAgent>) => void;
  removeDeployedAgent: (id: string) => void;
  getActiveAgentsCount: () => number;
  getRecentlyDeployedAgents: (days?: number) => DeployedAgent[];
  // S3 methods
  loadAgentsFromS3: () => Promise<void>;
  migrateToS3: () => Promise<void>;
  isLoading: boolean;
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
  const [deployedAgents, setDeployedAgents] = useState<DeployedAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize agents from S3 on component mount
  useEffect(() => {
    loadAgentsFromS3();
  }, []);



  // Helper function to save to localStorage (fallback)
  const saveToLocalStorage = (agents: DeployedAgent[]) => {
    try {
      localStorage.setItem('deployedAgents', JSON.stringify(agents));
    } catch (error) {
      console.error('Error saving deployed agents to localStorage:', error);
    }
  };

  const getActiveAgentsCount = () => {
    return deployedAgents.filter(agent => agent.status === 'active').length;
  };

  const getRecentlyDeployedAgents = (days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return deployedAgents.filter(agent => {
      const deployedDate = new Date(agent.deployedAt);
      return deployedDate >= cutoffDate;
    });
  };

  // S3 Methods
  const loadAgentsFromS3 = async () => {
    setIsLoading(true);
    try {
      const s3Agents = await s3AgentService.getAllAgents();
      const convertedAgents = s3Agents.map(convertS3AgentToDeployedAgent);
      setDeployedAgents(convertedAgents);
      console.log(`✅ Loaded ${convertedAgents.length} agents from S3`);
    } catch (error) {
      console.error('❌ Failed to load agents from S3:', error);
      // Fallback to localStorage if S3 fails
      try {
        const saved = localStorage.getItem('deployedAgents');
        if (saved) {
          const localAgents = JSON.parse(saved);
          setDeployedAgents(localAgents);
          console.log(`⚠️ Loaded ${localAgents.length} agents from localStorage fallback`);
        }
      } catch (localError) {
        console.error('❌ Failed to load from localStorage fallback:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const migrateToS3 = async () => {
    setIsLoading(true);
    try {
      // Get agents from localStorage
      const saved = localStorage.getItem('deployedAgents');
      if (!saved) {
        console.log('No agents to migrate from localStorage');
        return;
      }

      const localAgents = JSON.parse(saved);
      console.log(`🔄 Migrating ${localAgents.length} agents to S3...`);

      // Migrate to S3
      const migratedAgents = await s3AgentService.migrateFromLocalStorage(localAgents);
      
      // Update local state
      const convertedAgents = migratedAgents.map(convertS3AgentToDeployedAgent);
      setDeployedAgents(convertedAgents);

      // Clear localStorage after successful migration
      localStorage.removeItem('deployedAgents');
      
      console.log(`✅ Successfully migrated ${migratedAgents.length} agents to S3`);
    } catch (error) {
      console.error('❌ Failed to migrate agents to S3:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert S3Agent to DeployedAgent
  const convertS3AgentToDeployedAgent = (s3Agent: S3Agent): DeployedAgent => {
    return {
      id: s3Agent.id,
      name: s3Agent.name,
      description: s3Agent.description,
      category: s3Agent.category,
      status: (s3Agent.status as 'deploying' | 'active' | 'inactive' | 'error') || 'active',
      deployedAt: s3Agent.createdAt,
      createdAt: s3Agent.createdAt,
      version: '1.0.0',
      author: 'User',
      tags: [],
      framework: 'Custom',
      executionCount: 0,
      lastExecuted: undefined,
      capabilities: s3Agent.capabilities || [],
      pricing: {
        costPerExecution: 0.10,
        estimatedRuntime: '30s'
      },
      inputSchema: s3Agent.inputSchema,
      outputSchema: s3Agent.outputSchema,
      customProcessingLogic: s3Agent.customProcessingLogic,
      purpose: s3Agent.purpose
    };
  };

  // Update methods to use S3
  const addDeployedAgent = async (agent: DeployedAgent) => {
    try {
      const s3Agent = await s3AgentService.saveAgent({
        name: agent.name,
        description: agent.description,
        category: agent.category,
        status: agent.status,
        purpose: agent.purpose,
        customProcessingLogic: agent.customProcessingLogic,
        inputSchema: agent.inputSchema,
        outputSchema: agent.outputSchema,
        capabilities: agent.capabilities
      });
      
      const convertedAgent = convertS3AgentToDeployedAgent(s3Agent);
      setDeployedAgents(prev => [...prev, convertedAgent]);
      console.log(`✅ Agent saved to S3: ${s3Agent.name}`);
    } catch (error) {
      console.error('❌ Failed to save agent to S3:', error);
      // Fallback to localStorage
      const newAgents = [...deployedAgents, agent];
      setDeployedAgents(newAgents);
      saveToLocalStorage(newAgents);
    }
  };

  const updateDeployedAgent = async (id: string, updates: Partial<DeployedAgent>) => {
    try {
      const updatedS3Agent = await s3AgentService.updateAgent(id, {
        name: updates.name,
        description: updates.description,
        category: updates.category,
        status: updates.status,
        purpose: updates.purpose,
        customProcessingLogic: updates.customProcessingLogic,
        inputSchema: updates.inputSchema,
        outputSchema: updates.outputSchema,
        capabilities: updates.capabilities
      });
      
      const convertedAgent = convertS3AgentToDeployedAgent(updatedS3Agent);
      setDeployedAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...convertedAgent } : agent
      ));
      console.log(`✅ Agent updated in S3: ${id}`);
    } catch (error) {
      console.error('❌ Failed to update agent in S3:', error);
      // Fallback to local update
      const newAgents = deployedAgents.map(agent => 
        agent.id === id ? { ...agent, ...updates } : agent
      );
      setDeployedAgents(newAgents);
      saveToLocalStorage(newAgents);
    }
  };

  const removeDeployedAgent = async (id: string) => {
    try {
      await s3AgentService.deleteAgent(id);
      setDeployedAgents(prev => prev.filter(agent => agent.id !== id));
      console.log(`✅ Agent deleted from S3: ${id}`);
    } catch (error) {
      console.error('❌ Failed to delete agent from S3:', error);
      // Fallback to local removal
      const newAgents = deployedAgents.filter(agent => agent.id !== id);
      setDeployedAgents(newAgents);
      saveToLocalStorage(newAgents);
    }
  };

  // Debug function - expose to window for console debugging
  useEffect(() => {
    (window as any).debugAgents = () => {
      console.log('=== AGENT DEBUG INFO ===');
      console.log('Deployed agents count:', deployedAgents.length);
      console.log('Active agents count:', getActiveAgentsCount());
      console.log('All deployed agents:', deployedAgents);
      console.log('Is loading:', isLoading);
      console.log('========================');
    };
    
    // Expose sample data reset function
    (window as any).resetAgentSampleData = () => {
      const { agentManagementService } = require('../services/agentManagementService');
      agentManagementService.resetSampleData();
      console.log('✅ Sample data reset and regenerated');
      // Refresh the page to see changes
      window.location.reload();
    };

    // Expose function to clear all S3 agents (for removing dummy data)
    (window as any).clearAllS3Agents = async () => {
      if (window.confirm('Are you sure you want to delete ALL agents from S3? This cannot be undone.')) {
        try {
          for (const agent of deployedAgents) {
            await s3AgentService.deleteAgent(agent.id);
          }
          setDeployedAgents([]);
          console.log('✅ All S3 agents cleared');
        } catch (error) {
          console.error('❌ Failed to clear S3 agents:', error);
        }
      }
    };
  }, [deployedAgents, isLoading]);

  const value: AgentContextType = {
    deployedAgents,
    addDeployedAgent,
    updateDeployedAgent,
    removeDeployedAgent,
    getActiveAgentsCount,
    getRecentlyDeployedAgents,
    loadAgentsFromS3,
    migrateToS3,
    isLoading
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};
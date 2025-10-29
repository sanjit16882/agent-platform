import { s3AgentService } from '../services/s3AgentService';

export interface LocalStorageAgent {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status?: string;
  purpose?: string;
  customProcessingLogic?: string;
  inputSchema?: any;
  outputSchema?: any;
  capabilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

class MigrationHelper {
  /**
   * Check if there are agents in localStorage that need migration
   */
  checkForLocalStorageAgents(): LocalStorageAgent[] {
    try {
      const localAgents: LocalStorageAgent[] = [];
      
      // Check various localStorage keys that might contain agents
      const possibleKeys = [
        'agents',
        'customAgents', 
        'savedAgents',
        'agentConfigs',
        'userAgents'
      ];

      possibleKeys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            
            // Handle different storage formats
            if (Array.isArray(parsed)) {
              localAgents.push(...parsed);
            } else if (parsed && typeof parsed === 'object') {
              // Handle object format where agents might be stored as properties
              Object.values(parsed).forEach((agent: any) => {
                if (agent && typeof agent === 'object' && agent.id) {
                  localAgents.push(agent);
                }
              });
            }
          }
        } catch (error) {
          console.warn(`Error parsing localStorage key ${key}:`, error);
        }
      });

      // Remove duplicates based on ID
      const uniqueAgents = localAgents.filter((agent, index, self) => 
        index === self.findIndex(a => a.id === agent.id)
      );

      console.log(`🔍 Found ${uniqueAgents.length} agents in localStorage:`, uniqueAgents);
      return uniqueAgents;
    } catch (error) {
      console.error('Error checking localStorage for agents:', error);
      return [];
    }
  }

  /**
   * Migrate agents from localStorage to S3
   */
  async migrateAgentsToS3(): Promise<{ success: boolean; migrated: number; total: number; errors: string[] }> {
    try {
      const localAgents = this.checkForLocalStorageAgents();
      
      if (localAgents.length === 0) {
        console.log('✅ No agents found in localStorage to migrate');
        return { success: true, migrated: 0, total: 0, errors: [] };
      }

      console.log(`📦 Starting migration of ${localAgents.length} agents to S3...`);

      // Convert to S3 format and add missing fields
      const agentsToMigrate = localAgents.map(agent => ({
        ...agent,
        name: agent.name || 'Unnamed Agent',
        description: agent.description || 'Migrated from localStorage',
        category: agent.category || 'Custom',
        status: agent.status || 'active',
        createdAt: agent.createdAt || new Date().toISOString(),
        updatedAt: agent.updatedAt || new Date().toISOString(),
        capabilities: agent.capabilities || []
      }));

      // Call the migration API
      const result = await s3AgentService.migrateFromLocalStorage(agentsToMigrate);
      
      console.log(`✅ Migration completed: ${result.length}/${localAgents.length} agents migrated`);

      // Clear localStorage after successful migration
      if (result.length > 0) {
        this.clearLocalStorageAgents();
      }

      return {
        success: true,
        migrated: result.length,
        total: localAgents.length,
        errors: []
      };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        migrated: 0,
        total: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Clear agents from localStorage after successful migration
   */
  private clearLocalStorageAgents(): void {
    try {
      const keysToCheck = [
        'agents',
        'customAgents', 
        'savedAgents',
        'agentConfigs',
        'userAgents'
      ];

      keysToCheck.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`🧹 Cleared localStorage key: ${key}`);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Add some sample agents to S3 for demonstration
   */
  async addSampleAgents(): Promise<void> {
    try {
      const sampleAgents = [
        {
          name: 'Code Review Assistant',
          description: 'Analyzes code for best practices, security issues, and performance optimizations',
          category: 'Development',
          status: 'active',
          purpose: 'Automated code review and quality assurance',
          capabilities: ['Static Analysis', 'Security Scanning', 'Performance Review', 'Best Practices'],
          customProcessingLogic: 'Performs comprehensive code analysis including syntax checking, security vulnerability detection, and performance optimization suggestions.'
        },
        {
          name: 'API Documentation Generator',
          description: 'Automatically generates comprehensive API documentation from code',
          category: 'Documentation',
          status: 'active',
          purpose: 'Generate and maintain API documentation',
          capabilities: ['OpenAPI Generation', 'Markdown Export', 'Interactive Docs', 'Version Control'],
          customProcessingLogic: 'Scans API endpoints and generates detailed documentation with examples and schemas.'
        },
        {
          name: 'Database Migration Helper',
          description: 'Assists with database schema migrations and data transformations',
          category: 'Database',
          status: 'active',
          purpose: 'Manage database schema changes and migrations',
          capabilities: ['Schema Analysis', 'Migration Scripts', 'Data Validation', 'Rollback Support'],
          customProcessingLogic: 'Analyzes database schemas and generates safe migration scripts with rollback capabilities.'
        },
        {
          name: 'Performance Monitor',
          description: 'Monitors application performance and identifies bottlenecks',
          category: 'Monitoring',
          status: 'active',
          purpose: 'Real-time performance monitoring and optimization',
          capabilities: ['Performance Metrics', 'Bottleneck Detection', 'Resource Usage', 'Alerting'],
          customProcessingLogic: 'Continuously monitors application performance metrics and provides optimization recommendations.'
        }
      ];

      console.log('📦 Adding sample agents to S3...');
      
      for (const agent of sampleAgents) {
        try {
          await s3AgentService.saveAgent(agent);
          console.log(`✅ Added sample agent: ${agent.name}`);
        } catch (error) {
          console.error(`❌ Failed to add sample agent ${agent.name}:`, error);
        }
      }

      console.log('✅ Sample agents added successfully');
    } catch (error) {
      console.error('❌ Error adding sample agents:', error);
    }
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(): Promise<boolean> {
    try {
      // Check if there are agents in localStorage
      const localAgents = this.checkForLocalStorageAgents();
      
      // Check if there are agents in S3
      const s3Agents = await s3AgentService.getAllAgents();
      
      // Migration is needed if there are local agents but no S3 agents
      return localAgents.length > 0 && s3Agents.length === 0;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }
}

export const migrationHelper = new MigrationHelper();
export default migrationHelper;
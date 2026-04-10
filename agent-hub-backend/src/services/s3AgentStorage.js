const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

class S3AgentStorage {
  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.S3_AGENTS_BUCKET || 'agenthub-agents-storage';
    this.agentsPrefix = 'agents/';
    this.metadataPrefix = 'metadata/';
  }

  /**
   * Initialize S3 bucket (create if doesn't exist)
   */
  async initializeBucket() {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      console.log(`✅ S3 bucket ${this.bucketName} exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`📦 Creating S3 bucket: ${this.bucketName}`);
        const region = process.env.AWS_REGION || 'us-east-1';
        const createBucketParams = { Bucket: this.bucketName };
        
        // Only add LocationConstraint for regions other than us-east-1
        if (region !== 'us-east-1') {
          createBucketParams.CreateBucketConfiguration = {
            LocationConstraint: region
          };
        }
        
        await this.s3.createBucket(createBucketParams).promise();
        console.log(`✅ S3 bucket ${this.bucketName} created successfully`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Save agent to S3
   */
  async saveAgent(agent) {
    try {
      const agentId = agent.id || `custom_${Date.now()}_${uuidv4().substring(0, 8)}`;
      const key = `${this.agentsPrefix}${agentId}.json`;
      
      const agentData = {
        ...agent,
        id: agentId,
        createdAt: agent.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Ensure MCP config is preserved if provided
        mcpConfig: agent.mcpConfig || {
          enabled: false,
          serverIds: [],
          timeout: 30000,
          autoApprove: []
        }
      };

      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(agentData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          agentType: agent.category || 'custom',
          agentName: agent.name || 'unnamed'
        }
      }).promise();

      console.log(`✅ Agent saved to S3: ${agentId}`);
      return agentData;
    } catch (error) {
      console.error('❌ Error saving agent to S3:', error);
      throw error;
    }
  }

  /**
   * Get agent from S3
   */
  async getAgent(agentId) {
    try {
      const key = `${this.agentsPrefix}${agentId}.json`;
      
      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return JSON.parse(result.Body.toString());
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error(`❌ Error getting agent ${agentId} from S3:`, error);
      throw error;
    }
  }

  /**
   * Alias for getAgent (for compatibility)
   */
  async getAgentById(agentId) {
    return this.getAgent(agentId);
  }

  /**
   * List all agents from S3
   */
  async listAgents() {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: this.agentsPrefix
      }).promise();

      const agents = [];
      
      for (const object of result.Contents || []) {
        try {
          const agentData = await this.s3.getObject({
            Bucket: this.bucketName,
            Key: object.Key
          }).promise();
          
          const agent = JSON.parse(agentData.Body.toString());
          agents.push(agent);
        } catch (error) {
          console.error(`❌ Error reading agent ${object.Key}:`, error);
        }
      }

      return agents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('❌ Error listing agents from S3:', error);
      throw error;
    }
  }

  /**
   * Update agent in S3
   */
  async updateAgent(agentId, updates) {
    try {
      const existingAgent = await this.getAgent(agentId);
      if (!existingAgent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const updatedAgent = {
        ...existingAgent,
        ...updates,
        id: agentId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      return await this.saveAgent(updatedAgent);
    } catch (error) {
      console.error(`❌ Error updating agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete agent from S3
   */
  async deleteAgent(agentId) {
    try {
      const key = `${this.agentsPrefix}${agentId}.json`;
      
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      console.log(`✅ Agent deleted from S3: ${agentId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting agent ${agentId} from S3:`, error);
      throw error;
    }
  }

  /**
   * Migrate agents from localStorage format to S3
   */
  async migrateAgentsFromLocalStorage(localStorageAgents) {
    try {
      console.log(`📦 Migrating ${localStorageAgents.length} agents to S3...`);
      
      const migratedAgents = [];
      
      for (const agent of localStorageAgents) {
        try {
          const migratedAgent = await this.saveAgent(agent);
          migratedAgents.push(migratedAgent);
          console.log(`✅ Migrated agent: ${agent.name || agent.id}`);
        } catch (error) {
          console.error(`❌ Failed to migrate agent ${agent.id}:`, error);
        }
      }

      console.log(`✅ Migration complete: ${migratedAgents.length}/${localStorageAgents.length} agents migrated`);
      return migratedAgents;
    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  }

  /**
   * Update MCP configuration for an agent
   */
  async updateAgentMCPConfig(agentId, mcpConfig) {
    try {
      const existingAgent = await this.getAgent(agentId);
      if (!existingAgent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const updatedAgent = {
        ...existingAgent,
        mcpConfig,
        updatedAt: new Date().toISOString()
      };

      await this.saveAgent(updatedAgent);
      console.log(`✅ MCP config updated for agent: ${agentId}`);
      return updatedAgent;
    } catch (error) {
      console.error(`❌ Error updating MCP config for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get agents with MCP enabled
   */
  async getAgentsWithMCP() {
    try {
      const agents = await this.listAgents();
      return agents.filter(agent => agent.mcpConfig && agent.mcpConfig.enabled);
    } catch (error) {
      console.error('❌ Error getting agents with MCP:', error);
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats() {
    try {
      const agents = await this.listAgents();
      
      const stats = {
        total: agents.length,
        byCategory: {},
        byStatus: {},
        recentlyCreated: agents.filter(a => {
          const createdDate = new Date(a.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdDate > weekAgo;
        }).length
      };

      agents.forEach(agent => {
        const category = agent.category || 'unknown';
        const status = agent.status || 'active';
        
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting agent stats:', error);
      throw error;
    }
  }
}

module.exports = S3AgentStorage;
/**
 * Database MCP Server - Internal Database Access
 * 
 * This server provides database access capabilities for agents.
 * It's an internal server that doesn't require external process spawning.
 */

import { EventEmitter } from 'events';
import { MCPTool, MCPToolCall, MCPToolResult } from '../types/mcpTypes';

export class DatabaseMCPServer extends EventEmitter {
  private isInitialized = false;
  private tools: MCPTool[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🗄️ Database MCP Server: Initializing...');
      
      // Define available tools
      this.tools = [
        {
          name: 'execute_query',
          description: 'Execute a SQL query (SELECT only for safety)',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute (SELECT statements only)'
              },
              parameters: {
                type: 'array',
                description: 'Query parameters for prepared statements',
                items: { type: 'string' }
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_schema',
          description: 'Get database schema information',
          inputSchema: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: 'Specific table name (optional)'
              }
            }
          }
        },
        {
          name: 'get_table_info',
          description: 'Get detailed information about a specific table',
          inputSchema: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: 'Name of the table'
              }
            },
            required: ['table_name']
          }
        },
        {
          name: 'validate_query',
          description: 'Validate SQL query syntax without executing',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to validate'
              }
            },
            required: ['query']
          }
        }
      ];

      this.isInitialized = true;
      console.log('✅ Database MCP Server: Initialized with', this.tools.length, 'tools');
      
    } catch (error) {
      console.error('❌ Database MCP Server: Failed to initialize:', error);
      throw error;
    }
  }

  getTools(): MCPTool[] {
    return [...this.tools];
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.isInitialized) {
      throw new Error('Database MCP Server not initialized');
    }

    console.log(`🔧 Database MCP Server: Calling tool ${toolCall.name}`);

    try {
      switch (toolCall.name) {
        case 'execute_query':
          return await this.executeQuery(toolCall.arguments);
        
        case 'get_schema':
          return await this.getSchema(toolCall.arguments);
        
        case 'get_table_info':
          return await this.getTableInfo(toolCall.arguments);
        
        case 'validate_query':
          return await this.validateQuery(toolCall.arguments);
        
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }
    } catch (error) {
      console.error(`❌ Database MCP Server: Tool ${toolCall.name} failed:`, error);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async executeQuery(args: any): Promise<MCPToolResult> {
    const { query, parameters = [] } = args;

    // Validate that it's a SELECT query for safety
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for safety');
    }

    // For now, return mock data since we don't have a real database connection
    // In a real implementation, this would connect to the actual database
    const mockResults = this.getMockQueryResults(query);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          parameters,
          results: mockResults,
          rowCount: mockResults.length,
          executionTime: '15ms'
        }, null, 2)
      }]
    };
  }

  private async getSchema(args: any): Promise<MCPToolResult> {
    const { table_name } = args;

    // Mock schema information
    const mockSchema = {
      database: 'agenthub',
      tables: [
        {
          name: 'agents',
          columns: [
            { name: 'id', type: 'VARCHAR(255)', nullable: false, key: 'PRIMARY' },
            { name: 'name', type: 'VARCHAR(255)', nullable: false },
            { name: 'category', type: 'VARCHAR(100)', nullable: true },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            { name: 'updated_at', type: 'TIMESTAMP', nullable: false }
          ]
        },
        {
          name: 'executions',
          columns: [
            { name: 'id', type: 'VARCHAR(255)', nullable: false, key: 'PRIMARY' },
            { name: 'agent_id', type: 'VARCHAR(255)', nullable: false, key: 'FOREIGN' },
            { name: 'status', type: 'VARCHAR(50)', nullable: false },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            { name: 'duration_ms', type: 'INTEGER', nullable: true }
          ]
        },
        {
          name: 'analytics',
          columns: [
            { name: 'id', type: 'VARCHAR(255)', nullable: false, key: 'PRIMARY' },
            { name: 'metric_name', type: 'VARCHAR(100)', nullable: false },
            { name: 'metric_value', type: 'DECIMAL(10,2)', nullable: false },
            { name: 'recorded_at', type: 'TIMESTAMP', nullable: false }
          ]
        }
      ]
    };

    const result = table_name 
      ? mockSchema.tables.find(t => t.name === table_name)
      : mockSchema;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async getTableInfo(args: any): Promise<MCPToolResult> {
    const { table_name } = args;

    // Mock table information
    const mockTableInfo = {
      agents: {
        name: 'agents',
        rowCount: 42,
        sizeBytes: 8192,
        indexes: ['PRIMARY', 'idx_category', 'idx_created_at'],
        constraints: ['PRIMARY KEY (id)'],
        lastUpdated: new Date().toISOString()
      },
      executions: {
        name: 'executions',
        rowCount: 1337,
        sizeBytes: 32768,
        indexes: ['PRIMARY', 'idx_agent_id', 'idx_status', 'idx_created_at'],
        constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (agent_id) REFERENCES agents(id)'],
        lastUpdated: new Date().toISOString()
      },
      analytics: {
        name: 'analytics',
        rowCount: 5000,
        sizeBytes: 16384,
        indexes: ['PRIMARY', 'idx_metric_name', 'idx_recorded_at'],
        constraints: ['PRIMARY KEY (id)'],
        lastUpdated: new Date().toISOString()
      }
    };

    const tableInfo = mockTableInfo[table_name as keyof typeof mockTableInfo];
    
    if (!tableInfo) {
      throw new Error(`Table '${table_name}' not found`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(tableInfo, null, 2)
      }]
    };
  }

  private async validateQuery(args: any): Promise<MCPToolResult> {
    const { query } = args;

    // Basic SQL validation (simplified)
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      queryType: 'SELECT',
      estimatedComplexity: 'LOW'
    };

    // Check for basic SQL structure
    if (!query.trim()) {
      validation.valid = false;
      validation.errors.push('Query cannot be empty');
    }

    // Check for dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
    const upperQuery = query.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        validation.valid = false;
        validation.errors.push(`Dangerous operation detected: ${keyword}`);
      }
    }

    // Check for SELECT
    if (!upperQuery.trim().startsWith('SELECT')) {
      validation.warnings.push('Only SELECT queries are recommended');
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(validation, null, 2)
      }]
    };
  }

  private getMockQueryResults(query: string): any[] {
    const upperQuery = query.toUpperCase();

    if (upperQuery.includes('AGENTS')) {
      return [
        { id: 'agent_1', name: 'Email Rephraser', category: 'productivity', created_at: '2024-01-15T10:30:00Z' },
        { id: 'agent_2', name: 'Code Generator', category: 'development', created_at: '2024-01-16T14:20:00Z' },
        { id: 'agent_3', name: 'Security Scanner', category: 'security', created_at: '2024-01-17T09:15:00Z' }
      ];
    }

    if (upperQuery.includes('EXECUTIONS')) {
      return [
        { id: 'exec_1', agent_id: 'agent_1', status: 'completed', created_at: '2024-01-18T10:00:00Z', duration_ms: 1500 },
        { id: 'exec_2', agent_id: 'agent_2', status: 'completed', created_at: '2024-01-18T10:05:00Z', duration_ms: 2300 },
        { id: 'exec_3', agent_id: 'agent_1', status: 'failed', created_at: '2024-01-18T10:10:00Z', duration_ms: 800 }
      ];
    }

    if (upperQuery.includes('ANALYTICS')) {
      return [
        { id: 'metric_1', metric_name: 'total_executions', metric_value: 1337, recorded_at: '2024-01-18T12:00:00Z' },
        { id: 'metric_2', metric_name: 'success_rate', metric_value: 94.5, recorded_at: '2024-01-18T12:00:00Z' },
        { id: 'metric_3', metric_name: 'avg_duration_ms', metric_value: 1850, recorded_at: '2024-01-18T12:00:00Z' }
      ];
    }

    // Default mock result
    return [
      { message: 'Mock query result', query_executed: query, timestamp: new Date().toISOString() }
    ];
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Database MCP Server: Shutting down...');
    this.isInitialized = false;
    console.log('✅ Database MCP Server: Shutdown complete');
  }
}
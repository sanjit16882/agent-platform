/**
 * MCP Server Registry - Internal MCP Servers
 * 
 * This registry manages internal MCP servers that provide core functionality
 * like database access, file system operations, etc.
 */

import { EventEmitter } from 'events';
import { MCPServerConfig, MCPServerStatus } from '../types/mcpTypes';
import { DatabaseMCPServer } from './databaseServer';

export interface MCPServerRegistry {
  initialize(): Promise<void>;
  getServer(serverId: string): any;
  getAllServers(): Record<string, any>;
  shutdown(): Promise<void>;
}

export class InternalMCPServerRegistry extends EventEmitter implements MCPServerRegistry {
  private servers: Record<string, any> = {};
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 MCP Server Registry: Initializing internal servers...');

      // Initialize database server (always available)
      const databaseServer = new DatabaseMCPServer();
      await databaseServer.initialize();
      this.servers['database'] = databaseServer;

      this.isInitialized = true;
      console.log('✅ MCP Server Registry: Internal servers initialized');
      
    } catch (error) {
      console.error('❌ MCP Server Registry: Failed to initialize:', error);
      throw error;
    }
  }

  getServer(serverId: string): any {
    return this.servers[serverId];
  }

  getAllServers(): Record<string, any> {
    return { ...this.servers };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 MCP Server Registry: Shutting down internal servers...');
    
    for (const [serverId, server] of Object.entries(this.servers)) {
      try {
        if (server.shutdown) {
          await server.shutdown();
        }
        console.log(`✅ MCP Server Registry: Shutdown ${serverId}`);
      } catch (error) {
        console.error(`❌ MCP Server Registry: Failed to shutdown ${serverId}:`, error);
      }
    }
    
    this.servers = {};
    this.isInitialized = false;
    console.log('✅ MCP Server Registry: Shutdown complete');
  }
}

/**
 * Create MCP server registry instance
 */
export function createMCPServerRegistry(): MCPServerRegistry {
  return new InternalMCPServerRegistry();
}
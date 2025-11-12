/**
 * MCP Module Index - Per-Agent MCP Implementation
 * 
 * New Approach:
 * - Per-agent MCP configuration
 * - User-controlled MCP enablement
 * - Clean separation of MCP and standard execution
 */

// Core MCP services
export { MCPClient, createMCPClient } from './mcpClient';
export { mcpConfigService } from './mcpConfig';

// MCP server registry
export { createMCPServerRegistry } from './servers';

// MCP types
export * from './types/mcpTypes';
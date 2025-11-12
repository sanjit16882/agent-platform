import express from 'express';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const router = express.Router();

/**
 * Docker MCP Server Management Routes
 * These routes manage the Docker-based real MCP servers
 */

// Docker MCP server endpoints
const DOCKER_MCP_SERVERS = {
  filesystem: 'http://localhost:3010',
  database: 'http://localhost:3011',
  git: 'http://localhost:3012',
  office365: 'http://localhost:3013'
};

/**
 * Get real Docker MCP servers
 * GET /api/v1/mcp/servers
 */
router.get('/servers', async (req, res) => {
  try {
    const servers = [
      {
        id: 'filesystem',
        name: 'File System Server',
        description: 'Real file operations - read, write, list, search files',
        category: 'system',
        icon: 'folder',
        url: DOCKER_MCP_SERVERS.filesystem,
        capabilities: ['file-reading', 'file-writing', 'directory-scanning', 'file-search'],
        tools: ['read_file', 'write_file', 'list_directory', 'search_files'],
        useCases: ['Code Analysis', 'File Processing', 'Content Management']
      },
      {
        id: 'database',
        name: 'Database Server',
        description: 'Real SQLite database operations with persistence',
        category: 'data',
        icon: 'database',
        url: DOCKER_MCP_SERVERS.database,
        capabilities: ['data-querying', 'schema-analysis', 'data-persistence'],
        tools: ['execute_query', 'get_schema', 'get_table_info', 'create_table'],
        useCases: ['Data Analysis', 'Report Generation', 'Data Storage']
      },
      {
        id: 'git',
        name: 'Git Server',
        description: 'Real git repository operations and analysis',
        category: 'development',
        icon: 'code-branch',
        url: DOCKER_MCP_SERVERS.git,
        capabilities: ['repository-analysis', 'commit-history', 'diff-analysis'],
        tools: ['log', 'status', 'diff', 'branch', 'show'],
        useCases: ['Code Review', 'Repository Analysis', 'Change Tracking']
      },
      {
        id: 'office365',
        name: 'Office365 Server',
        description: 'Office365 integration (ready for real API)',
        category: 'productivity',
        icon: 'envelope',
        url: DOCKER_MCP_SERVERS.office365,
        capabilities: ['email-access', 'calendar-management', 'document-access'],
        tools: ['get_emails', 'send_email', 'get_calendar', 'get_documents'],
        useCases: ['Email Management', 'Calendar Integration', 'Document Processing']
      }
    ];

    // Check server health and update status
    for (const server of servers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${server.url}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        (server as any).status = response.ok ? 'running' : 'error';
      } catch (error) {
        (server as any).status = 'error';
      }
    }

    res.json({
      success: true,
      data: servers
    });
  } catch (error) {
    console.error('Error getting Docker MCP servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MCP servers'
    });
  }
});

/**
 * Get Docker MCP server status
 * GET /api/v1/mcp/status
 */
router.get('/status', async (req, res) => {
  try {
    const status: Record<string, any> = {};

    for (const [serverId, serverUrl] of Object.entries(DOCKER_MCP_SERVERS)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${serverUrl}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        status[serverId] = {
          status: response.ok ? 'running' : 'error',
          url: serverUrl,
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        status[serverId] = {
          status: 'error',
          url: serverUrl,
          error: error instanceof Error ? error.message : 'Connection failed',
          lastCheck: new Date().toISOString()
        };
      }
    }

    const allRunning = Object.values(status).every((s: any) => s.status === 'running');

    res.json({
      success: true,
      data: {
        overall: allRunning ? 'healthy' : 'degraded',
        servers: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking MCP status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check MCP status'
    });
  }
});

/**
 * Start Docker MCP servers
 * POST /api/v1/mcp/docker/start
 */
router.post('/docker/start', async (req, res) => {
  try {
    console.log('🐳 Starting Docker MCP servers...');
    
    // Execute the start script
    const startProcess = spawn('cmd', ['/c', 'docker-mcp-servers\\start-mcp-servers.bat'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    startProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    startProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    startProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Docker MCP servers started successfully');
        res.json({
          success: true,
          message: 'Docker MCP servers started successfully',
          output
        });
      } else {
        console.error('❌ Failed to start Docker MCP servers:', errorOutput);
        res.status(500).json({
          success: false,
          message: 'Failed to start Docker MCP servers',
          error: errorOutput
        });
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      startProcess.kill();
      res.status(408).json({
        success: false,
        message: 'Timeout starting Docker MCP servers'
      });
    }, 30000);

  } catch (error) {
    console.error('Error starting Docker MCP servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start Docker MCP servers'
    });
  }
});

/**
 * Check Docker MCP server health
 * GET /api/v1/mcp/docker/health
 */
router.get('/docker/health', async (req, res) => {
  try {
    const healthChecks: Record<string, any> = {};

    for (const [serverId, serverUrl] of Object.entries(DOCKER_MCP_SERVERS)) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${serverUrl}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const healthData = await response.json();
          healthChecks[serverId] = {
            status: 'healthy',
            responseTime,
            url: serverUrl,
            details: healthData
          };
        } else {
          healthChecks[serverId] = {
            status: 'unhealthy',
            responseTime,
            url: serverUrl,
            error: `HTTP ${response.status}`
          };
        }
      } catch (error) {
        healthChecks[serverId] = {
          status: 'unreachable',
          url: serverUrl,
          error: error instanceof Error ? error.message : 'Connection failed'
        };
      }
    }

    const healthyCount = Object.values(healthChecks).filter((h: any) => h.status === 'healthy').length;
    const totalCount = Object.keys(healthChecks).length;

    res.json({
      success: true,
      data: {
        overall: healthyCount === totalCount ? 'healthy' : healthyCount > 0 ? 'degraded' : 'unhealthy',
        healthy: healthyCount,
        total: totalCount,
        servers: healthChecks,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking Docker MCP health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Docker MCP health'
    });
  }
});

/**
 * Call MCP tool via proxy
 * POST /api/v1/mcp/tools/call
 */
router.post('/tools/call', async (req, res) => {
  try {
    const { serverId, toolName, args } = req.body;

    if (!serverId || !toolName) {
      return res.status(400).json({
        success: false,
        error: 'serverId and toolName are required'
      });
    }

    const serverUrl = DOCKER_MCP_SERVERS[serverId as keyof typeof DOCKER_MCP_SERVERS];
    if (!serverUrl) {
      return res.status(400).json({
        success: false,
        error: `Unknown MCP server: ${serverId}`
      });
    }

    // Proxy the MCP call to the Docker server
    const response = await fetch(`${serverUrl}/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args || {}
        }
      })
    });

    if (!response.ok) {
      throw new Error(`MCP server responded with ${response.status}`);
    }

    const result = await response.json();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calling MCP tool:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'MCP tool call failed'
    });
  }
});

export default router;
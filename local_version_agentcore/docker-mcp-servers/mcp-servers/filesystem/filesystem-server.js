// Real MCP File System Server
// Implements actual MCP protocol for file operations

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');

const app = express();
const PORT = process.env.PORT || 3000;
const FILESYSTEM_ROOT = process.env.FILESYSTEM_ROOT || '/workspace';

app.use(cors());
app.use(express.json());

// MCP Protocol Implementation
let messageId = 0;

// MCP Tools Definition
const TOOLS = [
  {
    name: 'read_file',
    description: 'Read contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to write' },
        content: { type: 'string', description: 'Content to write to the file' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List contents of a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the directory to list' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for files by name pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'File name pattern to search for' },
        directory: { type: 'string', description: 'Directory to search in (optional)' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'get_file_info',
    description: 'Get information about a file or directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to get information about' }
      },
      required: ['path']
    }
  }
];

// Utility function to resolve and validate paths
function resolvePath(inputPath) {
  const resolved = path.resolve(FILESYSTEM_ROOT, inputPath);
  
  // Security check: ensure path is within FILESYSTEM_ROOT
  if (!resolved.startsWith(path.resolve(FILESYSTEM_ROOT))) {
    throw new Error('Access denied: Path outside allowed directory');
  }
  
  return resolved;
}

// MCP Protocol Endpoints

// Initialize
app.post('/mcp/initialize', (req, res) => {
  console.log('🔌 MCP Filesystem Server: Initialize request received');
  
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      serverInfo: {
        name: 'AgentHub-Filesystem-Server',
        version: '1.0.0'
      }
    }
  });
});

// List Tools
app.post('/mcp/tools/list', (req, res) => {
  console.log('🔧 MCP Filesystem Server: Tools list requested');
  
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    result: {
      tools: TOOLS
    }
  });
});

// Call Tool
app.post('/mcp/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body.params;
  
  console.log(`🛠️ MCP Filesystem Server: Tool ${name} called with args:`, args);
  
  try {
    let result;
    
    switch (name) {
      case 'read_file':
        result = await readFile(args.path);
        break;
        
      case 'write_file':
        result = await writeFile(args.path, args.content);
        break;
        
      case 'list_directory':
        result = await listDirectory(args.path);
        break;
        
      case 'search_files':
        result = await searchFiles(args.pattern, args.directory);
        break;
        
      case 'get_file_info':
        result = await getFileInfo(args.path);
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    });
    
  } catch (error) {
    console.error(`❌ MCP Filesystem Server: Tool ${name} failed:`, error);
    
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: error.message,
        data: { tool: name, args }
      }
    });
  }
});

// Tool Implementations

async function readFile(filePath) {
  const resolvedPath = resolvePath(filePath);
  
  if (!await fs.pathExists(resolvedPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const stats = await fs.stat(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }
  
  const content = await fs.readFile(resolvedPath, 'utf8');
  const mimeType = mime.lookup(resolvedPath) || 'text/plain';
  
  return {
    path: filePath,
    content,
    size: stats.size,
    mimeType,
    lastModified: stats.mtime.toISOString()
  };
}

async function writeFile(filePath, content) {
  const resolvedPath = resolvePath(filePath);
  
  // Ensure directory exists
  await fs.ensureDir(path.dirname(resolvedPath));
  
  await fs.writeFile(resolvedPath, content, 'utf8');
  const stats = await fs.stat(resolvedPath);
  
  return {
    path: filePath,
    size: stats.size,
    written: true,
    lastModified: stats.mtime.toISOString()
  };
}

async function listDirectory(dirPath) {
  const resolvedPath = resolvePath(dirPath || '.');
  
  if (!await fs.pathExists(resolvedPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  const stats = await fs.stat(resolvedPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }
  
  const entries = await fs.readdir(resolvedPath);
  const items = [];
  
  for (const entry of entries) {
    const entryPath = path.join(resolvedPath, entry);
    const entryStats = await fs.stat(entryPath);
    
    items.push({
      name: entry,
      path: path.relative(FILESYSTEM_ROOT, entryPath),
      type: entryStats.isDirectory() ? 'directory' : 'file',
      size: entryStats.size,
      lastModified: entryStats.mtime.toISOString(),
      mimeType: entryStats.isFile() ? mime.lookup(entryPath) || 'application/octet-stream' : null
    });
  }
  
  return {
    directory: dirPath || '.',
    items: items.sort((a, b) => {
      // Directories first, then files, both alphabetically
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
  };
}

async function searchFiles(pattern, directory = '.') {
  const resolvedDir = resolvePath(directory);
  
  if (!await fs.pathExists(resolvedDir)) {
    throw new Error(`Directory not found: ${directory}`);
  }
  
  const results = [];
  const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
  
  async function searchRecursive(currentDir) {
    const entries = await fs.readdir(currentDir);
    
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry);
      const stats = await fs.stat(entryPath);
      
      if (stats.isFile() && regex.test(entry)) {
        results.push({
          name: entry,
          path: path.relative(FILESYSTEM_ROOT, entryPath),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          mimeType: mime.lookup(entryPath) || 'application/octet-stream'
        });
      } else if (stats.isDirectory() && !entry.startsWith('.')) {
        await searchRecursive(entryPath);
      }
    }
  }
  
  await searchRecursive(resolvedDir);
  
  return {
    pattern,
    directory,
    matches: results.sort((a, b) => a.path.localeCompare(b.path))
  };
}

async function getFileInfo(filePath) {
  const resolvedPath = resolvePath(filePath);
  
  if (!await fs.pathExists(resolvedPath)) {
    throw new Error(`Path not found: ${filePath}`);
  }
  
  const stats = await fs.stat(resolvedPath);
  
  return {
    path: filePath,
    type: stats.isDirectory() ? 'directory' : 'file',
    size: stats.size,
    created: stats.birthtime.toISOString(),
    lastModified: stats.mtime.toISOString(),
    lastAccessed: stats.atime.toISOString(),
    permissions: stats.mode.toString(8),
    mimeType: stats.isFile() ? mime.lookup(resolvedPath) || 'application/octet-stream' : null
  };
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'MCP Filesystem Server',
    version: '1.0.0',
    filesystemRoot: FILESYSTEM_ROOT,
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🗂️ MCP Filesystem Server running on port ${PORT}`);
  console.log(`📁 Filesystem root: ${FILESYSTEM_ROOT}`);
  console.log(`🔧 Available tools: ${TOOLS.map(t => t.name).join(', ')}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
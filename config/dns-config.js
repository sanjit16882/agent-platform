// DNS Configuration for Local AgentHub Platform
const config = {
  // Local development with custom DNS
  local: {
    domain: 'agenthub.local',
    ui: {
      protocol: 'http',
      host: 'agenthub.local',
      port: 3001,
      url: 'http://agenthub.local:3001'
    },
    api: {
      protocol: 'http',
      host: 'api.agenthub.local',
      port: 3002,
      url: 'http://api.agenthub.local:3002'
    },
    services: {
      dashboard: 'http://dashboard.agenthub.local:3001',
      finops: 'http://finops.agenthub.local:3001',
      mcp: 'http://mcp.agenthub.local:3002',
      analytics: 'http://analytics.agenthub.local:3001'
    }
  },

  // Hybrid: Local services with AWS integrations
  hybrid: {
    domain: 'agenthub.local',
    ui: {
      protocol: 'http',
      host: 'agenthub.local',
      port: 3001,
      url: 'http://agenthub.local:3001'
    },
    api: {
      protocol: 'http',
      host: 'api.agenthub.local',
      port: 3002,
      url: 'http://api.agenthub.local:3002'
    },
    aws: {
      // Use real AWS services for specific features
      costExplorer: true,
      bedrock: true,
      s3: true,
      cloudWatch: true,
      // Keep local for development
      dynamodb: false,
      lambda: false
    }
  },

  // Production AWS
  production: {
    domain: 'agenthub.com',
    ui: {
      protocol: 'https',
      host: 'app.agenthub.com',
      port: 443,
      url: 'https://app.agenthub.com'
    },
    api: {
      protocol: 'https',
      host: 'api.agenthub.com',
      port: 443,
      url: 'https://api.agenthub.com'
    }
  }
};

// Get current environment configuration
function getConfig() {
  const env = process.env.NODE_ENV || 'local';
  const mode = process.env.AGENTHUB_MODE || 'local'; // local, hybrid, production
  
  return config[mode] || config.local;
}

// Generate URLs for different services
function getServiceUrls() {
  const cfg = getConfig();
  
  return {
    ui: cfg.ui.url,
    api: cfg.api.url,
    dashboard: cfg.services?.dashboard || cfg.ui.url,
    finops: cfg.services?.finops || `${cfg.ui.url}/finops`,
    mcp: cfg.services?.mcp || `${cfg.api.url}/mcp`,
    analytics: cfg.services?.analytics || `${cfg.ui.url}/analytics`
  };
}

module.exports = {
  config,
  getConfig,
  getServiceUrls
};
// AWS Configuration for Frontend
export const awsConfig = {
  // These will be populated by CDK outputs during deployment
  API: {
    endpoints: [
      {
        name: 'AgentHubAPI',
        endpoint: process.env.REACT_APP_API_GATEWAY_URL || 'https://6gwwzzxu4d.execute-api.us-east-1.amazonaws.com/prod',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
      }
    ]
  },
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_xxxxxxxxx',
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH'
  },
  Storage: {
    AWSS3: {
      bucket: process.env.REACT_APP_S3_BUCKET || 'agent-hub-assets-bucket',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
    }
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  AGENTS: '/api/v1/agents',
  INTELLIGENCE: '/api/v1/intelligence/analyze-query-dynamic',
  EXECUTIONS: '/api/v1/executions',
  MCP_STATUS: '/api/v1/mcp/status',
  MCP_EXECUTE: '/api/v1/mcp/execute'
};

// Environment-specific configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiBaseUrl: process.env.REACT_APP_API_GATEWAY_URL,
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
};
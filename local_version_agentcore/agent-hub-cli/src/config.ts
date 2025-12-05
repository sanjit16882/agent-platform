import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  apiUrl: string;
  apiKey: string;
  defaultAgent?: string;
}

function loadConfig(): Config {
  // Try to load from config file
  const configPath = path.join(os.homedir(), '.agent-hub', 'config.json');
  
  let fileConfig: Partial<Config> = {};
  if (fs.existsSync(configPath)) {
    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configData);
    } catch (error) {
      console.warn('Warning: Could not parse config file');
    }
  }

  // Environment variables take precedence
  return {
    apiUrl: process.env.AGENT_HUB_API_URL || fileConfig.apiUrl || 'http://localhost:4002',
    apiKey: process.env.AGENT_HUB_API_KEY || fileConfig.apiKey || '',
    defaultAgent: process.env.AGENT_HUB_DEFAULT_AGENT || fileConfig.defaultAgent
  };
}

export const config = loadConfig();

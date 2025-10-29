import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { AgentConfig } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.agenthub');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: AgentConfig = {
  apiUrl: process.env.AGENTHUB_API_URL || 'http://localhost:3002',
  timeout: 30000
};

export class ConfigManager {
  private config: AgentConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AgentConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readJsonSync(CONFIG_FILE);
        return { ...DEFAULT_CONFIG, ...configData };
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults');
    }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
    
    try {
      fs.ensureDirSync(CONFIG_DIR);
      fs.writeJsonSync(CONFIG_FILE, this.config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  public setApiKey(apiKey: string): void {
    this.saveConfig({ apiKey });
  }

  public setApiUrl(apiUrl: string): void {
    this.saveConfig({ apiUrl });
  }

  public setDefaultAgent(agentId: string): void {
    this.saveConfig({ defaultAgent: agentId });
  }
}

export const configManager = new ConfigManager();
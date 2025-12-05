/**
 * Vector DB Configuration Service
 * 
 * Manages user Vector DB configurations with persistence
 */

import fs from 'fs/promises';
import path from 'path';

interface VectorDBConfig {
  providerId: string;
  providerName: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

interface ConfigStore {
  configs: Record<string, VectorDBConfig>;
}

export class VectorDBConfigService {
  private configPath: string;
  private configs: Map<string, VectorDBConfig>;

  constructor(configDir: string = './data') {
    this.configPath = path.join(configDir, 'vectordb-configs.json');
    this.configs = new Map();
  }

  /**
   * Initialize the service and load existing configurations
   */
  async initialize(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });

      // Load existing configurations
      await this.loadConfigs();
      
      console.log(`✅ VectorDB Config Service initialized with ${this.configs.size} configurations`);
    } catch (error) {
      console.error('❌ Failed to initialize VectorDB Config Service:', error);
      throw error;
    }
  }

  /**
   * Load configurations from disk
   */
  private async loadConfigs(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const store: ConfigStore = JSON.parse(data);
      
      this.configs.clear();
      Object.entries(store.configs).forEach(([id, config]) => {
        this.configs.set(id, config);
      });
      
      console.log(`📂 Loaded ${this.configs.size} Vector DB configurations`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, start with empty configs
        console.log('📂 No existing Vector DB configurations found, starting fresh');
      } else {
        console.error('❌ Error loading Vector DB configurations:', error);
        throw error;
      }
    }
  }

  /**
   * Save configurations to disk
   */
  private async saveConfigs(): Promise<void> {
    try {
      const store: ConfigStore = {
        configs: Object.fromEntries(this.configs)
      };
      
      await fs.writeFile(
        this.configPath,
        JSON.stringify(store, null, 2),
        'utf-8'
      );
      
      console.log(`💾 Saved ${this.configs.size} Vector DB configurations`);
    } catch (error) {
      console.error('❌ Error saving Vector DB configurations:', error);
      throw error;
    }
  }

  /**
   * Save or update a Vector DB configuration
   */
  async saveConfig(
    providerId: string,
    providerName: string,
    config: Record<string, any>,
    userId?: string
  ): Promise<VectorDBConfig> {
    const now = new Date().toISOString();
    const existingConfig = this.configs.get(providerId);

    const vectorDBConfig: VectorDBConfig = {
      providerId,
      providerName,
      config,
      createdAt: existingConfig?.createdAt || now,
      updatedAt: now,
      userId
    };

    this.configs.set(providerId, vectorDBConfig);
    await this.saveConfigs();

    console.log(`✅ Saved configuration for ${providerName} (${providerId})`);
    return vectorDBConfig;
  }

  /**
   * Get a specific configuration
   */
  getConfig(providerId: string): VectorDBConfig | undefined {
    return this.configs.get(providerId);
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): VectorDBConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(providerId: string): Promise<boolean> {
    const existed = this.configs.delete(providerId);
    
    if (existed) {
      await this.saveConfigs();
      console.log(`🗑️  Deleted configuration for ${providerId}`);
    }
    
    return existed;
  }

  /**
   * Check if a provider is configured
   */
  isConfigured(providerId: string): boolean {
    return this.configs.has(providerId);
  }

  /**
   * Get configured provider IDs
   */
  getConfiguredProviderIds(): string[] {
    return Array.from(this.configs.keys());
  }
}

// Singleton instance
export const vectorDBConfigService = new VectorDBConfigService();

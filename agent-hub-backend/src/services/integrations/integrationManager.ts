/**
 * Integration Manager
 * 
 * Manages all integrations and provides a unified interface
 */

import { BaseIntegration, IntegrationConfig } from './baseIntegration';
import { ConfluenceIntegration } from './confluenceIntegration';

export class IntegrationManager {
  private integrations: Map<string, BaseIntegration> = new Map();
  private configs: Map<string, IntegrationConfig> = new Map();
  
  /**
   * Register an integration
   */
  registerIntegration(config: IntegrationConfig): BaseIntegration {
    let integration: BaseIntegration;
    
    switch (config.type) {
      case 'confluence':
        integration = new ConfluenceIntegration(config);
        break;
      
      // Add more integrations here:
      // case 'sharepoint':
      //   integration = new SharePointIntegration(config);
      //   break;
      // case 'google-drive':
      //   integration = new GoogleDriveIntegration(config);
      //   break;
      
      default:
        throw new Error(`Unknown integration type: ${config.type}`);
    }
    
    this.integrations.set(config.id, integration);
    this.configs.set(config.id, config);
    
    console.log(`✅ Registered integration: ${config.name} (${config.type})`);
    
    return integration;
  }
  
  /**
   * Get integration by ID
   */
  getIntegration(id: string): BaseIntegration | undefined {
    return this.integrations.get(id);
  }
  
  /**
   * Get all integrations
   */
  getAllIntegrations(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }
  
  /**
   * Get integration config
   */
  getConfig(id: string): IntegrationConfig | undefined {
    return this.configs.get(id);
  }
  
  /**
   * Update integration config
   */
  updateConfig(id: string, updates: Partial<IntegrationConfig>): void {
    const config = this.configs.get(id);
    if (config) {
      Object.assign(config, updates);
      this.configs.set(id, config);
    }
  }
  
  /**
   * Remove integration
   */
  removeIntegration(id: string): boolean {
    this.integrations.delete(id);
    return this.configs.delete(id);
  }
  
  /**
   * Test integration connection
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const integration = this.integrations.get(id);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }
    
    return await integration.testConnection();
  }
  
  /**
   * Sync integration
   */
  async syncIntegration(id: string) {
    const integration = this.integrations.get(id);
    if (!integration) {
      throw new Error('Integration not found');
    }
    
    return await integration.sync();
  }
  
  /**
   * Sync all enabled integrations
   */
  async syncAll() {
    const results = [];
    
    for (const [id, integration] of this.integrations.entries()) {
      const config = this.configs.get(id);
      if (config?.enabled) {
        console.log(`🔄 Syncing ${config.name}...`);
        const result = await integration.sync();
        results.push({ id, name: config.name, result });
      }
    }
    
    return results;
  }
  
  /**
   * Get integration statistics
   */
  getStatistics() {
    const stats = {
      total: this.integrations.size,
      enabled: 0,
      disabled: 0,
      byType: {} as Record<string, number>,
      totalDocuments: 0
    };
    
    for (const config of this.configs.values()) {
      if (config.enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }
      
      stats.byType[config.type] = (stats.byType[config.type] || 0) + 1;
      stats.totalDocuments += config.documentsImported || 0;
    }
    
    return stats;
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();

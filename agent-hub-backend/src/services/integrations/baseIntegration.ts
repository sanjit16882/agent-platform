/**
 * Base Integration Class
 * 
 * Abstract class that all integrations extend
 * Provides common functionality and interface
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
  schedule?: string; // Cron expression
  lastSync?: string;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress';
  lastSyncError?: string;
  documentsImported?: number;
}

export interface SyncResult {
  success: boolean;
  documentsProcessed: number;
  documentsImported: number;
  documentsFailed: number;
  errors: string[];
  duration: number;
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig;
  
  constructor(config: IntegrationConfig) {
    this.config = config;
  }
  
  /**
   * Test connection to the integration
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>;
  
  /**
   * Sync documents from the integration
   */
  abstract sync(): Promise<SyncResult>;
  
  /**
   * Get integration metadata
   */
  getMetadata() {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      enabled: this.config.enabled,
      lastSync: this.config.lastSync,
      lastSyncStatus: this.config.lastSyncStatus,
      documentsImported: this.config.documentsImported || 0
    };
  }
  
  /**
   * Update last sync status
   */
  protected updateSyncStatus(status: 'success' | 'failed' | 'in_progress', error?: string) {
    this.config.lastSync = new Date().toISOString();
    this.config.lastSyncStatus = status;
    if (error) {
      this.config.lastSyncError = error;
    }
  }
}

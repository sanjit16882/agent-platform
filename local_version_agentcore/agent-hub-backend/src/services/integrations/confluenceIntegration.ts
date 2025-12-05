/**
 * Confluence Integration
 * 
 * Syncs pages from Confluence spaces to Vector DB
 */

import axios from 'axios';
import { BaseIntegration, IntegrationConfig, SyncResult } from './baseIntegration';
import { documentIngestionService } from '../documentIngestionService';

interface ConfluenceConfig extends IntegrationConfig {
  config: {
    baseUrl: string;        // https://yourcompany.atlassian.net
    username: string;       // email@company.com
    apiToken: string;       // API token
    spaceKeys: string[];    // ['DOCS', 'KB']
    providerId: string;     // Vector DB provider
  };
}

export class ConfluenceIntegration extends BaseIntegration {
  private confluenceConfig: ConfluenceConfig;
  
  constructor(config: ConfluenceConfig) {
    super(config);
    this.confluenceConfig = config;
  }
  
  /**
   * Test connection to Confluence
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(
        `${this.confluenceConfig.config.baseUrl}/wiki/rest/api/space`,
        {
          auth: {
            username: this.confluenceConfig.config.username,
            password: this.confluenceConfig.config.apiToken
          },
          params: { limit: 1 }
        }
      );
      
      if (response.status === 200) {
        return {
          success: true,
          message: `Connected successfully. Found ${response.data.size} spaces.`
        };
      }
      
      return {
        success: false,
        message: 'Failed to connect to Confluence'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }
  
  /**
   * Sync all pages from configured spaces
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      documentsProcessed: 0,
      documentsImported: 0,
      documentsFailed: 0,
      errors: [],
      duration: 0
    };
    
    this.updateSyncStatus('in_progress');
    
    try {
      console.log('📚 Starting Confluence sync...');
      
      for (const spaceKey of this.confluenceConfig.config.spaceKeys) {
        console.log(`   Syncing space: ${spaceKey}`);
        
        try {
          const pages = await this.getAllPages(spaceKey);
          console.log(`   Found ${pages.length} pages in ${spaceKey}`);
          
          for (const page of pages) {
            result.documentsProcessed++;
            
            try {
              await this.processPage(page);
              result.documentsImported++;
              console.log(`   ✅ Imported: ${page.title}`);
            } catch (error: any) {
              result.documentsFailed++;
              result.errors.push(`Failed to import ${page.title}: ${error.message}`);
              console.error(`   ❌ Failed: ${page.title}`, error.message);
            }
          }
        } catch (error: any) {
          result.errors.push(`Failed to sync space ${spaceKey}: ${error.message}`);
          console.error(`   ❌ Failed to sync space ${spaceKey}:`, error.message);
        }
      }
      
      result.duration = Date.now() - startTime;
      
      if (result.documentsFailed === 0) {
        this.updateSyncStatus('success');
        console.log(`✅ Confluence sync complete: ${result.documentsImported} documents imported`);
      } else {
        this.updateSyncStatus('success', `${result.documentsFailed} documents failed`);
        console.log(`⚠️ Confluence sync complete with errors: ${result.documentsImported} imported, ${result.documentsFailed} failed`);
      }
      
      this.config.documentsImported = (this.config.documentsImported || 0) + result.documentsImported;
      
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
      this.updateSyncStatus('failed', error.message);
      console.error('❌ Confluence sync failed:', error.message);
    }
    
    return result;
  }
  
  /**
   * Get all pages from a space
   */
  private async getAllPages(spaceKey: string): Promise<any[]> {
    const pages = [];
    let start = 0;
    const limit = 100;
    
    while (true) {
      try {
        const response = await axios.get(
          `${this.confluenceConfig.config.baseUrl}/wiki/rest/api/content`,
          {
            auth: {
              username: this.confluenceConfig.config.username,
              password: this.confluenceConfig.config.apiToken
            },
            params: {
              spaceKey,
              type: 'page',
              status: 'current',
              expand: 'body.storage,version,space',
              start,
              limit
            }
          }
        );
        
        pages.push(...response.data.results);
        
        if (response.data.results.length < limit) break;
        start += limit;
      } catch (error: any) {
        console.error(`Error fetching pages from ${spaceKey}:`, error.message);
        break;
      }
    }
    
    return pages;
  }
  
  /**
   * Process a single page
   */
  private async processPage(page: any): Promise<void> {
    // Extract text content from HTML
    const content = this.extractContent(page.body.storage.value);
    
    // Import to Vector DB
    await documentIngestionService.ingestText({
      title: page.title,
      content,
      providerId: this.confluenceConfig.config.providerId,
      category: 'confluence',
      metadata: {
        source: 'confluence',
        integration: this.config.id,
        spaceKey: page.space.key,
        spaceName: page.space.name,
        pageId: page.id,
        url: `${this.confluenceConfig.config.baseUrl}/wiki${page._links.webui}`,
        lastModified: page.version.when,
        author: page.version.by.displayName,
        version: page.version.number
      },
      uploadedBy: 'confluence-integration'
    });
  }
  
  /**
   * Extract text from Confluence HTML
   */
  private extractContent(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
}

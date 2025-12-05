import { EventEmitter } from 'events';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'connector' | 'webhook' | 'vector-store' | 'tool' | 'middleware';
  capabilities: string[];
  endpoints?: PluginEndpoint[];
  configuration?: PluginConfigSchema;
  dependencies?: string[];
}

export interface PluginEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: any;
  response?: any;
}

export interface PluginConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default?: any;
    validation?: any;
  };
}

export interface RegisteredPlugin {
  manifest: PluginManifest;
  instance: any;
  status: 'active' | 'inactive' | 'error';
  registeredAt: Date;
  lastUsed?: Date;
  errorMessage?: string;
}

export interface APIConnector {
  id: string;
  name: string;
  baseUrl: string;
  authentication: {
    type: 'none' | 'api-key' | 'oauth' | 'basic';
    config: any;
  };
  endpoints: Record<string, {
    method: string;
    path: string;
    description: string;
  }>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface VectorStore {
  id: string;
  name: string;
  type: 'pinecone' | 'weaviate' | 'chroma' | 'custom';
  config: any;
  dimensions: number;
  indexName: string;
}

export class IntegrationHub extends EventEmitter {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private connectors: Map<string, APIConnector> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private vectorStores: Map<string, VectorStore> = new Map();

  // Plugin Management
  async registerPlugin(manifest: PluginManifest, pluginInstance: any): Promise<void> {
    try {
      // Validate plugin
      this.validatePlugin(manifest, pluginInstance);

      // Initialize plugin if it has an init method
      if (typeof pluginInstance.init === 'function') {
        await pluginInstance.init();
      }

      const registeredPlugin: RegisteredPlugin = {
        manifest,
        instance: pluginInstance,
        status: 'active',
        registeredAt: new Date()
      };

      this.plugins.set(manifest.id, registeredPlugin);
      this.emit('plugin:registered', manifest.id);

      console.log(`Plugin registered: ${manifest.name} v${manifest.version}`);
    } catch (error: any) {
      console.error(`Failed to register plugin ${manifest.id}:`, error.message);
      throw error;
    }
  }

  private validatePlugin(manifest: PluginManifest, instance: any): void {
    // Required fields
    const required: (keyof PluginManifest)[] = ['id', 'name', 'version', 'type'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Plugin manifest missing required field: ${field}`);
      }
    }

    // Type-specific validation
    switch (manifest.type) {
      case 'connector':
        if (!instance.connect || typeof instance.connect !== 'function') {
          throw new Error('Connector plugins must implement connect() method');
        }
        break;
      case 'webhook':
        if (!instance.handleWebhook || typeof instance.handleWebhook !== 'function') {
          throw new Error('Webhook plugins must implement handleWebhook() method');
        }
        break;
      case 'vector-store':
        if (!instance.search || !instance.upsert) {
          throw new Error('Vector store plugins must implement search() and upsert() methods');
        }
        break;
    }
  }

  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      // Cleanup if plugin has cleanup method
      if (typeof plugin.instance.cleanup === 'function') {
        plugin.instance.cleanup();
      }

      this.plugins.delete(pluginId);
      this.emit('plugin:unregistered', pluginId);
      console.log(`Plugin unregistered: ${pluginId}`);
    }
  }

  getPlugin(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  listPlugins(type?: string): RegisteredPlugin[] {
    const plugins = Array.from(this.plugins.values());
    return type ? plugins.filter(p => p.manifest.type === type) : plugins;
  }

  // API Connector Management
  registerConnector(connector: APIConnector): void {
    this.connectors.set(connector.id, connector);
    this.emit('connector:registered', connector.id);
  }

  async executeConnector(
    connectorId: string, 
    endpoint: string, 
    params: any = {}
  ): Promise<any> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    const endpointConfig = connector.endpoints[endpoint];
    if (!endpointConfig) {
      throw new Error(`Endpoint ${endpoint} not found in connector ${connectorId}`);
    }

    // Find connector plugin
    const connectorPlugin = this.listPlugins('connector')
      .find(p => p.manifest.id === connectorId);

    if (!connectorPlugin) {
      throw new Error(`Connector plugin ${connectorId} not registered`);
    }

    // Execute through plugin
    return await connectorPlugin.instance.execute(endpoint, params);
  }

  // Webhook Management
  registerWebhook(webhook: WebhookConfig): void {
    this.webhooks.set(webhook.id, webhook);
    this.emit('webhook:registered', webhook.id);
  }

  async triggerWebhook(webhookId: string, event: string, data: any): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || !webhook.active) {
      return;
    }

    if (!webhook.events.includes(event)) {
      return;
    }

    // Find webhook plugin or use built-in HTTP webhook
    const webhookPlugin = this.listPlugins('webhook')
      .find(p => p.manifest.id === webhookId);

    if (webhookPlugin) {
      await webhookPlugin.instance.handleWebhook(event, data);
    } else {
      // Built-in HTTP webhook
      await this.sendHttpWebhook(webhook, event, data);
    }
  }

  private async sendHttpWebhook(webhook: WebhookConfig, event: string, data: any): Promise<void> {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id
    };

    // Add signature if secret is provided
    let headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'AgentHub-Webhook/1.0'
    };

    if (webhook.secret) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-AgentHub-Signature'] = `sha256=${signature}`;
    }

    // Send with retry logic
    let retries = 0;
    while (retries <= webhook.retryPolicy.maxRetries) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          this.emit('webhook:success', webhook.id, event);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        retries++;
        if (retries > webhook.retryPolicy.maxRetries) {
          this.emit('webhook:failed', webhook.id, event, error.message);
          throw error;
        }
        
        // Exponential backoff
        const delay = webhook.retryPolicy.backoffMs * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Vector Store Management
  registerVectorStore(vectorStore: VectorStore): void {
    this.vectorStores.set(vectorStore.id, vectorStore);
    this.emit('vector-store:registered', vectorStore.id);
  }

  async searchVectorStore(
    storeId: string, 
    query: number[], 
    options: { topK?: number; filter?: any } = {}
  ): Promise<any[]> {
    const store = this.vectorStores.get(storeId);
    if (!store) {
      throw new Error(`Vector store ${storeId} not found`);
    }

    // Find vector store plugin
    const storePlugin = this.listPlugins('vector-store')
      .find(p => p.manifest.id === storeId);

    if (!storePlugin) {
      throw new Error(`Vector store plugin ${storeId} not registered`);
    }

    return await storePlugin.instance.search(query, options);
  }

  async upsertVectorStore(
    storeId: string, 
    vectors: Array<{ id: string; values: number[]; metadata?: any }>
  ): Promise<void> {
    const store = this.vectorStores.get(storeId);
    if (!store) {
      throw new Error(`Vector store ${storeId} not found`);
    }

    const storePlugin = this.listPlugins('vector-store')
      .find(p => p.manifest.id === storeId);

    if (!storePlugin) {
      throw new Error(`Vector store plugin ${storeId} not registered`);
    }

    await storePlugin.instance.upsert(vectors);
  }

  // SDK Generation Support
  generateSDKConfig(): {
    endpoints: any[];
    authentication: any;
    baseUrl: string;
  } {
    const endpoints: any[] = [];

    // Add core API endpoints
    endpoints.push(
      { method: 'GET', path: '/api/agents', description: 'List all agents' },
      { method: 'GET', path: '/api/agents/{id}', description: 'Get agent details' },
      { method: 'POST', path: '/api/agents/{id}/execute', description: 'Execute agent' },
      { method: 'POST', path: '/api/agents/{id}/test', description: 'Test agent' },
      { method: 'GET', path: '/api/agents/{id}/versions', description: 'Get agent versions' },
      { method: 'POST', path: '/api/agents/{id}/deploy', description: 'Deploy agent version' }
    );

    // Add plugin endpoints
    for (const plugin of this.plugins.values()) {
      if (plugin.manifest.endpoints) {
        for (const endpoint of plugin.manifest.endpoints) {
          endpoints.push({
            method: endpoint.method,
            path: `/api/plugins/${plugin.manifest.id}${endpoint.path}`,
            description: endpoint.description,
            plugin: plugin.manifest.id
          });
        }
      }
    }

    return {
      endpoints,
      authentication: {
        type: 'api-key',
        header: 'X-API-Key'
      },
      baseUrl: process.env.API_BASE_URL || 'http://localhost:4002'
    };
  }

  // Health check for all integrations
  async healthCheck(): Promise<{
    plugins: Record<string, { status: string; lastUsed?: Date; error?: string }>;
    connectors: Record<string, { status: string }>;
    webhooks: Record<string, { status: string; active: boolean }>;
    vectorStores: Record<string, { status: string }>;
  }> {
    const result: any = {
      plugins: {},
      connectors: {},
      webhooks: {},
      vectorStores: {}
    };

    // Check plugins
    for (const [id, plugin] of this.plugins) {
      result.plugins[id] = {
        status: plugin.status,
        lastUsed: plugin.lastUsed,
        error: plugin.errorMessage
      };
    }

    // Check connectors
    for (const [id] of this.connectors) {
      result.connectors[id] = { status: 'registered' };
    }

    // Check webhooks
    for (const [id, webhook] of this.webhooks) {
      result.webhooks[id] = {
        status: 'registered',
        active: webhook.active
      };
    }

    // Check vector stores
    for (const [id] of this.vectorStores) {
      result.vectorStores[id] = { status: 'registered' };
    }

    return result;
  }
}

// Singleton instance
export const integrationHub = new IntegrationHub();
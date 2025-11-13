/**
 * VectorDBProviderService
 * 
 * Manages Vector DB providers (approved and marketplace)
 */

import { VectorDBProvider } from '../models/vectorDBProvider';
import { APPROVED_PROVIDERS, MARKETPLACE_PROVIDERS, ALL_PROVIDERS } from '../data/vectorDBProviders';

export class VectorDBProviderService {
  
  private providers: Map<string, VectorDBProvider>;
  
  constructor() {
    // Initialize with seed data
    this.providers = new Map();
    ALL_PROVIDERS.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
    
    console.log(`✅ VectorDBProviderService initialized with ${this.providers.size} providers`);
  }
  
  /**
   * Get all approved providers
   */
  getApprovedProviders(): VectorDBProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.status === 'approved')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Get all marketplace providers
   */
  getMarketplaceProviders(): VectorDBProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.status === 'marketplace')
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Get all providers (approved + marketplace)
   */
  getAllProviders(): { approved: VectorDBProvider[]; marketplace: VectorDBProvider[] } {
    return {
      approved: this.getApprovedProviders(),
      marketplace: this.getMarketplaceProviders()
    };
  }
  
  /**
   * Get provider by ID
   */
  getProviderById(id: string): VectorDBProvider | null {
    return this.providers.get(id) || null;
  }
  
  /**
   * Add new provider (Admin only)
   */
  addProvider(provider: VectorDBProvider): VectorDBProvider {
    // Validate provider
    if (!provider.id || !provider.name) {
      throw new Error('Provider ID and name are required');
    }
    
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider with ID ${provider.id} already exists`);
    }
    
    // Set timestamps
    provider.createdAt = new Date().toISOString();
    provider.updatedAt = new Date().toISOString();
    
    // Add to map
    this.providers.set(provider.id, provider);
    
    console.log(`✅ Provider added: ${provider.name} (${provider.id})`);
    
    return provider;
  }
  
  /**
   * Update provider (Admin only)
   */
  updateProvider(id: string, updates: Partial<VectorDBProvider>): VectorDBProvider {
    const provider = this.providers.get(id);
    
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }
    
    // Update provider
    const updatedProvider = {
      ...provider,
      ...updates,
      id: provider.id,  // Prevent ID change
      updatedAt: new Date().toISOString()
    };
    
    this.providers.set(id, updatedProvider);
    
    console.log(`✅ Provider updated: ${updatedProvider.name} (${id})`);
    
    return updatedProvider;
  }
  
  /**
   * Delete provider (Admin only)
   */
  deleteProvider(id: string): boolean {
    const provider = this.providers.get(id);
    
    if (!provider) {
      return false;
    }
    
    this.providers.delete(id);
    
    console.log(`✅ Provider deleted: ${provider.name} (${id})`);
    
    return true;
  }
  
  /**
   * Search providers by name or description
   */
  searchProviders(query: string): VectorDBProvider[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.providers.values())
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Get providers by category
   */
  getProvidersByCategory(category: 'managed' | 'self-hosted' | 'hybrid'): VectorDBProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Validate provider configuration
   */
  validateConfiguration(providerId: string, config: Record<string, any>): { valid: boolean; errors: string[] } {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      return { valid: false, errors: ['Provider not found'] };
    }
    
    const errors: string[] = [];
    
    // Check required fields
    provider.configTemplate.fields.forEach(field => {
      if (field.required && !config[field.name]) {
        errors.push(`${field.label} is required`);
      }
      
      // Validate field type
      if (config[field.name]) {
        const value = config[field.name];
        
        switch (field.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`${field.label} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${field.label} must be a boolean`);
            }
            break;
        }
        
        // Validate pattern
        if (field.validation?.pattern && typeof value === 'string') {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push(field.validation.message || `${field.label} format is invalid`);
          }
        }
        
        // Validate min/max
        if (field.type === 'number') {
          const numValue = Number(value);
          if (field.validation?.min !== undefined && numValue < field.validation.min) {
            errors.push(`${field.label} must be at least ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined && numValue > field.validation.max) {
            errors.push(`${field.label} must be at most ${field.validation.max}`);
          }
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const vectorDBProviderService = new VectorDBProviderService();

export default vectorDBProviderService;

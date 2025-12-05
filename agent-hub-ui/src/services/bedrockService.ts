// AWS Bedrock Service - Fetches available models and connection status
export interface BedrockModel {
  id: string;
  name: string;
  max_tokens: number;
  temperature: number;
  cost_per_1m_tokens: string;
  best_for: string[];
  status: string;
}

export interface BedrockStatus {
  success: boolean;
  bedrock_status: string;
  timestamp: string;
  available_models: BedrockModel[];
  agent_model_mapping: {
    agent_id: string;
    model_used: string;
    optimization: string;
  }[];
  demo_info: {
    provider: string;
    region: string;
    real_ai: boolean;
    cost_tracking: boolean;
    models_count: number;
  };
}

export interface BedrockConnectionTest {
  success: boolean;
  status: string;
  connection_time: string;
  model_used: string;
  tokens_used: {
    input_tokens: number;
    output_tokens: number;
  };
  response_preview: string;
  demo_message: string;
  timestamp: string;
}

class BedrockService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  }

  async getAvailableModels(): Promise<BedrockStatus> {
    try {
      // Use the same endpoint as Agent Testing to get all available models
      const response = await fetch(`${this.baseUrl}/api/v1/models/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response to match our BedrockStatus interface
      const models = (data.models || []).map((model: any) => ({
        id: model.id,
        name: model.name,
        max_tokens: 4000, // Default value
        temperature: 0.1,
        cost_per_1m_tokens: model.cost === 'Low' ? '$0.25' : model.cost === 'Medium' ? '$3.00' : '$15.00',
        best_for: [model.description],
        status: '✅ Available'
      }));
      
      return {
        success: data.success !== false,
        bedrock_status: 'connected',
        timestamp: new Date().toISOString(),
        available_models: models,
        agent_model_mapping: [],
        demo_info: {
          provider: 'AWS Bedrock',
          region: 'us-east-1',
          real_ai: true,
          cost_tracking: true,
          models_count: models.length
        }
      };
    } catch (error) {
      console.error('Error fetching Bedrock models:', error);
      throw error;
    }
  }

  async testConnection(): Promise<BedrockConnectionTest> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/bedrock/test-connection`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error testing Bedrock connection:', error);
      throw error;
    }
  }

  async isBedrockAvailable(): Promise<boolean> {
    try {
      const status = await this.getAvailableModels();
      return status.success && status.demo_info.real_ai;
    } catch (error) {
      console.error('Error checking Bedrock availability:', error);
      return false;
    }
  }

  getModelDisplayName(modelId: string): string {
    // Handle short model IDs (legacy)
    const modelNames: { [key: string]: string } = {
      'haiku': 'Claude 3 Haiku',
      'sonnet': 'Claude 3.5 Sonnet', 
      'titan': 'Amazon Titan Text Express'
    };
    
    if (modelNames[modelId]) {
      return modelNames[modelId];
    }
    
    // Handle full Bedrock model IDs
    if (modelId.includes('claude-3-5-sonnet')) {
      return 'Claude 3.5 Sonnet';
    } else if (modelId.includes('claude-3-sonnet')) {
      return 'Claude 3 Sonnet';
    } else if (modelId.includes('claude-3-haiku')) {
      return 'Claude 3 Haiku';
    } else if (modelId.includes('claude-3-opus')) {
      return 'Claude 3 Opus';
    } else if (modelId.includes('claude-2')) {
      return 'Claude 2';
    } else if (modelId.includes('titan-text-express')) {
      return 'Amazon Titan Text Express';
    } else if (modelId.includes('titan-text-lite')) {
      return 'Amazon Titan Text Lite';
    } else if (modelId.includes('titan')) {
      return 'Amazon Titan';
    }
    
    // Fallback: return the model ID as-is
    return modelId;
  }

  getModelDescription(modelId: string): string {
    // Handle short model IDs (legacy)
    const descriptions: { [key: string]: string } = {
      'haiku': 'Fast and cost-effective for simple tasks',
      'sonnet': 'High-performance for complex reasoning',
      'titan': 'AWS native model for general text processing'
    };
    
    if (descriptions[modelId]) {
      return descriptions[modelId];
    }
    
    // Handle full Bedrock model IDs
    if (modelId.includes('haiku')) {
      return 'Fast and cost-effective for simple tasks';
    } else if (modelId.includes('sonnet')) {
      return 'High-performance for complex reasoning';
    } else if (modelId.includes('opus')) {
      return 'Most capable model for complex tasks';
    } else if (modelId.includes('titan')) {
      return 'AWS native model for general text processing';
    }
    
    return 'AI language model';
  }

  getModelRecommendation(agentType: string): string {
    const recommendations: { [key: string]: string } = {
      'llm': 'sonnet', // Best for complex text analysis
      'rpa': 'haiku',  // Cost-effective for automation
      'selenium': 'haiku', // Simple for test generation
      'custom': 'titan', // AWS native for integrations
      'hybrid': 'sonnet' // Best overall performance
    };
    return recommendations[agentType] || 'haiku';
  }
}

export const bedrockService = new BedrockService();
export default bedrockService;
/**
 * Models Routes
 * API endpoints for fetching available AI models from AWS Bedrock
 */

import { Router, Request, Response } from 'express';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

const router = Router();

// Initialize Bedrock client
const getBedrockClient = () => {
  const config: any = {
    region: process.env.AWS_REGION || 'us-east-1'
  };

  // Add credentials if available
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  return new BedrockClient(config);
};

/**
 * GET /api/v1/models/available
 * Get all available models from AWS Bedrock
 * This endpoint dynamically fetches models from Bedrock instead of using hardcoded data
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    console.log('🤖 Fetching available models from AWS Bedrock...');

    let models: any[] = [];
    let fetchedFromBedrock = false;

    // Try to fetch from AWS Bedrock
    try {
      const client = getBedrockClient();
      const command = new ListFoundationModelsCommand({});
      const response = await client.send(command);

      if (response.modelSummaries && response.modelSummaries.length > 0) {
        console.log(`✅ Fetched ${response.modelSummaries.length} models from AWS Bedrock`);
        
        // Filter for text generation models and map to our format
        models = response.modelSummaries
          .filter(model => 
            model.outputModalities?.includes('TEXT') &&
            model.inferenceTypesSupported?.includes('ON_DEMAND')
          )
          .map(model => {
            const modelId = model.modelId || '';
            const provider = model.providerName || 'Unknown';
            const modelName = model.modelName || modelId;

            // Determine cost and speed based on model type
            let cost = 'Medium';
            let speed = 'Medium';
            let description = modelName;

            if (modelId.includes('haiku')) {
              cost = 'Low';
              speed = 'Fast';
              description = 'Fast and cost-effective for most tasks';
            } else if (modelId.includes('sonnet')) {
              cost = 'Medium';
              speed = 'Medium';
              description = 'Balanced performance for complex tasks';
            } else if (modelId.includes('opus')) {
              cost = 'High';
              speed = 'Slow';
              description = 'Most capable for complex reasoning';
            } else if (modelId.includes('titan')) {
              cost = 'Low';
              speed = 'Fast';
              description = 'Budget-friendly Amazon model';
            } else if (modelId.includes('llama')) {
              cost = 'Medium';
              speed = 'Medium';
              description = 'Open-source Meta model';
            }

            return {
              id: modelId,
              name: modelName,
              provider: provider,
              description: description,
              cost: cost,
              speed: speed
            };
          })
          .sort((a, b) => {
            // Sort by cost (Low first) then by name
            const costOrder = { 'Low': 0, 'Medium': 1, 'High': 2 };
            const costDiff = (costOrder[a.cost as keyof typeof costOrder] || 1) - 
                           (costOrder[b.cost as keyof typeof costOrder] || 1);
            if (costDiff !== 0) return costDiff;
            return a.name.localeCompare(b.name);
          });

        fetchedFromBedrock = true;
      }
    } catch (bedrockError) {
      console.warn('⚠️ Could not fetch from AWS Bedrock, using fallback models:', bedrockError);
    }

    // Fallback to curated list if Bedrock fetch failed or returned no models
    if (models.length === 0) {
      console.log('📋 Using fallback model list');
      models = [
        {
          id: 'anthropic.claude-3-haiku-20240307-v1:0',
          name: 'Claude 3 Haiku',
          provider: 'Anthropic',
          description: 'Fast and cost-effective for most tasks',
          cost: 'Low',
          speed: 'Fast'
        },
        {
          id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          name: 'Claude 3.5 Sonnet v2',
          provider: 'Anthropic',
          description: 'Most capable model for complex reasoning',
          cost: 'High',
          speed: 'Medium'
        },
        {
          id: 'anthropic.claude-3-sonnet-20240229-v1:0',
          name: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          description: 'Balanced performance for complex tasks',
          cost: 'Medium',
          speed: 'Medium'
        },
        {
          id: 'anthropic.claude-3-opus-20240229-v1:0',
          name: 'Claude 3 Opus',
          provider: 'Anthropic',
          description: 'Highest quality for critical tasks',
          cost: 'High',
          speed: 'Slow'
        },
        {
          id: 'amazon.titan-text-express-v1',
          name: 'Titan Text Express',
          provider: 'Amazon',
          description: 'Budget-friendly for simple tasks',
          cost: 'Low',
          speed: 'Fast'
        },
        {
          id: 'amazon.titan-text-lite-v1',
          name: 'Titan Text Lite',
          provider: 'Amazon',
          description: 'Ultra low cost and lightweight',
          cost: 'Low',
          speed: 'Fast'
        }
      ];
    }

    res.json({
      success: true,
      models: models,
      count: models.length,
      source: fetchedFromBedrock ? 'aws-bedrock' : 'fallback',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching available models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

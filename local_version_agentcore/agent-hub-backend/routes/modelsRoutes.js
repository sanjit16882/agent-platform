/**
 * Models API Routes
 * Endpoints for fetching available AI models from AWS Bedrock
 */

const express = require('express');
const router = express.Router();
const { BedrockClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock');

// Initialize Bedrock client
const bedrockClient = new BedrockClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * GET /api/v1/models/available
 * Get list of available models from AWS Bedrock
 */
router.get('/available', async (req, res) => {
  try {
    console.log('📋 Fetching available models from AWS Bedrock...');
    
    const command = new ListFoundationModelsCommand({
      byProvider: 'Anthropic' // Filter for Claude models only
    });
    
    const response = await bedrockClient.send(command);
    
    // Map Bedrock response to our model format
    const models = (response.modelSummaries || [])
      .filter(model => {
        // Only include models that support on-demand inference
        return model.inferenceTypesSupported && 
               model.inferenceTypesSupported.includes('ON_DEMAND');
      })
      .map(model => {
        const modelId = model.modelId;
        const modelName = model.modelName || modelId;
        
        // Determine cost and speed based on model name
        let cost = 'Medium';
        let speed = 'Medium';
        let description = model.modelArn || 'Claude model';
        
        if (modelName.includes('haiku') || modelName.includes('Haiku')) {
          cost = 'Low';
          speed = 'Fast';
          description = 'Fast and efficient, good for simple to moderate tasks';
        } else if (modelName.includes('sonnet') || modelName.includes('Sonnet')) {
          cost = 'Medium';
          speed = 'Medium';
          description = 'Balanced performance and speed';
        } else if (modelName.includes('opus') || modelName.includes('Opus')) {
          cost = 'High';
          speed = 'Slow';
          description = 'Most capable model, best for complex reasoning tasks';
        }
        
        return {
          id: modelId,
          name: modelName,
          provider: 'Anthropic',
          description,
          cost,
          speed,
          inputModalities: model.inputModalities || [],
          outputModalities: model.outputModalities || []
        };
      })
      .sort((a, b) => {
        // Sort by name to put newer models first
        return b.name.localeCompare(a.name);
      });
    
    console.log(`✅ Found ${models.length} available models`);
    models.forEach(m => console.log(`   - ${m.name} (${m.id})`));
    
    res.json({
      success: true,
      models,
      count: models.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching available models:', error);
    
    // Return fallback models if API fails
    res.json({
      success: false,
      error: error.message,
      models: [
        {
          id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          name: 'Claude 3.5 Sonnet v2',
          provider: 'Anthropic',
          description: 'Most capable model (fallback)',
          cost: 'High',
          speed: 'Medium'
        },
        {
          id: 'anthropic.claude-3-sonnet-20240229-v1:0',
          name: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          description: 'Balanced performance and speed (fallback)',
          cost: 'Medium',
          speed: 'Medium'
        }
      ],
      count: 2
    });
  }
});

module.exports = router;

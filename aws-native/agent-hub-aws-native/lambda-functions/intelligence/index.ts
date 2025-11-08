import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { createHash } from 'crypto';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });

// Environment variables
const AGENTS_TABLE = process.env.AGENTS_TABLE!;
const INTELLIGENCE_TABLE = process.env.INTELLIGENCE_TABLE!;
const EVENT_BUS = process.env.EVENT_BUS!;

interface AnalysisRequest {
  query: string;
  userId?: string;
  context?: {
    type: string;
    data: any;
  };
}

interface AnalysisResult {
  success: boolean;
  analysis: {
    intent: string;
    confidence: number;
    frameworks: string[];
    languages: string[];
    capabilities: string[];
    keywords: string[];
  };
  suggestions: Array<{
    title: string;
    description: string;
    confidence: number;
    type: string;
    agentId?: string;
  }>;
  existingAgents: any[];
  metadata: {
    processingTime: number;
    analysisType: string;
    cached?: boolean;
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Intelligence Analysis Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const request: AnalysisRequest = JSON.parse(event.body || '{}');
    
    if (!request.query || !request.query.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Query is required'
        })
      };
    }

    const startTime = Date.now();
    
    // Check cache first
    const cachedResult = await getCachedAnalysis(request.query);
    if (cachedResult) {
      console.log('Returning cached analysis');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cached: true,
            processingTime: Date.now() - startTime
          }
        })
      };
    }

    // Perform new analysis
    const result = await performIntelligenceAnalysis(request);
    
    // Cache the result
    await cacheAnalysis(request.query, result);
    
    // Publish analytics event
    await publishEvent('Intelligence Analysis Completed', {
      query: request.query.substring(0, 100),
      userId: request.userId,
      intent: result.analysis.intent,
      confidence: result.analysis.confidence,
      existingAgentsFound: result.existingAgents.length,
      processingTime: result.metadata.processingTime
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Intelligence analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to analyze query',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function performIntelligenceAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Analyzing query:', request.query.substring(0, 50) + '...');

    // Step 1: Basic keyword analysis
    const basicAnalysis = await performBasicAnalysis(request.query);
    
    // Step 2: Get existing agents for comparison
    const existingAgents = await getExistingAgents();
    
    // Step 3: Find matching agents
    const matchingAgents = await findMatchingAgents(request.query, existingAgents);
    
    // Step 4: Use Bedrock for enhanced analysis (if available)
    let enhancedAnalysis;
    try {
      enhancedAnalysis = await performBedrockAnalysis(request.query, basicAnalysis, matchingAgents);
    } catch (error) {
      console.warn('Bedrock analysis failed, using basic analysis:', error);
      enhancedAnalysis = basicAnalysis;
    }

    // Step 5: Generate suggestions
    const suggestions = generateSuggestions(matchingAgents, enhancedAnalysis);

    // Step 6: Determine intent
    const intent = matchingAgents.length > 0 ? 'use-existing-agent' : 'create-agent';
    const confidence = matchingAgents.length > 0 ? 
      Math.max(0.8, matchingAgents[0].matchScore) : 
      enhancedAnalysis.confidence;

    const result: AnalysisResult = {
      success: true,
      analysis: {
        intent,
        confidence,
        frameworks: enhancedAnalysis.frameworks || [],
        languages: enhancedAnalysis.languages || [],
        capabilities: enhancedAnalysis.capabilities || [],
        keywords: enhancedAnalysis.keywords || []
      },
      suggestions,
      existingAgents: matchingAgents,
      metadata: {
        processingTime: Date.now() - startTime,
        analysisType: 'bedrock-enhanced'
      }
    };

    console.log('✅ Analysis complete:', {
      intent: result.analysis.intent,
      confidence: Math.round(result.analysis.confidence * 100) + '%',
      existingAgents: result.existingAgents.length,
      suggestions: result.suggestions.length
    });

    return result;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

async function performBasicAnalysis(query: string) {
  const lowerQuery = query.toLowerCase();
  const keywords = query.split(/\s+/).filter(word => word.length > 2);
  
  const frameworks: string[] = [];
  const languages: string[] = [];
  const capabilities: string[] = [];

  // Detect frameworks
  if (lowerQuery.includes('react') || lowerQuery.includes('jsx')) {
    frameworks.push('React');
    languages.push('JavaScript', 'TypeScript');
  }
  if (lowerQuery.includes('vue')) {
    frameworks.push('Vue.js');
    languages.push('JavaScript');
  }
  if (lowerQuery.includes('angular')) {
    frameworks.push('Angular');
    languages.push('TypeScript');
  }
  if (lowerQuery.includes('node') || lowerQuery.includes('express')) {
    frameworks.push('Node.js');
    languages.push('JavaScript');
  }
  if (lowerQuery.includes('python') || lowerQuery.includes('django') || lowerQuery.includes('flask')) {
    languages.push('Python');
    if (lowerQuery.includes('django')) frameworks.push('Django');
    if (lowerQuery.includes('flask')) frameworks.push('Flask');
  }

  // Detect capabilities
  if (lowerQuery.includes('code') || lowerQuery.includes('review')) {
    capabilities.push('Code Review');
  }
  if (lowerQuery.includes('api') || lowerQuery.includes('rest')) {
    capabilities.push('API Development');
  }
  if (lowerQuery.includes('test') || lowerQuery.includes('testing')) {
    capabilities.push('Testing');
  }
  if (lowerQuery.includes('deploy') || lowerQuery.includes('deployment')) {
    capabilities.push('Deployment');
  }
  if (lowerQuery.includes('security') || lowerQuery.includes('scan')) {
    capabilities.push('Security');
  }

  return {
    frameworks,
    languages,
    capabilities,
    keywords: keywords.slice(0, 10),
    confidence: 0.7
  };
}

async function getExistingAgents() {
  try {
    const command = new ScanCommand({
      TableName: AGENTS_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'active'
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching existing agents:', error);
    return [];
  }
}

async function findMatchingAgents(query: string, agents: any[]) {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/);
  const matchingAgents: any[] = [];

  for (const agent of agents) {
    let matchScore = 0;
    const agentText = (agent.name + ' ' + agent.description + ' ' + agent.category).toLowerCase();

    // Check for direct word matches
    for (const queryWord of queryWords) {
      if (queryWord.length > 2 && agentText.includes(queryWord)) {
        matchScore += 0.3;
      }
    }

    // Bonus for category matches
    if (lowerQuery.includes(agent.category.toLowerCase())) {
      matchScore += 0.2;
    }

    if (matchScore > 0.4) {
      matchingAgents.push({
        ...agent,
        matchScore: Math.min(1.0, matchScore),
        reason: `Existing "${agent.name}" matches your requirements`
      });
    }
  }

  // Sort by match score
  return matchingAgents.sort((a, b) => b.matchScore - a.matchScore);
}

async function performBedrockAnalysis(query: string, basicAnalysis: any, matchingAgents: any[]) {
  try {
    const prompt = `
Analyze this user query for creating an AI agent: "${query}"

Context:
- Existing matching agents found: ${matchingAgents.length}
- Basic analysis detected: ${JSON.stringify(basicAnalysis)}

Please provide a JSON response with:
1. Enhanced framework/language detection
2. Capability analysis
3. Confidence score (0-1)
4. Recommended approach

Format: {"frameworks": [], "languages": [], "capabilities": [], "confidence": 0.8, "reasoning": "..."}
`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Parse Claude's response
    const content = responseBody.content[0].text;
    
    try {
      const analysis = JSON.parse(content);
      return {
        ...basicAnalysis,
        ...analysis,
        enhanced: true
      };
    } catch (parseError) {
      console.warn('Failed to parse Bedrock response, using basic analysis');
      return basicAnalysis;
    }

  } catch (error) {
    console.warn('Bedrock analysis failed:', error);
    return basicAnalysis;
  }
}

function generateSuggestions(matchingAgents: any[], analysis: any) {
  const suggestions: any[] = [];

  if (matchingAgents.length > 0) {
    // Suggest existing agents first
    suggestions.push(...matchingAgents.slice(0, 2).map(agent => ({
      title: `Use Existing: ${agent.name}`,
      description: agent.reason,
      confidence: agent.matchScore,
      type: 'existing-agent',
      agentId: agent.id
    })));

    // Add option to create new
    suggestions.push({
      title: 'Create New Agent Instead',
      description: 'Build a new specialized agent with custom requirements',
      confidence: 0.6,
      type: 'create-new'
    });
  } else {
    // No existing agents, suggest creating new
    suggestions.push({
      title: 'Custom Development Agent',
      description: 'Build a specialized agent for your requirements',
      confidence: 0.8,
      type: 'create-new'
    });

    if (analysis.frameworks.length > 0) {
      suggestions.push({
        title: `${analysis.frameworks[0]} Specialist Agent`,
        description: `Create an agent specialized in ${analysis.frameworks[0]} development`,
        confidence: 0.7,
        type: 'create-new'
      });
    }

    if (analysis.capabilities.length > 0) {
      suggestions.push({
        title: `${analysis.capabilities[0]} Agent`,
        description: `Build an agent focused on ${analysis.capabilities[0].toLowerCase()}`,
        confidence: 0.6,
        type: 'create-new'
      });
    }
  }

  return suggestions;
}

async function getCachedAnalysis(query: string): Promise<AnalysisResult | null> {
  try {
    const queryHash = createHash('md5').update(query.toLowerCase().trim()).digest('hex');
    
    const command = new GetCommand({
      TableName: INTELLIGENCE_TABLE,
      Key: { query_hash: queryHash }
    });

    const result = await docClient.send(command);
    
    if (result.Item && result.Item.ttl > Math.floor(Date.now() / 1000)) {
      return result.Item.analysis;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached analysis:', error);
    return null;
  }
}

async function cacheAnalysis(query: string, analysis: AnalysisResult): Promise<void> {
  try {
    const queryHash = createHash('md5').update(query.toLowerCase().trim()).digest('hex');
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    const command = new PutCommand({
      TableName: INTELLIGENCE_TABLE,
      Item: {
        query_hash: queryHash,
        query: query,
        analysis,
        ttl,
        created_at: new Date().toISOString()
      }
    });

    await docClient.send(command);
  } catch (error) {
    console.error('Error caching analysis:', error);
    // Don't throw - caching failure shouldn't break the main operation
  }
}

async function publishEvent(eventType: string, detail: any): Promise<void> {
  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'agent-hub',
          DetailType: eventType,
          Detail: JSON.stringify(detail),
          EventBusName: EVENT_BUS
        }
      ]
    });

    await eventBridgeClient.send(command);
  } catch (error) {
    console.error('Error publishing event:', error);
  }
}
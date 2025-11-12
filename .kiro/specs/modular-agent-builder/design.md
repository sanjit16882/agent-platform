# Design Document - Modular Agent Builder with Vector DB & MCP Options

## Overview

The Modular Agent Builder enhances the existing Agent Hub platform by introducing flexible configuration options for Vector Database (RAG) and MCP tools. This design maintains complete backward compatibility with existing functionality while adding powerful new capabilities for knowledge-based agents.

### Design Principles

1. **Zero Breaking Changes**: All existing functionality preserved
2. **Architectural Isolation**: New Vector DB code completely separate from existing MCP code
3. **Additive Enhancement**: New features added without modifying existing code
4. **Flexible Configuration**: Users choose capabilities based on needs
5. **Cost Transparency**: Clear cost and performance implications
6. **Graceful Degradation**: Fallback to simpler modes if services fail

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
├──────────────────────┬──────────────────────┬───────────────────┤
│   Agent Builder UI   │   Agent Management   │   Knowledge Base  │
│   - Basic Config     │   - List Agents      │   - Upload Docs   │
│   - Vector DB Toggle │   - Edit Agents      │   - Manage Indexes│
│   - MCP Toggle       │   - Execute Agents   │   - View Stats    │
│   - Templates        │   - View Results     │                   │
└──────────┬───────────┴──────────┬───────────┴─────────┬─────────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │
┌─────────────────────────────────┴─────────────────────────────────┐
│                    Backend API Layer                               │
├────────────────┬────────────────┬────────────────┬────────────────┤
│  Agent Routes  │  Vector Routes │  MCP Routes    │  Bedrock Routes│
│  (Existing)    │  (NEW)         │  (Existing)    │  (Existing)    │
└────────┬───────┴────────┬───────┴────────┬───────┴────────┬───────┘
         │                │                │                │
         └────────────────┼────────────────┼────────────────┘
                          │                │
┌─────────────────────────┴────────────────┴───────────────────────┐
│                    Service Layer (NEW)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AgentExecutionRouter (NEW - Orchestrates Everything)    │   │
│  │  - Determines execution mode based on configuration      │   │
│  │  - Routes to appropriate execution flow                  │   │
│  │  - Wraps existing services without modification          │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│       ┌───────────────┼───────────────┐                          │
│       │               │               │                          │
│       ▼               ▼               ▼                          │
│  ┌─────────┐   ┌──────────────┐  ┌──────────────┐              │
│  │ Bedrock │   │  Vector DB   │  │  MCP Client  │              │
│  │ Service │   │  Service     │  │  (Existing)  │              │
│  │(Existing│   │  (NEW)       │  │              │              │
│  └─────────┘   └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴─────────────────────────────────────────┐
│                      Data & Storage Layer                          │
├────────────────┬────────────────┬────────────────┬───────────────┤
│  Agent Metadata│  Vector DB     │  MCP Config    │  Bedrock      │
│  (S3/Existing) │  (OpenSearch)  │  (localStorage)│  (AWS)        │
│                │  (NEW)         │  (Existing)    │  (Existing)   │
└────────────────┴────────────────┴────────────────┴───────────────┘
```

### Execution Flow Decision Tree

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│  AgentExecutionRouter               │
│  Load Agent Configuration           │
└─────────────┬───────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Check Configuration │
    └─────────┬───────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
Vector DB?          MCP?
    │                   │
    ├─ NO ──┬─── NO ────┤
    │       │           │
    │       └───────────┴──────> [Flow 1: Bedrock Only]
    │                            Direct call to Bedrock
    │                            Fastest, cheapest
    │
    ├─ YES ─┬─── NO ────┤
    │       │           │
    │       └───────────┴──────> [Flow 2: RAG Only]
    │                            1. Generate embedding
    │                            2. Search Vector DB
    │                            3. Retrieve context
    │                            4. Call Bedrock with context
    │
    ├─ NO ──┬─── YES ───┤
    │       │           │
    │       └───────────┴──────> [Flow 3: MCP Only]
    │                            1. Call Bedrock with tools
    │                            2. Invoke MCP tools if needed
    │                            3. Return results to Bedrock
    │                            (Uses existing MCP flow)
    │
    └─ YES ─┴─── YES ───┘
            │
            └──────────────────> [Flow 4: Full Stack]
                                 1. Generate embedding
                                 2. Search Vector DB
                                 3. Retrieve context
                                 4. Call Bedrock with context + tools
                                 5. Invoke MCP tools if needed
                                 6. Return final response
```

---

## Component Design

### 1. Agent Configuration Schema (Enhanced)

```typescript
interface AgentConfiguration {
  // ============================================
  // EXISTING FIELDS (Unchanged)
  // ============================================
  agentId: string;
  name: string;
  description: string;
  category: string;
  mcpServer?: string;  // ← EXISTING MCP association
  model: string;        // ← EXISTING model selection
  
  // ============================================
  // NEW FIELDS (Optional, default disabled)
  // ============================================
  vectorDB?: {
    enabled: boolean;  // Default: false
    provider: 'opensearch' | 'pinecone' | 'pgvector';
    indexes: string[];  // Knowledge bases to search
    retrievalConfig: {
      topK: number;  // Number of documents to retrieve
      minSimilarity: number;  // Minimum similarity threshold
      maxTokens?: number;  // Max tokens from retrieved docs
    };
  };
  
  // ============================================
  // EXECUTION METADATA (Auto-calculated)
  // ============================================
  executionMode?: 'bedrock-only' | 'rag' | 'mcp' | 'full-stack';
  estimatedCost?: {
    perQuery: number;
    breakdown: {
      llm: number;
      vectorDB?: number;
      mcp?: number;
    };
  };
  estimatedLatency?: {
    average: number;
    breakdown: {
      llm: number;
      vectorDB?: number;
      mcp?: number;
    };
  };
}
```

### 2. AgentExecutionRouter (NEW - Core Orchestrator)

```typescript
/**
 * AgentExecutionRouter
 * 
 * Central orchestrator that routes agent queries to appropriate execution flow
 * based on configuration. Wraps existing services without modifying them.
 * 
 * CRITICAL: This class DOES NOT modify existing Bedrock or MCP services.
 * It only wraps and coordinates them.
 */
class AgentExecutionRouter {
  
  constructor(
    private bedrockService: BedrockService,  // Existing service
    private vectorDBService: VectorDBService,  // NEW service
    private mcpClient: MCPClient,  // Existing client
    private mcpConfigService: MCPConfigService  // Existing service
  ) {}
  
  /**
   * Main execution method - routes to appropriate flow
   */
  async executeAgent(
    query: string,
    agentConfig: AgentConfiguration,
    context?: any
  ): Promise<AgentExecutionResult> {
    
    // Determine execution mode
    const mode = this.determineExecutionMode(agentConfig);
    
    // Log execution mode for monitoring
    this.logExecution(agentConfig.agentId, mode, query);
    
    // Route to appropriate flow
    switch (mode) {
      case 'bedrock-only':
        return this.executeBedrockOnly(query, agentConfig, context);
      
      case 'rag':
        return this.executeWithRAG(query, agentConfig, context);
      
      case 'mcp':
        return this.executeWithMCP(query, agentConfig, context);
      
      case 'full-stack':
        return this.executeFullStack(query, agentConfig, context);
      
      default:
        throw new Error(`Unknown execution mode: ${mode}`);
    }
  }
  
  /**
   * Determine execution mode based on configuration
   */
  private determineExecutionMode(
    agentConfig: AgentConfiguration
  ): ExecutionMode {
    
    const hasVectorDB = agentConfig.vectorDB?.enabled === true;
    const hasMCP = !!agentConfig.mcpServer;
    
    if (!hasVectorDB && !hasMCP) return 'bedrock-only';
    if (hasVectorDB && !hasMCP) return 'rag';
    if (!hasVectorDB && hasMCP) return 'mcp';
    if (hasVectorDB && hasMCP) return 'full-stack';
    
    return 'bedrock-only';  // Default fallback
  }
  
  /**
   * Flow 1: Bedrock Only (Existing functionality)
   * Direct call to Bedrock, no additional services
   */
  private async executeBedrockOnly(
    query: string,
    agentConfig: AgentConfiguration,
    context?: any
  ): Promise<AgentExecutionResult> {
    
    // ✅ USES EXISTING BEDROCK SERVICE - NO MODIFICATIONS
    const response = await this.bedrockService.callBedrock(
      agentConfig.model,
      query,
      context
    );
    
    return {
      success: true,
      content: response.content,
      mode: 'bedrock-only',
      usage: response.usage,
      cost: response.cost,
      latency: response.latency
    };
  }
  
  /**
   * Flow 2: RAG (Vector DB + Bedrock)
   * Retrieve context from Vector DB, then call Bedrock
   */
  private async executeWithRAG(
    query: string,
    agentConfig: AgentConfiguration,
    context?: any
  ): Promise<AgentExecutionResult> {
    
    const startTime = Date.now();
    
    try {
      // Step 1: Generate embedding for query
      const embedding = await this.vectorDBService.generateEmbedding(query);
      
      // Step 2: Search Vector DB for relevant documents
      const retrievedDocs = await this.vectorDBService.search({
        indexes: agentConfig.vectorDB!.indexes,
        vector: embedding,
        topK: agentConfig.vectorDB!.retrievalConfig.topK,
        minSimilarity: agentConfig.vectorDB!.retrievalConfig.minSimilarity
      });
      
      // Step 3: Build enhanced prompt with context
      const enhancedPrompt = this.buildRAGPrompt(query, retrievedDocs, context);
      
      // Step 4: Call Bedrock with enhanced prompt
      // ✅ USES EXISTING BEDROCK SERVICE - NO MODIFICATIONS
      const response = await this.bedrockService.callBedrock(
        agentConfig.model,
        enhancedPrompt,
        context
      );
      
      const totalLatency = Date.now() - startTime;
      
      return {
        success: true,
        content: response.content,
        mode: 'rag',
        usage: response.usage,
        cost: {
          ...response.cost,
          vectorDB: this.calculateVectorDBCost(retrievedDocs.length)
        },
        latency: totalLatency,
        metadata: {
          documentsRetrieved: retrievedDocs.length,
          vectorSearchLatency: retrievedDocs.searchLatency
        }
      };
      
    } catch (error) {
      // Fallback to Bedrock-only if Vector DB fails
      console.error('Vector DB error, falling back to Bedrock-only:', error);
      return this.executeBedrockOnly(query, agentConfig, context);
    }
  }
  
  /**
   * Flow 3: MCP Only (Existing MCP functionality)
   * Delegates to existing MCP execution flow
   */
  private async executeWithMCP(
    query: string,
    agentConfig: AgentConfiguration,
    context?: any
  ): Promise<AgentExecutionResult> {
    
    // ✅ DELEGATES TO EXISTING MCP LOGIC - ZERO MODIFICATIONS
    // This method simply wraps the existing MCP execution flow
    
    const mcpServerConfig = this.mcpConfigService.getServerConfig(
      agentConfig.mcpServer!
    );
    
    if (!mcpServerConfig) {
      throw new Error(`MCP server not found: ${agentConfig.mcpServer}`);
    }
    
    // Step 1: Get MCP tools for this server
    const mcpTools = await this.mcpClient.getTools(agentConfig.mcpServer!);
    
    // Step 2: Call Bedrock with tool definitions
    // ✅ USES EXISTING BEDROCK SERVICE - NO MODIFICATIONS
    const initialResponse = await this.bedrockService.callBedrockWithTools(
      agentConfig.model,
      query,
      mcpTools,
      context
    );
    
    // Step 3: If Bedrock wants to use tools, invoke them
    if (initialResponse.tool_use && initialResponse.tool_use.length > 0) {
      
      // ✅ USES EXISTING MCP CLIENT - NO MODIFICATIONS
      const toolResults = await this.mcpClient.invokeTools(
        agentConfig.mcpServer!,
        initialResponse.tool_use
      );
      
      // Step 4: Send tool results back to Bedrock
      const finalResponse = await this.bedrockService.callBedrockWithToolResults(
        agentConfig.model,
        query,
        initialResponse,
        toolResults,
        context
      );
      
      return {
        success: true,
        content: finalResponse.content,
        mode: 'mcp',
        usage: finalResponse.usage,
        cost: {
          ...finalResponse.cost,
          mcp: this.calculateMCPCost(toolResults.length)
        },
        latency: finalResponse.latency,
        metadata: {
          toolsInvoked: toolResults.length,
          toolNames: toolResults.map(t => t.name)
        }
      };
    }
    
    // No tools needed, return initial response
    return {
      success: true,
      content: initialResponse.content,
      mode: 'mcp',
      usage: initialResponse.usage,
      cost: initialResponse.cost,
      latency: initialResponse.latency
    };
  }
  
  /**
   * Flow 4: Full Stack (Vector DB + MCP + Bedrock)
   * Combines RAG and MCP capabilities
   */
  private async executeFullStack(
    query: string,
    agentConfig: AgentConfiguration,
    context?: any
  ): Promise<AgentExecutionResult> {
    
    const startTime = Date.now();
    
    try {
      // Step 1: RAG - Retrieve context from Vector DB
      const embedding = await this.vectorDBService.generateEmbedding(query);
      const retrievedDocs = await this.vectorDBService.search({
        indexes: agentConfig.vectorDB!.indexes,
        vector: embedding,
        topK: agentConfig.vectorDB!.retrievalConfig.topK,
        minSimilarity: agentConfig.vectorDB!.retrievalConfig.minSimilarity
      });
      
      // Step 2: Build enhanced prompt with retrieved context
      const enhancedPrompt = this.buildRAGPrompt(query, retrievedDocs, context);
      
      // Step 3: Get MCP tools
      const mcpTools = await this.mcpClient.getTools(agentConfig.mcpServer!);
      
      // Step 4: Call Bedrock with context AND tools
      // ✅ USES EXISTING BEDROCK SERVICE - NO MODIFICATIONS
      const initialResponse = await this.bedrockService.callBedrockWithTools(
        agentConfig.model,
        enhancedPrompt,
        mcpTools,
        context
      );
      
      // Step 5: If tools needed, invoke them
      if (initialResponse.tool_use && initialResponse.tool_use.length > 0) {
        
        // ✅ USES EXISTING MCP CLIENT - NO MODIFICATIONS
        const toolResults = await this.mcpClient.invokeTools(
          agentConfig.mcpServer!,
          initialResponse.tool_use
        );
        
        // Step 6: Final Bedrock call with everything
        const finalResponse = await this.bedrockService.callBedrockWithToolResults(
          agentConfig.model,
          enhancedPrompt,
          initialResponse,
          toolResults,
          context
        );
        
        const totalLatency = Date.now() - startTime;
        
        return {
          success: true,
          content: finalResponse.content,
          mode: 'full-stack',
          usage: finalResponse.usage,
          cost: {
            ...finalResponse.cost,
            vectorDB: this.calculateVectorDBCost(retrievedDocs.length),
            mcp: this.calculateMCPCost(toolResults.length)
          },
          latency: totalLatency,
          metadata: {
            documentsRetrieved: retrievedDocs.length,
            toolsInvoked: toolResults.length,
            vectorSearchLatency: retrievedDocs.searchLatency
          }
        };
      }
      
      // No tools needed, return response with RAG context
      const totalLatency = Date.now() - startTime;
      
      return {
        success: true,
        content: initialResponse.content,
        mode: 'full-stack',
        usage: initialResponse.usage,
        cost: {
          ...initialResponse.cost,
          vectorDB: this.calculateVectorDBCost(retrievedDocs.length)
        },
        latency: totalLatency,
        metadata: {
          documentsRetrieved: retrievedDocs.length
        }
      };
      
    } catch (error) {
      // Fallback to MCP-only if Vector DB fails
      console.error('Vector DB error in full-stack mode, falling back to MCP-only:', error);
      return this.executeWithMCP(query, agentConfig, context);
    }
  }
  
  /**
   * Build RAG prompt with retrieved context
   */
  private buildRAGPrompt(
    query: string,
    retrievedDocs: RetrievedDocument[],
    context?: any
  ): string {
    
    if (retrievedDocs.length === 0) {
      return query;  // No context, return original query
    }
    
    const contextText = retrievedDocs
      .map((doc, idx) => `[Document ${idx + 1}]\n${doc.content}`)
      .join('\n\n');
    
    return `
Context from knowledge base:
${contextText}

User Query: ${query}

Please answer the user's query based on the context provided above. If the context doesn't contain relevant information, you can use your general knowledge but mention that the information is not from the knowledge base.
    `.trim();
  }
  
  /**
   * Calculate Vector DB cost
   */
  private calculateVectorDBCost(documentsRetrieved: number): number {
    // Embedding generation: $0.0001 per query
    // Vector search: $0.0001 per query
    // Document retrieval: $0.00001 per document
    return 0.0002 + (documentsRetrieved * 0.00001);
  }
  
  /**
   * Calculate MCP cost
   */
  private calculateMCPCost(toolsInvoked: number): number {
    // $0.10 per tool invocation (average)
    return toolsInvoked * 0.10;
  }
  
  /**
   * Log execution for monitoring
   */
  private logExecution(
    agentId: string,
    mode: ExecutionMode,
    query: string
  ): void {
    console.log(`[AgentExecutionRouter] Agent: ${agentId}, Mode: ${mode}, Query: ${query.substring(0, 50)}...`);
  }
}

// ============================================
// Supporting Types
// ============================================

type ExecutionMode = 'bedrock-only' | 'rag' | 'mcp' | 'full-stack';

interface AgentExecutionResult {
  success: boolean;
  content: string;
  mode: ExecutionMode;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  cost: {
    llm: number;
    vectorDB?: number;
    mcp?: number;
    total: number;
  };
  latency: number;
  metadata?: {
    documentsRetrieved?: number;
    toolsInvoked?: number;
    vectorSearchLatency?: number;
    toolNames?: string[];
  };
  error?: string;
}

interface RetrievedDocument {
  id: string;
  content: string;
  similarity: number;
  metadata: any;
  searchLatency?: number;
}
```



### 3. VectorDBService (NEW - Independent Module)

```typescript
/**
 * VectorDBService
 * 
 * Handles all Vector Database operations including:
 * - Embedding generation via AWS Bedrock
 * - Vector search in OpenSearch/Pinecone/Pgvector
 * - Knowledge base management
 * 
 * CRITICAL: This is a completely NEW service that does not modify
 * any existing services.
 */
class VectorDBService {
  
  constructor(
    private bedrockRuntime: AWS.BedrockRuntime,
    private vectorDBClient: VectorDBClient  // OpenSearch/Pinecone/Pgvector
  ) {}
  
  /**
   * Generate embedding for text using AWS Bedrock Titan Embeddings
   */
  async generateEmbedding(text: string): Promise<number[]> {
    
    try {
      const response = await this.bedrockRuntime.invokeModel({
        modelId: 'amazon.titan-embed-text-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: text
        })
      }).promise();
      
      const responseBody = JSON.parse(response.body.toString());
      return responseBody.embedding;  // Returns 1536-dimensional vector
      
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
  
  /**
   * Search vector database for similar documents
   */
  async search(params: VectorSearchParams): Promise<VectorSearchResult> {
    
    const startTime = Date.now();
    
    try {
      const results = await this.vectorDBClient.search({
        indexes: params.indexes,
        vector: params.vector,
        k: params.topK,
        filter: {
          similarity: { $gte: params.minSimilarity }
        }
      });
      
      const searchLatency = Date.now() - startTime;
      
      return {
        documents: results.map(r => ({
          id: r.id,
          content: r.metadata.content,
          similarity: r.score,
          metadata: r.metadata
        })),
        searchLatency,
        totalResults: results.length
      };
      
    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }
  
  /**
   * Index a document in vector database
   */
  async indexDocument(params: IndexDocumentParams): Promise<void> {
    
    try {
      // Generate embedding for document
      const embedding = await this.generateEmbedding(params.content);
      
      // Store in vector database
      await this.vectorDBClient.insert({
        index: params.index,
        id: params.id,
        vector: embedding,
        metadata: {
          content: params.content,
          title: params.title,
          source: params.source,
          timestamp: new Date().toISOString(),
          ...params.metadata
        }
      });
      
      console.log(`✅ Document indexed: ${params.id} in ${params.index}`);
      
    } catch (error) {
      console.error('Document indexing failed:', error);
      throw new Error(`Failed to index document: ${error.message}`);
    }
  }
  
  /**
   * Delete a document from vector database
   */
  async deleteDocument(index: string, documentId: string): Promise<void> {
    
    try {
      await this.vectorDBClient.delete({
        index,
        id: documentId
      });
      
      console.log(`✅ Document deleted: ${documentId} from ${index}`);
      
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
  
  /**
   * Create a new knowledge base (index)
   */
  async createKnowledgeBase(params: CreateKnowledgeBaseParams): Promise<void> {
    
    try {
      await this.vectorDBClient.createIndex({
        name: params.name,
        dimension: 1536,  // Titan embeddings dimension
        metric: 'cosine',  // Similarity metric
        metadata: {
          description: params.description,
          createdAt: new Date().toISOString()
        }
      });
      
      console.log(`✅ Knowledge base created: ${params.name}`);
      
    } catch (error) {
      console.error('Knowledge base creation failed:', error);
      throw new Error(`Failed to create knowledge base: ${error.message}`);
    }
  }
  
  /**
   * Delete a knowledge base (index)
   */
  async deleteKnowledgeBase(name: string): Promise<void> {
    
    try {
      await this.vectorDBClient.deleteIndex(name);
      console.log(`✅ Knowledge base deleted: ${name}`);
      
    } catch (error) {
      console.error('Knowledge base deletion failed:', error);
      throw new Error(`Failed to delete knowledge base: ${error.message}`);
    }
  }
  
  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(name: string): Promise<KnowledgeBaseStats> {
    
    try {
      const stats = await this.vectorDBClient.getIndexStats(name);
      
      return {
        name,
        documentCount: stats.documentCount,
        sizeBytes: stats.sizeBytes,
        createdAt: stats.metadata.createdAt,
        lastUpdated: stats.metadata.lastUpdated
      };
      
    } catch (error) {
      console.error('Failed to get knowledge base stats:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
}

// ============================================
// Supporting Types
// ============================================

interface VectorSearchParams {
  indexes: string[];
  vector: number[];
  topK: number;
  minSimilarity: number;
}

interface VectorSearchResult {
  documents: RetrievedDocument[];
  searchLatency: number;
  totalResults: number;
}

interface IndexDocumentParams {
  index: string;
  id: string;
  content: string;
  title?: string;
  source?: string;
  metadata?: any;
}

interface CreateKnowledgeBaseParams {
  name: string;
  description: string;
}

interface KnowledgeBaseStats {
  name: string;
  documentCount: number;
  sizeBytes: number;
  createdAt: string;
  lastUpdated?: string;
}
```

---

## User Interface Design

### 1. Agent Builder UI - Configuration Step

```tsx
/**
 * AgentConfigurationForm
 * 
 * Enhanced agent builder with Vector DB and MCP options
 * 
 * CRITICAL: This component adds new sections without modifying
 * existing MCP UI components.
 */
const AgentConfigurationForm: React.FC<Props> = ({ agent, onSave }) => {
  
  const [vectorDBEnabled, setVectorDBEnabled] = useState(false);
  const [mcpEnabled, setMCPEnabled] = useState(!!agent.mcpServer);
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0.50);
  const [estimatedLatency, setEstimatedLatency] = useState(500);
  
  // Update cost and latency when configuration changes
  useEffect(() => {
    calculateEstimates();
  }, [vectorDBEnabled, mcpEnabled, selectedKnowledgeBases]);
  
  const calculateEstimates = () => {
    let cost = 0.50;  // Base Bedrock cost
    let latency = 500;  // Base Bedrock latency
    
    if (vectorDBEnabled) {
      cost += 0.25;  // Vector DB cost
      latency += 200;  // Vector DB latency
    }
    
    if (mcpEnabled) {
      cost += 0.10;  // MCP cost per tool
      latency += 500;  // MCP latency per tool
    }
    
    setEstimatedCost(cost);
    setEstimatedLatency(latency);
  };
  
  return (
    <Form>
      
      {/* ============================================ */}
      {/* STEP 1: Basic Configuration (Existing)      */}
      {/* ============================================ */}
      <Section title="Basic Configuration">
        <Form.Group>
          <Form.Label>Agent Name</Form.Label>
          <Form.Control type="text" value={agent.name} />
        </Form.Group>
        
        <Form.Group>
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" value={agent.description} />
        </Form.Group>
        
        <Form.Group>
          <Form.Label>Category</Form.Label>
          <Form.Select value={agent.category}>
            <option>Automation</option>
            <option>Analysis</option>
            <option>Integration</option>
          </Form.Select>
        </Form.Group>
      </Section>
      
      {/* ============================================ */}
      {/* STEP 2: LLM Configuration (Existing)        */}
      {/* ============================================ */}
      <Section title="LLM Configuration">
        <Form.Group>
          <Form.Label>Model</Form.Label>
          <Form.Select 
            value={agent.model}
            disabled={mcpEnabled}  // ← Existing logic preserved
          >
            <option value="claude-3-haiku">Claude 3 Haiku (Cost-effective)</option>
            <option value="claude-3-sonnet">Claude 3.5 Sonnet (Balanced)</option>
            <option value="titan-express">Titan Express (Budget)</option>
          </Form.Select>
          
          {mcpEnabled && (
            <Alert variant="info" className="mt-2">
              <small>
                <strong>ℹ️ Model Selection Disabled</strong><br />
                Model is configured through the selected MCP server.
              </small>
            </Alert>
          )}
        </Form.Group>
        
        <Form.Group>
          <Form.Label>Temperature</Form.Label>
          <Form.Range min={0} max={1} step={0.1} value={0.7} />
        </Form.Group>
      </Section>
      
      {/* ============================================ */}
      {/* STEP 3: Knowledge Base (NEW - Vector DB)    */}
      {/* ============================================ */}
      <Section title="Knowledge Base (Optional)">
        <Form.Group>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <Form.Label className="mb-0">Enable Vector Database (RAG)</Form.Label>
              <Form.Text className="text-muted">
                Give your agent access to custom knowledge bases for context-aware responses
              </Form.Text>
            </div>
            <Form.Check 
              type="switch"
              checked={vectorDBEnabled}
              onChange={(e) => setVectorDBEnabled(e.target.checked)}
            />
          </div>
        </Form.Group>
        
        {vectorDBEnabled && (
          <>
            <Form.Group>
              <Form.Label>Vector DB Provider</Form.Label>
              <Form.Select>
                <option value="opensearch">AWS OpenSearch</option>
                <option value="pinecone">Pinecone</option>
                <option value="pgvector">PostgreSQL (Pgvector)</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Knowledge Bases</Form.Label>
              <MultiSelect
                options={availableKnowledgeBases}
                value={selectedKnowledgeBases}
                onChange={setSelectedKnowledgeBases}
                placeholder="Select knowledge bases to search"
              />
              <Form.Text className="text-muted">
                Select one or more knowledge bases for your agent to search
              </Form.Text>
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Documents to Retrieve</Form.Label>
              <Form.Control 
                type="number" 
                min={1} 
                max={20} 
                defaultValue={5}
              />
              <Form.Text className="text-muted">
                Number of relevant documents to include as context
              </Form.Text>
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Minimum Similarity</Form.Label>
              <Form.Range 
                min={0} 
                max={1} 
                step={0.05} 
                defaultValue={0.7}
              />
              <Form.Text className="text-muted">
                Only retrieve documents with similarity above this threshold
              </Form.Text>
            </Form.Group>
            
            <Alert variant="info">
              <div className="d-flex align-items-start">
                <div className="me-2">💡</div>
                <div>
                  <strong>Cost Impact:</strong> +$0.25 per 1000 queries<br />
                  <strong>Latency Impact:</strong> +200ms average<br />
                  <strong>Benefits:</strong> Context-aware responses, reduced hallucinations
                </div>
              </div>
            </Alert>
            
            <div className="mt-3">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => navigate('/knowledge-bases')}
              >
                Manage Knowledge Bases
              </Button>
            </div>
          </>
        )}
      </Section>
      
      {/* ============================================ */}
      {/* STEP 4: External Tools (Existing MCP)       */}
      {/* ============================================ */}
      <Section title="External Tools (Optional)">
        <Form.Group>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <Form.Label className="mb-0">Enable MCP Tools</Form.Label>
              <Form.Text className="text-muted">
                Allow your agent to use external tools and APIs
              </Form.Text>
            </div>
            <Form.Check 
              type="switch"
              checked={mcpEnabled}
              onChange={(e) => setMCPEnabled(e.target.checked)}
            />
          </div>
        </Form.Group>
        
        {mcpEnabled && (
          <>
            {/* ✅ EXISTING MCP UI COMPONENT - NO MODIFICATIONS */}
            <ExistingMCPServerSelector 
              selectedServer={agent.mcpServer}
              onServerChange={(serverId) => {
                // Existing logic preserved
                agent.mcpServer = serverId;
                const server = mcpConfigService.getServerConfig(serverId);
                if (server) {
                  agent.model = server.modelId;
                }
              }}
            />
            
            <Alert variant="info">
              <div className="d-flex align-items-start">
                <div className="me-2">💡</div>
                <div>
                  <strong>Cost Impact:</strong> +$0.10 per tool invocation<br />
                  <strong>Latency Impact:</strong> +500ms per tool call<br />
                  <strong>Benefits:</strong> Access to external data and services
                </div>
              </div>
            </Alert>
            
            <div className="mt-3">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => navigate('/mcp-management')}
              >
                Manage MCP Servers
              </Button>
            </div>
          </>
        )}
      </Section>
      
      {/* ============================================ */}
      {/* STEP 5: Configuration Summary               */}
      {/* ============================================ */}
      <Section title="Configuration Summary">
        <Card>
          <Card.Body>
            <h5>Your Agent Configuration</h5>
            <ul className="list-unstyled">
              <li>✅ LLM: {agent.model}</li>
              <li>{vectorDBEnabled ? '✅' : '❌'} Vector DB (RAG)</li>
              <li>{mcpEnabled ? '✅' : '❌'} MCP Tools</li>
            </ul>
            
            <hr />
            
            <h6>Estimated Costs & Performance</h6>
            <Table size="sm" borderless>
              <tbody>
                <tr>
                  <td><strong>Cost per 1000 queries:</strong></td>
                  <td className="text-end">${estimatedCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Average latency:</strong></td>
                  <td className="text-end">{estimatedLatency}ms</td>
                </tr>
                <tr>
                  <td><strong>Execution mode:</strong></td>
                  <td className="text-end">
                    <Badge bg="primary">
                      {getExecutionMode(vectorDBEnabled, mcpEnabled)}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </Table>
            
            <hr />
            
            <h6>Cost Breakdown</h6>
            <ProgressBar>
              <ProgressBar 
                variant="primary" 
                now={50} 
                label="LLM" 
                key={1} 
              />
              {vectorDBEnabled && (
                <ProgressBar 
                  variant="info" 
                  now={25} 
                  label="Vector DB" 
                  key={2} 
                />
              )}
              {mcpEnabled && (
                <ProgressBar 
                  variant="success" 
                  now={25} 
                  label="MCP" 
                  key={3} 
                />
              )}
            </ProgressBar>
          </Card.Body>
        </Card>
      </Section>
      
      {/* ============================================ */}
      {/* STEP 6: Save Button                         */}
      {/* ============================================ */}
      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Agent Configuration
        </Button>
      </div>
      
    </Form>
  );
};

// Helper function to determine execution mode
function getExecutionMode(vectorDB: boolean, mcp: boolean): string {
  if (!vectorDB && !mcp) return 'Bedrock Only';
  if (vectorDB && !mcp) return 'RAG';
  if (!vectorDB && mcp) return 'MCP';
  if (vectorDB && mcp) return 'Full Stack';
  return 'Unknown';
}
```

### 2. Agent Templates

```tsx
/**
 * Agent Templates
 * 
 * Pre-configured templates for common use cases
 */
const AGENT_TEMPLATES = [
  {
    id: 'simple-chatbot',
    name: 'Simple Chatbot',
    description: 'Basic Q&A chatbot without external dependencies',
    icon: '💬',
    config: {
      vectorDB: { enabled: false },
      mcpServer: null,
      model: 'claude-3-haiku',
      estimatedCost: 0.50,
      estimatedLatency: 500
    },
    useCase: 'Basic Q&A, simple conversations, quick responses'
  },
  {
    id: 'faq-bot',
    name: 'FAQ Bot',
    description: 'Search documentation and answer questions',
    icon: '📚',
    config: {
      vectorDB: { 
        enabled: true,
        provider: 'opensearch',
        indexes: ['faq-docs'],
        retrievalConfig: { topK: 5, minSimilarity: 0.7 }
      },
      mcpServer: null,
      model: 'claude-3-haiku',
      estimatedCost: 0.75,
      estimatedLatency: 700
    },
    useCase: 'Customer support, documentation search, knowledge base queries'
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Search code repositories and use development tools',
    icon: '💻',
    config: {
      vectorDB: { 
        enabled: true,
        provider: 'opensearch',
        indexes: ['code-docs', 'api-docs'],
        retrievalConfig: { topK: 10, minSimilarity: 0.6 }
      },
      mcpServer: 'github-api',
      model: 'claude-3-sonnet',
      estimatedCost: 0.85,
      estimatedLatency: 1200
    },
    useCase: 'Code review, API integration, development assistance'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Query databases and analyze data',
    icon: '📊',
    config: {
      vectorDB: { enabled: false },
      mcpServer: 'database-query',
      model: 'claude-3-sonnet',
      estimatedCost: 0.60,
      estimatedLatency: 1000
    },
    useCase: 'Data analysis, SQL queries, report generation'
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Full-featured support agent with knowledge base and tools',
    icon: '🎧',
    config: {
      vectorDB: { 
        enabled: true,
        provider: 'opensearch',
        indexes: ['product-docs', 'support-tickets', 'faq'],
        retrievalConfig: { topK: 5, minSimilarity: 0.7 }
      },
      mcpServer: 'slack-integration',
      model: 'claude-3-sonnet',
      estimatedCost: 0.85,
      estimatedLatency: 1200
    },
    useCase: 'Customer support, ticket management, escalation handling'
  }
];

/**
 * Template Selector Component
 */
const AgentTemplateSelector: React.FC<Props> = ({ onSelectTemplate }) => {
  
  return (
    <Container>
      <h3>Choose an Agent Template</h3>
      <p className="text-muted">
        Start with a pre-configured template or create a custom agent from scratch
      </p>
      
      <Row className="g-3">
        {AGENT_TEMPLATES.map(template => (
          <Col md={6} lg={4} key={template.id}>
            <Card 
              className="h-100 cursor-pointer hover-shadow"
              onClick={() => onSelectTemplate(template)}
            >
              <Card.Body>
                <div className="text-center mb-3">
                  <div style={{ fontSize: '3rem' }}>{template.icon}</div>
                </div>
                
                <Card.Title>{template.name}</Card.Title>
                <Card.Text className="text-muted small">
                  {template.description}
                </Card.Text>
                
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Configuration:</small>
                  </div>
                  <div className="d-flex gap-2 mb-2">
                    <Badge bg={template.config.vectorDB.enabled ? 'success' : 'secondary'}>
                      {template.config.vectorDB.enabled ? '✓' : '✗'} Vector DB
                    </Badge>
                    <Badge bg={template.config.mcpServer ? 'success' : 'secondary'}>
                      {template.config.mcpServer ? '✓' : '✗'} MCP
                    </Badge>
                  </div>
                  
                  <div className="small text-muted">
                    <div>💰 ${template.config.estimatedCost}/1K queries</div>
                    <div>⚡ {template.config.estimatedLatency}ms avg</div>
                  </div>
                </div>
                
                <hr />
                
                <div className="small">
                  <strong>Use Case:</strong><br />
                  {template.useCase}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
        
        {/* Custom Agent Option */}
        <Col md={6} lg={4}>
          <Card 
            className="h-100 cursor-pointer hover-shadow border-primary"
            onClick={() => onSelectTemplate(null)}
          >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <div style={{ fontSize: '3rem' }}>⚙️</div>
              <Card.Title className="mt-3">Custom Agent</Card.Title>
              <Card.Text className="text-center text-muted">
                Configure your agent from scratch with full control over all options
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
```



### 3. Knowledge Base Management UI

```tsx
/**
 * Knowledge Base Management Page
 * 
 * Allows users to create and manage knowledge bases (vector indexes)
 */
const KnowledgeBaseManagement: React.FC = () => {
  
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Knowledge Bases</h2>
          <p className="text-muted">
            Manage vector databases for your agents
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} className="me-2" />
          Create Knowledge Base
        </Button>
      </div>
      
      <Row className="g-3">
        {knowledgeBases.map(kb => (
          <Col md={6} lg={4} key={kb.id}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <Card.Title>{kb.name}</Card.Title>
                    <Card.Text className="text-muted small">
                      {kb.description}
                    </Card.Text>
                  </div>
                  <Dropdown>
                    <Dropdown.Toggle variant="link" size="sm">
                      <MoreVertical size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleEdit(kb)}>
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleUploadDocs(kb)}>
                        Upload Documents
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item 
                        className="text-danger"
                        onClick={() => handleDelete(kb)}
                      >
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Documents</span>
                    <strong>{kb.documentCount.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Size</span>
                    <strong>{formatBytes(kb.sizeBytes)}</strong>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Last Updated</span>
                    <strong>{formatDate(kb.lastUpdated)}</strong>
                  </div>
                </div>
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => handleViewDocs(kb)}
                  >
                    View Documents
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => handleTestSearch(kb)}
                  >
                    Test Search
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Create Knowledge Base Modal */}
      <CreateKnowledgeBaseModal 
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onCreated={handleKnowledgeBaseCreated}
      />
    </Container>
  );
};
```

---

## Data Models

### 1. Database Schema (NEW Tables)

```sql
-- ============================================
-- Knowledge Bases Table
-- ============================================
CREATE TABLE knowledge_bases (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(50) NOT NULL,  -- 'opensearch', 'pinecone', 'pgvector'
  index_name VARCHAR(255) NOT NULL,
  document_count INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  metadata JSON,
  
  INDEX idx_name (name),
  INDEX idx_provider (provider),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- Agent Vector DB Configuration Table
-- ============================================
CREATE TABLE agent_vector_config (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  provider VARCHAR(50),  -- 'opensearch', 'pinecone', 'pgvector'
  knowledge_base_ids JSON,  -- Array of knowledge base IDs
  top_k INTEGER DEFAULT 5,
  min_similarity DECIMAL(3,2) DEFAULT 0.70,
  max_tokens INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  INDEX idx_agent_id (agent_id),
  INDEX idx_enabled (enabled)
);

-- ============================================
-- Agent Execution Logs Table (Enhanced)
-- ============================================
CREATE TABLE agent_execution_logs (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  execution_mode VARCHAR(50) NOT NULL,  -- 'bedrock-only', 'rag', 'mcp', 'full-stack'
  query TEXT NOT NULL,
  response TEXT,
  
  -- Timing
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  latency_ms INTEGER,
  
  -- Usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  -- Cost
  llm_cost DECIMAL(10,6),
  vector_db_cost DECIMAL(10,6),
  mcp_cost DECIMAL(10,6),
  total_cost DECIMAL(10,6),
  
  -- Metadata
  documents_retrieved INTEGER,
  tools_invoked INTEGER,
  vector_search_latency_ms INTEGER,
  tool_names JSON,
  
  -- Status
  status VARCHAR(50) NOT NULL,  -- 'success', 'error', 'timeout'
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  INDEX idx_agent_id (agent_id),
  INDEX idx_execution_mode (execution_mode),
  INDEX idx_started_at (started_at),
  INDEX idx_status (status)
);
```

### 2. Agent Metadata Schema (Enhanced)

```json
{
  "agentId": "agent-123",
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries with knowledge base and tools",
  "category": "customer-support",
  "version": "1.0.0",
  
  "llmConfig": {
    "provider": "bedrock",
    "model": "claude-3-sonnet",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  
  "vectorDB": {
    "enabled": true,
    "provider": "opensearch",
    "knowledgeBases": [
      "product-docs",
      "support-tickets",
      "faq"
    ],
    "retrievalConfig": {
      "topK": 5,
      "minSimilarity": 0.7,
      "maxTokens": 4000
    }
  },
  
  "mcpConfig": {
    "enabled": true,
    "serverId": "slack-integration",
    "autoInvoke": true
  },
  
  "executionMode": "full-stack",
  
  "estimatedCost": {
    "perQuery": 0.85,
    "breakdown": {
      "llm": 0.50,
      "vectorDB": 0.25,
      "mcp": 0.10
    }
  },
  
  "estimatedLatency": {
    "average": 1200,
    "breakdown": {
      "llm": 500,
      "vectorDB": 200,
      "mcp": 500
    }
  },
  
  "createdAt": "2025-11-11T10:00:00Z",
  "updatedAt": "2025-11-11T10:00:00Z",
  "createdBy": "user-456"
}
```

---

## API Endpoints

### 1. Vector DB Endpoints (NEW)

```typescript
// ============================================
// Knowledge Base Management
// ============================================

// List all knowledge bases
GET /api/v1/knowledge-bases
Response: {
  knowledgeBases: KnowledgeBase[]
}

// Get knowledge base details
GET /api/v1/knowledge-bases/:id
Response: {
  knowledgeBase: KnowledgeBase,
  stats: KnowledgeBaseStats
}

// Create knowledge base
POST /api/v1/knowledge-bases
Body: {
  name: string,
  description: string,
  provider: 'opensearch' | 'pinecone' | 'pgvector'
}
Response: {
  knowledgeBase: KnowledgeBase
}

// Delete knowledge base
DELETE /api/v1/knowledge-bases/:id
Response: {
  success: boolean
}

// ============================================
// Document Management
// ============================================

// Upload documents to knowledge base
POST /api/v1/knowledge-bases/:id/documents
Body: FormData with files
Response: {
  documentsIndexed: number,
  errors: string[]
}

// List documents in knowledge base
GET /api/v1/knowledge-bases/:id/documents
Response: {
  documents: Document[],
  total: number
}

// Delete document from knowledge base
DELETE /api/v1/knowledge-bases/:id/documents/:documentId
Response: {
  success: boolean
}

// ============================================
// Search & Testing
// ============================================

// Test search in knowledge base
POST /api/v1/knowledge-bases/:id/search
Body: {
  query: string,
  topK: number,
  minSimilarity: number
}
Response: {
  documents: RetrievedDocument[],
  searchLatency: number
}
```

### 2. Agent Configuration Endpoints (Enhanced)

```typescript
// ============================================
// Agent Configuration (Enhanced)
// ============================================

// Create agent with Vector DB config
POST /api/v1/agents
Body: {
  name: string,
  description: string,
  llmConfig: LLMConfig,
  vectorDB?: VectorDBConfig,  // NEW
  mcpConfig?: MCPConfig
}
Response: {
  agent: Agent
}

// Update agent configuration
PUT /api/v1/agents/:id
Body: {
  vectorDB?: VectorDBConfig,  // NEW
  mcpConfig?: MCPConfig
}
Response: {
  agent: Agent
}

// Get agent execution mode
GET /api/v1/agents/:id/execution-mode
Response: {
  mode: 'bedrock-only' | 'rag' | 'mcp' | 'full-stack',
  capabilities: {
    vectorDB: boolean,
    mcp: boolean
  },
  estimatedCost: number,
  estimatedLatency: number
}
```

### 3. Agent Execution Endpoints (Enhanced)

```typescript
// ============================================
// Agent Execution (Enhanced)
// ============================================

// Execute agent query
POST /api/v1/agents/:id/execute
Body: {
  query: string,
  context?: any
}
Response: {
  success: boolean,
  content: string,
  mode: ExecutionMode,
  usage: TokenUsage,
  cost: CostBreakdown,
  latency: number,
  metadata?: {
    documentsRetrieved?: number,
    toolsInvoked?: number
  }
}

// Get execution history
GET /api/v1/agents/:id/executions
Query: {
  mode?: ExecutionMode,
  startDate?: string,
  endDate?: string,
  limit?: number
}
Response: {
  executions: ExecutionLog[],
  total: number,
  aggregates: {
    totalCost: number,
    avgLatency: number,
    successRate: number
  }
}
```

---

## Error Handling & Fallbacks

### 1. Vector DB Failure Handling

```typescript
/**
 * Vector DB Error Handling Strategy
 */
class VectorDBErrorHandler {
  
  async handleVectorDBError(
    error: Error,
    query: string,
    agentConfig: AgentConfiguration
  ): Promise<AgentExecutionResult> {
    
    // Log error for monitoring
    console.error('[VectorDB Error]', {
      agentId: agentConfig.agentId,
      error: error.message,
      query: query.substring(0, 100)
    });
    
    // Send alert if error rate is high
    await this.checkErrorRate(agentConfig.agentId);
    
    // Fallback strategy based on agent configuration
    if (agentConfig.mcpConfig?.enabled) {
      // Fallback to MCP-only mode
      console.log('[Fallback] Using MCP-only mode');
      return this.executionRouter.executeWithMCP(query, agentConfig);
    } else {
      // Fallback to Bedrock-only mode
      console.log('[Fallback] Using Bedrock-only mode');
      return this.executionRouter.executeBedrockOnly(query, agentConfig);
    }
  }
  
  async checkErrorRate(agentId: string): Promise<void> {
    const recentErrors = await this.getRecentErrors(agentId, 5);  // Last 5 minutes
    
    if (recentErrors.length > 10) {
      // High error rate, send alert
      await this.sendAlert({
        severity: 'high',
        message: `High Vector DB error rate for agent ${agentId}`,
        errorCount: recentErrors.length
      });
      
      // Temporarily disable Vector DB for this agent
      await this.temporarilyDisableVectorDB(agentId, 15);  // 15 minutes
    }
  }
}
```

### 2. MCP Failure Handling (Existing)

```typescript
/**
 * MCP Error Handling (Existing - No Changes)
 * 
 * This is the existing MCP error handling logic.
 * We document it here but DO NOT modify it.
 */
// Existing MCP error handling preserved
// No changes to this code
```

### 3. Graceful Degradation Matrix

```
┌─────────────────────────────────────────────────────────────┐
│  Failure Scenario          │  Fallback Strategy             │
├─────────────────────────────────────────────────────────────┤
│  Vector DB unavailable     │  → MCP-only or Bedrock-only    │
│  MCP server unavailable    │  → RAG or Bedrock-only         │
│  Both unavailable          │  → Bedrock-only                │
│  Bedrock unavailable       │  → Return error (no fallback)  │
│  Embedding generation fail │  → Skip Vector DB, use MCP/LLM │
│  Vector search timeout     │  → Skip Vector DB, use MCP/LLM │
│  MCP tool timeout          │  → Continue without tool       │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Analytics

### 1. Execution Mode Analytics

```typescript
/**
 * Analytics Dashboard Metrics
 */
interface ExecutionModeAnalytics {
  // Execution mode distribution
  modeDistribution: {
    'bedrock-only': number,
    'rag': number,
    'mcp': number,
    'full-stack': number
  },
  
  // Cost analysis
  costByMode: {
    'bedrock-only': number,
    'rag': number,
    'mcp': number,
    'full-stack': number
  },
  
  // Performance metrics
  latencyByMode: {
    'bedrock-only': number,
    'rag': number,
    'mcp': number,
    'full-stack': number
  },
  
  // Success rates
  successRateByMode: {
    'bedrock-only': number,
    'rag': number,
    'mcp': number,
    'full-stack': number
  },
  
  // Vector DB metrics
  vectorDBMetrics: {
    avgDocumentsRetrieved: number,
    avgSearchLatency: number,
    cacheHitRate: number
  },
  
  // MCP metrics
  mcpMetrics: {
    avgToolsInvoked: number,
    avgToolLatency: number,
    toolSuccessRate: number
  }
}
```

### 2. Cost Optimization Recommendations

```typescript
/**
 * Cost Optimization Engine
 */
class CostOptimizationEngine {
  
  async generateRecommendations(
    agentId: string
  ): Promise<CostRecommendation[]> {
    
    const executions = await this.getRecentExecutions(agentId, 1000);
    const recommendations: CostRecommendation[] = [];
    
    // Analyze Vector DB usage
    const vectorDBUsage = this.analyzeVectorDBUsage(executions);
    if (vectorDBUsage.hitRate < 0.3) {
      recommendations.push({
        type: 'disable-vector-db',
        priority: 'high',
        message: 'Vector DB hit rate is low (< 30%). Consider disabling to save costs.',
        estimatedSavings: vectorDBUsage.cost * 0.7
      });
    }
    
    // Analyze MCP usage
    const mcpUsage = this.analyzeMCPUsage(executions);
    if (mcpUsage.invocationRate < 0.2) {
      recommendations.push({
        type: 'disable-mcp',
        priority: 'medium',
        message: 'MCP tools are rarely used (< 20%). Consider disabling to save costs.',
        estimatedSavings: mcpUsage.cost * 0.8
      });
    }
    
    // Analyze model selection
    const modelUsage = this.analyzeModelUsage(executions);
    if (modelUsage.avgComplexity < 0.5) {
      recommendations.push({
        type: 'downgrade-model',
        priority: 'medium',
        message: 'Queries are simple. Consider using Claude Haiku instead of Sonnet.',
        estimatedSavings: modelUsage.cost * 0.4
      });
    }
    
    return recommendations;
  }
}
```

---

## Deployment Strategy

### Phase 1: Infrastructure Setup (Week 1)

1. **Set up Vector DB infrastructure**
   - Deploy AWS OpenSearch cluster
   - Configure security groups and IAM roles
   - Set up monitoring and alerts

2. **Create database tables**
   - Run migrations for new tables
   - Verify backward compatibility

3. **Deploy VectorDBService**
   - Deploy as independent service
   - Test embedding generation
   - Test vector search

### Phase 2: Backend Implementation (Week 2-3)

1. **Implement AgentExecutionRouter**
   - Create router class
   - Implement all execution flows
   - Add error handling and fallbacks

2. **Create API endpoints**
   - Knowledge base management endpoints
   - Enhanced agent configuration endpoints
   - Execution endpoints with mode support

3. **Testing**
   - Unit tests for all new services
   - Integration tests for execution flows
   - Verify zero impact on existing MCP functionality

### Phase 3: UI Implementation (Week 4-5)

1. **Agent Builder enhancements**
   - Add Vector DB configuration section
   - Add agent templates
   - Add cost/latency estimates

2. **Knowledge Base Management**
   - Create knowledge base management page
   - Document upload functionality
   - Search testing interface

3. **Testing**
   - UI component tests
   - End-to-end user flow tests
   - Verify existing MCP UI unchanged

### Phase 4: Rollout (Week 6)

1. **Beta testing**
   - Deploy to staging environment
   - Test with select users
   - Gather feedback

2. **Production deployment**
   - Deploy to production
   - Monitor error rates and performance
   - Gradual rollout to all users

3. **Documentation**
   - User guides
   - API documentation
   - Migration guides

---

## Success Metrics

### Technical Metrics

- ✅ Zero breaking changes to existing functionality
- ✅ All existing tests pass without modification
- ✅ New features are architecturally isolated
- ✅ API response times within SLA
- ✅ Error rates < 1%

### Business Metrics

- 📈 Agent creation rate increases by 20%
- 📈 User satisfaction score > 4.5/5
- 📈 Cost optimization recommendations accepted > 50%
- 📈 Vector DB adoption rate > 30% of new agents
- 📈 Full-stack agents (Vector DB + MCP) > 15%

### Performance Metrics

- ⚡ Bedrock-only: < 500ms average latency
- ⚡ RAG: < 700ms average latency
- ⚡ MCP: < 1000ms average latency
- ⚡ Full-stack: < 1200ms average latency
- ⚡ Vector search: < 200ms average latency

---

## Conclusion

This design provides a comprehensive, modular approach to enhancing the Agent Hub platform with Vector DB and MCP capabilities while maintaining complete backward compatibility. The architecture is:

- **Isolated**: New Vector DB code is completely separate from existing MCP code
- **Flexible**: Users can choose any combination of capabilities
- **Transparent**: Clear cost and performance implications
- **Resilient**: Graceful degradation and fallback strategies
- **Scalable**: Can handle growing number of agents and knowledge bases

The implementation follows the principle of **additive enhancement** - adding new capabilities without modifying existing functionality, ensuring a safe and smooth deployment.


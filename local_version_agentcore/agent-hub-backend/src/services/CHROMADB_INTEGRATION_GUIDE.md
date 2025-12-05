# ChromaDB Integration Guide

## Overview

This guide explains how to add ChromaDB as a vector database provider to the Agent Hub platform.

## Current Status

The platform currently supports:
- ✅ OpenSearch (AWS) - Placeholder implementation
- ✅ Mock - In-memory for development
- ❌ ChromaDB - **Not yet implemented**
- ❌ Pinecone - Not yet implemented
- ❌ Pgvector - Not yet implemented

## Why ChromaDB?

ChromaDB is an excellent choice for vector databases because:
- **Open Source**: Free and self-hosted
- **Easy Setup**: Simple installation and configuration
- **Python/TypeScript Support**: Official clients available
- **Fast**: Optimized for similarity search
- **Lightweight**: Can run locally or in Docker
- **No Cloud Dependencies**: Unlike OpenSearch (AWS) or Pinecone

## Implementation Steps

### Step 1: Install ChromaDB Dependencies

```bash
cd local_version/agent-hub-backend
npm install chromadb
```

### Step 2: Create ChromaDBClient Class

Add the following to `vectorDBClient.ts`:

```typescript
import { ChromaClient, Collection } from 'chromadb';

/**
 * ChromaDB Vector Database Client
 * 
 * Uses ChromaDB for vector storage and search
 */
export class ChromaDBVectorClient implements VectorDBClient {
  
  private client: ChromaClient;
  private collections: Map<string, Collection>;
  private host: string;
  private port: number;
  
  constructor(config?: { host?: string; port?: number }) {
    this.host = config?.host || process.env.CHROMADB_HOST || 'localhost';
    this.port = config?.port || parseInt(process.env.CHROMADB_PORT || '8000');
    this.collections = new Map();
    
    // Initialize ChromaDB client
    this.client = new ChromaClient({
      path: `http://${this.host}:${this.port}`
    });
    
    console.log('✅ ChromaDBVectorClient initialized');
    console.log(`   Host: ${this.host}:${this.port}`);
  }
  
  /**
   * Get or create collection
   */
  private async getCollection(name: string): Promise<Collection> {
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }
    
    try {
      // Try to get existing collection
      const collection = await this.client.getCollection({ name });
      this.collections.set(name, collection);
      return collection;
    } catch (error) {
      // Collection doesn't exist, create it
      const collection = await this.client.createCollection({ name });
      this.collections.set(name, collection);
      return collection;
    }
  }
  
  /**
   * Search for similar vectors using ChromaDB
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    
    try {
      console.log(`🔍 ChromaDB: Searching ${params.indexes.length} collection(s)...`);
      
      const allResults: SearchResult[] = [];
      
      // Search each index (collection)
      for (const indexName of params.indexes) {
        const collection = await this.getCollection(indexName);
        
        // Query ChromaDB
        const results = await collection.query({
          queryEmbeddings: [params.vector],
          nResults: params.k
        });
        
        // Transform results
        if (results.ids && results.ids[0]) {
          for (let i = 0; i < results.ids[0].length; i++) {
            const id = results.ids[0][i];
            const distance = results.distances?.[0]?.[i] || 0;
            const metadata = results.metadatas?.[0]?.[i] || {};
            
            // Convert distance to similarity score (1 - distance for cosine)
            const similarity = 1 - distance;
            
            // Filter by minimum similarity
            if (similarity >= params.minSimilarity) {
              allResults.push({
                id: id as string,
                score: similarity,
                metadata
              });
            }
          }
        }
      }
      
      // Sort by score descending
      allResults.sort((a, b) => b.score - a.score);
      
      // Return top K results
      return allResults.slice(0, params.k);
      
    } catch (error: any) {
      console.error('✗ ChromaDB search failed:', error);
      throw new Error(`ChromaDB search failed: ${error.message}`);
    }
  }
  
  /**
   * Insert a vector document into ChromaDB
   */
  async insert(params: InsertParams): Promise<void> {
    
    try {
      console.log(`📝 ChromaDB: Inserting document ${params.id} into ${params.index}`);
      
      const collection = await this.getCollection(params.index);
      
      // Add document to collection
      await collection.add({
        ids: [params.id],
        embeddings: [params.vector],
        metadatas: [params.metadata]
      });
      
      console.log(`✓ Document inserted: ${params.id}`);
      
    } catch (error: any) {
      console.error('✗ ChromaDB insert failed:', error);
      throw new Error(`ChromaDB insert failed: ${error.message}`);
    }
  }
  
  /**
   * Delete a vector document from ChromaDB
   */
  async delete(params: DeleteParams): Promise<void> {
    
    try {
      console.log(`🗑️ ChromaDB: Deleting document ${params.id} from ${params.index}`);
      
      const collection = await this.getCollection(params.index);
      
      // Delete document from collection
      await collection.delete({
        ids: [params.id]
      });
      
      console.log(`✓ Document deleted: ${params.id}`);
      
    } catch (error: any) {
      console.error('✗ ChromaDB delete failed:', error);
      throw new Error(`ChromaDB delete failed: ${error.message}`);
    }
  }
  
  /**
   * Create a new collection (index)
   */
  async createIndex(params: CreateIndexParams): Promise<void> {
    
    try {
      console.log(`🏗️ ChromaDB: Creating collection ${params.name}`);
      
      // Create collection with metadata
      const collection = await this.client.createCollection({
        name: params.name,
        metadata: {
          dimension: params.dimension,
          metric: params.metric,
          ...params.metadata
        }
      });
      
      this.collections.set(params.name, collection);
      
      console.log(`✅ Collection created: ${params.name}`);
      
    } catch (error: any) {
      console.error('✗ ChromaDB collection creation failed:', error);
      throw new Error(`ChromaDB collection creation failed: ${error.message}`);
    }
  }
  
  /**
   * Delete a collection (index)
   */
  async deleteIndex(name: string): Promise<void> {
    
    try {
      console.log(`🗑️ ChromaDB: Deleting collection ${name}`);
      
      await this.client.deleteCollection({ name });
      this.collections.delete(name);
      
      console.log(`✅ Collection deleted: ${name}`);
      
    } catch (error: any) {
      console.error('✗ ChromaDB collection deletion failed:', error);
      throw new Error(`ChromaDB collection deletion failed: ${error.message}`);
    }
  }
  
  /**
   * Get collection statistics
   */
  async getIndexStats(name: string): Promise<IndexStats> {
    
    try {
      console.log(`📊 ChromaDB: Getting stats for collection ${name}`);
      
      const collection = await this.getCollection(name);
      const count = await collection.count();
      
      return {
        documentCount: count,
        sizeBytes: 0, // ChromaDB doesn't provide size info directly
        metadata: {
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
      
    } catch (error: any) {
      console.error('✗ ChromaDB stats retrieval failed:', error);
      throw new Error(`ChromaDB stats retrieval failed: ${error.message}`);
    }
  }
  
  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    
    try {
      // Try to get heartbeat from ChromaDB
      const heartbeat = await this.client.heartbeat();
      return heartbeat > 0;
      
    } catch (error: any) {
      console.error('✗ ChromaDB health check failed:', error);
      return false;
    }
  }
}
```

### Step 3: Update Factory Function

Update the `createVectorDBClient` function in `vectorDBClient.ts`:

```typescript
export function createVectorDBClient(provider?: string): VectorDBClient {
  const selectedProvider = provider || process.env.VECTOR_DB_PROVIDER || 'mock';
  
  switch (selectedProvider.toLowerCase()) {
    case 'opensearch':
      return new OpenSearchVectorClient();
    
    case 'chromadb':
      return new ChromaDBVectorClient();
    
    case 'mock':
    default:
      return new MockVectorDBClient();
  }
}
```

### Step 4: Set Up ChromaDB Server

#### Option A: Docker (Recommended)

```bash
# Pull ChromaDB Docker image
docker pull chromadb/chroma

# Run ChromaDB server
docker run -p 8000:8000 chromadb/chroma
```

#### Option B: Python Installation

```bash
# Install ChromaDB
pip install chromadb

# Run ChromaDB server
chroma run --host localhost --port 8000
```

### Step 5: Configure Environment Variables

Add to your `.env` file:

```bash
# Vector DB Provider
VECTOR_DB_PROVIDER=chromadb

# ChromaDB Configuration
CHROMADB_HOST=localhost
CHROMADB_PORT=8000

# AWS Bedrock (for embeddings)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Step 6: Update UI to Show ChromaDB Option

Update `VectorDBConfigSection.tsx` (when it's created in Task 9):

```typescript
<Form.Group>
  <Form.Label>Vector DB Provider</Form.Label>
  <Form.Select value={provider} onChange={(e) => setProvider(e.target.value)}>
    <option value="opensearch">AWS OpenSearch</option>
    <option value="chromadb">ChromaDB (Local/Docker)</option>
    <option value="pinecone">Pinecone</option>
    <option value="pgvector">PostgreSQL (pgvector)</option>
  </Form.Select>
</Form.Group>
```

## Testing ChromaDB Integration

### Test 1: Health Check

```typescript
import { ChromaDBVectorClient } from './services/vectorDBClient';

const client = new ChromaDBVectorClient();
const isHealthy = await client.healthCheck();
console.log('ChromaDB Health:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
```

### Test 2: Create Collection and Index Document

```typescript
import { VectorDBService } from './services/vectorDBService';
import { ChromaDBVectorClient } from './services/vectorDBClient';

const client = new ChromaDBVectorClient();
const service = new VectorDBService(client);

// Create collection
await client.createIndex({
  name: 'test-collection',
  dimension: 1536,
  metric: 'cosine'
});

// Index a document
await service.indexDocument({
  index: 'test-collection',
  id: 'doc-1',
  content: 'This is a test document about AI and machine learning.',
  title: 'Test Document'
});

console.log('✅ Document indexed successfully');
```

### Test 3: Search

```typescript
// Generate embedding for query
const queryEmbedding = await service.generateEmbedding('Tell me about AI');

// Search for similar documents
const results = await service.search({
  indexes: ['test-collection'],
  vector: queryEmbedding,
  topK: 5,
  minSimilarity: 0.7
});

console.log(`Found ${results.documents.length} similar documents`);
results.documents.forEach(doc => {
  console.log(`- ${doc.metadata.title} (similarity: ${doc.similarity.toFixed(2)})`);
});
```

## Advantages of ChromaDB

### 1. **Easy Local Development**
- No cloud setup required
- Run locally with Docker
- Fast iteration and testing

### 2. **Cost-Effective**
- Free and open source
- No per-query costs
- Self-hosted

### 3. **Simple API**
- Clean Python/TypeScript API
- Easy to understand
- Good documentation

### 4. **Production-Ready**
- Can scale to millions of vectors
- Persistent storage
- Good performance

### 5. **Flexible Deployment**
- Local development
- Docker container
- Kubernetes
- Cloud VMs

## Comparison with Other Providers

| Feature | ChromaDB | OpenSearch | Pinecone | Pgvector |
|---------|----------|------------|----------|----------|
| **Cost** | Free | AWS costs | Paid | Free |
| **Setup** | Easy | Complex | Easy | Medium |
| **Local Dev** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Scalability** | Good | Excellent | Excellent | Good |
| **Managed** | Self-hosted | AWS managed | Fully managed | Self-hosted |
| **Best For** | Development, Small-Medium | Enterprise, AWS | Production, Scale | PostgreSQL users |

## Next Steps

1. **Install ChromaDB**: `npm install chromadb`
2. **Add ChromaDBVectorClient**: Copy code from Step 2
3. **Update Factory**: Update `createVectorDBClient` function
4. **Start ChromaDB Server**: Use Docker or Python
5. **Test Integration**: Run test scripts
6. **Update UI**: Add ChromaDB option to provider dropdown

## Troubleshooting

### Issue: "Cannot connect to ChromaDB"
**Solution**: 
- Check if ChromaDB server is running: `curl http://localhost:8000/api/v1/heartbeat`
- Verify CHROMADB_HOST and CHROMADB_PORT environment variables

### Issue: "Collection not found"
**Solution**: 
- Collections are created automatically on first use
- Or manually create: `await client.createIndex({ name: 'my-collection', dimension: 1536, metric: 'cosine' })`

### Issue: "Embedding dimension mismatch"
**Solution**: 
- Ensure embeddings are 1536-dimensional (AWS Bedrock Titan)
- ChromaDB will validate dimension on insert

## Resources

- **ChromaDB Documentation**: https://docs.trychroma.com/
- **ChromaDB GitHub**: https://github.com/chroma-core/chroma
- **TypeScript Client**: https://docs.trychroma.com/js_reference/Client

---

**Status**: 📋 Implementation Guide  
**Estimated Time**: 2-4 hours  
**Difficulty**: Medium  
**Prerequisites**: Docker or Python, AWS Bedrock access

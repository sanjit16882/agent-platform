/**
 * VectorDBAdapter.js
 * Mock adapter for Vector Database (RAG) integration
 * Simulates vector search and context retrieval
 */

class VectorDBAdapter {
  constructor(config = {}) {
    this.config = {
      embeddingModel: config.embeddingModel || 'amazon.titan-embed-text-v1',
      topK: config.topK || 5,
      similarityThreshold: config.similarityThreshold || 0.7,
      ...config
    };

    // Mock knowledge base
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  /**
   * Initialize mock knowledge base with sample documents
   */
  initializeKnowledgeBase() {
    return [
      {
        id: 'doc-001',
        content: 'SQL injection is a code injection technique that exploits vulnerabilities in database queries. Attackers can manipulate SQL statements to access unauthorized data.',
        metadata: { category: 'security', topic: 'sql-injection' },
        embedding: this.mockEmbedding('sql injection vulnerability')
      },
      {
        id: 'doc-002',
        content: 'Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages. There are three types: Stored XSS, Reflected XSS, and DOM-based XSS.',
        metadata: { category: 'security', topic: 'xss' },
        embedding: this.mockEmbedding('xss cross site scripting')
      },
      {
        id: 'doc-003',
        content: 'Buffer overflow occurs when a program writes more data to a buffer than it can hold. This can lead to crashes or arbitrary code execution.',
        metadata: { category: 'security', topic: 'buffer-overflow' },
        embedding: this.mockEmbedding('buffer overflow memory')
      },
      {
        id: 'doc-004',
        content: 'PCI DSS (Payment Card Industry Data Security Standard) is a set of security standards for organizations that handle credit card information.',
        metadata: { category: 'compliance', topic: 'pci-dss' },
        embedding: this.mockEmbedding('pci dss payment card')
      },
      {
        id: 'doc-005',
        content: 'OWASP Top 10 is a standard awareness document for web application security. It represents a broad consensus about the most critical security risks.',
        metadata: { category: 'security', topic: 'owasp' },
        embedding: this.mockEmbedding('owasp top 10 security')
      },
      {
        id: 'doc-006',
        content: 'Encryption types include symmetric (AES, DES) and asymmetric (RSA, ECC). Symmetric uses the same key for encryption and decryption, while asymmetric uses key pairs.',
        metadata: { category: 'cryptography', topic: 'encryption' },
        embedding: this.mockEmbedding('encryption symmetric asymmetric')
      },
      {
        id: 'doc-007',
        content: 'Test-Driven Development (TDD) is a software development approach where tests are written before the code. The cycle is: Red (write failing test), Green (make it pass), Refactor.',
        metadata: { category: 'testing', topic: 'tdd' },
        embedding: this.mockEmbedding('test driven development tdd')
      },
      {
        id: 'doc-008',
        content: 'Regression testing ensures that new code changes do not break existing functionality. It should be automated and run frequently.',
        metadata: { category: 'testing', topic: 'regression' },
        embedding: this.mockEmbedding('regression testing automation')
      }
    ];
  }

  /**
   * Search knowledge base with query
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Relevant documents
   */
  async search(query, options = {}) {
    const topK = options.topK || this.config.topK;
    const threshold = options.similarityThreshold || this.config.similarityThreshold;

    // Simulate embedding generation
    const queryEmbedding = this.mockEmbedding(query);

    // Calculate similarities
    const results = this.knowledgeBase.map(doc => ({
      ...doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Filter and sort
    const filtered = results
      .filter(doc => doc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Simulate network delay
    await this.simulateDelay(100, 300);

    return filtered.map(doc => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      similarity: doc.similarity
    }));
  }

  /**
   * Get context for a query (formatted for agent)
   * @param {string} query - User query
   * @returns {Promise<string>} Formatted context
   */
  async getContext(query) {
    const results = await this.search(query);
    
    if (results.length === 0) {
      return 'No relevant context found in knowledge base.';
    }

    const context = results.map((doc, index) => 
      `[${index + 1}] ${doc.content} (Relevance: ${Math.round(doc.similarity * 100)}%)`
    ).join('\n\n');

    return `Relevant context from knowledge base:\n\n${context}`;
  }

  /**
   * Add document to knowledge base
   * @param {Object} document - Document to add
   */
  async addDocument(document) {
    const embedding = this.mockEmbedding(document.content);
    
    this.knowledgeBase.push({
      id: document.id || `doc-${Date.now()}`,
      content: document.content,
      metadata: document.metadata || {},
      embedding
    });

    await this.simulateDelay(50, 150);
    
    return { success: true, id: document.id };
  }

  /**
   * Mock embedding generation (simple word-based vector)
   */
  mockEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(128).fill(0);
    
    // Simple hash-based embedding
    words.forEach((word, index) => {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const position = (charCode + i + index) % 128;
        vector[position] += 1;
      }
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Simulate network delay
   */
  async simulateDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get statistics about the knowledge base
   */
  getStats() {
    return {
      totalDocuments: this.knowledgeBase.length,
      categories: [...new Set(this.knowledgeBase.map(doc => doc.metadata.category))],
      config: this.config
    };
  }

  /**
   * Clear knowledge base
   */
  clear() {
    this.knowledgeBase = [];
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.knowledgeBase = this.initializeKnowledgeBase();
  }
}

module.exports = VectorDBAdapter;

# Knowledge Base Management API Documentation

## Overview

This document describes the API endpoints for the Knowledge Base Management feature in the Modular Agent Builder. These endpoints enable creating, managing, and searching vector databases for RAG-enabled AI agents.

## Base URL

```
Production: https://api.agenthub.example.com/api/v1
Staging: https://staging-api.agenthub.example.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API requests require authentication using an API key or JWT token.

### API Key Authentication

```http
Authorization: Bearer YOUR_API_KEY
```

### JWT Token Authentication

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Knowledge Base Endpoints

### List Knowledge Bases

Retrieve a list of all knowledge bases.

**Endpoint:** `GET /knowledge-bases`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 10, max: 100) |
| provider | string | No | Filter by provider (opensearch, pinecone, pgvector) |
| search | string | No | Search by name or description |

**Request Example:**

```http
GET /api/v1/knowledge-bases?page=1&limit=10
Authorization: Bearer YOUR_API_KEY
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "knowledgeBases": [
      {
        "id": "kb-123abc",
        "name": "Product Documentation",
        "description": "Complete product documentation and user guides",
        "provider": "opensearch",
        "indexName": "product-docs",
        "documentCount": 150,
        "sizeBytes": 5242880,
        "createdAt": "2025-11-01T10:00:00Z",
        "updatedAt": "2025-11-10T15:30:00Z",
        "createdBy": "user-456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

---

### Get Knowledge Base Details

Retrieve detailed information about a specific knowledge base.

**Endpoint:** `GET /knowledge-bases/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Knowledge base ID |

**Request Example:**

```http
GET /api/v1/knowledge-bases/kb-123abc
Authorization: Bearer YOUR_API_KEY
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "knowledgeBase": {
      "id": "kb-123abc",
      "name": "Product Documentation",
      "description": "Complete product documentation and user guides",
      "provider": "opensearch",
      "indexName": "product-docs",
      "documentCount": 150,
      "sizeBytes": 5242880,
      "createdAt": "2025-11-01T10:00:00Z",
      "updatedAt": "2025-11-10T15:30:00Z",
      "createdBy": "user-456",
      "metadata": {
        "lastIndexed": "2025-11-10T15:30:00Z",
        "averageDocumentSize": 34952,
        "totalChunks": 450
      }
    },
    "stats": {
      "documentsThisWeek": 15,
      "searchesThisWeek": 234,
      "averageSearchLatency": 145
    }
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `404 Not Found`: Knowledge base not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

---

### Create Knowledge Base

Create a new knowledge base.

**Endpoint:** `POST /knowledge-bases`

**Request Body:**

```json
{
  "name": "Customer Support KB",
  "description": "Historical support tickets and resolutions",
  "provider": "opensearch"
}
```

**Request Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Knowledge base name (max 255 chars) |
| description | string | No | Description (max 1000 chars) |
| provider | string | Yes | Provider: opensearch, pinecone, pgvector, mock |

**Request Example:**

```http
POST /api/v1/knowledge-bases
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Customer Support KB",
  "description": "Historical support tickets and resolutions",
  "provider": "opensearch"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "knowledgeBase": {
      "id": "kb-789xyz",
      "name": "Customer Support KB",
      "description": "Historical support tickets and resolutions",
      "provider": "opensearch",
      "indexName": "customer-support-kb",
      "documentCount": 0,
      "sizeBytes": 0,
      "createdAt": "2025-11-11T16:00:00Z",
      "updatedAt": "2025-11-11T16:00:00Z",
      "createdBy": "user-456"
    }
  },
  "message": "Knowledge base created successfully"
}
```

**Status Codes:**

- `201 Created`: Success
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: Invalid or missing authentication
- `409 Conflict`: Knowledge base with same name already exists
- `500 Internal Server Error`: Server error

---

### Delete Knowledge Base

Delete a knowledge base and all its documents.

**Endpoint:** `DELETE /knowledge-bases/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Knowledge base ID |

**Request Example:**

```http
DELETE /api/v1/knowledge-bases/kb-123abc
Authorization: Bearer YOUR_API_KEY
```

**Response Example:**

```json
{
  "success": true,
  "message": "Knowledge base deleted successfully",
  "data": {
    "deletedDocuments": 150,
    "deletedChunks": 450,
    "freedBytes": 5242880
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `404 Not Found`: Knowledge base not found
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: Knowledge base is in use by agents
- `500 Internal Server Error`: Server error

---

## Document Endpoints

### List Documents

Retrieve documents in a knowledge base.

**Endpoint:** `GET /knowledge-bases/:id/documents`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Knowledge base ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 10, max: 100) |
| search | string | No | Search by title or filename |
| type | string | No | Filter by file type (pdf, markdown, text, docx) |

**Request Example:**

```http
GET /api/v1/knowledge-bases/kb-123abc/documents?page=1&limit=10
Authorization: Bearer YOUR_API_KEY
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-456def",
        "title": "Getting Started Guide",
        "filename": "getting-started.md",
        "sizeBytes": 15360,
        "uploadedAt": "2025-11-01T10:00:00Z",
        "metadata": {
          "source": "documentation",
          "type": "markdown",
          "chunkCount": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `404 Not Found`: Knowledge base not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

---

### Upload Documents

Upload documents to a knowledge base.

**Endpoint:** `POST /knowledge-bases/:id/documents`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Knowledge base ID |

**Request Body:**

Multipart form data with files.

**Request Example:**

```http
POST /api/v1/knowledge-bases/kb-123abc/documents
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

files: [file1.pdf, file2.md, file3.txt]
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "documentsIndexed": 3,
    "totalChunks": 45,
    "totalBytes": 524288,
    "documents": [
      {
        "id": "doc-789ghi",
        "filename": "file1.pdf",
        "status": "indexed",
        "chunkCount": 20
      },
      {
        "id": "doc-012jkl",
        "filename": "file2.md",
        "status": "indexed",
        "chunkCount": 15
      },
      {
        "id": "doc-345mno",
        "filename": "file3.txt",
        "status": "indexed",
        "chunkCount": 10
      }
    ],
    "errors": []
  },
  "message": "3 documents uploaded and indexed successfully"
}
```

**Status Codes:**

- `201 Created`: Success
- `400 Bad Request`: Invalid files or file size exceeded
- `404 Not Found`: Knowledge base not found
- `401 Unauthorized`: Invalid or missing authentication
- `413 Payload Too Large`: File size exceeds limit
- `500 Internal Server Error`: Server error

---

### Delete Document

Delete a document from a knowledge base.

**Endpoint:** `DELETE /knowledge-bases/:id/documents/:documentId`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Knowledge base ID |
| documentId | string | Yes | Document ID |

**Request Example:**

```http
DELETE /api/v1/knowledge-bases/kb-123abc/documents/doc-456def
Authorization: Bearer YOUR_API_KEY
```

**Response Example:**

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "deletedChunks": 5,
    "freedBytes": 15360
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `404 Not Found`: Knowledge base or document not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

---

## Search Endpoints

### Test Search

Test search functionality in a knowledge base.

**Endpoint:** `POST /knowledge-bases/:id/search`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Knowledge base ID |

**Request Body:**

```json
{
  "query": "How do I reset my password?",
  "topK": 5,
  "minSimilarity": 0.7
}
```

**Request Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| topK | integer | No | Number of results (default: 5, max: 20) |
| minSimilarity | number | No | Minimum similarity (default: 0.7, range: 0.0-1.0) |

**Request Example:**

```http
POST /api/v1/knowledge-bases/kb-123abc/search
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "query": "How do I reset my password?",
  "topK": 5,
  "minSimilarity": 0.7
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-456def",
        "title": "Password Reset Guide",
        "content": "To reset your password, navigate to the login page and click 'Forgot Password'...",
        "similarity": 0.92,
        "metadata": {
          "source": "documentation",
          "type": "markdown",
          "chunkIndex": 2
        }
      },
      {
        "id": "doc-789ghi",
        "title": "Account Security",
        "content": "For security reasons, passwords must be reset every 90 days...",
        "similarity": 0.85,
        "metadata": {
          "source": "documentation",
          "type": "pdf",
          "chunkIndex": 5
        }
      }
    ],
    "searchLatency": 145,
    "totalResults": 2
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `400 Bad Request`: Invalid request body
- `404 Not Found`: Knowledge base not found
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

---

## Statistics Endpoints

### Get Knowledge Base Statistics

Get aggregated statistics across all knowledge bases.

**Endpoint:** `GET /knowledge-bases/stats/summary`

**Request Example:**

```http
GET /api/v1/knowledge-bases/stats/summary
Authorization: Bearer YOUR_API_KEY
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "totalKnowledgeBases": 3,
    "totalDocuments": 725,
    "totalStorageBytes": 19922944,
    "totalStorageMB": "19.0",
    "averageDocumentsPerKB": 241,
    "totalSearchesThisWeek": 1234,
    "averageSearchLatency": 152
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server error

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request body or parameters are invalid |
| `UNAUTHORIZED` | Authentication failed |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free Tier**: 100 requests per minute
- **Pro Tier**: 1000 requests per minute
- **Enterprise**: Custom limits

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699718400
```

---

## Webhooks

Subscribe to events for real-time notifications.

### Available Events

- `knowledge_base.created`
- `knowledge_base.updated`
- `knowledge_base.deleted`
- `document.uploaded`
- `document.indexed`
- `document.deleted`

### Webhook Payload Example

```json
{
  "event": "document.uploaded",
  "timestamp": "2025-11-11T16:00:00Z",
  "data": {
    "knowledgeBaseId": "kb-123abc",
    "documentId": "doc-456def",
    "filename": "new-document.pdf",
    "status": "indexed"
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { KnowledgeBaseClient } from '@agenthub/sdk';

const client = new KnowledgeBaseClient({
  apiKey: 'YOUR_API_KEY'
});

// Create knowledge base
const kb = await client.knowledgeBases.create({
  name: 'My Knowledge Base',
  description: 'Description here',
  provider: 'opensearch'
});

// Upload documents
await client.knowledgeBases.uploadDocuments(kb.id, [
  './doc1.pdf',
  './doc2.md'
]);

// Search
const results = await client.knowledgeBases.search(kb.id, {
  query: 'search query',
  topK: 5,
  minSimilarity: 0.7
});
```

### Python

```python
from agenthub import KnowledgeBaseClient

client = KnowledgeBaseClient(api_key='YOUR_API_KEY')

# Create knowledge base
kb = client.knowledge_bases.create(
    name='My Knowledge Base',
    description='Description here',
    provider='opensearch'
)

# Upload documents
client.knowledge_bases.upload_documents(
    kb.id,
    files=['doc1.pdf', 'doc2.md']
)

# Search
results = client.knowledge_bases.search(
    kb.id,
    query='search query',
    top_k=5,
    min_similarity=0.7
)
```

---

## Changelog

### Version 1.0.0 (2025-11-11)

- Initial release
- Knowledge base CRUD operations
- Document management
- Search functionality
- Statistics endpoints

---

## Support

For API support:
- Email: api-support@example.com
- Documentation: https://docs.agenthub.example.com
- Status Page: https://status.agenthub.example.com

---

**Last Updated**: November 11, 2025  
**API Version**: 1.0  
**For**: Modular Agent Builder - Knowledge Base Management

# Knowledge Base Management - User Guide

## Overview

The Knowledge Base Management feature allows you to create and manage vector databases that enable RAG (Retrieval Augmented Generation) capabilities for your AI agents. This guide will walk you through all the features and functionality.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a Knowledge Base](#creating-a-knowledge-base)
3. [Managing Documents](#managing-documents)
4. [Testing Search](#testing-search)
5. [Deleting Knowledge Bases](#deleting-knowledge-bases)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is a Knowledge Base?

A Knowledge Base is a vector database that stores documents and their embeddings, allowing AI agents to search and retrieve relevant information to enhance their responses. This enables:

- **Context-aware responses** based on your custom data
- **Reduced hallucinations** by grounding responses in factual information
- **Domain-specific knowledge** without retraining models
- **Up-to-date information** that can be easily updated

### Accessing Knowledge Base Management

1. Navigate to the main dashboard
2. Click on **"Knowledge Bases"** in the navigation menu
3. You'll see the Knowledge Base Management page with:
   - Summary statistics (total KBs, documents, storage)
   - List of existing knowledge bases
   - Create button to add new knowledge bases

---

## Creating a Knowledge Base

### Step 1: Open Create Modal

1. Click the **"Create Knowledge Base"** button in the top-right corner
2. The Create Knowledge Base modal will open

### Step 2: Fill in Details

**Required Fields:**
- **Name**: A descriptive name for your knowledge base
  - Example: "Product Documentation", "Support Tickets", "FAQ Database"
  - Must be unique and descriptive

**Optional Fields:**
- **Description**: Detailed description of what this knowledge base contains
  - Example: "Complete product documentation including user guides, API references, and tutorials"
  
- **Provider**: Vector database provider (default: Mock for development)
  - **AWS OpenSearch**: Production-ready, scalable vector search
  - **Pinecone**: Managed vector database service
  - **PostgreSQL (Pgvector)**: Open-source vector extension for PostgreSQL
  - **Mock**: Development/testing only

### Step 3: Create

1. Click **"Create Knowledge Base"**
2. Wait for confirmation message
3. Your new knowledge base will appear in the list

### Example

```
Name: Customer Support Knowledge Base
Description: Historical support tickets, common issues, and resolutions
Provider: AWS OpenSearch
```

---

## Managing Documents

### Uploading Documents

#### Step 1: Access Upload

1. Find your knowledge base in the list
2. Click the **three-dot menu** (⋮) on the knowledge base card
3. Select **"Upload Documents"**

Or:

1. Click the **"Upload"** button directly on the knowledge base card

#### Step 2: Select Files

1. Click **"Choose Files"** or drag and drop files
2. Select one or more documents to upload

**Supported Formats:**
- ✅ **Text files** (.txt)
- ✅ **Markdown** (.md)
- ✅ **JSON** (.json)
- ✅ **PDF** (.pdf)
- ✅ **Word documents** (.docx)

**File Size Limits:**
- Maximum 10MB per file
- No limit on number of files per upload

#### Step 3: Upload

1. Review selected files
2. Click **"Upload Documents"**
3. Wait for upload and indexing to complete
4. You'll see a success message with the number of documents uploaded

### Viewing Documents

1. Click the **three-dot menu** (⋮) on a knowledge base
2. Select **"View Documents"**
3. You'll see a table with all documents including:
   - Document title and filename
   - File type badge
   - File size
   - Number of chunks (embeddings)
   - Upload date
   - Action buttons (Preview, Delete)

### Document List Features

**Search:**
- Use the search box to filter documents by name
- Search is case-insensitive
- Results update as you type

**Pagination:**
- 10 documents per page
- Use pagination controls to navigate
- Shows current page range (e.g., "Showing 1-10 of 25")

**Preview Document:**
1. Click the **eye icon** (👁️) on any document
2. View document details:
   - Full title and filename
   - File type, size, and chunk count
   - Upload date and source
   - Content preview (scrollable)
3. Click **"Close"** to exit preview

**Delete Document:**
1. Click the **trash icon** (🗑️) on any document
2. Review the confirmation dialog
3. Understand what will be deleted:
   - The document file
   - All vector embeddings (chunks)
   - Document metadata
4. Click **"Delete Document"** to confirm
5. The document list will refresh automatically

---

## Testing Search

### Why Test Search?

Before using a knowledge base with an agent, it's important to test that:
- Documents are properly indexed
- Search returns relevant results
- Similarity thresholds are appropriate
- Performance is acceptable

### Step 1: Open Search Test

1. Click the **three-dot menu** (⋮) on a knowledge base
2. Select **"Test Search"**
3. The Search Test modal will open

### Step 2: Configure Search

**Search Query:**
- Enter a natural language query
- Example: "How do I reset my password?"
- Press Enter or click Search button

**Top K Results:**
- Use the slider to set how many results to return (1-20)
- Default: 5 results
- Higher values return more results but may include less relevant ones

**Minimum Similarity:**
- Use the slider to set the similarity threshold (0.0-1.0)
- Default: 0.70 (70%)
- Higher values return only very similar results
- Lower values return more results but may be less relevant

### Step 3: Execute Search

1. Click **"Search"** button
2. Wait for search to complete (typically < 1 second)
3. Review results

### Understanding Results

**Result Cards:**
Each result shows:
- **Rank**: Position in results (#1, #2, etc.)
- **Title**: Document title
- **Badges**: File type, source, chunk index
- **Similarity Score**: Percentage match (e.g., 92.0%)
- **Progress Bar**: Visual representation of similarity
- **Content Snippet**: Relevant text excerpt with query highlighted

**Similarity Score Colors:**
- 🟢 **Green (90%+)**: Excellent match
- 🔵 **Blue (80-89%)**: Good match
- 🟡 **Yellow (70-79%)**: Fair match
- ⚪ **Gray (<70%)**: Weak match

**Performance Metrics:**
- **Search Latency**: Time taken to search (in milliseconds)
- **Results Returned**: Number of results vs. requested
- **Average Similarity**: Mean similarity score across all results
- **Min Similarity Threshold**: Your configured threshold

### Step 4: Adjust and Retry

If results aren't satisfactory:

**Too Few Results:**
- Lower the minimum similarity threshold
- Increase Top K value
- Try different search terms

**Too Many Irrelevant Results:**
- Raise the minimum similarity threshold
- Decrease Top K value
- Use more specific search terms

**No Results:**
- Lower the minimum similarity threshold significantly
- Check that documents are uploaded
- Try broader search terms

### Step 5: Close

Click **"Close"** when finished testing

---

## Deleting Knowledge Bases

### ⚠️ Warning

Deleting a knowledge base is **permanent and cannot be undone**. This will delete:
- All documents in the knowledge base
- All vector embeddings
- The search index
- All metadata

### Steps to Delete

1. Click the **three-dot menu** (⋮) on the knowledge base
2. Select **"Delete"** (in red)
3. Review the confirmation dialog
4. Confirm you understand the data loss
5. Click **"Delete Knowledge Base"**
6. The knowledge base will be removed from the list

### Before Deleting

Consider:
- Are any agents using this knowledge base?
- Do you have backups of the documents?
- Is this knowledge base still needed?

---

## Best Practices

### Naming Conventions

**Good Names:**
- ✅ "Product Documentation v2.0"
- ✅ "Customer Support Tickets 2025"
- ✅ "Engineering FAQ Database"

**Poor Names:**
- ❌ "KB1"
- ❌ "Test"
- ❌ "Documents"

### Document Organization

**Do:**
- ✅ Use descriptive filenames
- ✅ Keep documents focused on specific topics
- ✅ Update documents regularly
- ✅ Remove outdated information
- ✅ Use consistent formatting

**Don't:**
- ❌ Upload duplicate documents
- ❌ Mix unrelated content in one document
- ❌ Use very large files (split them up)
- ❌ Upload binary files without text content

### Search Configuration

**For High Precision (fewer, more relevant results):**
- Set minimum similarity to 0.80 or higher
- Use Top K of 3-5
- Use specific search queries

**For High Recall (more results, some less relevant):**
- Set minimum similarity to 0.60 or lower
- Use Top K of 10-20
- Use broader search queries

**Balanced Approach (recommended):**
- Minimum similarity: 0.70
- Top K: 5
- Use natural language queries

### Performance Optimization

**Document Size:**
- Optimal: 1-5 pages per document
- Maximum: 10 pages per document
- Split larger documents into sections

**Document Count:**
- Optimal: 50-500 documents per knowledge base
- Maximum: 1000 documents per knowledge base
- Create multiple knowledge bases for different domains

**Update Frequency:**
- Update documents when information changes
- Remove outdated documents promptly
- Re-index after major updates

---

## Troubleshooting

### Issue: Upload Fails

**Possible Causes:**
- File size exceeds 10MB
- Unsupported file format
- Network connection issues
- Server error

**Solutions:**
1. Check file size and format
2. Try uploading one file at a time
3. Check your internet connection
4. Contact support if issue persists

### Issue: Search Returns No Results

**Possible Causes:**
- Minimum similarity threshold too high
- No documents uploaded
- Documents not indexed yet
- Query doesn't match document content

**Solutions:**
1. Lower minimum similarity to 0.50
2. Verify documents are uploaded
3. Wait a few minutes for indexing
4. Try different search terms
5. Check document content matches your query

### Issue: Search Results Not Relevant

**Possible Causes:**
- Minimum similarity threshold too low
- Documents contain mixed content
- Query is too broad

**Solutions:**
1. Raise minimum similarity to 0.80
2. Organize documents by topic
3. Use more specific queries
4. Review and clean up document content

### Issue: Slow Search Performance

**Possible Causes:**
- Too many documents
- Large document sizes
- High Top K value
- Server load

**Solutions:**
1. Split knowledge base into smaller ones
2. Reduce document sizes
3. Lower Top K value
4. Try again during off-peak hours

### Issue: Can't Delete Knowledge Base

**Possible Causes:**
- Knowledge base is in use by agents
- Permission issues
- Server error

**Solutions:**
1. Remove knowledge base from all agents first
2. Check your permissions
3. Contact administrator
4. Try again later

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Create Modal | `Ctrl/Cmd + K` |
| Search Documents | `Ctrl/Cmd + F` |
| Execute Search | `Enter` |
| Close Modal | `Esc` |

---

## Support

### Getting Help

**Documentation:**
- User guides (this document)
- API documentation
- Video tutorials

**Support Channels:**
- Email: support@example.com
- Chat: Available in-app
- Community forum: forum.example.com

**Reporting Issues:**
1. Note the error message
2. Document steps to reproduce
3. Include screenshots if helpful
4. Contact support with details

---

## Glossary

**Vector Database**: A database optimized for storing and searching vector embeddings

**Embedding**: A numerical representation of text that captures semantic meaning

**RAG**: Retrieval Augmented Generation - enhancing AI responses with retrieved context

**Similarity Score**: A measure of how closely a document matches a search query (0-100%)

**Top K**: The number of top results to return from a search

**Chunk**: A segment of a document that has been embedded separately

**Index**: The searchable structure containing all embeddings

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**For**: Modular Agent Builder - Knowledge Base Management

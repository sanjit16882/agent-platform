# Vector DB Document Management - Setup Guide

## Quick Setup (3 Steps)

### Step 1: Add the Import

Add this line to `local_version/agent-hub-backend/src/server.ts` after line 92 (after the other vector DB imports):

```typescript
import vectorDBDocumentRoutes from './routes/vectorDBDocumentRoutes';
```

So it looks like:
```typescript
import vectorDBProviderRoutes from './routes/vectorDBProviderRoutes';
import vectorDBAccessRequestRoutes from './routes/vectorDBAccessRequestRoutes';
import vectorDBDocumentRoutes from './routes/vectorDBDocumentRoutes';  // ADD THIS LINE
```

### Step 2: Register the Route

Add this line after line 117 (after the other vector DB routes):

```typescript
app.use('/api/v1/vector-db', vectorDBDocumentRoutes);
```

So it looks like:
```typescript
// Vector DB Provider Routes
app.use('/api/v1/vector-db', vectorDBProviderRoutes);

// Vector DB Access Request Routes
app.use('/api/v1/vector-db', vectorDBAccessRequestRoutes);

// Vector DB Document Routes
app.use('/api/v1/vector-db', vectorDBDocumentRoutes);  // ADD THIS LINE
```

### Step 3: Create Upload Directory

Run this command in your terminal:

```bash
cd local_version/agent-hub-backend
mkdir -p uploads/documents
```

Or on Windows PowerShell:
```powershell
cd local_version/agent-hub-backend
New-Item -ItemType Directory -Force -Path uploads/documents
```

---

## That's It! Now Restart Your Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm start
```

---

## Where to See It

### In the UI:

1. **Navigate to:** http://localhost:3000
2. **Click:** "Vector DB Admin" in the navigation
3. **You'll see 2 tabs:**
   - **📚 Document Management** (NEW!)
   - **🔑 Access Requests** (existing)

### Document Management Tab Features:

**Upload Tab:**
- Upload files (PDF, DOCX, TXT, MD)
- Select provider (Pinecone, pgvector, etc.)
- Choose category
- Import text directly
- See upload progress

**Manage Documents Tab:**
- View all uploaded documents
- See status (pending, processing, indexed, failed)
- Re-index documents
- Delete documents
- View chunk count and file size

**Settings Tab:**
- Configure chunk size
- Configure overlap percentage
- Select embedding model

---

## Test It Out

### 1. Create a Test File

Create a file called `test.txt`:
```
This is a test document for the Vector DB.

It contains some sample text that will be chunked and embedded.

You can use this to test the document ingestion feature.
```

### 2. Upload via UI

1. Go to Vector DB Admin → Document Management
2. Select "Pinecone" as provider
3. Select "Product Documentation" as category
4. Click "Choose Files" and select your `test.txt`
5. Click "Upload & Process"

### 3. Check the Results

- You should see a success message
- The document will appear in the "Manage Documents" tab
- Status will show as "INDEXED"
- You'll see the chunk count

---

## API Endpoints Available

All endpoints are at: `http://localhost:3002/api/v1/vector-db/`

- `POST /documents/upload` - Upload files
- `GET /documents` - List documents
- `GET /documents/:id` - Get document details
- `DELETE /documents/:id` - Delete document
- `POST /documents/:id/reindex` - Re-index document
- `GET /documents/:id/chunks` - Get document chunks
- `POST /documents/import/text` - Import raw text
- `POST /documents/import/url` - Import from URL (placeholder)
- `GET /documents/stats` - Get statistics
- `POST /documents/search` - Search documents

---

## What's Currently Mock vs Real

### ✅ Working Now (Mock Implementation):
- File upload
- Text extraction (TXT, MD files)
- Text chunking
- Document storage
- Document management (list, delete, re-index)
- Statistics

### 🔧 Needs Real Implementation:
- PDF extraction (need `pdf-parse` library)
- DOCX extraction (need `mammoth` library)
- Real embedding generation (need OpenAI or AWS Bedrock API)
- Real vector DB storage (need Pinecone or pgvector connection)

---

## Next Steps to Make It Production-Ready

### 1. Install PDF/DOCX Support

```bash
npm install pdf-parse mammoth
```

Then update `documentIngestionService.ts` to use these libraries.

### 2. Add Real Embeddings

**Option A: OpenAI**
```bash
npm install openai
```

**Option B: AWS Bedrock**
Already have AWS SDK installed.

### 3. Connect to Real Vector DB

**Option A: Pinecone**
```bash
npm install @pinecone-database/pinecone
```

**Option B: PostgreSQL with pgvector**
```bash
npm install pg
```

---

## Troubleshooting

### "Cannot find module './routes/vectorDBDocumentRoutes'"

Make sure the file exists at:
`local_version/agent-hub-backend/src/routes/vectorDBDocumentRoutes.ts`

### "Cannot find module './services/documentIngestionService'"

Make sure the file exists at:
`local_version/agent-hub-backend/src/services/documentIngestionService.ts`

### "Upload directory not found"

Create the directory:
```bash
mkdir -p local_version/agent-hub-backend/uploads/documents
```

### "Component not found: VectorDBDocumentManager"

Make sure the file exists at:
`local_version/agent-hub-ui/src/components/VectorDBDocumentManager.tsx`

---

## Summary

You now have a complete document ingestion system! The setup is:

1. ✅ Backend API routes created
2. ✅ Document processing service created
3. ✅ Frontend component created
4. ✅ Admin page updated with tabs
5. ⏳ Just need to register the route in server.ts
6. ⏳ Create upload directory
7. ⏳ Restart server

After these 3 simple steps, you'll be able to upload and manage documents in your Vector DB! 🎉

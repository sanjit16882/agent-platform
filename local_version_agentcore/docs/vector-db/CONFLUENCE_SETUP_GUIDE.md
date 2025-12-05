# Confluence Integration - Setup Guide

## ✅ What's Been Created

I've implemented a complete Confluence integration with a modular architecture. Here's what you have:

### Backend Files
- `services/integrations/baseIntegration.ts` - Base class for all integrations
- `services/integrations/confluenceIntegration.ts` - Confluence implementation
- `services/integrations/integrationManager.ts` - Integration manager
- `routes/vectorDBIntegrationRoutes.ts` - API endpoints

### Frontend Files
- `components/VectorDBIntegrationsManager.tsx` - UI for managing integrations
- Updated `pages/VectorDBAdminPage.tsx` - Added Integrations tab
- Updated `server.ts` - Registered routes

---

## Setup Steps

### Step 1: Install Dependencies

```bash
cd local_version/agent-hub-backend
npm install axios
```

### Step 2: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
npm start
```

### Step 3: Access the UI

1. Open browser: http://localhost:3000
2. Navigate to: **Vector DB Admin**
3. Click: **Integrations** tab

---

## How to Use

### Configure Confluence Integration

1. **Get API Token**
   - Go to: https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the token

2. **Add Integration**
   - Click "+ Add Confluence"
   - Fill in:
     ```
     Base URL: https://yourcompany.atlassian.net
     Username: your-email@company.com
     API Token: [paste token]
     Space Keys: DOCS, KB, SUPPORT
     Vector DB Provider: OpenSearch
     ```
   - Click "Create Integration"

3. **Sync Documents**
   - Click "Sync Now"
   - Wait for completion
   - Check "Document Management" tab to see imported pages

---

## What You'll See

### Integrations Tab

```
┌─────────────────────────────────────────────────────┐
│  🔗 Data Source Integrations                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [📚 Confluence]  [📁 SharePoint]  [📂 Google Drive]│
│   + Add           Coming Soon      Coming Soon     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Active Integrations (1)                [Sync All] │
├─────────────────────────────────────────────────────┤
│  Name              │ Type  │ Status  │ Last Sync   │
│  Confluence (DOCS) │ conf  │ SUCCESS │ 2 mins ago  │
│  Documents: 150    │       │         │ [Sync Now]  │
└─────────────────────────────────────────────────────┘
```

---

## Adding Other Integrations

The architecture makes it easy to add SharePoint, Google Drive, etc.

### Pattern to Follow

1. **Create Integration Class**
   ```typescript
   // services/integrations/sharepointIntegration.ts
   export class SharePointIntegration extends BaseIntegration {
     async testConnection() { /* ... */ }
     async sync() { /* ... */ }
   }
   ```

2. **Register in Manager**
   ```typescript
   // integrationManager.ts
   case 'sharepoint':
     integration = new SharePointIntegration(config);
     break;
   ```

3. **Add UI**
   ```typescript
   // VectorDBIntegrationsManager.tsx
   <Button onClick={() => setShowSharePointModal(true)}>
     + Add SharePoint
   </Button>
   ```

### Templates Available

Check `CONFLUENCE_INTEGRATION_COMPLETE.md` for:
- SharePoint template (OAuth-based)
- Google Drive template (OAuth-based)
- Database template (SQL-based)
- File System template (FS-based)

---

## API Endpoints

All at: `http://localhost:4002/api/v1/vector-db/`

### Create Integration
```bash
POST /integrations
{
  "id": "confluence-1",
  "name": "Confluence (DOCS)",
  "type": "confluence",
  "enabled": true,
  "config": {
    "baseUrl": "https://company.atlassian.net",
    "username": "email@company.com",
    "apiToken": "token",
    "spaceKeys": ["DOCS"],
    "providerId": "opensearch"
  }
}
```

### Sync Integration
```bash
POST /integrations/:id/sync
```

### List Integrations
```bash
GET /integrations
```

---

## Benefits

### ✅ Automated
- No manual uploads
- Runs on demand or schedule
- Keeps Vector DB updated

### ✅ Scalable
- Add unlimited integrations
- Each runs independently
- Handles thousands of documents

### ✅ Modular
- Easy to add new integrations
- Follow consistent pattern
- Self-contained code

### ✅ Maintainable
- Base class handles common logic
- Integration-specific code isolated
- Easy to debug and update

---

## Troubleshooting

### "Cannot find module 'axios'"
```bash
cd local_version/agent-hub-backend
npm install axios
```

### "Integration not found"
Make sure you created the integration first via the UI or API.

### "Sync failed"
Check:
- API token is valid
- Base URL is correct
- Space keys exist
- Network connectivity

### "No documents imported"
Check:
- Spaces have pages
- Pages are published (not drafts)
- User has permission to view pages

---

## Summary

✅ **Confluence integration implemented**
✅ **Modular architecture for easy expansion**
✅ **UI for managing integrations**
✅ **API endpoints for automation**
✅ **Templates for adding SharePoint, Google Drive, etc.**

**Next Steps:**
1. Install axios: `npm install axios`
2. Restart server
3. Configure Confluence integration
4. Sync documents
5. Add more integrations as needed

Your Vector DB can now automatically sync from Confluence! 🎉

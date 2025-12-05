# Vector DB Integrations - Automated Document Sync

## The Problem You Identified

✅ **You're absolutely right!** Manual document upload is:
- ❌ Time-consuming
- ❌ Error-prone
- ❌ Hard to keep updated
- ❌ Doesn't scale

## The Solution: Automated Integrations

Instead of manually uploading, integrate directly with your existing tools:
- ✅ **Confluence** - Wiki/documentation
- ✅ **Jira** - Tickets and knowledge
- ✅ **SharePoint** - Document management
- ✅ **Google Drive** - File storage
- ✅ **Notion** - Notes and docs
- ✅ **Slack** - Conversations and knowledge
- ✅ **GitHub** - Code and docs
- ✅ **Zendesk** - Support tickets

---

## Architecture: Automated Sync

```
┌─────────────────────────────────────────────────────────────┐
│              External Data Sources                          │
├─────────────────────────────────────────────────────────────┤
│  Confluence  │  Jira  │  SharePoint  │  Google Drive  │ ... │
└──────┬───────┴────┬───┴──────┬───────┴────────┬─────────────┘
       │            │          │                │
       │ API        │ API      │ API            │ API
       │            │          │                │
       ↓            ↓          ↓                ↓
┌─────────────────────────────────────────────────────────────┐
│           Integration Service (New Backend)                 │
│  - Fetch documents from APIs                                │
│  - Transform to common format                               │
│  - Detect changes (webhooks/polling)                        │
│  - Trigger ingestion                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│        Document Ingestion Service (Existing)                │
│  - Extract text                                             │
│  - Chunk documents                                          │
│  - Generate embeddings                                      │
│  - Store in Vector DB                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration 1: Confluence

### What It Does
- Syncs all pages from specified Confluence spaces
- Keeps documents updated automatically
- Preserves page hierarchy and metadata

### Implementation

```typescript
// services/integrations/confluenceIntegration.ts

import axios from 'axios';

interface ConfluenceConfig {
  baseUrl: string;        // https://yourcompany.atlassian.net
  username: string;       // your-email@company.com
  apiToken: string;       // API token from Atlassian
  spaceKeys: string[];    // ['DOCS', 'KB', 'SUPPORT']
}

export class ConfluenceIntegration {
  private config: ConfluenceConfig;
  
  constructor(config: ConfluenceConfig) {
    this.config = config;
  }
  
  /**
   * Sync all pages from Confluence spaces
   */
  async syncSpaces(): Promise<void> {
    for (const spaceKey of this.config.spaceKeys) {
      console.log(`📚 Syncing Confluence space: ${spaceKey}`);
      
      // Get all pages in space
      const pages = await this.getAllPages(spaceKey);
      console.log(`   Found ${pages.length} pages`);
      
      // Process each page
      for (const page of pages) {
        await this.processPage(page);
      }
    }
  }
  
  /**
   * Get all pages from a space
   */
  private async getAllPages(spaceKey: string): Promise<any[]> {
    const pages = [];
    let start = 0;
    const limit = 100;
    
    while (true) {
      const response = await axios.get(
        `${this.config.baseUrl}/wiki/rest/api/content`,
        {
          auth: {
            username: this.config.username,
            password: this.config.apiToken
          },
          params: {
            spaceKey,
            type: 'page',
            status: 'current',
            expand: 'body.storage,version,space',
            start,
            limit
          }
        }
      );
      
      pages.push(...response.data.results);
      
      if (response.data.results.length < limit) break;
      start += limit;
    }
    
    return pages;
  }
  
  /**
   * Process a single page
   */
  private async processPage(page: any): Promise<void> {
    // Extract content
    const content = this.extractContent(page.body.storage.value);
    
    // Import to Vector DB
    await documentIngestionService.ingestText({
      title: page.title,
      content,
      providerId: 'pinecone', // or from config
      category: 'confluence',
      metadata: {
        source: 'confluence',
        spaceKey: page.space.key,
        spaceName: page.space.name,
        pageId: page.id,
        url: `${this.config.baseUrl}/wiki${page._links.webui}`,
        lastModified: page.version.when,
        author: page.version.by.displayName
      },
      uploadedBy: 'confluence-integration'
    });
    
    console.log(`   ✅ Synced: ${page.title}`);
  }
  
  /**
   * Extract text from Confluence HTML
   */
  private extractContent(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
  
  /**
   * Setup webhook for real-time updates
   */
  async setupWebhook(callbackUrl: string): Promise<void> {
    // Confluence webhooks notify when pages are created/updated
    await axios.post(
      `${this.config.baseUrl}/wiki/rest/webhooks/1.0/webhook`,
      {
        name: 'Agent Hub Vector DB Sync',
        url: callbackUrl,
        events: [
          'page_created',
          'page_updated',
          'page_removed'
        ],
        filters: {
          'space-key': this.config.spaceKeys
        }
      },
      {
        auth: {
          username: this.config.username,
          password: this.config.apiToken
        }
      }
    );
    
    console.log('✅ Confluence webhook configured');
  }
}
```

### Usage

```typescript
// API endpoint to trigger Confluence sync
app.post('/api/v1/vector-db/integrations/confluence/sync', async (req, res) => {
  const { baseUrl, username, apiToken, spaceKeys } = req.body;
  
  const integration = new ConfluenceIntegration({
    baseUrl,
    username,
    apiToken,
    spaceKeys
  });
  
  await integration.syncSpaces();
  
  res.json({ success: true, message: 'Confluence sync complete' });
});
```

---

## Integration 2: SharePoint

### What It Does
- Syncs documents from SharePoint libraries
- Supports Office files (Word, Excel, PowerPoint)
- Maintains folder structure

### Implementation

```typescript
// services/integrations/sharepointIntegration.ts

import { Client } from '@microsoft/microsoft-graph-client';

interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;        // https://yourcompany.sharepoint.com/sites/docs
  libraryName: string;    // 'Documents' or 'Shared Documents'
}

export class SharePointIntegration {
  private client: Client;
  private config: SharePointConfig;
  
  constructor(config: SharePointConfig) {
    this.config = config;
    this.client = this.initializeClient();
  }
  
  /**
   * Initialize Microsoft Graph client
   */
  private initializeClient(): Client {
    return Client.init({
      authProvider: async (done) => {
        // Get access token
        const token = await this.getAccessToken();
        done(null, token);
      }
    });
  }
  
  /**
   * Get access token
   */
  private async getAccessToken(): Promise<string> {
    const response = await axios.post(
      `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    );
    
    return response.data.access_token;
  }
  
  /**
   * Sync all documents from SharePoint library
   */
  async syncLibrary(): Promise<void> {
    console.log(`📁 Syncing SharePoint library: ${this.config.libraryName}`);
    
    // Get site ID
    const site = await this.client
      .api(`/sites/${this.config.siteUrl}`)
      .get();
    
    // Get drive (library)
    const drives = await this.client
      .api(`/sites/${site.id}/drives`)
      .get();
    
    const drive = drives.value.find((d: any) => d.name === this.config.libraryName);
    
    if (!drive) {
      throw new Error(`Library ${this.config.libraryName} not found`);
    }
    
    // Get all files
    await this.syncFolder(drive.id, 'root');
  }
  
  /**
   * Sync a folder recursively
   */
  private async syncFolder(driveId: string, folderId: string): Promise<void> {
    const items = await this.client
      .api(`/drives/${driveId}/items/${folderId}/children`)
      .get();
    
    for (const item of items.value) {
      if (item.folder) {
        // Recursively sync subfolders
        await this.syncFolder(driveId, item.id);
      } else if (item.file) {
        // Process file
        await this.processFile(driveId, item);
      }
    }
  }
  
  /**
   * Process a single file
   */
  private async processFile(driveId: string, item: any): Promise<void> {
    // Skip non-document files
    const supportedExtensions = ['.docx', '.pdf', '.txt', '.md'];
    const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
    
    if (!supportedExtensions.includes(ext)) {
      return;
    }
    
    console.log(`   Processing: ${item.name}`);
    
    // Download file content
    const content = await this.client
      .api(`/drives/${driveId}/items/${item.id}/content`)
      .get();
    
    // Save to temp file
    const tempPath = `/tmp/${item.id}${ext}`;
    fs.writeFileSync(tempPath, content);
    
    // Ingest document
    await documentIngestionService.ingestDocument({
      filePath: tempPath,
      filename: item.name,
      category: 'sharepoint',
      providerId: 'pinecone',
      metadata: {
        source: 'sharepoint',
        siteUrl: this.config.siteUrl,
        library: this.config.libraryName,
        itemId: item.id,
        url: item.webUrl,
        lastModified: item.lastModifiedDateTime,
        author: item.lastModifiedBy.user.displayName
      },
      uploadedBy: 'sharepoint-integration'
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    console.log(`   ✅ Synced: ${item.name}`);
  }
}
```

---

## Integration 3: Google Drive

### What It Does
- Syncs documents from Google Drive folders
- Supports Google Docs, Sheets, PDFs
- Real-time updates via webhooks

### Implementation

```typescript
// services/integrations/googleDriveIntegration.ts

import { google } from 'googleapis';

interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;       // Google Drive folder ID
}

export class GoogleDriveIntegration {
  private drive: any;
  private config: GoogleDriveConfig;
  
  constructor(config: GoogleDriveConfig) {
    this.config = config;
    this.drive = this.initializeDrive();
  }
  
  /**
   * Initialize Google Drive client
   */
  private initializeDrive() {
    const oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret
    );
    
    oauth2Client.setCredentials({
      refresh_token: this.config.refreshToken
    });
    
    return google.drive({ version: 'v3', auth: oauth2Client });
  }
  
  /**
   * Sync all files from folder
   */
  async syncFolder(): Promise<void> {
    console.log(`📂 Syncing Google Drive folder: ${this.config.folderId}`);
    
    // Get all files in folder
    const response = await this.drive.files.list({
      q: `'${this.config.folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
      pageSize: 1000
    });
    
    const files = response.data.files;
    console.log(`   Found ${files.length} files`);
    
    for (const file of files) {
      await this.processFile(file);
    }
  }
  
  /**
   * Process a single file
   */
  private async processFile(file: any): Promise<void> {
    console.log(`   Processing: ${file.name}`);
    
    let content: string;
    
    // Handle different file types
    if (file.mimeType === 'application/vnd.google-apps.document') {
      // Google Doc - export as plain text
      const response = await this.drive.files.export({
        fileId: file.id,
        mimeType: 'text/plain'
      });
      content = response.data;
      
    } else if (file.mimeType === 'application/pdf') {
      // PDF - download and extract
      const response = await this.drive.files.get({
        fileId: file.id,
        alt: 'media'
      }, { responseType: 'arraybuffer' });
      
      // Save and process PDF
      const tempPath = `/tmp/${file.id}.pdf`;
      fs.writeFileSync(tempPath, Buffer.from(response.data));
      
      await documentIngestionService.ingestDocument({
        filePath: tempPath,
        filename: file.name,
        category: 'google-drive',
        providerId: 'pinecone',
        metadata: {
          source: 'google-drive',
          fileId: file.id,
          url: file.webViewLink,
          lastModified: file.modifiedTime
        },
        uploadedBy: 'google-drive-integration'
      });
      
      fs.unlinkSync(tempPath);
      return;
      
    } else {
      console.log(`   ⏭️  Skipped: Unsupported type ${file.mimeType}`);
      return;
    }
    
    // Ingest text content
    await documentIngestionService.ingestText({
      title: file.name,
      content,
      providerId: 'pinecone',
      category: 'google-drive',
      metadata: {
        source: 'google-drive',
        fileId: file.id,
        url: file.webViewLink,
        lastModified: file.modifiedTime
      },
      uploadedBy: 'google-drive-integration'
    });
    
    console.log(`   ✅ Synced: ${file.name}`);
  }
}
```

---

## Integration 4: Jira (Knowledge from Tickets)

### What It Does
- Extracts knowledge from resolved tickets
- Builds FAQ from common issues
- Includes solutions and workarounds

### Implementation

```typescript
// services/integrations/jiraIntegration.ts

import axios from 'axios';

interface JiraConfig {
  baseUrl: string;        // https://yourcompany.atlassian.net
  username: string;
  apiToken: string;
  projectKeys: string[];  // ['SUPPORT', 'HELP']
}

export class JiraIntegration {
  private config: JiraConfig;
  
  constructor(config: JiraConfig) {
    this.config = config;
  }
  
  /**
   * Sync resolved tickets as knowledge
   */
  async syncResolvedTickets(): Promise<void> {
    for (const projectKey of this.config.projectKeys) {
      console.log(`🎫 Syncing Jira project: ${projectKey}`);
      
      // Get resolved tickets
      const tickets = await this.getResolvedTickets(projectKey);
      console.log(`   Found ${tickets.length} resolved tickets`);
      
      for (const ticket of tickets) {
        await this.processTicket(ticket);
      }
    }
  }
  
  /**
   * Get resolved tickets
   */
  private async getResolvedTickets(projectKey: string): Promise<any[]> {
    const response = await axios.get(
      `${this.config.baseUrl}/rest/api/3/search`,
      {
        auth: {
          username: this.config.username,
          password: this.config.apiToken
        },
        params: {
          jql: `project = ${projectKey} AND status = Resolved ORDER BY updated DESC`,
          maxResults: 1000,
          fields: 'summary,description,resolution,comment,created,updated'
        }
      }
    );
    
    return response.data.issues;
  }
  
  /**
   * Process a single ticket
   */
  private async processTicket(ticket: any): Promise<void> {
    // Build content from ticket
    const content = `
# ${ticket.fields.summary}

## Issue Description
${ticket.fields.description || 'No description provided'}

## Resolution
${ticket.fields.resolution?.description || 'Resolved'}

## Comments and Solutions
${this.extractComments(ticket.fields.comment)}
    `.trim();
    
    // Ingest as knowledge
    await documentIngestionService.ingestText({
      title: `${ticket.key}: ${ticket.fields.summary}`,
      content,
      providerId: 'pinecone',
      category: 'jira-knowledge',
      metadata: {
        source: 'jira',
        projectKey: ticket.fields.project.key,
        ticketKey: ticket.key,
        url: `${this.config.baseUrl}/browse/${ticket.key}`,
        created: ticket.fields.created,
        updated: ticket.fields.updated
      },
      uploadedBy: 'jira-integration'
    });
    
    console.log(`   ✅ Synced: ${ticket.key}`);
  }
  
  /**
   * Extract useful comments
   */
  private extractComments(commentData: any): string {
    if (!commentData || !commentData.comments) return '';
    
    return commentData.comments
      .map((c: any) => `**${c.author.displayName}:** ${c.body}`)
      .join('\n\n');
  }
}
```

---

## UI: Integration Management

Add a new tab to Vector DB Admin for managing integrations:

```typescript
// VectorDBIntegrationsManager.tsx

const VectorDBIntegrationsManager = () => {
  const [integrations, setIntegrations] = useState([]);
  
  return (
    <Container>
      <h3>🔗 Data Source Integrations</h3>
      
      <Row>
        {/* Confluence */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <h5>📚 Confluence</h5>
              <p className="text-muted">Sync wiki pages and documentation</p>
              
              <Form.Group className="mb-2">
                <Form.Label>Base URL</Form.Label>
                <Form.Control placeholder="https://yourcompany.atlassian.net" />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>API Token</Form.Label>
                <Form.Control type="password" />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>Space Keys (comma-separated)</Form.Label>
                <Form.Control placeholder="DOCS, KB, SUPPORT" />
              </Form.Group>
              
              <Button onClick={syncConfluence}>
                Sync Now
              </Button>
              
              <Form.Check 
                type="checkbox"
                label="Auto-sync daily"
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>
        
        {/* SharePoint */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <h5>📁 SharePoint</h5>
              <p className="text-muted">Sync document libraries</p>
              
              <Form.Group className="mb-2">
                <Form.Label>Site URL</Form.Label>
                <Form.Control placeholder="https://yourcompany.sharepoint.com/sites/docs" />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>Client ID</Form.Label>
                <Form.Control />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>Client Secret</Form.Label>
                <Form.Control type="password" />
              </Form.Group>
              
              <Button onClick={syncSharePoint}>
                Sync Now
              </Button>
              
              <Form.Check 
                type="checkbox"
                label="Auto-sync daily"
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>
        
        {/* Google Drive */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <h5>📂 Google Drive</h5>
              <p className="text-muted">Sync folders and documents</p>
              
              <Button variant="primary" onClick={connectGoogleDrive}>
                <FaGoogle /> Connect Google Drive
              </Button>
              
              <Form.Group className="mt-3">
                <Form.Label>Folder ID</Form.Label>
                <Form.Control placeholder="1a2b3c4d5e6f7g8h9i0j" />
              </Form.Group>
              
              <Button onClick={syncGoogleDrive} className="mt-2">
                Sync Now
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Jira */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <h5>🎫 Jira</h5>
              <p className="text-muted">Extract knowledge from tickets</p>
              
              <Form.Group className="mb-2">
                <Form.Label>Base URL</Form.Label>
                <Form.Control placeholder="https://yourcompany.atlassian.net" />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>API Token</Form.Label>
                <Form.Control type="password" />
              </Form.Group>
              
              <Form.Group className="mb-2">
                <Form.Label>Project Keys</Form.Label>
                <Form.Control placeholder="SUPPORT, HELP" />
              </Form.Group>
              
              <Button onClick={syncJira}>
                Sync Resolved Tickets
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Sync History */}
      <Card className="mt-4">
        <Card.Header>Sync History</Card.Header>
        <Card.Body>
          <Table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Last Sync</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>📚 Confluence (DOCS)</td>
                <td>2 hours ago</td>
                <td>150 pages</td>
                <td><Badge bg="success">Success</Badge></td>
                <td><Button size="sm">Sync Now</Button></td>
              </tr>
              <tr>
                <td>📁 SharePoint (Documents)</td>
                <td>1 day ago</td>
                <td>85 files</td>
                <td><Badge bg="success">Success</Badge></td>
                <td><Button size="sm">Sync Now</Button></td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};
```

---

## Scheduled Sync

Set up automatic syncing:

```typescript
// services/syncScheduler.ts

import cron from 'node-cron';

export class SyncScheduler {
  
  /**
   * Schedule daily syncs
   */
  static setupSchedules() {
    // Confluence - Daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running scheduled Confluence sync...');
      await this.syncConfluence();
    });
    
    // SharePoint - Daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('🔄 Running scheduled SharePoint sync...');
      await this.syncSharePoint();
    });
    
    // Google Drive - Every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Running scheduled Google Drive sync...');
      await this.syncGoogleDrive();
    });
    
    // Jira - Weekly on Sunday
    cron.schedule('0 4 * * 0', async () => {
      console.log('🔄 Running scheduled Jira sync...');
      await this.syncJira();
    });
  }
  
  private static async syncConfluence() {
    // Get saved configs from database
    const configs = await db.getIntegrationConfigs('confluence');
    
    for (const config of configs) {
      const integration = new ConfluenceIntegration(config);
      await integration.syncSpaces();
    }
  }
  
  // Similar methods for other integrations...
}
```

---

## Benefits of Integrations

### ✅ Automated
- No manual uploads
- Runs on schedule
- Real-time updates via webhooks

### ✅ Always Up-to-Date
- Syncs latest changes automatically
- Detects new/updated/deleted documents
- Keeps Vector DB current

### ✅ Scalable
- Handles thousands of documents
- Incremental updates (only changed docs)
- Parallel processing

### ✅ Comprehensive
- Pulls from multiple sources
- Unified knowledge base
- Single search across all systems

---

## Summary

**You're absolutely right!** Manual upload doesn't scale. Instead:

1. **Configure integrations** (Confluence, SharePoint, etc.)
2. **Run initial sync** (one-time bulk import)
3. **Enable auto-sync** (daily/hourly updates)
4. **Webhooks** (real-time updates when docs change)

**Result:** Your Vector DB stays automatically updated with knowledge from all your systems! 🎉

This is the **production-ready approach** that companies actually use!

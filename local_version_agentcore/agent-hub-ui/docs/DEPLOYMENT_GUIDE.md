# Frontend Deployment Guide - Knowledge Base Management UI

## Overview

This guide covers the deployment process for the Knowledge Base Management UI components built for the Modular Agent Builder feature.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Process](#build-process)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Verification](#verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher (or yarn v1.22.x)
- **Git**: v2.x or higher

### Required Access

- Access to deployment server/platform
- API endpoint URLs
- Environment variables
- SSL certificates (for production)

### Checklist

- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] SSL certificates obtained (production)
- [ ] Deployment credentials configured

---

## Build Process

### 1. Install Dependencies

```bash
cd local_version/agent-hub-ui
npm install
```

Or with yarn:

```bash
yarn install
```

### 2. Run Tests

Before building, ensure all tests pass:

```bash
# Run all tests
npm test -- --watchAll=false

# Run with coverage
npm test -- --coverage --watchAll=false
```

**Expected Output:**
```
Test Suites: 3 passed, 3 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        15.234 s
```

### 3. Build for Production

```bash
npm run build
```

**Build Output:**
```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  150.23 KB  build/static/js/main.abc123.js
  45.67 KB   build/static/css/main.def456.css
  
The build folder is ready to be deployed.
```

### 4. Verify Build

Check that the build directory contains:

```
build/
├── static/
│   ├── css/
│   │   └── main.*.css
│   ├── js/
│   │   └── main.*.js
│   └── media/
├── index.html
├── manifest.json
└── asset-manifest.json
```

---

## Environment Configuration

### Environment Variables

Create environment-specific configuration files:

#### Development (.env.development)

```env
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_ENV=development
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_LOG_LEVEL=debug
```

#### Staging (.env.staging)

```env
REACT_APP_API_URL=https://staging-api.agenthub.example.com/api/v1
REACT_APP_ENV=staging
REACT_APP_ENABLE_MOCK_DATA=false
REACT_APP_LOG_LEVEL=info
```

#### Production (.env.production)

```env
REACT_APP_API_URL=https://api.agenthub.example.com/api/v1
REACT_APP_ENV=production
REACT_APP_ENABLE_MOCK_DATA=false
REACT_APP_LOG_LEVEL=error
```

### Configuration Files

#### package.json Scripts

Ensure these scripts are configured:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "build:staging": "env-cmd -f .env.staging react-scripts build",
    "build:production": "env-cmd -f .env.production react-scripts build",
    "test": "react-scripts test",
    "test:ci": "react-scripts test --watchAll=false --coverage",
    "eject": "react-scripts eject"
  }
}
```

---

## Deployment Steps

### Option 1: Static Hosting (AWS S3 + CloudFront)

#### Step 1: Build for Production

```bash
npm run build:production
```

#### Step 2: Upload to S3

```bash
# Install AWS CLI if not already installed
# aws configure

# Sync build folder to S3
aws s3 sync build/ s3://your-bucket-name/ --delete

# Set cache control headers
aws s3 cp s3://your-bucket-name/ s3://your-bucket-name/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000"

# Set no-cache for index.html
aws s3 cp build/index.html s3://your-bucket-name/index.html \
  --metadata-directive REPLACE \
  --cache-control "no-cache, no-store, must-revalidate"
```

#### Step 3: Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Option 2: Docker Container

#### Step 1: Create Dockerfile

```dockerfile
# Build stage
FROM node:16-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:production

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Create nginx.conf

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### Step 3: Build and Deploy Docker Image

```bash
# Build image
docker build -t agenthub-ui:latest .

# Tag for registry
docker tag agenthub-ui:latest your-registry.com/agenthub-ui:latest

# Push to registry
docker push your-registry.com/agenthub-ui:latest

# Deploy (example with Docker Compose)
docker-compose up -d
```

### Option 3: Vercel/Netlify

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

---

## Verification

### Post-Deployment Checks

#### 1. Health Check

```bash
curl https://your-domain.com/health
# Expected: 200 OK
```

#### 2. UI Accessibility

Open browser and navigate to:
- `https://your-domain.com`
- `https://your-domain.com/knowledge-bases`

#### 3. Component Verification

Test each component:

**Knowledge Base Management:**
- [ ] Page loads without errors
- [ ] Statistics cards display correctly
- [ ] Knowledge base list renders
- [ ] Create modal opens
- [ ] Upload modal opens
- [ ] Search modal opens
- [ ] Dropdown menus work

**Document List:**
- [ ] Document table displays
- [ ] Pagination works
- [ ] Search filters documents
- [ ] Preview modal opens
- [ ] Delete modal opens

**Search Test:**
- [ ] Search query input works
- [ ] Sliders adjust values
- [ ] Search executes
- [ ] Results display
- [ ] Performance metrics show

#### 4. API Integration

Verify API calls:

```bash
# Check network tab in browser DevTools
# Verify API endpoints are called correctly
# Check for CORS issues
# Verify authentication headers
```

#### 5. Console Errors

Open browser console and check for:
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No network errors
- [ ] No CORS errors

#### 6. Performance

Run Lighthouse audit:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## Rollback Procedure

### Quick Rollback (S3/CloudFront)

#### Step 1: Identify Previous Version

```bash
# List S3 versions
aws s3api list-object-versions \
  --bucket your-bucket-name \
  --prefix index.html
```

#### Step 2: Restore Previous Version

```bash
# Copy previous version
aws s3 cp s3://your-bucket-name/index.html \
  s3://your-bucket-name/index.html \
  --version-id PREVIOUS_VERSION_ID
```

#### Step 3: Invalidate Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Docker Rollback

```bash
# List previous images
docker images agenthub-ui

# Deploy previous version
docker-compose down
docker-compose up -d agenthub-ui:PREVIOUS_TAG
```

### Vercel/Netlify Rollback

Both platforms provide one-click rollback in their dashboards:

1. Go to deployments page
2. Find previous successful deployment
3. Click "Rollback" or "Promote to Production"

---

## Troubleshooting

### Issue: Build Fails

**Symptoms:**
- npm run build fails
- TypeScript errors
- Missing dependencies

**Solutions:**

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16.x or higher

# Run tests first
npm test -- --watchAll=false
```

### Issue: White Screen After Deployment

**Symptoms:**
- Blank page loads
- Console shows 404 errors
- Assets not loading

**Solutions:**

1. Check `homepage` in package.json:
```json
{
  "homepage": "https://your-domain.com"
}
```

2. Verify build output:
```bash
ls -la build/
```

3. Check nginx/server configuration for SPA routing

### Issue: API Calls Fail

**Symptoms:**
- Network errors in console
- CORS errors
- 401 Unauthorized

**Solutions:**

1. Verify environment variables:
```bash
echo $REACT_APP_API_URL
```

2. Check CORS configuration on backend

3. Verify authentication headers

4. Test API directly:
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.agenthub.example.com/api/v1/knowledge-bases
```

### Issue: Slow Load Times

**Symptoms:**
- Long initial load
- Large bundle size
- Poor Lighthouse scores

**Solutions:**

1. Enable code splitting:
```typescript
// Use React.lazy for route-based splitting
const KnowledgeBaseManagement = React.lazy(() => 
  import('./components/KnowledgeBaseManagement')
);
```

2. Optimize images and assets

3. Enable compression (gzip/brotli)

4. Use CDN for static assets

### Issue: Components Not Rendering

**Symptoms:**
- Components show as blank
- React errors in console
- Missing imports

**Solutions:**

1. Check component imports:
```typescript
import KnowledgeBaseManagement from './components/KnowledgeBaseManagement';
```

2. Verify all dependencies installed:
```bash
npm install react-bootstrap bootstrap
```

3. Check for TypeScript errors:
```bash
npm run build
```

---

## Monitoring

### Application Monitoring

Set up monitoring for:

**Error Tracking:**
- Sentry
- Rollbar
- LogRocket

**Performance Monitoring:**
- Google Analytics
- New Relic
- Datadog

**User Analytics:**
- Mixpanel
- Amplitude
- Heap

### Example: Sentry Integration

```typescript
// src/index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.REACT_APP_ENV,
  tracesSampleRate: 1.0,
});
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --watchAll=false --coverage
      
      - name: Build
        run: npm run build:production
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync build/ s3://${{ secrets.S3_BUCKET }}/ --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_ID }} \
            --paths "/*"
```

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] API keys not exposed in frontend code
- [ ] Content Security Policy (CSP) configured
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Dependencies scanned for vulnerabilities
- [ ] Authentication tokens stored securely

---

## Performance Checklist

- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Lazy loading for routes
- [ ] Gzip/Brotli compression enabled
- [ ] CDN configured
- [ ] Cache headers set correctly
- [ ] Bundle size < 250KB (gzipped)
- [ ] Lighthouse score > 90

---

## Support

For deployment support:
- DevOps Team: devops@example.com
- Documentation: https://docs.agenthub.example.com/deployment
- Slack: #deployment-support

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**For**: Modular Agent Builder - Knowledge Base Management UI

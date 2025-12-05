# Troubleshooting Guide - Knowledge Base Management UI

## Overview

This guide provides solutions to common issues encountered when using the Knowledge Base Management UI components.

## Table of Contents

1. [Component Issues](#component-issues)
2. [API Integration Issues](#api-integration-issues)
3. [Search Issues](#search-issues)
4. [Upload Issues](#upload-issues)
5. [Performance Issues](#performance-issues)
6. [Browser Compatibility](#browser-compatibility)

---

## Component Issues

### Issue: Components Not Rendering

**Symptoms:**
- Blank page or white screen
- Components don't appear
- Console shows import errors

**Possible Causes:**
- Missing dependencies
- Incorrect import paths
- Build errors

**Solutions:**

1. **Check Dependencies:**
```bash
npm install react-bootstrap bootstrap
```

2. **Verify Imports:**
```typescript
// Correct import
import KnowledgeBaseManagement from './components/KnowledgeBaseManagement';

// Incorrect import
import KnowledgeBaseManagement from './KnowledgeBaseManagement'; // Missing path
```

3. **Check Console for Errors:**
- Open browser DevTools (F12)
- Check Console tab for error messages
- Look for missing module errors

4. **Rebuild Application:**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

---

### Issue: Modal Not Opening

**Symptoms:**
- Click button but modal doesn't appear
- Modal appears but is not visible
- Modal backdrop shows but content is missing

**Possible Causes:**
- State management issue
- CSS/Bootstrap not loaded
- Z-index conflicts

**Solutions:**

1. **Check Bootstrap CSS:**
```typescript
// In index.tsx or App.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
```

2. **Verify State:**
```typescript
// Check that state is being updated
const [showModal, setShowModal] = useState(false);

// Ensure onClick handler is correct
<Button onClick={() => setShowModal(true)}>Open Modal</Button>
```

3. **Check Z-Index:**
```css
/* If modal is behind other elements */
.modal {
  z-index: 1050 !important;
}
.modal-backdrop {
  z-index: 1040 !important;
}
```

---

### Issue: Dropdown Menu Not Working

**Symptoms:**
- Dropdown doesn't open on click
- Dropdown items not clickable
- Dropdown closes immediately

**Possible Causes:**
- Event propagation issues
- Bootstrap JavaScript not loaded
- Conflicting event handlers

**Solutions:**

1. **Check Bootstrap JavaScript:**
```typescript
// Ensure react-bootstrap is installed
npm install react-bootstrap
```

2. **Verify Dropdown Structure:**
```typescript
<Dropdown>
  <Dropdown.Toggle variant="link">
    <i className="bi bi-three-dots-vertical"></i>
  </Dropdown.Toggle>
  <Dropdown.Menu>
    <Dropdown.Item onClick={handleClick}>Action</Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
```

3. **Check Event Handlers:**
```typescript
// Prevent event propagation if needed
const handleClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  // Your logic here
};
```

---

## API Integration Issues

### Issue: API Calls Failing

**Symptoms:**
- Network errors in console
- 404 Not Found errors
- 500 Internal Server Error
- No data loading

**Possible Causes:**
- Incorrect API URL
- Missing authentication
- CORS issues
- Backend not running

**Solutions:**

1. **Verify API URL:**
```typescript
// Check environment variable
console.log(process.env.REACT_APP_API_URL);

// Should output: http://localhost:3000/api/v1 (development)
```

2. **Check Authentication:**
```typescript
// Verify auth headers are being sent
const response = await fetch('/api/v1/knowledge-bases', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

3. **Test API Directly:**
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/knowledge-bases

# Should return JSON response
```

4. **Check CORS:**
```javascript
// Backend should have CORS enabled
app.use(cors({
  origin: 'http://localhost:3001', // Frontend URL
  credentials: true
}));
```

---

### Issue: CORS Errors

**Symptoms:**
- Console shows "CORS policy" error
- Requests blocked by browser
- Preflight requests failing

**Error Message:**
```
Access to fetch at 'http://localhost:3000/api/v1/knowledge-bases' 
from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solutions:**

1. **Backend CORS Configuration:**
```javascript
// Express.js example
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3001', 'https://your-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

2. **Development Proxy:**
```json
// package.json
{
  "proxy": "http://localhost:3000"
}
```

3. **Verify Preflight:**
```bash
# Test OPTIONS request
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:3000/api/v1/knowledge-bases
```

---

### Issue: 401 Unauthorized

**Symptoms:**
- API returns 401 status
- User logged out unexpectedly
- Authentication fails

**Possible Causes:**
- Expired token
- Missing token
- Invalid token
- Token not sent in headers

**Solutions:**

1. **Check Token Expiration:**
```typescript
// Decode JWT to check expiration
const token = localStorage.getItem('token');
const decoded = jwtDecode(token);
console.log('Token expires:', new Date(decoded.exp * 1000));
```

2. **Refresh Token:**
```typescript
// Implement token refresh logic
const refreshToken = async () => {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
};
```

3. **Verify Token in Headers:**
```typescript
// Check network tab in DevTools
// Verify Authorization header is present
```

---

## Search Issues

### Issue: Search Returns No Results

**Symptoms:**
- Search executes but returns 0 results
- "No Results Found" message appears
- Expected documents not returned

**Possible Causes:**
- Similarity threshold too high
- Documents not indexed
- Query doesn't match content
- Indexing still in progress

**Solutions:**

1. **Lower Similarity Threshold:**
```typescript
// Try with lower threshold
minSimilarity: 0.5  // Instead of 0.7
```

2. **Check Document Status:**
```bash
# Verify documents are indexed
curl http://localhost:3000/api/v1/knowledge-bases/kb-123/documents
```

3. **Wait for Indexing:**
- Large documents may take time to index
- Check backend logs for indexing status
- Retry search after a few minutes

4. **Try Different Queries:**
```typescript
// Instead of: "password reset procedure"
// Try: "reset password"
// Or: "how to reset"
```

---

### Issue: Search Results Not Relevant

**Symptoms:**
- Results don't match query
- Low similarity scores
- Unexpected documents returned

**Possible Causes:**
- Similarity threshold too low
- Documents contain mixed content
- Query is too broad

**Solutions:**

1. **Raise Similarity Threshold:**
```typescript
minSimilarity: 0.8  // Instead of 0.6
```

2. **Use More Specific Queries:**
```typescript
// Instead of: "help"
// Try: "how to configure email settings"
```

3. **Review Document Content:**
- Check if documents contain relevant information
- Remove or update irrelevant documents
- Split mixed-content documents

4. **Adjust Top K:**
```typescript
topK: 3  // Instead of 10 (fewer, more relevant results)
```

---

### Issue: Search is Slow

**Symptoms:**
- Search takes > 2 seconds
- UI freezes during search
- Timeout errors

**Possible Causes:**
- Too many documents
- Large document sizes
- High Top K value
- Backend performance issues

**Solutions:**

1. **Reduce Top K:**
```typescript
topK: 5  // Instead of 20
```

2. **Optimize Documents:**
- Split large documents into smaller ones
- Remove unnecessary content
- Limit document size to < 10 pages

3. **Check Backend Performance:**
```bash
# Monitor backend logs
# Check database query times
# Verify vector DB performance
```

4. **Add Loading State:**
```typescript
// Show loading indicator
{searching && <Spinner animation="border" />}
```

---

## Upload Issues

### Issue: File Upload Fails

**Symptoms:**
- Upload button doesn't work
- Files not uploading
- Error message appears
- Upload progress stuck

**Possible Causes:**
- File size too large
- Unsupported file format
- Network issues
- Backend error

**Solutions:**

1. **Check File Size:**
```typescript
// Verify file size before upload
const maxSize = 10 * 1024 * 1024; // 10MB

if (file.size > maxSize) {
  alert('File size exceeds 10MB limit');
  return;
}
```

2. **Verify File Format:**
```typescript
const supportedFormats = ['.txt', '.md', '.json', '.pdf', '.docx'];
const fileExtension = file.name.substring(file.name.lastIndexOf('.'));

if (!supportedFormats.includes(fileExtension)) {
  alert('Unsupported file format');
  return;
}
```

3. **Check Network:**
```bash
# Test upload with curl
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "files=@document.pdf" \
  http://localhost:3000/api/v1/knowledge-bases/kb-123/documents
```

4. **Review Backend Logs:**
- Check for error messages
- Verify file processing
- Check disk space

---

### Issue: Upload Progress Not Showing

**Symptoms:**
- Progress bar doesn't update
- No feedback during upload
- Upload completes but no indication

**Possible Causes:**
- Progress tracking not implemented
- State not updating
- Component not re-rendering

**Solutions:**

1. **Implement Progress Tracking:**
```typescript
const [uploadProgress, setUploadProgress] = useState(0);

const handleUpload = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('files', file));
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const progress = (e.loaded / e.total) * 100;
      setUploadProgress(progress);
    }
  });
  
  xhr.open('POST', '/api/v1/knowledge-bases/kb-123/documents');
  xhr.send(formData);
};
```

2. **Show Progress Bar:**
```typescript
{uploading && (
  <ProgressBar 
    now={uploadProgress} 
    label={`${uploadProgress.toFixed(0)}%`}
  />
)}
```

---

## Performance Issues

### Issue: Slow Page Load

**Symptoms:**
- Page takes > 3 seconds to load
- Components render slowly
- UI feels sluggish

**Possible Causes:**
- Large bundle size
- Too many API calls
- Unoptimized images
- No code splitting

**Solutions:**

1. **Implement Code Splitting:**
```typescript
// Use React.lazy for route-based splitting
const KnowledgeBaseManagement = React.lazy(() => 
  import('./components/KnowledgeBaseManagement')
);

// Wrap with Suspense
<Suspense fallback={<Spinner />}>
  <KnowledgeBaseManagement />
</Suspense>
```

2. **Optimize API Calls:**
```typescript
// Use React Query for caching
import { useQuery } from 'react-query';

const { data, isLoading } = useQuery(
  'knowledgeBases',
  fetchKnowledgeBases,
  { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
);
```

3. **Lazy Load Images:**
```typescript
<img 
  src={imageUrl} 
  loading="lazy"
  alt="Description"
/>
```

4. **Check Bundle Size:**
```bash
npm run build
# Check build/static/js/*.js file sizes
# Should be < 250KB gzipped
```

---

### Issue: Memory Leaks

**Symptoms:**
- Browser tab uses increasing memory
- Page becomes unresponsive over time
- Browser crashes

**Possible Causes:**
- Event listeners not cleaned up
- Timers not cleared
- Subscriptions not unsubscribed

**Solutions:**

1. **Clean Up Event Listeners:**
```typescript
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

2. **Clear Timers:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // Do something
  }, 1000);
  
  // Cleanup
  return () => clearTimeout(timer);
}, []);
```

3. **Unsubscribe:**
```typescript
useEffect(() => {
  const subscription = observable.subscribe(data => {
    // Handle data
  });
  
  // Cleanup
  return () => subscription.unsubscribe();
}, []);
```

---

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Issue: Features Not Working in Older Browsers

**Symptoms:**
- Components don't render
- JavaScript errors
- Styling issues

**Solutions:**

1. **Add Polyfills:**
```bash
npm install react-app-polyfill
```

```typescript
// src/index.tsx (at the very top)
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
```

2. **Check Browser Support:**
```javascript
// Check if browser is supported
const isSupported = () => {
  return 'fetch' in window && 'Promise' in window;
};

if (!isSupported()) {
  alert('Please upgrade your browser');
}
```

---

## Getting Help

### Before Contacting Support

1. **Check Console for Errors:**
   - Open DevTools (F12)
   - Check Console tab
   - Note any error messages

2. **Check Network Tab:**
   - Open DevTools Network tab
   - Look for failed requests
   - Check response status codes

3. **Try Incognito Mode:**
   - Rules out extension conflicts
   - Tests with clean cache

4. **Clear Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache completely

### Information to Provide

When contacting support, include:

- **Browser and Version**: Chrome 96, Firefox 95, etc.
- **Operating System**: Windows 10, macOS 12, etc.
- **Error Messages**: Copy exact error text
- **Steps to Reproduce**: Detailed steps
- **Screenshots**: If applicable
- **Network Logs**: Export HAR file from DevTools

### Support Channels

- **Email**: support@example.com
- **Chat**: Available in-app
- **Documentation**: https://docs.agenthub.example.com
- **Community Forum**: https://forum.agenthub.example.com

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**For**: Modular Agent Builder - Knowledge Base Management UI

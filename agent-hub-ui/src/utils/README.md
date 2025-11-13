# API Client Utility

## Overview

The `apiClient.ts` provides a centralized way to make API requests with automatic authentication handling.

## Why Use This?

- **Automatic Authentication**: All requests automatically include the demo password header
- **Consistent Configuration**: Base URL and headers are configured in one place
- **Type Safety**: TypeScript support for better development experience
- **Easy to Maintain**: Update authentication logic in one place instead of every component

## Usage

### Basic GET Request

```typescript
import api from '../utils/apiClient';

const fetchData = async () => {
  const response = await api.get('/api/v1/agents');
  const data = await response.json();
  return data;
};
```

### POST Request with Data

```typescript
import api from '../utils/apiClient';

const createAgent = async (agentData) => {
  const response = await api.post('/api/v1/agents/create', agentData);
  const result = await response.json();
  return result;
};
```

### Other HTTP Methods

```typescript
// PUT
await api.put('/api/v1/agents/123', updatedData);

// DELETE
await api.delete('/api/v1/agents/123');

// PATCH
await api.patch('/api/v1/agents/123', partialUpdate);
```

### Skip Authentication (if needed)

```typescript
const response = await api.get('/health', { skipAuth: true });
```

### Custom Headers

```typescript
const response = await api.post('/api/v1/agents', data, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Configuration

Set these environment variables in your `.env` file:

```env
REACT_APP_API_BASE_URL=http://localhost:3002
REACT_APP_DEMO_PASSWORD=agenthub2024
```

## Migration Guide

### Before (Old Way)

```typescript
const response = await fetch('http://localhost:3002/api/v1/agents', {
  headers: {
    'Content-Type': 'application/json',
    'x-demo-password': 'agenthub2024'
  }
});
```

### After (New Way)

```typescript
import api from '../utils/apiClient';

const response = await api.get('/api/v1/agents');
```

## Benefits

1. **No More 401 Errors**: Authentication is handled automatically
2. **DRY Principle**: Don't repeat authentication logic everywhere
3. **Easy Updates**: Change auth method once, applies everywhere
4. **Environment Aware**: Automatically uses correct base URL per environment

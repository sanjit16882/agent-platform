# Handling Rate Limits - Developer Guide

## Quick Reference

When you see **HTTP 429 (Too Many Requests)** errors, follow this guide.

## Common Scenarios

### 1. Polling APIs

❌ **Bad - Aggressive Polling**
```typescript
while (true) {
  const response = await fetch('/api/status');
  await sleep(1000); // Too fast!
}
```

✅ **Good - Exponential Backoff**
```typescript
let delay = 2000; // Start with 2 seconds
const maxDelay = 10000;

while (attempts < maxAttempts) {
  try {
    const response = await fetch('/api/status');
    
    if (response.status === 429) {
      console.warn(`Rate limited, waiting ${delay}ms`);
      delay = Math.min(delay * 2, maxDelay);
      await sleep(delay);
      continue;
    }
    
    // Success - reset delay
    delay = 2000;
    
    if (response.data.completed) break;
    
  } catch (error) {
    break;
  }
  
  await sleep(delay);
  attempts++;
}
```

### 2. React useEffect Polling

❌ **Bad - No Cleanup**
```typescript
useEffect(() => {
  pollAPI(); // Runs twice in StrictMode!
}, []);
```

✅ **Good - With Cleanup**
```typescript
useEffect(() => {
  let cancelled = false;
  
  const poll = async () => {
    if (!cancelled) {
      await pollAPI();
    }
  };
  
  poll();
  
  return () => {
    cancelled = true; // Prevent double execution
  };
}, []);
```

### 3. Batch Operations

❌ **Bad - Parallel Flood**
```typescript
const results = await Promise.all(
  items.map(item => api.process(item))
); // Floods the API!
```

✅ **Good - Sequential with Delays**
```typescript
const results = [];
for (let i = 0; i < items.length; i++) {
  if (i > 0) {
    await sleep(1000); // Delay between requests
  }
  results.push(await api.process(items[i]));
}
```

✅ **Better - Controlled Concurrency**
```typescript
import pLimit from 'p-limit';

const limit = pLimit(3); // Max 3 concurrent requests
const results = await Promise.all(
  items.map(item => limit(() => api.process(item)))
);
```

## Rate Limit Headers

Always check these response headers:

```typescript
const response = await fetch('/api/endpoint');

console.log('Limit:', response.headers.get('X-RateLimit-Limit'));
console.log('Remaining:', response.headers.get('X-RateLimit-Remaining'));
console.log('Reset:', response.headers.get('X-RateLimit-Reset'));

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Retry after ${retryAfter} seconds`);
}
```

## Backend Rate Limit Configuration

### Current Limits (reliable-server.ts)

```typescript
// General API: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Dashboard: 50 requests per minute
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50
});

// Testing: 60 requests per minute
const testingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60
});
```

### Adding New Rate Limiters

```typescript
import rateLimit from 'express-rate-limit';

const myLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Time window
  max: 30, // Max requests per window
  message: {
    success: false,
    error: 'Custom rate limit message',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Optional: Skip certain requests
  skip: (req) => {
    return req.path === '/health'; // Don't rate limit health checks
  }
});

app.use('/api/my-endpoint', myLimiter);
```

## Best Practices

### 1. Start Conservative
- Begin with longer delays (2-5 seconds)
- Increase frequency only if needed
- Monitor rate limit headers

### 2. Implement Backoff
- Double delay on each 429 error
- Cap maximum delay (e.g., 30 seconds)
- Reset delay on successful requests

### 3. Add Delays Between Operations
```typescript
for (const item of items) {
  await processItem(item);
  await sleep(1000); // Breathing room
}
```

### 4. Use Request Queues
```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private delay = 1000;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      await sleep(this.delay);
    }
    
    this.processing = false;
  }
}
```

### 5. Cache Responses
```typescript
const cache = new Map();

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  cache.set(url, data);
  setTimeout(() => cache.delete(url), 60000); // Cache for 1 minute
  
  return data;
}
```

## Debugging Rate Limits

### 1. Enable Verbose Logging
```typescript
const DEBUG_RATE_LIMITS = true;

if (DEBUG_RATE_LIMITS) {
  console.log('🔍 Rate Limit Info:', {
    limit: response.headers.get('X-RateLimit-Limit'),
    remaining: response.headers.get('X-RateLimit-Remaining'),
    reset: new Date(response.headers.get('X-RateLimit-Reset') * 1000)
  });
}
```

### 2. Track Request Counts
```typescript
let requestCount = 0;
const startTime = Date.now();

async function trackedFetch(url: string) {
  requestCount++;
  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`Request #${requestCount} at ${elapsed.toFixed(1)}s`);
  
  return fetch(url);
}
```

### 3. Monitor in DevTools
1. Open Network tab
2. Filter by API endpoint
3. Check Status column for 429s
4. Inspect Headers tab for rate limit info

## Testing Rate Limits

### Unit Test Example
```typescript
describe('Rate Limit Handling', () => {
  it('should retry with backoff on 429', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({ status: 429 })
      .mockResolvedValueOnce({ status: 429 })
      .mockResolvedValueOnce({ status: 200, json: () => ({ data: 'success' }) });
    
    const result = await fetchWithRetry(mockFetch);
    
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.data).toBe('success');
  });
});
```

## Emergency Fixes

If you're getting rate limited in production:

1. **Immediate**: Increase backend rate limits temporarily
2. **Short-term**: Add exponential backoff to frontend
3. **Long-term**: Implement proper request queuing and caching

```typescript
// Emergency backend fix
const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200, // Temporarily doubled
  message: 'Rate limit temporarily increased'
});
```

## Resources

- [Express Rate Limit Docs](https://github.com/express-rate-limit/express-rate-limit)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**Remember**: Rate limits protect both the server and the user experience. Always implement proper backoff strategies!

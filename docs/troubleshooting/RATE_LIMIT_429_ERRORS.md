# Troubleshooting: HTTP 429 Rate Limit Errors

## Quick Fix Checklist

If you're seeing `429 (Too Many Requests)` errors:

### 1. ✅ Restart Backend Server (REQUIRED)
```bash
# Stop current server (Ctrl+C in terminal)
cd local_version/agent-hub-backend
npm start
```

**Why?** Rate limiter configuration changes only take effect after restart.

### 2. ✅ Wait for Rate Limit Reset
- **General API**: Resets every 15 minutes
- **Testing API**: Resets every 1 minute
- **Dashboard API**: Resets every 1 minute

**Quick check**: Wait 2 minutes, then try again.

### 3. ✅ Clear Browser State
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### 4. ✅ Check React StrictMode
If tests run twice, StrictMode is active:

```typescript
// In src/index.tsx, temporarily disable:
root.render(
  // <React.StrictMode>  // Comment this out
    <App />
  // </React.StrictMode>
);
```

**Note**: Only disable for testing, re-enable for production!

## Symptoms & Solutions

### Symptom: Immediate 429 on First Request

**Cause**: Previous test runs exhausted rate limit

**Solution**:
1. Wait 2 minutes
2. Restart backend
3. Clear browser cache
4. Try again

### Symptom: Tests Run Twice

**Cause**: React StrictMode double-mounting in development

**Solution**: Already fixed in code with cleanup function. If still happening:
- Check if StrictMode is enabled in `src/index.tsx`
- Verify cleanup function is present in `StepExecuteTests.tsx`

### Symptom: 429 After 3-4 Requests

**Cause**: Rate limit too restrictive or requests too fast

**Solution**: Backend rate limits are now:
- General API: 100 requests / 15 minutes
- Testing API: 60 requests / minute
- Polling: 2-10 second intervals with exponential backoff

If still hitting limits, increase backend limits temporarily:

```typescript
// In reliable-server.ts
const testingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120, // Doubled from 60
  // ...
});
```

## Monitoring Rate Limits

### In Browser DevTools

1. Open Network tab
2. Click any API request
3. Check Headers tab for:
   - `X-RateLimit-Limit`: Total allowed
   - `X-RateLimit-Remaining`: Requests left
   - `X-RateLimit-Reset`: When limit resets
   - `Retry-After`: Seconds to wait (on 429)

### Example Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700000000
Retry-After: 60
```

## Testing the Fix

### 1. Verify Backend is Running
```bash
curl http://localhost:3002/api/testing/agents
# Should return 200, not 429
```

### 2. Check Rate Limit Headers
```bash
curl -I http://localhost:3002/api/testing/agents
# Look for X-RateLimit-* headers
```

### 3. Test Frontend
1. Open browser to testing page
2. Open DevTools → Network tab
3. Start a test
4. Verify:
   - ✅ Only ONE "Starting test execution" log
   - ✅ 2-second delay before first request
   - ✅ No 429 errors
   - ✅ Exponential backoff on polling

## Emergency: Disable Rate Limiting

**Only for development/debugging:**

```typescript
// In reliable-server.ts, comment out rate limiters:
// app.use('/api/', generalLimiter);
// app.use('/api/testing', testingLimiter);
```

**Remember to re-enable before committing!**

## Current Configuration

### Frontend (StepExecuteTests.tsx)
- Initial delay: 2 seconds
- Polling start: 2 seconds
- Polling max: 10 seconds
- Exponential backoff: 2x on 429
- Delay between categories: 1 second

### Backend (reliable-server.ts)
- General API: 100 req / 15 min
- Testing API: 60 req / 1 min
- Dashboard API: 50 req / 1 min

## Still Having Issues?

### Check These:

1. **Multiple browser tabs?**
   - Each tab counts toward rate limit
   - Close extra tabs

2. **Multiple test runs?**
   - Wait for previous run to complete
   - Don't spam the "Run Tests" button

3. **Backend logs showing errors?**
   - Check terminal for rate limit messages
   - Look for "Too many requests" logs

4. **Network issues?**
   - Check if backend is actually running
   - Verify port 3002 is accessible
   - Check for proxy/firewall issues

### Debug Mode

Enable verbose logging:

```typescript
// In StepExecuteTests.tsx, add at top:
const DEBUG = true;

// Then in executeTests:
if (DEBUG) {
  console.log('🔍 Rate Limit Debug:', {
    timestamp: new Date().toISOString(),
    requestCount: /* track this */,
    lastRequest: /* track this */
  });
}
```

## Prevention

To avoid rate limits in the future:

1. ✅ Always use exponential backoff
2. ✅ Add delays between batch operations
3. ✅ Implement request queuing
4. ✅ Cache responses when possible
5. ✅ Use WebSockets for real-time updates (future)
6. ✅ Monitor rate limit headers
7. ✅ Handle 429 errors gracefully

## Related Documentation

- `docs/implementation/RATE_LIMIT_FIX.md` - Technical details
- `docs/guides/HANDLING_RATE_LIMITS.md` - Best practices
- `local_version/agent-hub-backend/src/reliable-server.ts` - Backend config
- `local_version/agent-hub-ui/src/components/testing/StepExecuteTests.tsx` - Frontend implementation

---

**Last Updated**: 2024-11-20
**Status**: Active fixes implemented, requires backend restart

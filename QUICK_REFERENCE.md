# Quick Reference - Today's Fixes

## 🔐 Authentication
- **API Client**: Always use `import api from '../utils/apiClient'`
- **Backend CORS**: Must include `'x-demo-password'` in allowedHeaders
- **Module Imports**: Use `.default` for TypeScript compiled modules

## 💾 Vector DB Persistence
- **Service**: vectorDBConfigService auto-loads on startup
- **Storage**: data/vectordb-configs.json
- **Endpoints**: /api/v1/vector-db/configs

## 🎨 UI Guidelines
- **Colors**: Use `secondary` or `light` badges (no bright colors)
- **Text**: Minimal descriptions, no long paragraphs
- **Modals**: Always use `centered` prop

## 🧭 Navigation
- Agent Templates: `/agent-templates` (under Resources)
- Vector DB: `/vector-db` (under Resources → Data & Knowledge)

## ⚠️ Never Do
- ❌ Remove `x-demo-password` from CORS
- ❌ Use raw `fetch()` instead of `api` client
- ❌ Add colorful badges back
- ❌ Remove `centered` from modals
- ❌ Delete vectorDBConfigService initialization

## ✅ Always Do
- ✅ Use apiClient for all API calls
- ✅ Test after server restart
- ✅ Check browser console for errors
- ✅ Verify configs persist

@echo off
echo 🧪 Testing AgentHub Backend Server...
echo.

cd backend

echo 📦 Installing dependencies...
call npm install

echo.
echo 🚀 Starting test server on port 3002...
echo.
echo ✅ If successful, you should see:
echo    • Server running message
echo    • Available endpoints
echo.
echo 🌐 Test URLs:
echo    • Health: http://localhost:3002/health
echo    • Root: http://localhost:3002/
echo    • Cost API: http://localhost:3002/api/v1/costs/dashboard
echo.
echo Press Ctrl+C to stop the server
echo.

npm run test-server
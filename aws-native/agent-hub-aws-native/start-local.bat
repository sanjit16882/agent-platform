@echo off
echo 🚀 Starting AgentHub Platform (AWS Native Version)...
echo.

echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)

echo.
echo 🔧 Starting Backend API on port 3002...
start "AgentHub Backend API" cmd /k "npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

cd ..\frontend
echo.
echo 📦 Installing frontend dependencies...
call npm install
if %errorLevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)

echo.
echo 🎨 Starting Frontend UI on port 3001...
start "AgentHub Frontend" cmd /k "cross-env REACT_APP_API_URL=http://localhost:3002 npm start"

echo.
echo ✅ AgentHub Platform is starting...
echo.
echo 🌐 Services will be available at:
echo    • Frontend UI:  http://localhost:3001
echo    • Backend API:  http://localhost:3002
echo    • Health Check: http://localhost:3002/health
echo    • Cost API:     http://localhost:3002/api/v1/costs/dashboard
echo.
echo 📊 Available Features:
echo    • Dashboard with CLI integration
echo    • Agent Catalog and Builder
echo    • Hybrid Agent Builder with AI
echo    • FinOps Dashboard with real AWS costs
echo    • Integration Guide and API Docs
echo    • CloudWatch Metrics
echo.
echo ⏳ Please wait for both services to fully start...
echo    Frontend will open automatically in your browser
echo.
pause
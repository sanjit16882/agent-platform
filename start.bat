@echo off
REM ========================================
REM Agent Hub Platform - Unified Startup
REM ========================================

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     Agent Hub Platform - Quick Start                     ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check if mode is specified
if "%1"=="" goto :menu
if /i "%1"=="local" goto :local
if /i "%1"=="demo" goto :demo
if /i "%1"=="help" goto :help
goto :menu

:menu
echo Select startup mode:
echo.
echo [1] Local Development (Full features, localhost only)
echo [2] Demo Mode (Mock data, safe for public)
echo [3] Help
echo [4] Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto :local
if "%choice%"=="2" goto :demo
if "%choice%"=="3" goto :help
if "%choice%"=="4" exit /b
goto :menu

:local
echo.
echo ═══════════════════════════════════════════════════════════
echo  Starting LOCAL Development Mode
echo ═══════════════════════════════════════════════════════════
echo.
echo ✅ Real AWS credentials will be used
echo ✅ Full development features enabled
echo ✅ Only accessible from localhost
echo.

echo 📊 Starting Backend (Local Mode)...
start "Backend-Local" cmd /k "cd agent-hub-backend && set NODE_ENV=development && set DEMO_MODE=false && node comprehensive-server.js"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend (Local Mode)...
start "Frontend-Local" cmd /k "cd agent-hub-ui && npm start"

echo.
echo ✅ Local development environment started!
echo.
echo 📱 Frontend: http://localhost:3001
echo 🔧 Backend:  http://localhost:3002
echo 📊 Learning: http://localhost:3001/learning
echo.
goto :end

:demo
echo.
echo ═══════════════════════════════════════════════════════════
echo  Starting DEMO Mode
echo ═══════════════════════════════════════════════════════════
echo.
echo ⚠️  DEMO MODE - Mock data will be used
echo 🔒 Real AWS credentials will NOT be exposed
echo 🌐 Safe for public access
echo.

echo 📊 Starting Backend (Demo Mode)...
start "Backend-Demo" cmd /k "cd agent-hub-backend && set NODE_ENV=demo && set DEMO_MODE=true && set USE_MOCK_AWS_DATA=true && node comprehensive-server.js"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend (Demo Mode)...
start "Frontend-Demo" cmd /k "cd agent-hub-ui && set REACT_APP_DEMO_MODE=true && npm start"

echo.
echo ✅ Demo environment started!
echo.
echo 📱 Local access: http://localhost:3001
echo.
echo 🌐 For public access, start Cloudflare Tunnel:
echo    cloudflared tunnel run agenthub-demo
echo.
goto :end

:help
echo.
echo ═══════════════════════════════════════════════════════════
echo  Agent Hub Platform - Startup Help
echo ═══════════════════════════════════════════════════════════
echo.
echo USAGE:
echo   start.bat              - Interactive menu
echo   start.bat local        - Start in local development mode
echo   start.bat demo         - Start in demo mode
echo   start.bat help         - Show this help
echo.
echo MODES:
echo.
echo   LOCAL DEVELOPMENT
echo   - Full features with real AWS credentials
echo   - Only accessible from localhost
echo   - Best for development and testing
echo.
echo   DEMO MODE
echo   - Uses mock data (no real AWS calls)
echo   - Safe for public demonstrations
echo   - Can be exposed via Cloudflare Tunnel
echo.
echo REQUIREMENTS:
echo   - Node.js 16+ installed
echo   - npm dependencies installed in both directories
echo   - AWS credentials configured (for local mode)
echo.
echo FIRST TIME SETUP:
echo   cd agent-hub-backend
echo   npm install
echo   cd ../agent-hub-ui
echo   npm install
echo.
echo ACCESS POINTS:
echo   Frontend:  http://localhost:3001
echo   Backend:   http://localhost:3002
echo   Learning:  http://localhost:3001/learning
echo   Agents:    http://localhost:3001/agents
echo.
goto :end

:end
echo.
pause

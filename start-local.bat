@echo off
echo ========================================
echo   Agent Factory - Local Development
echo ========================================
echo.
echo Starting local development environment...
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:3002
echo.

REM Check if ports are available
echo Checking ports...
netstat -an | findstr :3001 >nul
if %errorlevel% == 0 (
    echo WARNING: Port 3001 is already in use
    echo Please stop the process using port 3001 or use a different port
    pause
    exit /b 1
)

netstat -an | findstr :3002 >nul
if %errorlevel% == 0 (
    echo WARNING: Port 3002 is already in use
    echo Please stop the process using port 3002 or use a different port
    pause
    exit /b 1
)

echo Ports are available!
echo.

REM Start backend in new window
echo Starting backend server...
start "Agent Factory Backend" cmd /k "cd agent-hub-backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting frontend server...
start "Agent Factory Frontend" cmd /k "cd agent-hub-ui && npm start"

echo.
echo ========================================
echo   Both servers are starting...
echo   Please wait for them to fully load
echo ========================================
echo.
echo Frontend will open at: http://localhost:3001
echo Backend API available at: http://localhost:3002
echo.
echo 🛠️  Developer Tools Available:
echo    VSCode Extension: Right-click code files for agent actions
echo    CLI Tool: Use 'agent' command in terminal
echo    Setup: Run setup-developer-tools.bat if not installed
echo.
echo Press any key to exit this window...
pause >nul
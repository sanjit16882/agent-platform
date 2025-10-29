@echo off
echo 🧹 Cleaning up ports 3001 and 3002...
echo.

REM Kill any processes using port 3001
echo 🔍 Checking port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr LISTENING') do (
    echo 🛑 Killing process %%a on port 3001
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any processes using port 3002
echo 🔍 Checking port 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr LISTENING') do (
    echo 🛑 Killing process %%a on port 3002
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ✅ Ports 3001 and 3002 are now available
echo.
pause
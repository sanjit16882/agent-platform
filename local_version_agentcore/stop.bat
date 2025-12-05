@echo off
REM ========================================
REM Agent Hub Platform - Stop All Services
REM ========================================

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     Stopping Agent Hub Platform                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo 🛑 Stopping all Node.js processes...
echo.

REM Kill all node processes (be careful if you have other Node apps running)
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo ✅ Node.js processes stopped
) else (
    echo ℹ️  No Node.js processes found
)

echo.
echo 🛑 Stopping npm processes...
taskkill /F /IM npm.cmd 2>nul

echo.
echo ✅ All services stopped!
echo.
pause

@echo off
echo 🔍 Checking Agent Hub Port Usage...
echo.

echo 📊 Port 3001 (Frontend):
netstat -ano | findstr ":3001" | findstr LISTENING
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on port 3001
) else (
    echo ❌ Frontend is not running on port 3001
)
echo.

echo 📊 Port 3002 (Backend):
netstat -ano | findstr ":3002" | findstr LISTENING
if %errorlevel% equ 0 (
    echo ✅ Backend is running on port 3002
) else (
    echo ❌ Backend is not running on port 3002
)
echo.

echo 📊 Port 3000 (Should be free):
netstat -ano | findstr ":3000" | findstr LISTENING
if %errorlevel% equ 0 (
    echo ⚠️  Something is still using port 3000
) else (
    echo ✅ Port 3000 is free
)
echo.

echo 🎯 Your clean setup:
echo   Frontend: http://localhost:3001
echo   Backend:  http://localhost:3002
echo.
pause
@echo off
echo ========================================
echo Forcing Complete Frontend Rebuild
echo ========================================
echo.

echo Step 1: Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing build cache...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Step 3: Starting fresh development server...
echo.
echo The browser will open automatically.
echo When it opens, press Ctrl+Shift+R to hard refresh!
echo.
npm start

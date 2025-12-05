@echo off
echo Building TypeScript...
call npm run build

echo.
echo Restarting server...
echo Press Ctrl+C to stop the server when ready
echo.
call npm start

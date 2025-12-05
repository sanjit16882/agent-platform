@echo off
echo Starting Agent Hub in LOCAL environment...

REM Set environment variables for local development
set NODE_ENV=local
set PORT=3002

REM Create local data directory if it doesn't exist
if not exist "data" mkdir data
if not exist "logs" mkdir logs

echo Environment: %NODE_ENV%
echo Port: %PORT%

REM Start the backend server
cd agent-hub-backend
npm run dev

pause
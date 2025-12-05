@echo off
echo Starting Agent Hub in PRODUCTION environment...

REM Set environment variables for production
set NODE_ENV=production
set PORT=8080

REM Validate required environment variables
if "%JWT_SECRET%"=="" (
    echo ERROR: JWT_SECRET environment variable is required for production
    pause
    exit /b 1
)

if "%REDIS_HOST%"=="" (
    echo ERROR: REDIS_HOST environment variable is required for production
    pause
    exit /b 1
)

echo Environment: %NODE_ENV%
echo Port: %PORT%

REM Build and start the production server
cd agent-hub-backend
npm run build
npm start

pause
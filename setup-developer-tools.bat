@echo off
echo ========================================
echo   AgentHub Developer Tools Setup
echo ========================================
echo.
echo Setting up VSCode Extension and CLI Tool...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    pause
    exit /b 1
)

REM Check if VSCode is available
code --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: VSCode 'code' command not found
    echo VSCode extension installation will be skipped
    echo You can install manually: code --install-extension agenthub-1.0.0.vsix
    set SKIP_VSCODE=1
) else (
    set SKIP_VSCODE=0
)

echo.
echo ========================================
echo   1. Setting up CLI Tool
echo ========================================
echo.

cd agent-hub-cli
if not exist package.json (
    echo ERROR: agent-hub-cli/package.json not found
    echo Please ensure you're in the correct directory
    pause
    exit /b 1
)

echo Installing CLI dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install CLI dependencies
    pause
    exit /b 1
)

echo Building CLI...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build CLI
    pause
    exit /b 1
)

echo Linking CLI globally...
call npm link
if %errorlevel% neq 0 (
    echo ERROR: Failed to link CLI globally
    echo You may need to run as administrator
    pause
    exit /b 1
)

echo.
echo ✅ CLI Tool installed successfully!
echo Test with: agent --version

cd ..

if %SKIP_VSCODE% equ 1 (
    echo.
    echo ⚠️  VSCode extension skipped - install manually:
    echo    cd agenthub-vscode-extension
    echo    code --install-extension agenthub-1.0.0.vsix
    goto :configure
)

echo.
echo ========================================
echo   2. Setting up VSCode Extension
echo ========================================
echo.

cd agenthub-vscode-extension
if not exist agenthub-1.0.0.vsix (
    echo Building VSCode extension...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install VSCode extension dependencies
        pause
        exit /b 1
    )
    
    call npm run compile
    if %errorlevel% neq 0 (
        echo ERROR: Failed to compile VSCode extension
        pause
        exit /b 1
    )
    
    call npm run package
    if %errorlevel% neq 0 (
        echo ERROR: Failed to package VSCode extension
        pause
        exit /b 1
    )
)

echo Installing VSCode extension...
code --install-extension agenthub-1.0.0.vsix
if %errorlevel% neq 0 (
    echo ERROR: Failed to install VSCode extension
    echo Try installing manually: code --install-extension agenthub-1.0.0.vsix
    pause
    exit /b 1
)

echo.
echo ✅ VSCode Extension installed successfully!

cd ..

:configure
echo.
echo ========================================
echo   3. Configuration
echo ========================================
echo.

echo Configuring CLI tool...
agent config set --api-url http://localhost:3002
if %errorlevel% neq 0 (
    echo WARNING: Failed to configure CLI automatically
    echo Please run manually: agent config setup
)

echo.
echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo Developer tools are now installed:
echo.
echo 🖥️  CLI Tool:
echo    - Test: agent --version
echo    - Configure: agent config setup
echo    - Initialize project: agent init
echo.
echo 🎨 VSCode Extension:
echo    - Open VSCode and check Extensions panel
echo    - Configure: Settings → AgentHub → API URL: http://localhost:3002
echo    - Test: Ctrl+Shift+P → "AgentHub: List Available Agents"
echo.
echo 📚 Documentation:
echo    - See DEVELOPER-TOOLS-INTEGRATION.md for full guide
echo.
echo Next steps:
echo 1. Start the platform: start-local.bat
echo 2. Open your project in VSCode
echo 3. Right-click any code file → AgentHub options
echo 4. Or use CLI: agent test, agent scan, etc.
echo.
pause
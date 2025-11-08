#!/usr/bin/env pwsh

# Run Infrastructure Tests for MCP Integration
# This script runs both unit tests and integration tests for the infrastructure

param(
    [string]$Environment = "dev",
    [string]$TestType = "all", # all, unit, integration
    [switch]$Coverage = $false,
    [switch]$Verbose = $false,
    [switch]$Watch = $false
)

Write-Host "🧪 Running Infrastructure Tests" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Test Type: $TestType" -ForegroundColor Yellow

# Set environment variables
$env:TEST_ENVIRONMENT = $Environment
$env:AWS_REGION = "us-east-1"
$env:NODE_ENV = "test"

# Change to infrastructure directory
Set-Location "infrastructure"

try {
    # Install dependencies if needed
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing test dependencies..." -ForegroundColor Blue
        npm install
    }

    # Install additional test dependencies
    Write-Host "📦 Installing Jest and testing dependencies..." -ForegroundColor Blue
    npm install --save-dev jest @types/jest ts-jest @aws-sdk/client-cloudformation @aws-sdk/client-ecs @aws-sdk/client-elastic-load-balancing-v2 @aws-sdk/client-cloudwatch-logs @aws-sdk/client-cloudwatch @aws-sdk/client-sns node-fetch @types/node-fetch

    # Build TypeScript
    Write-Host "🔨 Building TypeScript..." -ForegroundColor Blue
    npm run build

    # Configure Jest
    if (!(Test-Path "jest.config.js")) {
        Write-Host "⚙️ Creating Jest configuration..." -ForegroundColor Blue
        @"
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 60000,
  maxWorkers: 1
};
"@ | Out-File -FilePath "jest.config.js" -Encoding UTF8
    }

    # Create test setup file
    if (!(Test-Path "test/setup.ts")) {
        Write-Host "⚙️ Creating test setup..." -ForegroundColor Blue
        New-Item -ItemType Directory -Force -Path "test" | Out-Null
        @"
// Test setup file
import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(60000);

// Mock AWS SDK calls in unit tests
if (process.env.NODE_ENV === 'test') {
  // Add any global test setup here
}
"@ | Out-File -FilePath "test/setup.ts" -Encoding UTF8
    }

    # Update package.json with test scripts
    Write-Host "⚙️ Updating package.json test scripts..." -ForegroundColor Blue
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    if (!$packageJson.scripts) {
        $packageJson.scripts = @{}
    }
    
    $packageJson.scripts."test" = "jest"
    $packageJson.scripts."test:unit" = "jest --testPathPattern=test --testPathIgnorePatterns=integration"
    $packageJson.scripts."test:integration" = "jest --testPathPattern=integration"
    $packageJson.scripts."test:watch" = "jest --watch"
    $packageJson.scripts."test:coverage" = "jest --coverage"
    
    $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding UTF8

    # Run tests based on type
    $jestArgs = @()
    
    if ($TestType -eq "unit") {
        $jestArgs += "--testPathPattern=test"
        $jestArgs += "--testPathIgnorePatterns=integration"
        Write-Host "🧪 Running unit tests..." -ForegroundColor Blue
    } elseif ($TestType -eq "integration") {
        $jestArgs += "--testPathPattern=integration"
        Write-Host "🧪 Running integration tests..." -ForegroundColor Blue
        Write-Host "⚠️  Note: Integration tests require deployed infrastructure" -ForegroundColor Yellow
    } else {
        Write-Host "🧪 Running all tests..." -ForegroundColor Blue
    }

    if ($Coverage) {
        $jestArgs += "--coverage"
    }

    if ($Verbose) {
        $jestArgs += "--verbose"
    }

    if ($Watch) {
        $jestArgs += "--watch"
    }

    # Add timeout for integration tests
    if ($TestType -eq "integration" -or $TestType -eq "all") {
        $jestArgs += "--testTimeout=120000"
    }

    # Run Jest
    $jestCommand = "npx jest " + ($jestArgs -join " ")
    Write-Host "Executing: $jestCommand" -ForegroundColor Cyan
    
    Invoke-Expression $jestCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed!" -ForegroundColor Green
        
        if ($Coverage) {
            Write-Host ""
            Write-Host "📊 Coverage report generated in coverage/ directory" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "🎯 Test Summary:" -ForegroundColor Yellow
        Write-Host "• Unit tests validate CDK template generation" -ForegroundColor White
        Write-Host "• Integration tests validate deployed infrastructure" -ForegroundColor White
        Write-Host "• All infrastructure components are tested" -ForegroundColor White
        
    } else {
        Write-Host "❌ Some tests failed!" -ForegroundColor Red
        
        Write-Host ""
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "• Check that infrastructure is deployed for integration tests" -ForegroundColor White
        Write-Host "• Verify AWS credentials are configured" -ForegroundColor White
        Write-Host "• Review test output for specific failures" -ForegroundColor White
        Write-Host "• Run with --verbose for detailed output" -ForegroundColor White
        
        exit 1
    }

} catch {
    Write-Host "❌ Error running tests: $_" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    Set-Location ".."
}

Write-Host ""
Write-Host "📋 Available Test Commands:" -ForegroundColor Cyan
Write-Host "• Unit tests only: ./run-infrastructure-tests.ps1 -TestType unit" -ForegroundColor White
Write-Host "• Integration tests: ./run-infrastructure-tests.ps1 -TestType integration" -ForegroundColor White
Write-Host "• With coverage: ./run-infrastructure-tests.ps1 -Coverage" -ForegroundColor White
Write-Host "• Watch mode: ./run-infrastructure-tests.ps1 -Watch" -ForegroundColor White
Write-Host "• Verbose output: ./run-infrastructure-tests.ps1 -Verbose" -ForegroundColor White

Write-Host ""
Write-Host "🏁 Infrastructure testing completed!" -ForegroundColor Green
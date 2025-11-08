#!/usr/bin/env pwsh

# Test Tool Execution API Endpoints
# This script tests the deployed tool execution API endpoints

param(
    [string]$Environment = "dev",
    [string]$ApiUrl = "",
    [switch]$Detailed = $false
)

if ($ApiUrl -eq "") {
    # Get API URL from CloudFormation stack
    $ApiUrl = aws cloudformation describe-stacks --stack-name "AgentHubStack-$Environment" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0 -or $ApiUrl -eq "" -or $ApiUrl -eq "None") {
        Write-Host "❌ Could not retrieve API Gateway URL. Make sure the Agent Hub stack is deployed." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🧪 Testing Tool Execution API" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow

$baseUrl = "$ApiUrl/api/v1/tool-execution"
$testResults = @()

try {
    # Test 1: Health Check
    Write-Host ""
    Write-Host "🏥 Testing Health Check Endpoint..." -ForegroundColor Blue
    
    try {
        $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 10
        
        if ($healthResponse.success -and $healthResponse.data.status -eq "healthy") {
            Write-Host "✅ Health check passed" -ForegroundColor Green
            $testResults += @{ Test = "Health Check"; Status = "PASS"; Details = $healthResponse.data.service }
        } else {
            Write-Host "⚠️  Health check returned unhealthy status" -ForegroundColor Yellow
            $testResults += @{ Test = "Health Check"; Status = "WARN"; Details = $healthResponse.data.status }
        }
        
        if ($Detailed) {
            Write-Host "   Service: $($healthResponse.data.service)" -ForegroundColor Cyan
            Write-Host "   Environment: $($healthResponse.data.environment)" -ForegroundColor Cyan
            Write-Host "   Stats: $($healthResponse.data.stats | ConvertTo-Json -Compress)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Health Check"; Status = "FAIL"; Details = $_.Exception.Message }
    }

    # Test 2: Tool Execution Request
    Write-Host ""
    Write-Host "⚡ Testing Tool Execution Request..." -ForegroundColor Blue
    
    $executionRequest = @{
        agentId = "test-agent-$(Get-Random)"
        toolName = "excel_create_workbook"
        parameters = @{
            filename = "test-workbook.xlsx"
            data = @(
                @("Name", "Department", "Salary"),
                @("John Doe", "Engineering", 75000),
                @("Jane Smith", "Marketing", 65000)
            )
        }
        priority = "normal"
        timeout = 30000
        metadata = @{
            testRun = $true
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    }
    
    try {
        $executeResponse = Invoke-RestMethod -Uri "$baseUrl/execute" -Method POST -Body ($executionRequest | ConvertTo-Json -Depth 10) -ContentType "application/json" -TimeoutSec 10
        
        if ($executeResponse.success) {
            Write-Host "✅ Tool execution request accepted" -ForegroundColor Green
            $testResults += @{ Test = "Tool Execution"; Status = "PASS"; Details = $executeResponse.data.executionId }
            
            $executionId = $executeResponse.data.executionId
            
            if ($Detailed) {
                Write-Host "   Execution ID: $executionId" -ForegroundColor Cyan
                Write-Host "   Status: $($executeResponse.data.status)" -ForegroundColor Cyan
                Write-Host "   Priority: $($executeResponse.data.priority)" -ForegroundColor Cyan
            }
            
            # Test 3: Status Check
            Write-Host ""
            Write-Host "📊 Testing Status Check..." -ForegroundColor Blue
            
            try {
                Start-Sleep -Seconds 2 # Wait a moment for processing
                $statusResponse = Invoke-RestMethod -Uri "$baseUrl/status/$executionId" -Method GET -TimeoutSec 10
                
                if ($statusResponse.success) {
                    Write-Host "✅ Status check successful" -ForegroundColor Green
                    $testResults += @{ Test = "Status Check"; Status = "PASS"; Details = $statusResponse.data.status }
                    
                    if ($Detailed) {
                        Write-Host "   Status: $($statusResponse.data.status)" -ForegroundColor Cyan
                        Write-Host "   Created: $($statusResponse.data.createdAt)" -ForegroundColor Cyan
                        Write-Host "   Updated: $($statusResponse.data.updatedAt)" -ForegroundColor Cyan
                    }
                } else {
                    Write-Host "❌ Status check failed" -ForegroundColor Red
                    $testResults += @{ Test = "Status Check"; Status = "FAIL"; Details = "API returned success=false" }
                }
            } catch {
                Write-Host "❌ Status check failed: $($_.Exception.Message)" -ForegroundColor Red
                $testResults += @{ Test = "Status Check"; Status = "FAIL"; Details = $_.Exception.Message }
            }
            
            # Test 4: Cancellation (if execution is still pending)
            if ($statusResponse.data.status -in @("pending", "queued", "running")) {
                Write-Host ""
                Write-Host "🛑 Testing Execution Cancellation..." -ForegroundColor Blue
                
                try {
                    $cancelRequest = @{
                        executionId = $executionId
                        reason = "API test cancellation"
                    }
                    
                    $cancelResponse = Invoke-RestMethod -Uri "$baseUrl/cancel" -Method POST -Body ($cancelRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
                    
                    if ($cancelResponse.success) {
                        Write-Host "✅ Execution cancellation successful" -ForegroundColor Green
                        $testResults += @{ Test = "Cancellation"; Status = "PASS"; Details = $cancelResponse.data.status }
                    } else {
                        Write-Host "❌ Execution cancellation failed" -ForegroundColor Red
                        $testResults += @{ Test = "Cancellation"; Status = "FAIL"; Details = "API returned success=false" }
                    }
                } catch {
                    Write-Host "❌ Execution cancellation failed: $($_.Exception.Message)" -ForegroundColor Red
                    $testResults += @{ Test = "Cancellation"; Status = "FAIL"; Details = $_.Exception.Message }
                }
            } else {
                Write-Host "ℹ️  Skipping cancellation test (execution not in cancellable state)" -ForegroundColor Blue
                $testResults += @{ Test = "Cancellation"; Status = "SKIP"; Details = "Execution not cancellable" }
            }
            
        } else {
            Write-Host "❌ Tool execution request failed" -ForegroundColor Red
            $testResults += @{ Test = "Tool Execution"; Status = "FAIL"; Details = "API returned success=false" }
        }
    } catch {
        Write-Host "❌ Tool execution request failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Tool Execution"; Status = "FAIL"; Details = $_.Exception.Message }
    }

    # Test 5: Invalid Request Validation
    Write-Host ""
    Write-Host "🔍 Testing Request Validation..." -ForegroundColor Blue
    
    try {
        $invalidRequest = @{
            # Missing required fields
            parameters = @{}
        }
        
        $validationResponse = Invoke-RestMethod -Uri "$baseUrl/execute" -Method POST -Body ($invalidRequest | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        # This should fail with 400
        Write-Host "❌ Validation test failed - invalid request was accepted" -ForegroundColor Red
        $testResults += @{ Test = "Request Validation"; Status = "FAIL"; Details = "Invalid request was accepted" }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ Request validation working correctly" -ForegroundColor Green
            $testResults += @{ Test = "Request Validation"; Status = "PASS"; Details = "400 Bad Request returned" }
        } else {
            Write-Host "❌ Unexpected validation response: $($_.Exception.Message)" -ForegroundColor Red
            $testResults += @{ Test = "Request Validation"; Status = "FAIL"; Details = $_.Exception.Message }
        }
    }

} catch {
    Write-Host "❌ API testing error: $_" -ForegroundColor Red
    exit 1
}

# Test Summary
Write-Host ""
Write-Host "📋 API Test Summary" -ForegroundColor Blue
Write-Host "==================" -ForegroundColor Blue

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$skipCount = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count

foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        "SKIP" { "Blue" }
        default { "White" }
    }
    
    Write-Host "[$($result.Status)] $($result.Test): $($result.Details)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Results: $passCount passed, $failCount failed, $warnCount warnings, $skipCount skipped" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "🎯 All critical tests passed!" -ForegroundColor Green
    Write-Host "The Tool Execution Engine is ready for MCP integration." -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 Available Endpoints:" -ForegroundColor Yellow
    Write-Host "• POST $baseUrl/execute - Submit tool execution requests" -ForegroundColor White
    Write-Host "• GET  $baseUrl/status/{executionId} - Get execution status" -ForegroundColor White
    Write-Host "• POST $baseUrl/cancel - Cancel pending executions" -ForegroundColor White
    Write-Host "• GET  $baseUrl/health - Health check" -ForegroundColor White
    
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed. Review the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏁 API testing completed!" -ForegroundColor Green
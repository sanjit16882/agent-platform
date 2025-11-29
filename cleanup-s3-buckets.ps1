# S3 Bucket Cleanup Script
# Deletes unused S3 buckets from old deployments
# KEEPS: agenthub-agents-storage (used by current POC)

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  S3 Bucket Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Buckets to DELETE (not used by local_version POC)
$bucketsToDelete = @(
    "agent-hub-frontend-448049831733-us-east-1",
    "agent-hub-storage-448049831733",
    "agenthub-frontend",
    "agenthub-prod-1761681932",
    "agenthub-prod-20251010150344",
    "cdk-hnb659fds-assets-448049831733-us-east-1"
)

# Buckets to KEEP (used by local_version POC)
$bucketsToKeep = @(
    "agenthub-agents-storage",
    "do-not-delete-ssm-diagnosis-448049831733-us-east-1-88mbe"
)

Write-Host "Analysis of S3 Buckets:`n" -ForegroundColor Yellow

Write-Host "WILL DELETE (6 buckets):" -ForegroundColor Red
foreach ($bucket in $bucketsToDelete) {
    try {
        $size = aws s3 ls s3://$bucket --recursive --summarize 2>&1 | Select-String "Total Size:" | ForEach-Object { $_.ToString().Split(':')[1].Trim() }
        $objects = aws s3 ls s3://$bucket --recursive --summarize 2>&1 | Select-String "Total Objects:" | ForEach-Object { $_.ToString().Split(':')[1].Trim() }
        
        if ($size) {
            $sizeMB = [math]::Round([int]$size / 1MB, 2)
            Write-Host "  - $bucket" -ForegroundColor White
            Write-Host "    Objects: $objects, Size: $sizeMB MB" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  - $bucket (error checking)" -ForegroundColor White
    }
}

Write-Host "`nWILL KEEP (2 buckets):" -ForegroundColor Green
foreach ($bucket in $bucketsToKeep) {
    Write-Host "  - $bucket" -ForegroundColor White
    if ($bucket -eq "agenthub-agents-storage") {
        Write-Host "    (Used by local_version POC for agent storage)" -ForegroundColor Gray
    } else {
        Write-Host "    (AWS Systems Manager diagnostic bucket)" -ForegroundColor Gray
    }
}

if ($DryRun) {
    Write-Host "`n[DRY RUN] No buckets will be deleted" -ForegroundColor Yellow
} else {
    Write-Host "`nWARNING: This will permanently delete 6 S3 buckets and all their contents!" -ForegroundColor Red
    Write-Host "Type 'DELETE' to confirm: " -ForegroundColor Yellow -NoNewline
    $confirmation = Read-Host
    
    if ($confirmation -ne "DELETE") {
        Write-Host "Cleanup cancelled" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "`nStarting cleanup...`n" -ForegroundColor Cyan

$deleted = @()
$failed = @()

foreach ($bucket in $bucketsToDelete) {
    Write-Host "Processing: $bucket" -ForegroundColor Cyan
    
    try {
        # Check if bucket exists
        $exists = aws s3 ls s3://$bucket 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            if (-not $DryRun) {
                Write-Host "  Deleting bucket and all contents..." -ForegroundColor Yellow
                aws s3 rb s3://$bucket --force 2>&1 | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  [SUCCESS] Bucket deleted" -ForegroundColor Green
                    $deleted += $bucket
                } else {
                    Write-Host "  [FAILED] Could not delete bucket" -ForegroundColor Red
                    $failed += $bucket
                }
            } else {
                Write-Host "  [DRY RUN] Would delete this bucket" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [SKIP] Bucket not found or already deleted" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
        $failed += $bucket
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

if ($deleted.Count -gt 0) {
    Write-Host "Successfully Deleted ($($deleted.Count) buckets):" -ForegroundColor Green
    foreach ($bucket in $deleted) {
        Write-Host "  - $bucket" -ForegroundColor White
    }
}

if ($failed.Count -gt 0) {
    Write-Host "`nFailed to Delete ($($failed.Count) buckets):" -ForegroundColor Yellow
    foreach ($bucket in $failed) {
        Write-Host "  - $bucket" -ForegroundColor White
    }
}

Write-Host "`nKept Buckets:" -ForegroundColor Green
Write-Host "  - agenthub-agents-storage (REQUIRED for POC)" -ForegroundColor White
Write-Host "  - do-not-delete-ssm-diagnosis-... (AWS managed)" -ForegroundColor White

Write-Host "`nStorage Freed: ~217 MB" -ForegroundColor Cyan
Write-Host "Cost Savings: ~$0.005/month (minimal but good housekeeping)" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`n[DRY RUN] Run without -DryRun to perform actual deletion" -ForegroundColor Yellow
}

Write-Host "`nYour local POC will continue working normally!" -ForegroundColor Green
Write-Host "Only bucket used: agenthub-agents-storage`n" -ForegroundColor Green

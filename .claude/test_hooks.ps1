# Test Script for Claude Flow Windows Hooks
# Verifies all 8 hooks are properly configured and functional

$ErrorActionPreference = "Continue"
$testResults = @()
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "`n===== Claude Flow Windows Hooks Test Suite =====`n" -ForegroundColor Cyan
Write-Host "Testing Time: $timestamp" -ForegroundColor Yellow
Write-Host "Testing all 8 lifecycle hooks...`n" -ForegroundColor Yellow

# Function to test a hook
function Test-Hook {
    param(
        [string]$HookName,
        [string]$ScriptPath,
        [string]$InputJson = ""
    )

    Write-Host "Testing $HookName..." -NoNewline

    try {
        if ($InputJson) {
            $result = $InputJson | powershell.exe -ExecutionPolicy Bypass -File $ScriptPath 2>&1
        } else {
            $result = powershell.exe -ExecutionPolicy Bypass -File $ScriptPath 2>&1
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
            return @{
                Hook = $HookName
                Status = "PASS"
                Output = ($result | Out-String).Substring(0, [Math]::Min(200, ($result | Out-String).Length))
            }
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            return @{
                Hook = $HookName
                Status = "FAIL"
                Output = $result | Out-String
            }
        }
    }
    catch {
        Write-Host " [ERROR]" -ForegroundColor Red
        return @{
            Hook = $HookName
            Status = "ERROR"
            Output = $_.ToString()
        }
    }
}

# Test 1: SessionStart
$testResults += Test-Hook -HookName "SessionStart" -ScriptPath ".claude\hooks\session_start.ps1"

# Test 2: UserPromptSubmit
$userPromptInput = @{
    userPrompt = "test chronos timekeeping with voice activation"
} | ConvertTo-Json
$testResults += Test-Hook -HookName "UserPromptSubmit" -ScriptPath ".claude\hooks\user_prompt_submit.ps1" -InputJson $userPromptInput

# Test 3: PreToolUse (should pass with Read tool)
$preToolInput = @{
    tool = "Read"
    arguments = @{
        file_path = "test.md"
    }
} | ConvertTo-Json
$testResults += Test-Hook -HookName "PreToolUse (Read)" -ScriptPath ".claude\hooks\pre_tool_use.ps1" -InputJson $preToolInput

# Test 4: PreToolUse (should warn/block with Write tool)
$preToolBlockInput = @{
    tool = "Write"
    arguments = @{
        file_path = "test.py"
        content = "print('test')"
    }
} | ConvertTo-Json
$blockResult = $preToolBlockInput | powershell.exe -ExecutionPolicy Bypass -File ".claude\hooks\pre_tool_use.ps1" 2>&1
if ($LASTEXITCODE -eq 2) {
    Write-Host "PreToolUse (Block)... [OK - Correctly Blocked]" -ForegroundColor Green
    $testResults += @{
        Hook = "PreToolUse (Block)"
        Status = "PASS"
        Output = "Correctly blocked direct coding attempt"
    }
} else {
    Write-Host "PreToolUse (Block)... [FAIL - Should Block]" -ForegroundColor Red
    $testResults += @{
        Hook = "PreToolUse (Block)"
        Status = "FAIL"
        Output = "Failed to block direct coding"
    }
}

# Test 5: PostToolUse
$postToolInput = @{
    tool = "Task"
    result = "Successfully created agent for code implementation"
} | ConvertTo-Json
$testResults += Test-Hook -HookName "PostToolUse" -ScriptPath ".claude\hooks\post_tool_use.ps1" -InputJson $postToolInput

# Test 6: SubagentStop
$subagentInput = @{
    agentId = "test-agent-001"
    agentType = "coder"
    taskDescription = "Implement test feature"
    result = "Completed successfully with 5 tests passed"
    duration = "00:02:34"
} | ConvertTo-Json
$testResults += Test-Hook -HookName "SubagentStop" -ScriptPath ".claude\hooks\subagent_stop.ps1" -InputJson $subagentInput

# Test 7: PreCompact
$testResults += Test-Hook -HookName "PreCompact" -ScriptPath ".claude\hooks\pre_compact.ps1"

# Test 8: Notification
$notificationInput = @{
    type = "AgentComplete"
    message = "Test agent completed task successfully"
    priority = "Normal"
    source = "TestSuite"
} | ConvertTo-Json
$testResults += Test-Hook -HookName "Notification" -ScriptPath ".claude\hooks\notification.ps1" -InputJson $notificationInput

# Test 9: Stop
$testResults += Test-Hook -HookName "Stop" -ScriptPath ".claude\hooks\stop.ps1"

# Summary
Write-Host "`n===== Test Results Summary =====`n" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "Total Tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })

# Detailed results
Write-Host "`n===== Detailed Results =====`n" -ForegroundColor Cyan

foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "ERROR" { "Yellow" }
    }
    Write-Host "$($result.Hook): " -NoNewline
    Write-Host $result.Status -ForegroundColor $color

    if ($result.Status -ne "PASS") {
        Write-Host "Output: $($result.Output.Substring(0, [Math]::Min(200, $result.Output.Length)))..." -ForegroundColor Gray
    }
}

# Check file creation
Write-Host "`n===== File System Check =====`n" -ForegroundColor Cyan

$requiredFiles = @(
    ".claude\settings.json",
    ".claude\hooks\session_start.ps1",
    ".claude\hooks\user_prompt_submit.ps1",
    ".claude\hooks\pre_tool_use.ps1",
    ".claude\hooks\post_tool_use.ps1",
    ".claude\hooks\stop.ps1",
    ".claude\hooks\subagent_stop.ps1",
    ".claude\hooks\pre_compact.ps1",
    ".claude\hooks\notification.ps1",
    ".claude\memory\voice_preferences.json"
)

$fileCheckPass = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "[OK] " -ForegroundColor Green -NoNewline
    } else {
        Write-Host "[MISSING] " -ForegroundColor Red -NoNewline
        $fileCheckPass = $false
    }
    Write-Host $file
}

# Final verdict
Write-Host "`n===== Final Verdict =====`n" -ForegroundColor Cyan

if ($passCount -eq $testResults.Count -and $fileCheckPass) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Claude Flow Windows hooks are fully operational." -ForegroundColor Green
    Write-Host "CasparCode-002 orchestration-first protocol is active." -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED!" -ForegroundColor Red
    Write-Host "Please review the errors above and fix any issues." -ForegroundColor Yellow
}

Write-Host "`nTest log saved to: .claude\memory\test_results_$(Get-Date -Format 'yyyyMMdd_HHmmss').json" -ForegroundColor Gray

# Save results
$testResults | ConvertTo-Json -Depth 3 | Set-Content ".claude\memory\test_results_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
# SubagentStop Hook - Agent Result Capture & Ledger Update
# CasparCode-002 Agent Completion Protocol

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\agent_results.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Update-LedgerIndex {
    param(
        [string]$AgentId,
        [string]$AgentType,
        [string]$TaskDescription,
        [string]$Result
    )

    $ledgerPath = "$PSScriptRoot\..\..\chronos-timekeeping\.agent-templates\LEDGER-VERIFICATION-INDEX.md"
    $ledgerDir = Split-Path $ledgerPath -Parent

    # Create directory if it doesn't exist
    if (-not (Test-Path $ledgerDir)) {
        New-Item -ItemType Directory -Path $ledgerDir -Force | Out-Null
    }

    # Create or update ledger
    $ledgerEntry = @"

## [$timestamp] Agent: $AgentId
**Type**: $AgentType
**Task**: $TaskDescription
**Status**: $Result
**Neo4j Cross-Reference**: Session_$(Get-Date -Format 'yyyy_MM_dd')
**Tracking Doc**: tracking\daily_$(Get-Date -Format 'yyyy_MM_dd').md

---
"@

    if (Test-Path $ledgerPath) {
        Add-Content -Path $ledgerPath -Value $ledgerEntry
    } else {
        # Create new ledger with header
        $header = @"
# Ledger Verification Index
## Agent Task Completion Records

This ledger tracks all agent completions for dual-tracking verification.
Each entry must cross-reference with Neo4j entities and tracking documents.

---
"@
        $header + $ledgerEntry | Set-Content -Path $ledgerPath
    }

    return $ledgerPath
}

function Analyze-AgentResult {
    param([string]$Result)

    $analysis = @{
        Success = $true
        TestsPassed = 0
        FilesCreated = @()
        FilesModified = @()
        Errors = @()
        CodeQuality = "Unknown"
    }

    # Check for success/failure patterns
    if ($Result -match "(?i)(error|failed|exception)") {
        $analysis.Success = $false
        $analysis.Errors = [regex]::Matches($Result, "(?i)(error|failed|exception):?\s*([^\n]+)") |
            ForEach-Object { $_.Groups[2].Value }
    }

    # Check for test results
    if ($Result -match "(\d+)\s*(?:tests?|specs?)\s*pass") {
        $analysis.TestsPassed = [int]$matches[1]
    }

    # Check for file operations
    $filePattern = "(?i)(created?|modified?|updated?|wrote)\s+(?:file\s+)?([^\s]+\.[a-z]{2,4})"
    $fileMatches = [regex]::Matches($Result, $filePattern)
    foreach ($match in $fileMatches) {
        $action = $match.Groups[1].Value.ToLower()
        $file = $match.Groups[2].Value
        if ($action -match "create") {
            $analysis.FilesCreated += $file
        } else {
            $analysis.FilesModified += $file
        }
    }

    # Assess code quality indicators
    if ($Result -match "(?i)(refactor|optimize|clean)") {
        $analysis.CodeQuality = "Improved"
    }
    elseif ($Result -match "(?i)(todo|fixme|hack|temporary)") {
        $analysis.CodeQuality = "Needs Review"
    }
    elseif ($analysis.TestsPassed -gt 0) {
        $analysis.CodeQuality = "Tested"
    }

    return $analysis
}

try {
    Write-Log "SubagentStop hook processing agent completion"

    # Parse agent information
    $agentInfo = @{
        Id = "unknown"
        Type = "unknown"
        Task = ""
        Result = ""
        Duration = ""
    }

    if ($StdinContent) {
        $parsedInput = $StdinContent | ConvertFrom-Json
        $agentInfo.Id = $parsedInput.agentId
        $agentInfo.Type = $parsedInput.agentType
        $agentInfo.Task = $parsedInput.taskDescription
        $agentInfo.Result = $parsedInput.result | Out-String
        $agentInfo.Duration = $parsedInput.duration

        Write-Log "Agent $($agentInfo.Id) completed: $($agentInfo.Type)"
    }

    # Analyze agent result
    $analysis = Analyze-AgentResult -Result $agentInfo.Result

    # Update ledger
    $ledgerPath = Update-LedgerIndex `
        -AgentId $agentInfo.Id `
        -AgentType $agentInfo.Type `
        -TaskDescription $agentInfo.Task `
        -Result $(if ($analysis.Success) { "Success" } else { "Failed" })

    # Create summary message
    $summaryMessage = @"

## Agent Completion: $($agentInfo.Type)

### Task Summary
- **Agent ID**: $($agentInfo.Id)
- **Duration**: $($agentInfo.Duration)
- **Status**: $(if ($analysis.Success) { "✓ Success" } else { "✗ Failed" })
- **Code Quality**: $($analysis.CodeQuality)

"@

    # Add test results if present
    if ($analysis.TestsPassed -gt 0) {
        $summaryMessage += @"
### Test Results
- **Tests Passed**: $($analysis.TestsPassed)
- **TDD Compliance**: ✓ Tests executed

"@
    }

    # Add file operations if present
    if ($analysis.FilesCreated.Count -gt 0 -or $analysis.FilesModified.Count -gt 0) {
        $summaryMessage += @"
### File Operations
"@
        if ($analysis.FilesCreated.Count -gt 0) {
            $summaryMessage += "**Created**: $($analysis.FilesCreated -join ', ')`n"
        }
        if ($analysis.FilesModified.Count -gt 0) {
            $summaryMessage += "**Modified**: $($analysis.FilesModified -join ', ')`n"
        }
        $summaryMessage += "`n"
    }

    # Add errors if present
    if ($analysis.Errors.Count -gt 0) {
        $summaryMessage += @"
### ⚠ Errors Detected
"@
        foreach ($error in $analysis.Errors) {
            $summaryMessage += "- $error`n"
        }
        $summaryMessage += "`n"
    }

    # Add Neo4j storage recommendation
    $agentEntity = "Agent_$($agentInfo.Type)_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    $summaryMessage += @"
### Recommended Neo4j Storage
``````cypher
CREATE (a:core {
  name: '$agentEntity',
  observations: [
    '[$timestamp] Task: $($agentInfo.Task -replace "'", "''")',
    '[$timestamp] Status: $(if ($analysis.Success) { "Success" } else { "Failed" })',
    '[$timestamp] Duration: $($agentInfo.Duration)',
    '[$timestamp] Quality: $($analysis.CodeQuality)'
  ]
})
``````

### Ledger Updated
**Path**: $ledgerPath
**Verification**: Cross-reference with Neo4j and tracking docs

---
"@

    Write-Output $summaryMessage
    Write-Log "Agent completion processed and ledger updated"

    # Update agent statistics
    $statsFile = "$PSScriptRoot\..\memory\agent_performance.json"
    $agentStat = @{
        Timestamp = $timestamp
        AgentId = $agentInfo.Id
        AgentType = $agentInfo.Type
        Success = $analysis.Success
        Duration = $agentInfo.Duration
        TestsPassed = $analysis.TestsPassed
        FilesCreated = $analysis.FilesCreated.Count
        FilesModified = $analysis.FilesModified.Count
        ErrorCount = $analysis.Errors.Count
    }

    if (Test-Path $statsFile) {
        $stats = Get-Content $statsFile | ConvertFrom-Json
        $stats += $agentStat
        $stats | ConvertTo-Json -Depth 3 | Set-Content $statsFile
    } else {
        @($agentStat) | ConvertTo-Json -Depth 3 | Set-Content $statsFile
    }

    exit 0
}
catch {
    Write-Log "SubagentStop hook failed: $_" -Level "ERROR"
    exit 0  # Don't block on errors
}
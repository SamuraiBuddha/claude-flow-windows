# PreToolUse Hook - Agent Delegation Enforcement
# CasparCode-002 Orchestration-First Protocol Monitor

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\tool_use.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Speak-Warning {
    param([string]$Text)
    try {
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $synthesizer.Rate = 2  # Slightly faster for warnings
        $synthesizer.Volume = 100
        $synthesizer.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
        $synthesizer.Speak($Text)
        $synthesizer.Dispose()
    }
    catch {
        Write-Log "TTS warning failed: $_" -Level "WARN"
    }
}

try {
    Write-Log "PreToolUse hook checking tool usage"

    # Parse tool information
    $toolInfo = ""
    $toolName = ""
    $toolArgs = ""

    if ($StdinContent) {
        $parsedInput = $StdinContent | ConvertFrom-Json
        $toolName = $parsedInput.tool
        $toolArgs = $parsedInput.arguments | ConvertTo-Json -Compress
        Write-Log "Tool: $toolName with args: $toolArgs"
    }

    # Code-related tools that should trigger delegation check
    $codeTools = @("Write", "Edit", "create_task", "apply_template", "add_section")
    $allowedTools = @("Read", "Bash", "Task", "mcp__neo4j", "mcp__time", "TodoWrite", "get_overview", "search_tasks")

    # Check if this is a code task that should be delegated
    $shouldBlock = $false
    $warningMessage = ""

    # Check for direct coding attempts
    if ($toolName -in $codeTools) {
        # Check if creating code files
        if ($toolArgs -match '\.(py|js|ts|jsx|tsx|java|cpp|cs|go|rs|rb|php)') {
            $shouldBlock = $true
            $warningMessage = @"

## ORCHESTRATION VIOLATION DETECTED

**Tool blocked**: $toolName attempting to create/edit code files
**CasparCode-002 Rule**: ALL code tasks must be delegated to agents

### Required Action:
Use Task tool to spawn appropriate agent based on complexity:
- **Opus agent**: Complex architecture, security, critical bugs
- **Sonnet agent**: Standard features, refactoring, tests
- **Haiku agent**: Simple fixes, docs, formatting

### Correct Pattern:
``````
Task(
  subagent_type="coder",  # or reviewer, researcher, etc.
  description="Implement [specific task]",
  prompt="[Full context from Neo4j + specifications]"
)
``````

**Remember**: CasparCode-002 is an orchestrator, NOT a coder
[000.CasparCode_Role:1-6]

---
"@
        }
    }

    # Check for Bash commands that might be coding
    if ($toolName -eq "Bash") {
        if ($toolArgs -match 'npm (run |install)|python.*\.py|node.*\.js|cargo |go run|dotnet ') {
            # Running code directly instead of through agents
            $warningMessage = @"

## DELEGATION REMINDER

**Tool monitored**: Bash attempting to run code directly
**Consider**: Should this be delegated to an agent?

Running build/test commands is acceptable for verification.
Creating new code should go through agents.

---
"@
        }
    }

    # Log tool usage patterns for analysis
    $toolData = @{
        Timestamp = $timestamp
        Tool = $toolName
        IsCodeTask = ($toolName -in $codeTools)
        WasBlocked = $shouldBlock
    } | ConvertTo-Json

    $toolLogPath = "$PSScriptRoot\..\memory\tool_usage_$(Get-Date -Format 'yyyyMMdd').json"
    if (Test-Path $toolLogPath) {
        $existing = Get-Content $toolLogPath | ConvertFrom-Json
        $existing += $toolData | ConvertFrom-Json
        $existing | ConvertTo-Json | Set-Content $toolLogPath
    } else {
        "[$toolData]" | Set-Content $toolLogPath
    }

    # Output warning or blocking message
    if ($shouldBlock) {
        Write-Output $warningMessage
        Write-Log "Blocked direct coding attempt: $toolName" -Level "WARN"

        # Voice warning if TTS is available
        Speak-Warning "Orchestration violation. Delegate code tasks to agents."

        # Exit with error to block the tool
        exit 2
    }
    elseif ($warningMessage) {
        Write-Output $warningMessage
        Write-Log "Delegation reminder for: $toolName" -Level "INFO"
    }

    # Track agent spawning for metrics
    if ($toolName -eq "Task") {
        Write-Log "Agent spawned - maintaining orchestration pattern" -Level "INFO"

        # Extract agent type if available
        if ($toolArgs -match 'subagent_type["\s:]+([^",}]+)') {
            $agentType = $matches[1]
            Write-Log "Agent type: $agentType" -Level "INFO"

            # Update agent usage stats
            $statsFile = "$PSScriptRoot\..\memory\agent_stats.json"
            if (Test-Path $statsFile) {
                $stats = Get-Content $statsFile | ConvertFrom-Json
            } else {
                $stats = @{}
            }

            if ($stats.$agentType) {
                $stats.$agentType++
            } else {
                $stats | Add-Member -NotePropertyName $agentType -NotePropertyValue 1
            }

            $stats | ConvertTo-Json | Set-Content $statsFile
        }
    }

    exit 0
}
catch {
    Write-Log "PreToolUse hook failed: $_" -Level "ERROR"
    exit 0  # Don't block on errors
}
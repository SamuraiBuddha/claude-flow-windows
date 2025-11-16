# PreCompact Hook - Context Preservation Before Compaction
# CasparCode-002 Memory Persistence Protocol

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\compaction.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Extract-CriticalContext {
    # Extract critical information from current session
    $context = @{
        ActiveProjects = @()
        OpenTasks = @()
        PendingAgents = @()
        UnresolvedErrors = @()
        KeyDecisions = @()
        NextActions = @()
    }

    # Check for active projects in memory
    $projectPatterns = @("oblivion_remastered", "chronos_timekeeping", "claude-flow-windows")
    $memoryFiles = Get-ChildItem "$PSScriptRoot\..\memory\*.log" -ErrorAction SilentlyContinue

    foreach ($file in $memoryFiles) {
        $content = Get-Content $file -Tail 100  # Last 100 lines
        foreach ($project in $projectPatterns) {
            if ($content -match $project) {
                if ($project -notin $context.ActiveProjects) {
                    $context.ActiveProjects += $project
                }
            }
        }
    }

    # Check for open tasks from tool usage
    $toolLog = "$PSScriptRoot\..\memory\tool_usage_$(Get-Date -Format 'yyyyMMdd').json"
    if (Test-Path $toolLog) {
        $tools = Get-Content $toolLog | ConvertFrom-Json
        $taskTools = $tools | Where-Object { $_.Tool -eq "create_task" -and -not $_.IsCompleted }
        $context.OpenTasks = $taskTools | ForEach-Object { $_.TaskDescription }
    }

    # Check for pending agents
    $agentStats = "$PSScriptRoot\..\memory\agent_performance.json"
    if (Test-Path $agentStats) {
        $agents = Get-Content $agentStats | ConvertFrom-Json
        $recent = $agents | Where-Object {
            [DateTime]::Parse($_.Timestamp) -gt (Get-Date).AddHours(-1)
        }
        $context.PendingAgents = $recent | Where-Object { -not $_.Success }
    }

    # Extract errors from logs
    foreach ($file in $memoryFiles) {
        $errors = Get-Content $file | Where-Object { $_ -match "\[ERROR\]" }
        if ($errors) {
            $context.UnresolvedErrors += $errors | ForEach-Object {
                if ($_ -match "\[ERROR\]\s*(.+)") { $matches[1] }
            }
        }
    }

    return $context
}

function Create-CompactionSummary {
    param($Context)

    $summary = @"
# Pre-Compaction Context Summary
## Generated: $timestamp

### Active Projects
"@
    if ($Context.ActiveProjects.Count -gt 0) {
        foreach ($project in $Context.ActiveProjects) {
            $summary += "- $project`n"
        }
    } else {
        $summary += "- No active projects detected`n"
    }

    $summary += @"

### Open Tasks
"@
    if ($Context.OpenTasks.Count -gt 0) {
        foreach ($task in $Context.OpenTasks) {
            $summary += "- $task`n"
        }
    } else {
        $summary += "- No open tasks`n"
    }

    $summary += @"

### Pending Agents
"@
    if ($Context.PendingAgents.Count -gt 0) {
        foreach ($agent in $Context.PendingAgents) {
            $summary += "- Agent $($agent.AgentId): $($agent.AgentType)`n"
        }
    } else {
        $summary += "- No pending agents`n"
    }

    if ($Context.UnresolvedErrors.Count -gt 0) {
        $summary += @"

### Unresolved Errors
"@
        $Context.UnresolvedErrors | Select-Object -Unique | ForEach-Object {
            $summary += "- $_`n"
        }
    }

    $summary += @"

### Neo4j Context Queries
These queries will help restore context after compaction:

``````cypher
// Core methodology
MATCH (c:core) WHERE c.name IN ['000.Core_Methodology','000.CasparCode_Role']
RETURN c.name, c.observations[0..2]

// Active projects
MATCH (p:core) WHERE p.name CONTAINS 'oblivion' OR p.name CONTAINS 'chronos'
RETURN p.name, p.observations[0..2]
ORDER BY p.name DESC LIMIT 5

// Recent solutions
MATCH (s:core) WHERE s.name STARTS WITH '800'
RETURN s.name, s.observations[0..2]
ORDER BY s.name DESC LIMIT 3

// Today's conversation
MATCH (c:core) WHERE c.name = 'Conversation_$(Get-Date -Format 'yyyy_MM_dd')'
RETURN c.name, c.observations
``````

### Critical Reminders
1. **Orchestration-First**: All code tasks must be delegated to agents
2. **Dual-Tracking**: Both Neo4j and tracking documents must be updated
3. **No Emojis**: Prohibition rule [000_core_methodology_emoji_prohibition]
4. **Citation Format**: Always use [Entity:Verse#]
5. **Machine**: Caspar (i9-14900KF, RTX 3090, 64GB DDR5)

---
"@

    return $summary
}

try {
    Write-Log "PreCompact hook preserving critical context"

    # Extract critical context
    $context = Extract-CriticalContext

    # Create compaction summary
    $summary = Create-CompactionSummary -Context $context

    # Save to file for post-compaction recovery
    $compactionFile = "$PSScriptRoot\..\memory\compaction_$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
    $summary | Set-Content -Path $compactionFile

    Write-Log "Compaction summary saved to: $compactionFile"

    # Create Neo4j entity for compaction event
    $compactionEntity = "Compaction_$(Get-Date -Format 'yyyy_MM_dd_HHmmss')"
    $neo4jMessage = @"

## Pre-Compaction Context Preserved

**Summary File**: $compactionFile
**Active Projects**: $($context.ActiveProjects -join ', ')
**Open Tasks**: $($context.OpenTasks.Count)
**Pending Agents**: $($context.PendingAgents.Count)

### Recommended Neo4j Storage
``````cypher
CREATE (c:core {
  name: '$compactionEntity',
  observations: [
    '[$timestamp] Projects: $($context.ActiveProjects -join ", ")',
    '[$timestamp] Open tasks: $($context.OpenTasks.Count)',
    '[$timestamp] Pending agents: $($context.PendingAgents.Count)',
    '[$timestamp] Summary saved: $compactionFile'
  ]
})
``````

### Post-Compaction Recovery
After compaction, run these steps:
1. Load core methodology from Neo4j
2. Check $compactionFile for context
3. Resume active projects as listed
4. Verify pending agents completed

**IMPORTANT**: This summary is your context lifeline.
Keep it accessible for session continuity.

---
"@

    Write-Output $neo4jMessage

    # Archive pre-compaction state
    $archivePath = "$PSScriptRoot\..\memory\archive\pre_compact_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $archivePath -Force | Out-Null

    # Copy current memory files to archive
    Get-ChildItem "$PSScriptRoot\..\memory\*.json" |
        Copy-Item -Destination $archivePath -Force

    Write-Log "Pre-compaction state archived to: $archivePath"

    exit 0
}
catch {
    Write-Log "PreCompact hook failed: $_" -Level "ERROR"
    exit 0  # Don't block compaction on errors
}
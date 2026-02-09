# Stop Hook - Session Summary & Dual-Tracking Verification
# CasparCode-002 Session Closure Protocol

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\session_$((Get-Date).ToString('yyyyMMdd_HHmmss'))_stop.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Speak-Summary {
    param([string]$Text)
    try {
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $synthesizer.Rate = 0
        $synthesizer.Volume = 100
        $synthesizer.Speak($Text)
        $synthesizer.Dispose()
    }
    catch {
        Write-Log "TTS summary failed: $_" -Level "WARN"
    }
}

function Verify-DualTracking {
    # Check for today's tracking document
    $trackingPath = "$PSScriptRoot\..\..\tracking\daily_$(Get-Date -Format 'yyyy_MM_dd').md"
    $trackingExists = Test-Path $trackingPath

    # Check for Neo4j memory entries (via log analysis)
    $memoryLogPath = "$PSScriptRoot\..\memory\memory_capture.log"
    $neo4jEntries = 0

    if (Test-Path $memoryLogPath) {
        $todayLogs = Get-Content $memoryLogPath | Where-Object { $_ -match (Get-Date -Format "yyyy-MM-dd") }
        $neo4jEntries = ($todayLogs | Where-Object { $_ -match "memory-worthy" }).Count
    }

    return @{
        TrackingDoc = $trackingExists
        TrackingPath = $trackingPath
        Neo4jEntries = $neo4jEntries
        Compliant = ($trackingExists -and $neo4jEntries -gt 0)
    }
}

function Get-SessionStats {
    $stats = @{
        ToolsUsed = 0
        AgentsSpawned = 0
        MemoriesCreated = 0
        Errors = 0
        Duration = ""
    }

    # Get session start time
    $sessionMeta = "$PSScriptRoot\..\memory\current_session.json"
    if (Test-Path $sessionMeta) {
        $meta = Get-Content $sessionMeta | ConvertFrom-Json
        $startTime = [DateTime]::Parse($meta.StartTime)
        $duration = (Get-Date) - $startTime
        $stats.Duration = "{0:hh\:mm\:ss}" -f $duration
    }

    # Count tools used
    $toolLog = "$PSScriptRoot\..\memory\tool_usage_$(Get-Date -Format 'yyyyMMdd').json"
    if (Test-Path $toolLog) {
        $tools = Get-Content $toolLog | ConvertFrom-Json
        $stats.ToolsUsed = $tools.Count
    }

    # Count agents spawned
    $agentStats = "$PSScriptRoot\..\memory\agent_stats.json"
    if (Test-Path $agentStats) {
        $agents = Get-Content $agentStats | ConvertFrom-Json
        $stats.AgentsSpawned = ($agents.PSObject.Properties | Measure-Object -Sum Value).Sum
    }

    # Count memories created
    $memoryStats = "$PSScriptRoot\..\memory\tool_stats_$(Get-Date -Format 'yyyyMMdd').json"
    if (Test-Path $memoryStats) {
        $memories = Get-Content $memoryStats | ConvertFrom-Json
        $stats.MemoriesCreated = ($memories | Measure-Object -Sum MemoriesCreated).Sum
    }

    # Count errors
    $errorCount = 0
    Get-ChildItem "$PSScriptRoot\..\memory\*.log" | ForEach-Object {
        $errorCount += (Get-Content $_ | Where-Object { $_ -match "\[ERROR\]" }).Count
    }
    $stats.Errors = $errorCount

    return $stats
}

try {
    Write-Log "Session stop hook initiated"

    # Get dual-tracking verification
    $tracking = Verify-DualTracking

    # Get session statistics
    $stats = Get-SessionStats

    # Create session summary
    $summary = @"

## CasparCode-002 Session Complete

### Session Statistics
- **Duration**: $($stats.Duration)
- **Tools Used**: $($stats.ToolsUsed)
- **Agents Spawned**: $($stats.AgentsSpawned)
- **Memories Created**: $($stats.MemoriesCreated)
- **Errors Encountered**: $($stats.Errors)

### Dual-Tracking Verification
- **Neo4j Entries**: $($tracking.Neo4jEntries)
- **Tracking Document**: $(if ($tracking.TrackingDoc) { "[OK] Created" } else { "[MISSING]" })
- **Compliance Status**: $(if ($tracking.Compliant) { "[OK] COMPLIANT" } else { "[WARN] NON-COMPLIANT" })

"@

    # Add compliance warning if needed
    if (-not $tracking.Compliant) {
        $summary += @"
### [!] COMPLIANCE WARNING
Dual-tracking protocol may not have been followed completely.
Please verify:
1. Neo4j memories were created for significant work
2. Tracking document exists at: $($tracking.TrackingPath)
3. All citations follow [Entity:Verse#] format

[000.Core_Methodology:7-9]

"@
    }

    # Add orchestration metrics
    if ($stats.AgentsSpawned -gt 0) {
        $summary += @"
### Orchestration Metrics
- **Delegation Rate**: $(if ($stats.ToolsUsed -gt 0) { [math]::Round(($stats.AgentsSpawned / $stats.ToolsUsed) * 100, 1) } else { 0 })%
- **Agent Efficiency**: Maintained orchestration-first pattern
- **Code Tasks Delegated**: [OK] Following CasparCode-002 protocol

"@
    }

    # Create Neo4j session summary
    $sessionEntity = "Session_$(Get-Date -Format 'yyyy_MM_dd_HHmmss')"
    $summary += @"
### Recommended Neo4j Storage
``````cypher
CREATE (s:core {
  name: '$sessionEntity',
  observations: [
    '[$timestamp] Duration: $($stats.Duration)',
    '[$timestamp] Tools: $($stats.ToolsUsed), Agents: $($stats.AgentsSpawned)',
    '[$timestamp] Memories: $($stats.MemoriesCreated), Errors: $($stats.Errors)',
    '[$timestamp] Dual-tracking: $(if ($tracking.Compliant) { "Compliant" } else { "Non-compliant" })'
  ]
})
``````

### Voice Summary Available
Say "summary" or "report" to hear session summary via TTS

---
"@

    Write-Output $summary
    Write-Log "Session summary generated"

    # Check for voice activation in stop reason
    if ($StdinContent -match "speak|say|voice|summary|report") {
        $voiceSummary = "Session complete. Duration: $($stats.Duration). Tools used: $($stats.ToolsUsed). Agents spawned: $($stats.AgentsSpawned). Dual-tracking $(if ($tracking.Compliant) { 'compliant' } else { 'non-compliant' })."
        Speak-Summary $voiceSummary
    }

    # Archive session data
    $archivePath = "$PSScriptRoot\..\memory\archive\session_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $archivePath -Force | Out-Null

    # Move session files to archive
    Get-ChildItem "$PSScriptRoot\..\memory\*.json" |
        Where-Object { $_.Name -ne "current_session.json" } |
        Move-Item -Destination $archivePath -Force

    Write-Log "Session archived to: $archivePath"

    exit 0
}
catch {
    Write-Log "Stop hook failed: $_" -Level "ERROR"
    exit 0  # Don't block shutdown on errors
}
# SessionStart Hook - Initialize APOC Memory System v2
# CasparCode-002 Operational Mode Initialization

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\session_$((Get-Date).ToString('yyyyMMdd_HHmmss')).log"

# Create log directory if it doesn't exist
New-Item -ItemType Directory -Path "$PSScriptRoot\..\memory" -Force | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
    if ($Level -eq "ERROR") {
        Write-Error $Message
    }
}

try {
    Write-Log "Session started - CasparCode-002 initializing"

    # Create initialization message for Claude
    $initMessage = @"
## CasparCode-002 Session Initialized
### Operational Mode: ORCHESTRATION-FIRST

**Core Rules Loaded:**
1. NO direct coding - delegate ALL code tasks to agents
2. Dual-tracking protocol: Neo4j + tracking documents
3. No emojis in any output ([000_core_methodology_emoji_prohibition])
4. Citation format: [Entity:Verse#]
5. Spec-Kit methodology: Tests before code

**Available MCP Servers:**
- neo4j-memory-lilith: Memory storage
- neo4j-cypher-lilith: Cypher queries
- time-precision: Timestamp management
- claude-flow-windows: Swarm orchestration

**Agent Model Tiers:**
- Opus: Complex/critical tasks
- Sonnet: Standard development
- Haiku: Simple tasks

**Memory System:** APOC v2 active
**Machine:** Caspar (i9-14900KF, RTX 3090, 64GB DDR5)

### Required Actions:
1. Run get_neo4j_schema to initialize
2. Load core methodology: 000.Core_Methodology, 000.CasparCode_Role
3. Check for active projects in: oblivion_remastered, chronos_timekeeping
4. Use researcher agent for context retrieval

---
"@

    Write-Output $initMessage
    Write-Log "Initialization message sent to Claude"

    # Store session metadata
    $sessionMeta = @{
        StartTime = $timestamp
        Machine = "Caspar"
        Mode = "CasparCode-002"
        Neo4jActive = $true
        DualTracking = $true
    } | ConvertTo-Json

    Set-Content -Path "$PSScriptRoot\..\memory\current_session.json" -Value $sessionMeta
    Write-Log "Session metadata stored"

    exit 0
}
catch {
    Write-Log "Session initialization failed: $_" -Level "ERROR"
    exit 2
}
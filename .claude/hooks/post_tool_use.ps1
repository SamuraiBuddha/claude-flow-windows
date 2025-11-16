# PostToolUse Hook - Memory Capture & Dual-Tracking
# CasparCode-002 APOC Memory System Integration

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\memory_capture.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Extract-MemoryWorthy {
    param([string]$Content)

    $memories = @()

    # Pattern detection for memory-worthy content
    $patterns = @{
        # Technical solutions
        "Solution" = "(?i)(fixed|solved|resolved|implemented)[\s\S]{0,200}"
        # Error messages and lessons
        "Error" = "(?i)(error|failed|exception|warning):[\s\S]{0,200}"
        # Code patterns
        "Code" = "```[\s\S]+?```"
        # Configuration changes
        "Config" = "(?i)(config|setting|environment).*=.*"
        # Neo4j queries
        "Cypher" = "(?i)(MATCH|CREATE|MERGE|WITH|RETURN)[\s\S]{0,300}"
        # File operations
        "Files" = "(?i)(created|modified|deleted).*\.(py|js|ts|ps1|json|md)"
        # Agent delegations
        "Agent" = "(?i)(spawned|delegated|agent).*(?:opus|sonnet|haiku)"
    }

    foreach ($category in $patterns.Keys) {
        if ($Content -match $patterns[$category]) {
            $memories += @{
                Category = $category
                Content = $matches[0]
                Timestamp = $timestamp
            }
        }
    }

    return $memories
}

function Create-TrackingEntry {
    param(
        [string]$Category,
        [string]$Content,
        [string]$EntityName
    )

    $trackingFile = "$PSScriptRoot\..\..\tracking\daily_$(Get-Date -Format 'yyyy_MM_dd').md"

    # Ensure tracking directory exists
    New-Item -ItemType Directory -Path "$PSScriptRoot\..\..\tracking" -Force | Out-Null

    # Create or append to tracking document
    $entry = @"

## [$timestamp] $Category
**Neo4j Entity**: [$EntityName]
``````
$Content
``````

"@

    Add-Content -Path $trackingFile -Value $entry
    return $trackingFile
}

try {
    Write-Log "PostToolUse hook processing tool result"

    # Parse tool result
    $toolName = ""
    $toolResult = ""
    $toolSuccess = $true

    if ($StdinContent) {
        $parsedInput = $StdinContent | ConvertFrom-Json
        $toolName = $parsedInput.tool
        $toolResult = $parsedInput.result | Out-String
        $toolSuccess = -not ($toolResult -match "error|failed" -and $toolResult -notmatch "success")
        Write-Log "Tool: $toolName, Success: $toolSuccess"
    }

    # Extract memory-worthy content
    $memories = Extract-MemoryWorthy -Content $toolResult

    if ($memories.Count -gt 0) {
        Write-Log "Found $($memories.Count) memory-worthy items"

        $memoryMessage = @"

## Memory Capture Protocol Active

**Tool**: $toolName
**Status**: $(if ($toolSuccess) { "Success" } else { "Failed" })
**Memory Items Detected**: $($memories.Count)

### Recommended Neo4j Storage:
"@

        foreach ($memory in $memories) {
            $deweyNumber = switch ($memory.Category) {
                "Solution" { "800" }
                "Error" { "900" }
                "Code" { "700" }
                "Config" { "600" }
                "Cypher" { "500" }
                "Files" { "400" }
                "Agent" { "300" }
                default { "999" }
            }

            $entityName = "$deweyNumber.$($memory.Category)_$(Get-Date -Format 'yyyyMMdd')"

            $memoryMessage += @"

**$($memory.Category)**:
- Entity: ``$entityName``
- Cypher: ``CREATE (n:core {name: '$entityName', observations: ['$($memory.Content -replace "'", "''")']}``
"@

            # Create tracking document entry
            $trackingPath = Create-TrackingEntry -Category $memory.Category -Content $memory.Content -EntityName $entityName
        }

        # Check for agent results that need ledger updates
        if ($toolName -eq "Task") {
            $memoryMessage += @"

### Agent Result - Ledger Update Required
**Action**: Update ledger verification index
**File**: chronos-timekeeping/.agent-templates/LEDGER-VERIFICATION-INDEX.md
**Verify**: Cross-reference Neo4j ↔ Tracking document

"@
        }

        # Dual-tracking reminder
        $memoryMessage += @"

### Dual-Tracking Protocol Reminder
1. **Neo4j**: Structured storage (shown above)
2. **Tracking Doc**: $trackingPath
3. **Citation Format**: [Entity:Verse#]

Remember: Both systems must be updated for compliance
[000.Core_Methodology:7-9]

---
"@

        Write-Output $memoryMessage
    }

    # Special handling for Neo4j tool results
    if ($toolName -match "neo4j") {
        Write-Log "Neo4j operation detected - checking for schema changes"

        if ($toolResult -match "CREATE|MERGE|DELETE") {
            $schemaMessage = @"

## Neo4j Schema Modified

Remember to:
1. Update keyword index if new entities created
2. Verify relationships are properly linked
3. Check entity naming follows Dewey.Chapter.Verse format

---
"@
            Write-Output $schemaMessage
        }
    }

    # Track tool usage statistics
    $statsFile = "$PSScriptRoot\..\memory\tool_stats_$(Get-Date -Format 'yyyyMMdd').json"
    $toolStat = @{
        Timestamp = $timestamp
        Tool = $toolName
        Success = $toolSuccess
        MemoriesCreated = $memories.Count
    }

    if (Test-Path $statsFile) {
        $stats = Get-Content $statsFile | ConvertFrom-Json
        $stats += $toolStat
        $stats | ConvertTo-Json | Set-Content $statsFile
    } else {
        @($toolStat) | ConvertTo-Json | Set-Content $statsFile
    }

    exit 0
}
catch {
    Write-Log "PostToolUse hook failed: $_" -Level "ERROR"
    exit 0  # Don't block on errors
}
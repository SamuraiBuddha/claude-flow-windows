# Notification Hook - System Alerts with Voice Integration
# CasparCode-002 Notification Protocol

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\notifications.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Speak-Notification {
    param(
        [string]$Text,
        [string]$Priority = "Normal"
    )
    try {
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

        # Adjust voice parameters based on priority
        switch ($Priority) {
            "Critical" {
                $synthesizer.Rate = -2  # Slower for emphasis
                $synthesizer.Volume = 100
                $synthesizer.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
            }
            "High" {
                $synthesizer.Rate = 0
                $synthesizer.Volume = 100
            }
            "Low" {
                $synthesizer.Rate = 2
                $synthesizer.Volume = 70
            }
            default {
                $synthesizer.Rate = 0
                $synthesizer.Volume = 85
            }
        }

        $synthesizer.SpeakAsync($Text)
        Start-Sleep -Milliseconds 100  # Allow async start
        $synthesizer.Dispose()
    }
    catch {
        Write-Log "TTS notification failed: $_" -Level "WARN"
    }
}

function Get-NotificationPriority {
    param([string]$Content)

    if ($Content -match "(?i)(critical|urgent|emergency|fatal)") {
        return "Critical"
    }
    elseif ($Content -match "(?i)(error|failed|violation|warning)") {
        return "High"
    }
    elseif ($Content -match "(?i)(info|complete|success)") {
        return "Low"
    }
    else {
        return "Normal"
    }
}

function Format-NotificationMessage {
    param(
        [string]$Type,
        [string]$Message,
        [string]$Priority
    )

    $icon = switch ($Priority) {
        "Critical" { "🚨" }  # Will be filtered by emoji prohibition
        "High" { "⚠" }
        "Low" { "ℹ" }
        default { "•" }
    }

    # Apply emoji prohibition rule
    $icon = switch ($Priority) {
        "Critical" { "[!]" }
        "High" { "[*]" }
        "Low" { "[i]" }
        default { "[-]" }
    }

    return @"

$icon **$Type Notification** [$Priority Priority]
$Message

---
"@
}

try {
    Write-Log "Notification hook processing alert"

    # Parse notification data
    $notification = @{
        Type = "System"
        Message = ""
        Priority = "Normal"
        Source = ""
    }

    if ($StdinContent) {
        $parsedInput = $StdinContent | ConvertFrom-Json
        $notification.Type = $parsedInput.type
        $notification.Message = $parsedInput.message
        $notification.Source = $parsedInput.source

        # Auto-detect priority if not specified
        if ($parsedInput.priority) {
            $notification.Priority = $parsedInput.priority
        } else {
            $notification.Priority = Get-NotificationPriority -Content $notification.Message
        }

        Write-Log "Notification: $($notification.Type) - $($notification.Priority)"
    }

    # Process based on notification type
    $response = switch ($notification.Type) {
        "AgentComplete" {
            $voiceMessage = "Agent task completed"
            @"
## Agent Task Completed
$($notification.Message)

Next steps:
1. Verify agent followed dual-tracking protocol
2. Check ledger verification index
3. Update Neo4j with results
"@
        }

        "ErrorDetected" {
            $voiceMessage = "Error detected. Check logs"
            @"
## ⚠ Error Detected
$($notification.Message)

Recommended actions:
1. Review error details in logs
2. Spawn appropriate agent for resolution
3. Update 900.Errors chapter in Neo4j
"@
        }

        "MemoryThreshold" {
            $voiceMessage = "Memory threshold reached. Consider compaction"
            @"
## Memory Management Alert
$($notification.Message)

Options:
1. Run pre-compaction to save context
2. Archive completed work to Neo4j
3. Clear temporary files in memory folder
"@
        }

        "OrchestrationViolation" {
            $voiceMessage = "Orchestration violation. Delegate to agents"
            @"
## ORCHESTRATION VIOLATION
$($notification.Message)

**CRITICAL**: Direct coding detected!
Remember: CasparCode-002 delegates ALL code tasks to agents
[000.CasparCode_Role:1-6]
"@
        }

        "TestFailure" {
            $voiceMessage = "Test failure detected"
            @"
## Test Failure Alert
$($notification.Message)

TDD Protocol:
1. Tests must pass before code is complete
2. RED-GREEN-REFACTOR cycle required
3. Update test results in Neo4j
"@
        }

        "ProjectUpdate" {
            $voiceMessage = "Project update available"
            @"
## Project Update
$($notification.Message)

Sync required:
1. Pull latest from repository
2. Update Neo4j project entities
3. Review tracking documents
"@
        }

        default {
            $voiceMessage = "System notification"
            @"
## $($notification.Type) Notification
$($notification.Message)
"@
        }
    }

    # Format final message
    $formattedMessage = Format-NotificationMessage `
        -Type $notification.Type `
        -Message $response `
        -Priority $notification.Priority

    # Add Neo4j storage for critical notifications
    if ($notification.Priority -in @("Critical", "High")) {
        $notificationEntity = "Notification_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        $formattedMessage += @"

### Neo4j Storage Recommended
``````cypher
CREATE (n:core {
  name: '$notificationEntity',
  observations: [
    '[$timestamp] Type: $($notification.Type)',
    '[$timestamp] Priority: $($notification.Priority)',
    '[$timestamp] Message: $($notification.Message -replace "'", "''")'
  ]
})
``````
"@
    }

    # Output formatted message
    Write-Output $formattedMessage

    # Voice announcement based on priority and preferences
    $voiceEnabled = $false

    # Check if voice is enabled for this priority
    $voiceConfig = "$PSScriptRoot\..\memory\voice_preferences.json"
    if (Test-Path $voiceConfig) {
        $prefs = Get-Content $voiceConfig | ConvertFrom-Json
        $voiceEnabled = $prefs."$($notification.Priority)VoiceAlerts"
    } else {
        # Default: voice for Critical and High only
        $voiceEnabled = $notification.Priority -in @("Critical", "High")
    }

    if ($voiceEnabled) {
        Speak-Notification -Text $voiceMessage -Priority $notification.Priority
    }

    # Log notification
    $notificationLog = @{
        Timestamp = $timestamp
        Type = $notification.Type
        Priority = $notification.Priority
        Source = $notification.Source
        VoiceAnnounced = $voiceEnabled
    } | ConvertTo-Json

    $notificationHistory = "$PSScriptRoot\..\memory\notification_history.json"
    if (Test-Path $notificationHistory) {
        $history = Get-Content $notificationHistory | ConvertFrom-Json
        $history += $notificationLog | ConvertFrom-Json
        $history | ConvertTo-Json | Set-Content $notificationHistory
    } else {
        @($notificationLog | ConvertFrom-Json) | ConvertTo-Json | Set-Content $notificationHistory
    }

    Write-Log "Notification processed and logged"

    exit 0
}
catch {
    Write-Log "Notification hook failed: $_" -Level "ERROR"
    exit 0  # Don't block on notification errors
}
# UserPromptSubmit Hook - Neo4j Context Loading with Voice
# CasparCode-002 Pre-Prompt Processing

param(
    [string]$StdinContent = ""
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$logFile = "$PSScriptRoot\..\memory\user_prompts.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $logFile -Value $logEntry
}

function Speak-Text {
    param([string]$Text)
    try {
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $synthesizer.Rate = 0  # Normal speed
        $synthesizer.Volume = 100  # Max volume
        $synthesizer.Speak($Text)
        $synthesizer.Dispose()
    }
    catch {
        Write-Log "TTS failed: $_" -Level "WARN"
    }
}

try {
    Write-Log "UserPromptSubmit hook processing"

    # Parse user input
    $userInput = ""
    if ($StdinContent) {
        $parsedInput = $StdinContent | ConvertFrom-Json
        $userInput = $parsedInput.userPrompt
        Write-Log "User prompt: $userInput"
    }

    # Check for voice activation keywords
    $voiceKeywords = @("speak", "say", "tell me", "voice", "read", "announce")
    $shouldSpeak = $false
    foreach ($keyword in $voiceKeywords) {
        if ($userInput -like "*$keyword*") {
            $shouldSpeak = $true
            break
        }
    }

    # Build context message
    $contextMessage = @"

## Context Loading Protocol Active

**Keywords detected in prompt:**
"@

    # Analyze prompt for Neo4j context needs
    $contextQueries = @()

    # Check for project-specific keywords
    if ($userInput -match "oblivion|remastered") {
        $contextQueries += "MATCH (n:core) WHERE n.name CONTAINS 'oblivion_remastered' RETURN n.name, n.observations[0..2]"
    }

    if ($userInput -match "chronos|timekeep") {
        $contextQueries += "MATCH (n:core) WHERE n.name CONTAINS 'chronos_timekeeping' RETURN n.name, n.observations[0..2]"
    }

    # Check for methodology keywords
    if ($userInput -match "spec.?kit|test|tdd") {
        $contextQueries += "MATCH (n:core) WHERE n.name IN ['100.Constitution', '300.Spec_Kit'] RETURN n.name, n.observations[0..2]"
    }

    # Check for agent/orchestration keywords
    if ($userInput -match "agent|delegate|orchestr|caspar") {
        $contextQueries += "MATCH (n:core) WHERE n.name = '000.CasparCode_Role' RETURN n.name, n.observations"
    }

    if ($contextQueries.Count -gt 0) {
        $contextMessage += "`n**Neo4j queries to run:**`n"
        foreach ($query in $contextQueries) {
            $contextMessage += "- ``$query``  `n"
        }
    }

    # Check for voice commands
    if ($userInput -match "whisper|listen|hear|voice.?input") {
        $contextMessage += "`n**Voice Input Detected**: Whisper integration available via Python`n"
        $contextMessage += "- Model path: C:\Users\JordanEhrig\Documents\GitHub\whisper`n"
        $contextMessage += "- Command: ``python -m whisper audio.wav --model tiny``  `n"
    }

    # Agent delegation reminder
    if ($userInput -match "implement|code|fix|debug|create|build|develop") {
        $contextMessage += @"

### REMINDER: Orchestration-First Protocol
- NO direct coding - delegate to agents based on complexity:
  - **Opus agents**: Complex architecture, security, critical bugs
  - **Sonnet agents**: Standard features, refactoring, tests
  - **Haiku agents**: Simple fixes, docs, formatting
- Verify dual-tracking: Neo4j + tracking documents
- Citation format: [Entity:Verse#]
"@
    }

    # Add voice notification if enabled
    if ($shouldSpeak) {
        $contextMessage += "`n**Voice Output**: Windows SAPI TTS enabled for responses`n"

        # Speak acknowledgment
        Speak-Text "Processing your request"
    }

    $contextMessage += "`n---"

    Write-Output $contextMessage
    Write-Log "Context queries prepared: $($contextQueries.Count)"

    # Store prompt for later analysis
    $promptData = @{
        Timestamp = $timestamp
        UserInput = $userInput
        ContextQueries = $contextQueries
        VoiceEnabled = $shouldSpeak
    } | ConvertTo-Json

    Set-Content -Path "$PSScriptRoot\..\memory\last_prompt.json" -Value $promptData

    exit 0
}
catch {
    Write-Log "UserPromptSubmit failed: $_" -Level "ERROR"
    exit 2
}
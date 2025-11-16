# Claude Flow Windows Hooks Implementation
## CasparCode-002 Orchestration-First Protocol

This directory contains Windows PowerShell implementations of all 8 Claude Code lifecycle hooks, tailored for the CasparCode-002 methodology with voice integration capabilities.

## Core Principles

1. **Orchestration-First**: All code tasks MUST be delegated to agents
2. **Dual-Tracking Protocol**: Neo4j memory + tracking documents
3. **No Emojis**: Strict prohibition ([000_core_methodology_emoji_prohibition])
4. **Windows SAPI TTS**: Voice output for notifications and summaries
5. **APOC Memory v2**: Advanced memory management system

## Implemented Hooks

### 1. SessionStart (`session_start.ps1`)
**Purpose**: Initialize CasparCode-002 operational mode
- Sets orchestration-first rules
- Loads core methodology from Neo4j
- Configures MCP servers
- Creates session metadata
- **Voice**: Silent initialization

### 2. UserPromptSubmit (`user_prompt_submit.ps1`)
**Purpose**: Analyze prompts and load relevant context
- Keyword detection for projects (oblivion, chronos)
- Neo4j query preparation
- Voice activation detection
- Context loading based on prompt analysis
- **Voice**: Speaks acknowledgment when voice keywords detected

### 3. PreToolUse (`pre_tool_use.ps1`)
**Purpose**: Enforce orchestration-first methodology
- Blocks direct coding attempts
- Enforces agent delegation
- Tracks tool usage patterns
- Monitors orchestration compliance
- **Voice**: Warning for orchestration violations

### 4. PostToolUse (`post_tool_use.ps1`)
**Purpose**: Capture memory-worthy content
- Extracts solutions, errors, code patterns
- Creates Neo4j memory entities
- Updates tracking documents
- Ensures dual-tracking compliance
- **Voice**: Silent operation

### 5. Stop (`stop.ps1`)
**Purpose**: Session summary and verification
- Generates session statistics
- Verifies dual-tracking compliance
- Archives session data
- Creates Neo4j session entity
- **Voice**: Optional summary on request

### 6. SubagentStop (`subagent_stop.ps1`)
**Purpose**: Agent completion tracking
- Analyzes agent results
- Updates ledger verification index
- Tracks agent performance metrics
- Creates agent completion entities
- **Voice**: Silent operation

### 7. PreCompact (`pre_compact.ps1`)
**Purpose**: Context preservation before compaction
- Extracts critical context
- Saves compaction summary
- Archives pre-compaction state
- Creates recovery queries
- **Voice**: Silent operation

### 8. Notification (`notification.ps1`)
**Purpose**: System alerts with priority handling
- Processes various notification types
- Priority-based voice alerts
- Neo4j storage for critical alerts
- Notification history tracking
- **Voice**: Based on priority and preferences

## Voice Integration Features

### Windows SAPI TTS
- Built-in Windows Speech API
- No external dependencies
- Configurable rate and volume
- Gender selection support
- Async speech for non-blocking

### Voice Activation Keywords
Detected in user prompts:
- `speak`, `say`, `tell me`
- `voice`, `read`, `announce`
- `whisper`, `listen`, `hear`

### Voice Preferences
Configured in `.claude\memory\voice_preferences.json`:
```json
{
  "CriticalVoiceAlerts": true,
  "HighVoiceAlerts": true,
  "NormalVoiceAlerts": false,
  "LowVoiceAlerts": false
}
```

## Directory Structure

```
.claude/
├── hooks/
│   ├── session_start.ps1
│   ├── user_prompt_submit.ps1
│   ├── pre_tool_use.ps1
│   ├── post_tool_use.ps1
│   ├── stop.ps1
│   ├── subagent_stop.ps1
│   ├── pre_compact.ps1
│   ├── notification.ps1
│   └── README.md
├── memory/
│   ├── voice_preferences.json
│   ├── session_*.log
│   ├── tool_usage_*.json
│   ├── agent_stats.json
│   └── archive/
├── settings.json
└── tracking/
    └── daily_*.md
```

## Memory System Files

### Logs
- `session_*.log`: Session initialization and closure
- `user_prompts.log`: User input tracking
- `tool_use.log`: Tool usage monitoring
- `memory_capture.log`: Memory creation events
- `agent_results.log`: Agent completion tracking
- `compaction.log`: Compaction events
- `notifications.log`: System notifications

### JSON Data
- `current_session.json`: Active session metadata
- `last_prompt.json`: Most recent user prompt
- `tool_usage_*.json`: Daily tool usage stats
- `agent_stats.json`: Agent spawning statistics
- `agent_performance.json`: Agent completion metrics
- `tool_stats_*.json`: Tool success rates
- `notification_history.json`: Notification log

### Tracking Documents
- `tracking/daily_*.md`: Daily dual-tracking documents
- Citations follow `[Entity:Verse#]` format
- Cross-references with Neo4j entities

## Agent Delegation Tiers

### Opus Agents
- Complex architecture decisions
- Security-critical implementations
- Complex debugging
- Critical bug fixes

### Sonnet Agents
- Standard feature implementation
- Code refactoring
- Test writing
- Standard bug fixes

### Haiku Agents
- Documentation updates
- Simple configuration changes
- Trivial bug fixes
- Code formatting

## Error Handling

All hooks follow consistent error handling:
- Exit code 0: Success or non-blocking warning
- Exit code 2: Blocking error (PreToolUse violations)
- Comprehensive logging with levels: INFO, WARN, ERROR
- Non-blocking on hook failures to maintain session stability

## Testing Hooks

To test individual hooks:

```powershell
# Test SessionStart
powershell.exe -ExecutionPolicy Bypass -File .claude\hooks\session_start.ps1

# Test with input (UserPromptSubmit)
$input = @{userPrompt = "speak to me about chronos timekeeping"} | ConvertTo-Json
$input | powershell.exe -ExecutionPolicy Bypass -File .claude\hooks\user_prompt_submit.ps1

# Test PreToolUse blocking
$input = @{tool = "Write"; arguments = @{file_path = "test.py"}} | ConvertTo-Json
$input | powershell.exe -ExecutionPolicy Bypass -File .claude\hooks\pre_tool_use.ps1
```

## Maintenance

### Adding New Projects
Update keyword detection in `user_prompt_submit.ps1`:
```powershell
if ($userInput -match "new_project") {
    $contextQueries += "MATCH (n:core) WHERE n.name CONTAINS 'new_project' RETURN n.name, n.observations[0..2]"
}
```

### Modifying Voice Settings
Edit `.claude\memory\voice_preferences.json` or use PowerShell:
```powershell
$prefs = Get-Content .claude\memory\voice_preferences.json | ConvertFrom-Json
$prefs.HighVoiceAlerts = $false
$prefs | ConvertTo-Json | Set-Content .claude\memory\voice_preferences.json
```

### Archiving Old Sessions
Sessions are automatically archived in `.claude\memory\archive\`
Manual cleanup:
```powershell
Get-ChildItem .claude\memory\archive -Directory |
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Recurse -Force
```

## Integration with MCP Servers

The hooks integrate with:
- **neo4j-memory-lilith**: Memory storage and retrieval
- **neo4j-cypher-lilith**: Direct Cypher queries
- **time-precision**: Timestamp management
- **claude-flow-windows**: Swarm orchestration

## Future Enhancements

### Planned Features
- [ ] Whisper integration for speech-to-text input
- [ ] Coqui TTS for multi-language support
- [ ] Real-time agent monitoring dashboard
- [ ] Automated ledger reconciliation
- [ ] Voice command processing

### Potential Integrations
- [ ] OBS Studio automation (argos-mcp)
- [ ] Documentation server (atlas-docs-mcp)
- [ ] Calculator for metrics (calculator-mcp-server)
- [ ] WinDBG for crash analysis (mcp-windbg)

## Troubleshooting

### Common Issues

**Hooks not triggering**
- Verify settings.json paths use double backslashes
- Check PowerShell execution policy
- Ensure .ps1 files have correct permissions

**Voice not working**
- Windows Speech platform must be installed
- Check voice_preferences.json settings
- Verify System.Speech assembly available

**Memory not persisting**
- Check Neo4j MCP server is running
- Verify dual-tracking documents created
- Review logs for Neo4j connection errors

**Agent delegation blocked**
- PreToolUse hook working correctly
- Use Task tool with proper subagent_type
- Check agent_stats.json for delegation metrics

## Compliance Checklist

Every session should:
- [ ] Load core methodology at start
- [ ] Delegate ALL code tasks to agents
- [ ] Update both Neo4j and tracking docs
- [ ] Use proper citation format [Entity:Verse#]
- [ ] Archive session data on stop
- [ ] Verify dual-tracking compliance
- [ ] NO direct coding by CasparCode-002

## Credits

Created for CasparCode-002 operational mode on Caspar machine:
- Intel Core i9-14900KF
- NVIDIA RTX 3090
- 64GB DDR5
- Windows with PowerShell

Based on Claude Code Hooks architecture with Windows-specific adaptations for voice integration and CasparCode-002 orchestration methodology.
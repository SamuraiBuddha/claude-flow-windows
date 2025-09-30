# Claude Flow Windows API Documentation

Complete reference for all 87 tools available in the Claude Flow Windows MCP server.

## Table of Contents

1. [Swarm Coordination Tools](#swarm-coordination-tools)
2. [Cognitive Diversity Tools](#cognitive-diversity-tools)
3. [Memory Management Tools](#memory-management-tools)
4. [Performance Analysis Tools](#performance-analysis-tools)
5. [Windows Integration Tools](#windows-integration-tools)
6. [GitHub Automation Tools](#github-automation-tools)
7. [Workflow Automation Tools](#workflow-automation-tools)
8. [Optimization Tools](#optimization-tools)
9. [Training & Learning Tools](#training--learning-tools)

---

## Swarm Coordination Tools

### `swarm_init`

Initialize a swarm with specified topology and configuration.

**Parameters:**
- `topology` (required): Swarm network topology
  - `hierarchical`: Traditional command-and-control structure
  - `mesh`: Peer-to-peer agent communication
  - `star`: Central coordinator with spoke agents
  - `ring`: Circular communication patterns
  - `adaptive`: Dynamic topology based on workload
- `maxAgents` (optional, default: 8): Maximum number of agents in swarm
- `strategy` (optional, default: 'balanced'): Task execution strategy
  - `parallel`: Execute tasks simultaneously
  - `sequential`: Execute tasks in order
  - `balanced`: Mix of parallel and sequential based on dependencies
- `enableMemory` (optional, default: true): Enable persistent memory

**Example:**
```json
{
  "topology": "adaptive",
  "maxAgents": 12,
  "strategy": "balanced",
  "enableMemory": true
}
```

**Response:**
```json
{
  "swarmId": "swarm_a1b2c3d4",
  "topology": "adaptive",
  "status": "initialized",
  "agents": [],
  "capabilities": ["coordination", "memory", "optimization"]
}
```

---

### `agent_spawn`

Spawn a new agent with specific capabilities and context.

**Parameters:**
- `type` (required): Agent type and specialization
  - `coder`: Software development and programming
  - `researcher`: Information gathering and analysis
  - `reviewer`: Code and document review
  - `architect`: System design and architecture
  - `tester`: Quality assurance and testing
  - `devops`: Operations and deployment
  - `analyst`: Data analysis and reporting
  - `coordinator`: Task coordination and management
- `name` (optional): Agent name/identifier for tracking
- `skills` (optional): Comma-separated list of specialized skills
- `context` (optional): Working directory or contextual information

**Example:**
```json
{
  "type": "coder",
  "name": "python-specialist",
  "skills": "python,django,api-development,testing",
  "context": "C:\\Projects\\web-api"
}
```

**Response:**
```json
{
  "agentId": "agent_py_001",
  "type": "coder",
  "name": "python-specialist",
  "status": "active",
  "skills": ["python", "django", "api-development", "testing"],
  "context": "C:\\Projects\\web-api",
  "spawnTime": "2024-01-15T10:30:00Z"
}
```

---

### `task_orchestrate`

Orchestrate complex task execution across the swarm with intelligent distribution.

**Parameters:**
- `task` (required): Detailed task description
- `priority` (optional, default: 'medium'): Task priority level
  - `critical`: Immediate execution, highest resource allocation
  - `high`: Priority execution, elevated resources
  - `medium`: Standard execution
  - `low`: Background execution, minimal resources
- `strategy` (optional, default: 'adaptive'): Execution strategy
  - `parallel`: Execute subtasks simultaneously
  - `sequential`: Execute subtasks in dependency order
  - `adaptive`: Dynamic strategy based on task analysis
- `assignTo` (optional): Array of specific agent IDs for direct assignment

**Example:**
```json
{
  "task": "Implement OAuth2 authentication system with JWT tokens, including user registration, login, password reset, and session management",
  "priority": "high",
  "strategy": "adaptive",
  "assignTo": ["agent_py_001", "agent_sec_002"]
}
```

**Response:**
```json
{
  "taskId": "task_oauth_001",
  "status": "orchestrating",
  "subtasks": [
    {
      "id": "subtask_001",
      "description": "Design OAuth2 flow architecture",
      "assignedTo": "agent_sec_002",
      "status": "assigned"
    },
    {
      "id": "subtask_002", 
      "description": "Implement JWT token management",
      "assignedTo": "agent_py_001",
      "status": "assigned"
    }
  ],
  "estimatedCompletion": "2024-01-15T14:30:00Z"
}
```

---

### `swarm_monitor`

Monitor swarm status, performance metrics, and agent health.

**Parameters:**
- `swarmId` (optional): Specific swarm to monitor (current if not specified)
- `includeMetrics` (optional, default: true): Include performance metrics
- `includeAgents` (optional, default: true): Include agent status details

**Example:**
```json
{
  "swarmId": "swarm_a1b2c3d4",
  "includeMetrics": true,
  "includeAgents": true
}
```

**Response:**
```json
{
  "swarmId": "swarm_a1b2c3d4",
  "status": "active",
  "topology": "adaptive",
  "agents": {
    "total": 8,
    "active": 7,
    "idle": 1,
    "details": [
      {
        "id": "agent_py_001",
        "type": "coder",
        "status": "busy",
        "currentTask": "task_oauth_001_subtask_002",
        "utilization": 85
      }
    ]
  },
  "metrics": {
    "tasksCompleted": 142,
    "averageTaskTime": "00:12:34",
    "efficiency": 94.2,
    "tokenUsage": {
      "total": 124500,
      "average": 876
    }
  }
}
```

---

## Cognitive Diversity Tools

### `cognitive_spawn`

Spawn an agent with a specific cognitive pattern for diverse problem-solving approaches.

**Parameters:**
- `pattern` (required): Cognitive diversity pattern
  - `analytical`: Logic-driven, systematic analysis
  - `creative`: Innovation-focused, out-of-the-box thinking
  - `systematic`: Methodical, process-oriented approach
  - `intuitive`: Pattern-based, rapid decision making
  - `holistic`: Big-picture perspective, interconnected thinking
  - `detail-oriented`: Precision-focused, thorough analysis
- `role` (optional): Specific role within the swarm

**Example:**
```json
{
  "pattern": "creative",
  "role": "solution-architect"
}
```

**Response:**
```json
{
  "agentId": "cognitive_creative_001",
  "pattern": "creative",
  "role": "solution-architect",
  "characteristics": [
    "divergent thinking",
    "novel solution generation",
    "rapid prototyping",
    "alternative perspective"
  ],
  "status": "active"
}
```

---

### `neural_pattern`

Apply advanced neural pattern recognition to complex inputs.

**Parameters:**
- `input` (required): Data or problem to analyze
- `model` (optional, default: 'ensemble'): Neural model to use
  - `lstm`: Long Short-Term Memory for sequential patterns
  - `tcn`: Temporal Convolutional Network for time series
  - `nbeats`: Neural basis expansion for forecasting
  - `transformer`: Attention-based pattern recognition
  - `ensemble`: Combination of multiple models for robust analysis

**Example:**
```json
{
  "input": "User engagement has dropped 15% over the last month. Peak usage shifted from 2PM to 4PM. Mobile traffic increased 20% while desktop decreased 10%.",
  "model": "ensemble"
}
```

**Response:**
```json
{
  "patterns": [
    {
      "type": "temporal_shift",
      "confidence": 0.92,
      "description": "Usage pattern shift indicates changing user behavior"
    },
    {
      "type": "platform_migration", 
      "confidence": 0.87,
      "description": "Mobile-first usage trend emerging"
    }
  ],
  "recommendations": [
    "Optimize mobile experience during 4PM peak",
    "Investigate desktop usability issues",
    "Consider mobile-specific features"
  ]
}
```

---

### `daa_consensus`

Dynamic Agent Architecture consensus building for complex decision making.

**Parameters:**
- `topic` (required): Topic or decision requiring consensus
- `agents` (optional): Specific agents to include in consensus
- `threshold` (optional, default: 0.7): Consensus threshold (0.5-1.0)

**Example:**
```json
{
  "topic": "Choose between microservices vs monolithic architecture for the new project",
  "agents": ["agent_arch_001", "agent_py_001", "agent_ops_001"],
  "threshold": 0.8
}
```

**Response:**
```json
{
  "consensusReached": true,
  "finalScore": 0.85,
  "decision": "microservices",
  "reasoning": "Scalability requirements and team distribution favor microservices approach",
  "agentVotes": [
    {
      "agentId": "agent_arch_001",
      "position": "microservices",
      "confidence": 0.9,
      "reasoning": "Better scalability and maintainability"
    },
    {
      "agentId": "agent_py_001", 
      "position": "microservices",
      "confidence": 0.8,
      "reasoning": "Aligns with Python ecosystem patterns"
    }
  ]
}
```

---

## Memory Management Tools

### `memory_store`

Store data in persistent memory with optional TTL and namespace organization.

**Parameters:**
- `key` (required): Unique identifier for the stored data
- `value` (required): Data to store (any JSON-serializable object)
- `namespace` (optional, default: 'default'): Logical grouping namespace
- `ttl` (optional): Time to live in seconds

**Example:**
```json
{
  "key": "oauth_config",
  "value": {
    "clientId": "app_12345",
    "scopes": ["read", "write", "admin"],
    "endpoints": {
      "auth": "https://auth.example.com/oauth/authorize",
      "token": "https://auth.example.com/oauth/token"
    }
  },
  "namespace": "authentication",
  "ttl": 3600
}
```

**Response:**
```json
{
  "success": true,
  "key": "oauth_config",
  "namespace": "authentication",
  "stored": "2024-01-15T10:30:00Z",
  "expires": "2024-01-15T11:30:00Z"
}
```

---

### `memory_retrieve`

Retrieve data from persistent memory with namespace support.

**Parameters:**
- `key` (required): Key of the data to retrieve
- `namespace` (optional, default: 'default'): Namespace to search in

**Example:**
```json
{
  "key": "oauth_config",
  "namespace": "authentication"
}
```

**Response:**
```json
{
  "success": true,
  "key": "oauth_config",
  "namespace": "authentication",
  "value": {
    "clientId": "app_12345",
    "scopes": ["read", "write", "admin"],
    "endpoints": {
      "auth": "https://auth.example.com/oauth/authorize",
      "token": "https://auth.example.com/oauth/token"
    }
  },
  "stored": "2024-01-15T10:30:00Z",
  "accessed": "2024-01-15T10:45:00Z"
}
```

---

### `memory_persist`

Export or import memory state for backup and migration.

**Parameters:**
- `action` (required): Operation to perform
  - `export`: Export memory to file
  - `import`: Import memory from file
- `path` (optional): File path for export/import
- `compress` (optional, default: false): Use compression for export

**Example (Export):**
```json
{
  "action": "export",
  "path": "C:\\Backups\\claude-flow-memory-2024-01-15.json",
  "compress": true
}
```

**Response:**
```json
{
  "success": true,
  "action": "export",
  "path": "C:\\Backups\\claude-flow-memory-2024-01-15.json",
  "itemsExported": 1247,
  "fileSize": "2.4 MB",
  "compressed": true
}
```

---

## Performance Analysis Tools

### `bottleneck_detect`

Detect performance bottlenecks in swarm operations with automatic fixes.

**Parameters:**
- `swarmId` (optional): Specific swarm to analyze
- `timeRange` (optional, default: '1h'): Analysis time window
- `autoFix` (optional, default: false): Automatically apply fixes

**Example:**
```json
{
  "swarmId": "swarm_a1b2c3d4",
  "timeRange": "24h",
  "autoFix": true
}
```

**Response:**
```json
{
  "bottlenecks": [
    {
      "type": "memory_leak",
      "severity": "medium",
      "location": "agent_py_001",
      "description": "Gradual memory increase over 6 hours",
      "impact": "15% performance degradation",
      "autoFixed": true,
      "fix": "Implemented memory cleanup cycle"
    },
    {
      "type": "task_queue_backup",
      "severity": "high", 
      "location": "task_orchestrator",
      "description": "Task queue growing faster than processing",
      "impact": "25% increased latency",
      "autoFixed": false,
      "recommendation": "Increase parallel processing capacity"
    }
  ],
  "overallHealth": 78,
  "recommendations": [
    "Scale up agent pool during peak hours",
    "Implement adaptive task batching"
  ]
}
```

---

### `performance_report`

Generate comprehensive performance analysis reports.

**Parameters:**
- `format` (optional, default: 'json'): Output format
  - `json`: Structured JSON data
  - `markdown`: Human-readable markdown report
  - `html`: Interactive HTML dashboard
- `compareWith` (optional): Compare with previous time period
- `includeMetrics` (optional, default: true): Include detailed metrics

**Example:**
```json
{
  "format": "markdown",
  "compareWith": "last_week",
  "includeMetrics": true
}
```

**Response:**
```markdown
# Swarm Performance Report
*Generated: 2024-01-15 10:30:00*

## Executive Summary
- **Overall Efficiency**: 92.3% (+5.2% vs last week)
- **Tasks Completed**: 1,247 (+23% vs last week)  
- **Average Response Time**: 2.3s (-0.5s vs last week)

## Key Metrics
| Metric | Current | Last Week | Change |
|--------|---------|-----------|---------|
| Agent Utilization | 87% | 82% | +5% |
| Token Efficiency | 94.2% | 91.1% | +3.1% |
| Error Rate | 0.8% | 1.2% | -0.4% |

## Recommendations
1. **Scale agents during 2-4 PM peak** - 25% higher load detected
2. **Optimize memory usage** - 3 agents showing gradual increase
3. **Consider adaptive topology** - Current fixed topology suboptimal
```

---

### `token_usage`

Analyze token consumption patterns and optimization opportunities.

**Parameters:**
- `period` (optional, default: '24h'): Analysis time period
- `byAgent` (optional, default: false): Break down by individual agent
- `exportPath` (optional): Export detailed data to file

**Example:**
```json
{
  "period": "7d",
  "byAgent": true,
  "exportPath": "C:\\Reports\\token-usage-analysis.csv"
}
```

**Response:**
```json
{
  "summary": {
    "totalTokens": 2456789,
    "averagePerTask": 1247,
    "averagePerAgent": 8952,
    "efficiency": 94.2,
    "cost": "$24.57"
  },
  "breakdown": [
    {
      "agentId": "agent_py_001",
      "agentType": "coder",
      "tokensUsed": 45623,
      "tasksCompleted": 47,
      "efficiency": 96.1,
      "costPerTask": "$0.51"
    }
  ],
  "optimizations": [
    {
      "type": "prompt_compression",
      "potential_savings": "15%",
      "description": "Compress repetitive context in prompts"
    },
    {
      "type": "result_caching",
      "potential_savings": "8%", 
      "description": "Cache frequent query results"
    }
  ]
}
```

---

## Windows Integration Tools

### `shell_execute`

Execute Windows PowerShell commands with elevation and context support.

**Parameters:**
- `command` (required): PowerShell command to execute
- `elevated` (optional, default: false): Run with administrator privileges
- `workingDir` (optional): Working directory for command execution

**Example:**
```json
{
  "command": "Get-Process | Where-Object {$_.CPU -gt 100} | Select-Object Name, CPU, WorkingSet | Sort-Object CPU -Descending",
  "elevated": false,
  "workingDir": "C:\\Projects"
}
```

**Response:**
```json
{
  "success": true,
  "exitCode": 0,
  "output": "Name          CPU    WorkingSet\n----          ---    ----------\nchrome      2847.5     524288000\ncode        1456.2     312832000\nnode         892.1     156672000",
  "error": "",
  "executionTime": "1.2s",
  "workingDir": "C:\\Projects"
}
```

---

### `wsl_bridge`

Bridge commands to Windows Subsystem for Linux when available.

**Parameters:**
- `command` (required): Linux command to execute via WSL
- `distribution` (optional, default: 'Ubuntu'): WSL distribution to use

**Example:**
```json
{
  "command": "grep -r 'TODO' . --include='*.py' | head -10",
  "distribution": "Ubuntu-22.04"
}
```

**Response:**
```json
{
  "success": true,
  "wslAvailable": true,
  "distribution": "Ubuntu-22.04",
  "output": "./src/main.py:45:# TODO: Implement error handling\n./tests/test_auth.py:23:# TODO: Add edge case tests\n./utils/helpers.py:67:# TODO: Optimize performance",
  "executionTime": "0.8s",
  "note": "Command executed via WSL bridge"
}
```

---

## GitHub Automation Tools

### `github_swarm`

Deploy specialized swarms for GitHub repository management and automation.

**Parameters:**
- `repository` (required): GitHub repository (owner/name format)
- `focus` (optional, default: 'development'): Swarm focus area
  - `maintenance`: Issue triage, dependency updates, cleanup
  - `development`: Code review, testing, documentation
  - `triage`: Issue classification, priority assignment, routing
- `maxAgents` (optional, default: 5): Maximum agents in GitHub swarm
- `autoLabel` (optional, default: true): Automatically label issues/PRs
- `autoPR` (optional, default: false): Automatically create PRs for fixes

**Example:**
```json
{
  "repository": "claude-flow-windows/claude-flow-windows",
  "focus": "development",
  "maxAgents": 8,
  "autoLabel": true,
  "autoPR": false
}
```

**Response:**
```json
{
  "swarmId": "github_swarm_001",
  "repository": "claude-flow-windows/claude-flow-windows",
  "agents": [
    {
      "id": "gh_code_reviewer_001",
      "role": "code_reviewer",
      "focus": ["python", "typescript", "performance"]
    },
    {
      "id": "gh_issue_triager_001", 
      "role": "issue_triager",
      "focus": ["bug_classification", "priority_assignment"]
    }
  ],
  "status": "active",
  "monitoring": ["pull_requests", "issues", "releases"]
}
```

---

### `code_review`

Automated AI-powered code review for pull requests with focus areas.

**Parameters:**
- `prNumber` (required): Pull request number to review
- `focus` (optional, default: 'all'): Review focus area
  - `security`: Security vulnerabilities and best practices
  - `performance`: Performance optimization opportunities
  - `best-practices`: Code style, patterns, maintainability
  - `all`: Comprehensive review across all areas
- `suggestFixes` (optional, default: false): Generate fix suggestions

**Example:**
```json
{
  "prNumber": 42,
  "focus": "security",
  "suggestFixes": true
}
```

**Response:**
```json
{
  "prNumber": 42,
  "reviewStatus": "completed",
  "overallScore": 7.8,
  "findings": [
    {
      "type": "security",
      "severity": "high",
      "file": "src/auth.py",
      "line": 67,
      "issue": "Hardcoded secret key detected",
      "suggestion": "Move secret key to environment variable",
      "fixCode": "SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-key')"
    },
    {
      "type": "performance",
      "severity": "medium", 
      "file": "src/utils.py",
      "line": 23,
      "issue": "Inefficient loop could be optimized",
      "suggestion": "Use list comprehension for better performance"
    }
  ],
  "summary": "Good implementation overall. Address the hardcoded secret for security compliance."
}
```

---

## Workflow Automation Tools

### `workflow_select`

Intelligently select optimal workflow patterns for complex tasks.

**Parameters:**
- `task` (required): Task description for workflow selection
- `constraints` (optional): Resource or time constraints
- `preview` (optional, default: false): Preview workflow without execution

**Example:**
```json
{
  "task": "Migrate legacy PHP application to microservices architecture using Python and Docker",
  "constraints": "3-month timeline, 2 senior developers, minimal downtime",
  "preview": true
}
```

**Response:**
```json
{
  "selectedWorkflow": "incremental_migration",
  "rationale": "Large legacy migration requires phased approach to minimize risk",
  "phases": [
    {
      "phase": 1,
      "name": "Analysis & Planning",
      "duration": "3 weeks",
      "agents": ["architect", "analyst"],
      "deliverables": ["service boundaries", "migration plan", "risk assessment"]
    },
    {
      "phase": 2,
      "name": "Core Services Extraction", 
      "duration": "6 weeks",
      "agents": ["coder", "devops", "tester"],
      "deliverables": ["user service", "auth service", "API gateway"]
    }
  ],
  "riskFactors": ["data consistency", "performance impact", "team learning curve"],
  "alternatives": ["big_bang_migration", "strangler_pattern"]
}
```

---

### `auto_agent`

Automatically spawn and configure optimal agents for specific tasks.

**Parameters:**
- `task` (required): Task requiring agent allocation
- `maxAgents` (optional, default: 5): Maximum number of agents to spawn
- `strategy` (optional, default: 'balanced'): Agent selection strategy
  - `minimal`: Fewest agents necessary
  - `balanced`: Optimal balance of speed and resource usage
  - `comprehensive`: Maximum coverage with specialized agents

**Example:**
```json
{
  "task": "Build REST API for e-commerce platform with payment processing, inventory management, and user authentication",
  "maxAgents": 8,
  "strategy": "comprehensive"
}
```

**Response:**
```json
{
  "taskId": "auto_task_001",
  "agentsSpawned": 6,
  "agents": [
    {
      "id": "auto_architect_001",
      "type": "architect", 
      "focus": "API design, system architecture",
      "responsibility": "Design overall system structure and API contracts"
    },
    {
      "id": "auto_coder_001",
      "type": "coder",
      "focus": "Python, FastAPI, authentication",
      "responsibility": "Implement authentication and user management"
    },
    {
      "id": "auto_coder_002",
      "type": "coder", 
      "focus": "Python, payment APIs, security",
      "responsibility": "Implement payment processing integration"
    },
    {
      "id": "auto_devops_001",
      "type": "devops",
      "focus": "Docker, CI/CD, deployment",
      "responsibility": "Setup deployment pipeline and infrastructure"
    }
  ],
  "coordination": "hierarchical",
  "estimatedCompletion": "8-12 weeks"
}
```

---

### `smart_spawn`

Intelligently spawn agents based on current workload analysis.

**Parameters:**
- `analyze` (optional, default: true): Analyze current workload before spawning
- `threshold` (optional, default: 5): Workload threshold for spawning trigger
- `topology` (optional, default: 'adaptive'): Preferred topology for new agents

**Example:**
```json
{
  "analyze": true,
  "threshold": 8,
  "topology": "mesh"
}
```

**Response:**
```json
{
  "analysis": {
    "currentLoad": 9.2,
    "bottlenecks": ["code_review", "testing"],
    "underutilized": ["documentation"],
    "recommendation": "spawn_specialists"
  },
  "spawned": [
    {
      "id": "smart_reviewer_001",
      "type": "reviewer",
      "rationale": "Code review queue at 150% capacity",
      "specialization": "Python, security, performance"
    },
    {
      "id": "smart_tester_001",
      "type": "tester", 
      "rationale": "Testing backlog growing rapidly",
      "specialization": "API testing, automation, load testing"
    }
  ],
  "topologyAdjusted": true,
  "newTopology": "hybrid_mesh_star",
  "expectedImprovement": "35% load reduction, 50% faster turnaround"
}
```

---

## Optimization Tools

### `parallel_execute`

Execute multiple tasks in parallel with intelligent optimization.

**Parameters:**
- `tasks` (required): Array of tasks to execute in parallel
- `maxParallel` (optional, default: 5): Maximum concurrent executions
- `strategy` (optional, default: 'adaptive'): Parallelization strategy
  - `adaptive`: Dynamic adjustment based on task characteristics
  - `fixed`: Fixed number of parallel executions
  - `dynamic`: Continuously adjust based on performance

**Example:**
```json
{
  "tasks": [
    {"id": "test_suite_1", "type": "testing", "estimated_time": "5m"},
    {"id": "code_review_pr_42", "type": "review", "estimated_time": "15m"},
    {"id": "deploy_staging", "type": "deployment", "estimated_time": "8m"},
    {"id": "security_scan", "type": "analysis", "estimated_time": "12m"}
  ],
  "maxParallel": 3,
  "strategy": "adaptive"
}
```

**Response:**
```json
{
  "executionId": "parallel_exec_001",
  "strategy": "adaptive",
  "batches": [
    {
      "batch": 1,
      "tasks": ["test_suite_1", "code_review_pr_42", "security_scan"],
      "startTime": "2024-01-15T10:30:00Z"
    },
    {
      "batch": 2, 
      "tasks": ["deploy_staging"],
      "startTime": "2024-01-15T10:35:00Z",
      "waitFor": ["test_suite_1"]
    }
  ],
  "estimatedCompletion": "2024-01-15T10:45:00Z",
  "optimization": "Grouped I/O intensive tasks to avoid resource contention"
}
```

---

### `cache_manage`

Manage swarm cache for optimal performance and resource usage.

**Parameters:**
- `action` (required): Cache management action
  - `view`: Display cache statistics and contents
  - `clear`: Clear cache (specific keys or all)
  - `optimize`: Optimize cache for better performance
- `maxSize` (optional): Maximum cache size in MB
- `ttl` (optional): Default time-to-live for cache entries

**Example:**
```json
{
  "action": "optimize",
  "maxSize": 512,
  "ttl": 3600
}
```

**Response:**
```json
{
  "action": "optimize",
  "before": {
    "size": "724 MB",
    "entries": 15847,
    "hitRate": 67.3,
    "evictions": 342
  },
  "optimizations": [
    "Compressed 3,247 rarely accessed entries",
    "Evicted 1,892 expired entries", 
    "Adjusted TTL for 4,521 entries based on access patterns"
  ],
  "after": {
    "size": "485 MB", 
    "entries": 12508,
    "expectedHitRate": 82.1,
    "spaceSaved": "239 MB"
  }
}
```

---

### `topology_optimize`

Optimize swarm topology for current workload patterns.

**Parameters:**
- `currentTopology` (optional): Current topology to optimize
- `workloadType` (optional): Workload characterization
  - `parallel`: Mostly independent parallel tasks
  - `sequential`: Highly dependent sequential tasks  
  - `mixed`: Combination of parallel and sequential
- `autoApply` (optional, default: false): Automatically apply optimizations

**Example:**
```json
{
  "currentTopology": "hierarchical",
  "workloadType": "mixed",
  "autoApply": true
}
```

**Response:**
```json
{
  "analysis": {
    "currentTopology": "hierarchical",
    "efficiency": 73.2,
    "bottlenecks": ["central coordinator overload", "communication latency"]
  },
  "recommendation": {
    "newTopology": "adaptive_hybrid",
    "changes": [
      "Add mesh connections between peer agents",
      "Implement sub-coordinators for specialized tasks",
      "Direct communication paths for related agents"
    ],
    "expectedImprovement": "25-30% efficiency gain"
  },
  "applied": true,
  "migrationStatus": "in_progress",
  "estimatedCompletion": "2024-01-15T10:45:00Z"
}
```

---

## Training & Learning Tools

### `model_update`

Update swarm learning models based on performance data and new patterns.

**Parameters:**
- `model` (optional, default: 'agent-selector'): Model to update
  - `agent-selector`: Agent selection optimization
  - `task-router`: Task routing and distribution
  - `performance-predictor`: Performance prediction and optimization
- `incremental` (optional, default: true): Incremental vs full retraining
- `validate` (optional, default: true): Validate model before deployment

**Example:**
```json
{
  "model": "task-router",
  "incremental": true,
  "validate": true
}
```

**Response:**
```json
{
  "model": "task-router",
  "updateType": "incremental",
  "trainingData": {
    "samples": 15623,
    "period": "last_30_days",
    "features": ["task_type", "agent_specialization", "workload", "dependencies"]
  },
  "improvements": {
    "accuracy": "+12.3%",
    "responseTime": "-25ms",
    "resourceEfficiency": "+8.7%"
  },
  "validation": {
    "passed": true,
    "testAccuracy": 94.7,
    "crossValidationScore": 0.923
  },
  "deployed": true,
  "rollbackPlan": "model_task_router_v2.1.3"
}
```

---

### `pattern_train`

Train new patterns from swarm operational experience and data.

**Parameters:**
- `dataSource` (optional): Data source for pattern training
- `patternType` (optional, default: 'workflow'): Type of pattern to discover
  - `task`: Task execution patterns
  - `code`: Code structure and quality patterns  
  - `workflow`: Process and workflow optimization patterns

**Example:**
```json
{
  "dataSource": "last_60_days_operations",
  "patternType": "workflow"
}
```

**Response:**
```json
{
  "patternsDiscovered": 3,
  "patterns": [
    {
      "name": "parallel_testing_optimization",
      "description": "Testing tasks with similar setup can be batched for 40% time savings",
      "confidence": 0.89,
      "applicability": "testing workflows with shared fixtures",
      "potentialImpact": "25-40% time reduction"
    },
    {
      "name": "code_review_clustering",
      "description": "Reviews by the same author should be grouped for context efficiency", 
      "confidence": 0.76,
      "applicability": "multi-PR review workflows",
      "potentialImpact": "15% improved review quality"
    }
  ],
  "integration": {
    "autoApply": false,
    "requiresValidation": true,
    "estimatedBenefit": "18% overall efficiency improvement"
  }
}
```

---

## Swarm Topologies

### Hierarchical Topology
```
    Coordinator
   /     |     \
Agent1 Agent2 Agent3
```
- **Use Case**: Clear command structure, centralized decision making
- **Pros**: Simple coordination, clear authority
- **Cons**: Single point of failure, coordinator bottleneck

### Mesh Topology  
```
Agent1 ---- Agent2
  |    \    /   |
  |     \ /     |
Agent4 ---- Agent3
```
- **Use Case**: Peer-to-peer collaboration, high redundancy
- **Pros**: No single point of failure, fast communication
- **Cons**: Complex coordination, potential message overhead

### Star Topology
```
     Agent2
       |
Agent1-Hub-Agent3
       |
     Agent4
```
- **Use Case**: Hub-based coordination with specialized hub
- **Pros**: Centralized coordination, easy monitoring
- **Cons**: Hub bottleneck, limited scalability

### Ring Topology
```
Agent1 → Agent2
  ↑         ↓
Agent4 ← Agent3
```
- **Use Case**: Sequential processing, pipeline workflows
- **Pros**: Predictable flow, good for staged processes
- **Cons**: Single point failure breaks chain

### Adaptive Topology
Dynamic topology that changes based on workload:
- **Light Load**: Star topology for efficiency
- **Heavy Load**: Mesh topology for parallelism  
- **Sequential Tasks**: Ring topology for pipeline
- **Mixed Workload**: Hybrid approach

---

## Response Codes

### Success Codes
- `200`: Operation completed successfully
- `201`: Resource created successfully  
- `202`: Operation accepted and in progress

### Error Codes
- `400`: Invalid parameters or request format
- `404`: Swarm, agent, or resource not found
- `409`: Conflict (e.g., duplicate agent spawn)
- `429`: Rate limit exceeded
- `500`: Internal server error
- `503`: Service temporarily unavailable

### Tool-Specific Codes
- `1001`: Swarm initialization failed
- `1002`: Agent spawn failed
- `1003`: Task orchestration error
- `2001`: Memory operation failed
- `2002`: Cache operation failed
- `3001`: Performance analysis failed
- `4001`: Windows shell execution failed
- `4002`: WSL bridge unavailable

---

## Best Practices

### Agent Naming
- Use descriptive, role-based names: `python-api-specialist`, `security-reviewer`
- Include specialization: `frontend-react-expert`, `devops-kubernetes-admin`
- Avoid generic names: `agent1`, `helper`, `worker`

### Task Orchestration
- Break complex tasks into logical subtasks
- Specify clear dependencies between subtasks
- Use appropriate priority levels for business impact
- Include sufficient context for agent understanding

### Memory Management
- Use namespaces to organize related data
- Set appropriate TTL for temporary data
- Regular cleanup of expired entries
- Monitor memory usage for optimization

### Performance Optimization
- Monitor bottlenecks regularly
- Use adaptive strategies for dynamic workloads
- Implement caching for frequently accessed data
- Scale agents based on actual workload patterns

### Windows Integration
- Prefer PowerShell for Windows-native operations
- Use WSL bridge only when necessary
- Handle Windows-specific paths and permissions
- Consider Windows security context for elevated operations

---

This completes the comprehensive API documentation for Claude Flow Windows. Each tool is designed to integrate seamlessly with the MCP protocol and provide enterprise-grade functionality for Windows environments.
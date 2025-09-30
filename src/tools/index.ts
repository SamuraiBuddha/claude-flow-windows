import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Swarm Coordination Tools (claude-flow)
export const swarmTools: Tool[] = [
  {
    name: 'swarm_init',
    description: 'Initialize a swarm with specified topology and configuration',
    inputSchema: {
      type: 'object',
      properties: {
        topology: {
          type: 'string',
          enum: ['hierarchical', 'mesh', 'star', 'ring', 'adaptive'],
          description: 'Swarm network topology'
        },
        maxAgents: {
          type: 'number',
          description: 'Maximum number of agents in swarm',
          default: 8
        },
        strategy: {
          type: 'string',
          enum: ['parallel', 'sequential', 'balanced'],
          description: 'Task execution strategy',
          default: 'balanced'
        },
        enableMemory: {
          type: 'boolean',
          description: 'Enable persistent memory',
          default: true
        }
      },
      required: ['topology']
    }
  },
  {
    name: 'agent_spawn',
    description: 'Spawn a new agent with specific capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Agent type (coder, researcher, reviewer, architect, etc.)'
        },
        name: {
          type: 'string',
          description: 'Agent name/identifier'
        },
        skills: {
          type: 'string',
          description: 'Comma-separated list of skills'
        },
        context: {
          type: 'string',
          description: 'Working directory or context'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'task_orchestrate',
    description: 'Orchestrate complex task execution across swarm',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Task description'
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          default: 'medium'
        },
        strategy: {
          type: 'string',
          enum: ['parallel', 'sequential', 'adaptive'],
          default: 'adaptive'
        },
        assignTo: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific agent IDs to assign'
        }
      },
      required: ['task']
    }
  },
  {
    name: 'swarm_monitor',
    description: 'Monitor swarm status and performance',
    inputSchema: {
      type: 'object',
      properties: {
        swarmId: { type: 'string' },
        includeMetrics: { type: 'boolean', default: true },
        includeAgents: { type: 'boolean', default: true }
      }
    }
  }
];

// Cognitive Diversity Tools (ruv-swarm)
export const cognitiveTools: Tool[] = [
  {
    name: 'cognitive_spawn',
    description: 'Spawn agent with specific cognitive pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          enum: ['analytical', 'creative', 'systematic', 'intuitive', 'holistic', 'detail-oriented'],
          description: 'Cognitive diversity pattern'
        },
        role: {
          type: 'string',
          description: 'Agent role in swarm'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'neural_pattern',
    description: 'Apply neural pattern recognition to task',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        model: {
          type: 'string',
          enum: ['lstm', 'tcn', 'nbeats', 'transformer', 'ensemble'],
          default: 'ensemble'
        }
      },
      required: ['input']
    }
  },
  {
    name: 'daa_consensus',
    description: 'Dynamic Agent Architecture consensus building',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        agents: {
          type: 'array',
          items: { type: 'string' }
        },
        threshold: {
          type: 'number',
          default: 0.7,
          minimum: 0.5,
          maximum: 1.0
        }
      },
      required: ['topic']
    }
  }
];

// Memory Management Tools
export const memoryTools: Tool[] = [
  {
    name: 'memory_store',
    description: 'Store data in persistent memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: 'object' },
        namespace: { type: 'string', default: 'default' },
        ttl: { type: 'number', description: 'Time to live in seconds' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'memory_retrieve',
    description: 'Retrieve data from persistent memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        namespace: { type: 'string', default: 'default' }
      },
      required: ['key']
    }
  },
  {
    name: 'memory_persist',
    description: 'Export/import memory state',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['export', 'import']
        },
        path: { type: 'string' },
        compress: { type: 'boolean', default: false }
      },
      required: ['action']
    }
  }
];

// Performance & Analysis Tools
export const analysisTools: Tool[] = [
  {
    name: 'bottleneck_detect',
    description: 'Detect performance bottlenecks in swarm',
    inputSchema: {
      type: 'object',
      properties: {
        swarmId: { type: 'string' },
        timeRange: { type: 'string', default: '1h' },
        autoFix: { type: 'boolean', default: false }
      }
    }
  },
  {
    name: 'performance_report',
    description: 'Generate comprehensive performance report',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'markdown', 'html'],
          default: 'json'
        },
        compareWith: { type: 'string' },
        includeMetrics: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'token_usage',
    description: 'Analyze token usage and optimization',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', default: '24h' },
        byAgent: { type: 'boolean', default: false },
        exportPath: { type: 'string' }
      }
    }
  }
];

// Windows-Specific Tools
export const windowsTools: Tool[] = [
  {
    name: 'shell_execute',
    description: 'Execute Windows PowerShell commands',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        elevated: { type: 'boolean', default: false },
        workingDir: { type: 'string' }
      },
      required: ['command']
    }
  },
  {
    name: 'wsl_bridge',
    description: 'Bridge commands to WSL if available',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        distribution: { type: 'string', default: 'Ubuntu' }
      },
      required: ['command']
    }
  }
];

// GitHub Integration Tools
export const githubTools: Tool[] = [
  {
    name: 'github_swarm',
    description: 'Deploy swarm for GitHub repository management',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        focus: {
          type: 'string',
          enum: ['maintenance', 'development', 'triage'],
          default: 'development'
        },
        maxAgents: { type: 'number', default: 5 },
        autoLabel: { type: 'boolean', default: true },
        autoPR: { type: 'boolean', default: false }
      },
      required: ['repository']
    }
  },
  {
    name: 'code_review',
    description: 'Automated AI code review for pull requests',
    inputSchema: {
      type: 'object',
      properties: {
        prNumber: { type: 'number' },
        focus: {
          type: 'string',
          enum: ['security', 'performance', 'best-practices', 'all'],
          default: 'all'
        },
        suggestFixes: { type: 'boolean', default: false }
      },
      required: ['prNumber']
    }
  }
];

// Workflow Automation Tools
export const workflowTools: Tool[] = [
  {
    name: 'workflow_select',
    description: 'Select optimal workflow for task',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        constraints: { type: 'string' },
        preview: { type: 'boolean', default: false }
      },
      required: ['task']
    }
  },
  {
    name: 'auto_agent',
    description: 'Automatically spawn and configure agents for task',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        maxAgents: { type: 'number', default: 5 },
        strategy: {
          type: 'string',
          enum: ['minimal', 'balanced', 'comprehensive'],
          default: 'balanced'
        }
      },
      required: ['task']
    }
  },
  {
    name: 'smart_spawn',
    description: 'Intelligently spawn agents based on workload',
    inputSchema: {
      type: 'object',
      properties: {
        analyze: { type: 'boolean', default: true },
        threshold: { type: 'number', default: 5 },
        topology: {
          type: 'string',
          enum: ['hierarchical', 'mesh', 'adaptive'],
          default: 'adaptive'
        }
      }
    }
  }
];

// Optimization Tools
export const optimizationTools: Tool[] = [
  {
    name: 'parallel_execute',
    description: 'Execute tasks in parallel with optimization',
    inputSchema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: { type: 'object' }
        },
        maxParallel: { type: 'number', default: 5 },
        strategy: {
          type: 'string',
          enum: ['adaptive', 'fixed', 'dynamic'],
          default: 'adaptive'
        }
      },
      required: ['tasks']
    }
  },
  {
    name: 'cache_manage',
    description: 'Manage swarm cache for performance',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['view', 'clear', 'optimize']
        },
        maxSize: { type: 'number' },
        ttl: { type: 'number' }
      },
      required: ['action']
    }
  },
  {
    name: 'topology_optimize',
    description: 'Optimize swarm topology for current workload',
    inputSchema: {
      type: 'object',
      properties: {
        currentTopology: { type: 'string' },
        workloadType: {
          type: 'string',
          enum: ['parallel', 'sequential', 'mixed']
        },
        autoApply: { type: 'boolean', default: false }
      }
    }
  }
];

// Training & Learning Tools
export const trainingTools: Tool[] = [
  {
    name: 'model_update',
    description: 'Update swarm learning models',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['agent-selector', 'task-router', 'performance-predictor'],
          default: 'agent-selector'
        },
        incremental: { type: 'boolean', default: true },
        validate: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'pattern_train',
    description: 'Train new patterns from swarm experience',
    inputSchema: {
      type: 'object',
      properties: {
        dataSource: { type: 'string' },
        patternType: {
          type: 'string',
          enum: ['task', 'code', 'workflow'],
          default: 'workflow'
        }
      }
    }
  }
];

// Export all tools
export function getAllTools(): Tool[] {
  return [
    ...swarmTools,
    ...cognitiveTools,
    ...memoryTools,
    ...analysisTools,
    ...windowsTools,
    ...githubTools,
    ...workflowTools,
    ...optimizationTools,
    ...trainingTools
  ];
}

// Tool count verification (should be 87 tools when complete)
export const TOOL_COUNT = getAllTools().length;
console.error(`Claude Flow Windows: Loaded ${TOOL_COUNT} tools`);
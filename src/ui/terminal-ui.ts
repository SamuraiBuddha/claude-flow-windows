import blessed from 'blessed';
import contrib from 'blessed-contrib';
import chalk from 'chalk';
import { EventEmitter } from 'events';
import { ClaudeFlowServer } from '../index.js';

interface AgentDisplay {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  color: string;
  progress: number;
  currentTask?: string;
}

export class TerminalUI extends EventEmitter {
  private screen: any;
  private grid: any;
  private agentList: any;
  private taskLog: any;
  private performanceGauge: any;
  private swarmInfo: any;
  private agents: Map<string, AgentDisplay> = new Map();
  private server?: ClaudeFlowServer;
  
  private readonly agentColors = [
    '\x1b[31m', // Red
    '\x1b[32m', // Green  
    '\x1b[33m', // Yellow
    '\x1b[34m', // Blue
    '\x1b[35m', // Magenta
    '\x1b[36m', // Cyan
    '\x1b[91m', // Bright Red
    '\x1b[92m', // Bright Green
    '\x1b[93m', // Bright Yellow
    '\x1b[94m', // Bright Blue
  ];

  private readonly statusSymbols = {
    idle: '○',
    working: '●',
    completed: '✓',
    error: '✗'
  };

  constructor() {
    super();
    this.initializeScreen();
  }

  private initializeScreen() {
    // Create blessed screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Claude Flow Windows - Agent Swarm Monitor',
      fullUnicode: true
    });

    // Create grid layout
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    // Agent list (left panel)
    this.agentList = this.grid.set(0, 0, 8, 6, blessed.list, {
      label: ' 🤖 Active Agents ',
      tags: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue' },
        border: { fg: 'cyan' },
        label: { fg: 'white', bold: true }
      },
      mouse: true,
      keys: true,
      vi: true
    });

    // Task log (right panel)
    this.taskLog = this.grid.set(0, 6, 8, 6, contrib.log, {
      label: ' 📋 Task Activity ',
      border: { type: 'line' },
      style: {
        border: { fg: 'green' },
        label: { fg: 'white', bold: true }
      }
    });

    // Performance gauge (bottom left)
    this.performanceGauge = this.grid.set(8, 0, 4, 6, contrib.gauge, {
      label: ' Performance ',
      stroke: 'cyan',
      fill: 'white',
      width: 20
    });

    // Swarm info (bottom right)  
    this.swarmInfo = this.grid.set(8, 6, 4, 6, blessed.box, {
      label: ' 🌐 Swarm Status ',
      content: '',
      tags: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'yellow' },
        label: { fg: 'white', bold: true }
      }
    });

    // Keyboard shortcuts
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.cleanup();
      process.exit(0);
    });

    this.screen.key(['a'], () => {
      this.emit('spawn-agent');
    });

    this.screen.key(['t'], () => {
      this.emit('create-task');
    });

    this.screen.key(['r'], () => {
      this.refresh();
    });

    // Render screen
    this.screen.render();
  }

  public connectToServer(server: ClaudeFlowServer) {
    this.server = server;
    this.startMonitoring();
  }

  private startMonitoring() {
    // Update every 500ms
    setInterval(() => {
      this.updateAgentDisplay();
      this.updateSwarmInfo();
      this.updatePerformance();
    }, 500);
  }

  public spawnAgent(agent: AgentDisplay) {
    const colorIndex = this.agents.size % this.agentColors.length;
    agent.color = this.agentColors[colorIndex];
    this.agents.set(agent.id, agent);
    
    this.taskLog.log(`{green-fg}✓{/} Agent spawned: ${agent.name} (${agent.type})`);
    this.updateAgentDisplay();
  }

  public updateAgentStatus(agentId: string, status: AgentDisplay['status'], task?: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.currentTask = task;
      
      if (status === 'working' && task) {
        this.taskLog.log(`{yellow-fg}►{/} ${agent.name}: ${task}`);
      } else if (status === 'completed' && task) {
        this.taskLog.log(`{green-fg}✓{/} ${agent.name}: Completed ${task}`);
      } else if (status === 'error' && task) {
        this.taskLog.log(`{red-fg}✗{/} ${agent.name}: Error in ${task}`);
      }
    }
    this.updateAgentDisplay();
  }

  private updateAgentDisplay() {
    const items: string[] = [];
    
    this.agents.forEach((agent) => {
      const symbol = this.statusSymbols[agent.status];
      const color = agent.status === 'working' ? agent.color : 
                    agent.status === 'completed' ? '\x1b[32m' :
                    agent.status === 'error' ? '\x1b[31m' : '\x1b[90m';
      
      let line = `${color}${symbol}\x1b[0m ${agent.name} (${agent.type})`;
      
      if (agent.currentTask) {
        line += ` - ${agent.currentTask}`;
      }
      
      items.push(line);
    });

    this.agentList.setItems(items);
    this.screen.render();
  }

  private updateSwarmInfo() {
    const totalAgents = this.agents.size;
    const workingAgents = Array.from(this.agents.values()).filter(a => a.status === 'working').length;
    const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle').length;
    
    const info = `
{bold}Total Agents:{/} ${totalAgents}
{green-fg}● Working:{/} ${workingAgents}
{gray-fg}○ Idle:{/} ${idleAgents}

{bold}Commands:{/}
[A] Spawn Agent
[T] Create Task  
[R] Refresh
[Q] Quit
    `;
    
    this.swarmInfo.setContent(info);
    this.screen.render();
  }

  private updatePerformance() {
    const workingAgents = Array.from(this.agents.values()).filter(a => a.status === 'working').length;
    const totalAgents = this.agents.size || 1;
    const utilization = Math.round((workingAgents / totalAgents) * 100);
    
    this.performanceGauge.setPercent(utilization);
    this.screen.render();
  }

  private refresh() {
    this.updateAgentDisplay();
    this.updateSwarmInfo();
    this.updatePerformance();
    this.taskLog.log('{cyan-fg}↻{/} Display refreshed');
  }

  private cleanup() {
    this.agents.clear();
    this.screen.destroy();
  }

  public simulateAgentActivity() {
    // Simulate agent activity for demo
    const agentTypes = ['coder', 'researcher', 'reviewer', 'tester', 'architect'];
    const tasks = [
      'Analyzing codebase',
      'Writing unit tests', 
      'Reviewing PR #42',
      'Optimizing performance',
      'Documenting API',
      'Refactoring components',
      'Checking dependencies',
      'Running security scan'
    ];

    // Spawn a few agents
    for (let i = 1; i <= 5; i++) {
      const agent: AgentDisplay = {
        id: `agent-${i}`,
        name: `Agent-${i}`,
        type: agentTypes[i - 1],
        status: 'idle',
        color: '',
        progress: 0
      };
      this.spawnAgent(agent);
    }

    // Simulate work
    setInterval(() => {
      this.agents.forEach((agent) => {
        if (agent.status === 'idle' && Math.random() > 0.7) {
          // Start working
          const task = tasks[Math.floor(Math.random() * tasks.length)];
          this.updateAgentStatus(agent.id, 'working', task);
        } else if (agent.status === 'working' && Math.random() > 0.8) {
          // Complete task
          this.updateAgentStatus(agent.id, 'completed', agent.currentTask);
          setTimeout(() => {
            this.updateAgentStatus(agent.id, 'idle');
          }, 2000);
        }
      });
    }, 1500);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  const ui = new TerminalUI();
  
  // Connect to MCP server if running
  try {
    const server = new ClaudeFlowServer();
    ui.connectToServer(server);
  } catch (error) {
    console.log('Running in demo mode (MCP server not connected)');
    ui.simulateAgentActivity();
  }
  
  ui.on('spawn-agent', () => {
    // Handle agent spawn
    console.log('Spawn agent requested');
  });
  
  ui.on('create-task', () => {
    // Handle task creation
    console.log('Create task requested');
  });
}
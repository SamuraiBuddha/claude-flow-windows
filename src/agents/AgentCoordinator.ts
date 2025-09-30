import { EventEmitter } from 'events';
import { RealAgent, RealAgentConfig, AgentMessage } from './RealAgent.js';
import { v4 as uuidv4 } from 'uuid';

export interface SwarmConfig {
  apiKey?: string;
  mcpServers?: string[];
  maxAgents?: number;
  model?: string;
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: any;
}

export class AgentCoordinator extends EventEmitter {
  private agents: Map<string, RealAgent> = new Map();
  private taskAssignments: Map<string, TaskAssignment> = new Map();
  private messageRouter: Map<string, string[]> = new Map(); // agent connections
  private config: SwarmConfig;
  
  constructor(config: SwarmConfig) {
    super();
    this.config = config;
  }

  /**
   * Spawn a real agent with Claude API access
   */
  async spawnRealAgent(config: Partial<RealAgentConfig>): Promise<string> {
    const agentConfig: RealAgentConfig = {
      name: config.name || `Agent-${this.agents.size + 1}`,
      type: config.type || 'worker',
      apiKey: config.apiKey || this.config.apiKey,
      model: config.model || this.config.model || 'claude-3-sonnet-20240229',
      mcpServers: config.mcpServers || this.config.mcpServers,
      systemPrompt: config.systemPrompt,
      maxTokens: config.maxTokens || 1024,
      temperature: config.temperature || 0.7
    };

    const agent = new RealAgent(agentConfig);
    
    // Set up agent event handlers
    agent.on('ready', (agentId) => {
      console.log(`Agent ${agentConfig.name} (${agentId}) is ready`);
      this.emit('agent-ready', agentId);
    });

    agent.on('task-complete', (result) => {
      this.handleTaskComplete(result);
    });

    agent.on('agent-message', (msg) => {
      this.routeAgentMessage(msg);
    });

    agent.on('broadcast', (msg) => {
      this.broadcastMessage(msg);
    });

    agent.on('error', (error) => {
      console.error(`Agent error:`, error);
      this.emit('agent-error', error);
    });

    // Start the agent
    await agent.start();
    
    const agentId = agent['id'];
    this.agents.set(agentId, agent);
    
    return agentId;
  }

  /**
   * Create a team of agents for parallel processing
   */
  async createTeam(
    teamSize: number,
    teamConfig?: Partial<RealAgentConfig>
  ): Promise<string[]> {
    const agentIds: string[] = [];
    
    for (let i = 0; i < teamSize; i++) {
      const agentId = await this.spawnRealAgent({
        ...teamConfig,
        name: `${teamConfig?.name || 'Agent'}-${i + 1}`
      });
      agentIds.push(agentId);
    }
    
    // Connect agents in a mesh network (everyone can talk to everyone)
    for (const agentId of agentIds) {
      this.messageRouter.set(agentId, agentIds.filter(id => id !== agentId));
    }
    
    return agentIds;
  }

  /**
   * Assign a task to an agent or distribute across multiple agents
   */
  async assignTask(
    task: string,
    options?: {
      agentId?: string;
      parallel?: boolean;
      maxAgents?: number;
    }
  ): Promise<string> {
    const taskId = uuidv4();
    
    if (options?.parallel && !options?.agentId) {
      // Distribute task across multiple agents
      const availableAgents = this.getAvailableAgents();
      const agentsToUse = availableAgents.slice(0, options.maxAgents || availableAgents.length);
      
      for (const agent of agentsToUse) {
        const subtaskId = `${taskId}-${agent.id}`;
        const assignment: TaskAssignment = {
          taskId: subtaskId,
          agentId: agent.id,
          task,
          status: 'pending'
        };
        
        this.taskAssignments.set(subtaskId, assignment);
        assignment.status = 'running';
        
        await agent.sendTask(task, 'coordinator');
      }
      
      return taskId;
    } else {
      // Assign to specific agent or find available one
      const agent = options?.agentId 
        ? this.agents.get(options.agentId)
        : this.getAvailableAgents()[0];
        
      if (!agent) {
        throw new Error('No available agents');
      }
      
      const assignment: TaskAssignment = {
        taskId,
        agentId: agent['id'],
        task,
        status: 'pending'
      };
      
      this.taskAssignments.set(taskId, assignment);
      assignment.status = 'running';
      
      await agent.sendTask(task, 'coordinator');
      
      return taskId;
    }
  }

  /**
   * Enable agent-to-agent communication
   */
  connectAgents(agent1Id: string, agent2Id: string): void {
    const connections1 = this.messageRouter.get(agent1Id) || [];
    const connections2 = this.messageRouter.get(agent2Id) || [];
    
    if (!connections1.includes(agent2Id)) {
      connections1.push(agent2Id);
    }
    if (!connections2.includes(agent1Id)) {
      connections2.push(agent1Id);
    }
    
    this.messageRouter.set(agent1Id, connections1);
    this.messageRouter.set(agent2Id, connections2);
  }

  /**
   * Route messages between agents
   */
  private routeAgentMessage(msg: AgentMessage): void {
    const targetAgent = this.agents.get(msg.to);
    if (targetAgent) {
      // Check if agents are connected
      const connections = this.messageRouter.get(msg.from) || [];
      if (connections.includes(msg.to)) {
        targetAgent.sendTask(msg.content, msg.from);
      } else {
        console.warn(`Agents ${msg.from} and ${msg.to} are not connected`);
      }
    }
  }

  /**
   * Broadcast message to all agents
   */
  private broadcastMessage(msg: any): void {
    for (const [agentId, agent] of this.agents) {
      if (agentId !== msg.from) {
        agent.sendTask(msg.content, msg.from);
      }
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(result: any): void {
    const taskId = this.findTaskByAgent(result.from);
    if (taskId) {
      const assignment = this.taskAssignments.get(taskId);
      if (assignment) {
        assignment.status = 'completed';
        assignment.result = result.content;
        this.emit('task-complete', taskId, result);
      }
    }
  }

  /**
   * Find task by agent ID
   */
  private findTaskByAgent(agentId: string): string | undefined {
    for (const [taskId, assignment] of this.taskAssignments) {
      if (assignment.agentId === agentId && assignment.status === 'running') {
        return taskId;
      }
    }
    return undefined;
  }

  /**
   * Get available agents (not busy)
   */
  private getAvailableAgents(): RealAgent[] {
    const available: RealAgent[] = [];
    for (const agent of this.agents.values()) {
      if (agent.getStatus() === 'idle') {
        available.push(agent);
      }
    }
    return available;
  }

  /**
   * Execute MCP tool on specific agent
   */
  async executeMCPTool(
    agentId: string,
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return await agent.executeMCPTool(serverName, toolName, args);
  }

  /**
   * Get swarm status
   */
  getSwarmStatus(): any {
    const status = {
      totalAgents: this.agents.size,
      activeAgents: 0,
      idleAgents: 0,
      tasks: {
        total: this.taskAssignments.size,
        running: 0,
        completed: 0,
        failed: 0
      },
      connections: Array.from(this.messageRouter.entries())
    };
    
    for (const agent of this.agents.values()) {
      const agentStatus = agent.getStatus();
      if (agentStatus === 'busy') {
        status.activeAgents++;
      } else if (agentStatus === 'idle') {
        status.idleAgents++;
      }
    }
    
    for (const assignment of this.taskAssignments.values()) {
      status.tasks[assignment.status === 'running' ? 'running' :
                   assignment.status === 'completed' ? 'completed' :
                   assignment.status === 'failed' ? 'failed' : 'running']++;
    }
    
    return status;
  }

  /**
   * Terminate all agents
   */
  async terminate(): Promise<void> {
    for (const agent of this.agents.values()) {
      await agent.terminate();
    }
    this.agents.clear();
    this.taskAssignments.clear();
    this.messageRouter.clear();
  }
}
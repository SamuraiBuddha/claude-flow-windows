import { MemoryManager, AgentMemory } from '../memory/MemoryManager.js';
import { v4 as uuidv4 } from 'uuid';

export interface AgentConfig {
  type: 'coder' | 'researcher' | 'reviewer' | 'architect' | 'worker' | 'peer' | 'hub' | 'spoke' | 'node' | 'coordinator' | 'adaptive-coordinator' | 'adaptive-worker' | 'cognitive';
  name: string;
  skills?: string[];
  context?: Record<string, any>;
  swarmId?: string;
  role?: string;
  neighbors?: string[];
}

export interface CognitivePattern {
  pattern: 'analytical' | 'creative' | 'systematic' | 'intuitive' | 'holistic' | 'detail-oriented';
  characteristics: string[];
  strengths: string[];
  optimalTasks: string[];
}

export interface AgentStatus {
  id: string;
  type: string;
  name: string;
  status: 'idle' | 'busy' | 'terminated' | 'error';
  performance: {
    tasksCompleted: number;
    avgResponseTime: number;
    errorCount: number;
    tokenUsage: number;
    successRate: number;
  };
  skills: string[];
  swarmId?: string;
  role?: string;
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  responseTime?: number;
  tasksCompleted?: number;
  errorCount?: number;
  tokenUsage?: number;
}

export class AgentManager {
  private agents: Map<string, AgentStatus> = new Map();
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * Spawn a new agent with the specified configuration
   */
  async spawnAgent(args: any): Promise<any> {
    // Validate and extract required parameters
    const config: AgentConfig = {
      type: args.type || 'worker',
      name: args.name || `agent-${Date.now()}`,
      skills: args.skills ? (Array.isArray(args.skills) ? args.skills : args.skills.split(',')) : undefined,
      context: args.context || {},
      swarmId: args.swarmId,
      role: args.role,
      neighbors: args.neighbors
    };
    const agentId = uuidv4();
    const now = new Date();

    const agentStatus: AgentStatus = {
      id: agentId,
      type: config.type,
      name: config.name,
      status: 'idle',
      performance: {
        tasksCompleted: 0,
        avgResponseTime: 0,
        errorCount: 0,
        tokenUsage: 0,
        successRate: 1.0
      },
      skills: config.skills || this.getDefaultSkills(config.type),
      swarmId: config.swarmId,
      role: config.role,
      createdAt: now,
      lastActivity: now,
      metadata: {
        context: config.context || {},
        neighbors: config.neighbors || []
      }
    };

    // Store agent in memory
    this.agents.set(agentId, agentStatus);

    // Persist to MemoryManager
    const agentMemory: AgentMemory = {
      agentId,
      type: config.type,
      name: config.name,
      status: 'idle',
      metrics: {
        tasksCompleted: 0,
        avgResponseTime: 0,
        errorCount: 0,
        tokenUsage: 0
      },
      skills: agentStatus.skills,
      context: config.context || {},
      swarmId: config.swarmId,
      createdAt: now,
      lastActivity: now
    };

    await this.memoryManager.storeAgentMemory(agentMemory);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agentId,
            message: `Agent '${config.name}' of type '${config.type}' spawned successfully`,
            status: agentStatus,
            timestamp: now.toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Terminate an agent by ID
   */
  async terminateAgent(args: { agentId: string }): Promise<any> {
    const { agentId } = args;
    const agent = this.agents.get(agentId);

    if (!agent) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Agent with ID '${agentId}' not found`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }

    // Update status to terminated
    agent.status = 'terminated';
    agent.lastActivity = new Date();

    // Update in memory manager
    await this.memoryManager.updateAgentMemory(agentId, {
      status: 'terminated',
      lastActivity: agent.lastActivity
    });

    // Remove from active agents map
    this.agents.delete(agentId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agentId,
            message: `Agent '${agent.name}' terminated successfully`,
            finalStatus: agent,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get status of a specific agent
   */
  async getAgentStatus(args: { agentId: string }): Promise<any> {
    const { agentId } = args;
    const agent = this.agents.get(agentId);

    if (!agent) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Agent with ID '${agentId}' not found`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agentId,
            status: agent,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * List all active agents
   */
  async listAgents(args: { 
    swarmId?: string; 
    type?: string; 
    status?: string;
    includeTerminated?: boolean 
  } = {}): Promise<any> {
    const { swarmId, type, status, includeTerminated = false } = args;
    
    let agents = Array.from(this.agents.values());

    // Get terminated agents from memory if requested
    if (includeTerminated) {
      const allMemories = await this.memoryManager.getAllAgentMemories();
      const terminatedAgents = allMemories
        .filter(memory => memory.status === 'terminated')
        .map(memory => ({
          id: memory.agentId,
          type: memory.type,
          name: memory.name,
          status: memory.status as any,
          performance: {
            tasksCompleted: memory.metrics.tasksCompleted,
            avgResponseTime: memory.metrics.avgResponseTime,
            errorCount: memory.metrics.errorCount,
            tokenUsage: memory.metrics.tokenUsage,
            successRate: memory.metrics.errorCount > 0 
              ? memory.metrics.tasksCompleted / (memory.metrics.tasksCompleted + memory.metrics.errorCount)
              : 1.0
          },
          skills: memory.skills,
          swarmId: memory.swarmId,
          createdAt: memory.createdAt,
          lastActivity: memory.lastActivity
        }));
      
      agents = [...agents, ...terminatedAgents];
    }

    // Apply filters
    if (swarmId) {
      agents = agents.filter(agent => agent.swarmId === swarmId);
    }

    if (type) {
      agents = agents.filter(agent => agent.type === type);
    }

    if (status) {
      agents = agents.filter(agent => agent.status === status);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agents,
            totalCount: agents.length,
            activeCount: agents.filter(a => a.status !== 'terminated').length,
            filters: { swarmId, type, status, includeTerminated },
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Update agent performance metrics
   */
  async updateAgentMetrics(args: { 
    agentId: string; 
    metrics: AgentMetrics 
  }): Promise<any> {
    const { agentId, metrics } = args;
    const agent = this.agents.get(agentId);

    if (!agent) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Agent with ID '${agentId}' not found`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }

    // Update performance metrics
    if (metrics.responseTime !== undefined) {
      const currentAvg = agent.performance.avgResponseTime;
      const currentCount = agent.performance.tasksCompleted;
      agent.performance.avgResponseTime = 
        currentCount === 0 
          ? metrics.responseTime 
          : (currentAvg * currentCount + metrics.responseTime) / (currentCount + 1);
    }

    if (metrics.tasksCompleted !== undefined) {
      agent.performance.tasksCompleted += metrics.tasksCompleted;
    }

    if (metrics.errorCount !== undefined) {
      agent.performance.errorCount += metrics.errorCount;
    }

    if (metrics.tokenUsage !== undefined) {
      agent.performance.tokenUsage += metrics.tokenUsage;
    }

    // Recalculate success rate
    const totalTasks = agent.performance.tasksCompleted + agent.performance.errorCount;
    agent.performance.successRate = totalTasks > 0 
      ? agent.performance.tasksCompleted / totalTasks 
      : 1.0;

    agent.lastActivity = new Date();

    // Update in memory manager
    await this.memoryManager.updateAgentMemory(agentId, {
      metrics: {
        tasksCompleted: agent.performance.tasksCompleted,
        avgResponseTime: agent.performance.avgResponseTime,
        errorCount: agent.performance.errorCount,
        tokenUsage: agent.performance.tokenUsage
      },
      lastActivity: agent.lastActivity
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agentId,
            message: 'Agent metrics updated successfully',
            updatedMetrics: agent.performance,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Set agent status (idle, busy, etc.)
   */
  async setAgentStatus(args: { 
    agentId: string; 
    status: 'idle' | 'busy' | 'terminated' | 'error' 
  }): Promise<any> {
    const { agentId, status } = args;
    const agent = this.agents.get(agentId);

    if (!agent) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Agent with ID '${agentId}' not found`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }

    const previousStatus = agent.status;
    agent.status = status;
    agent.lastActivity = new Date();

    // Update in memory manager
    await this.memoryManager.updateAgentMemory(agentId, {
      status,
      lastActivity: agent.lastActivity
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agentId,
            message: `Agent status changed from '${previousStatus}' to '${status}'`,
            agent: {
              id: agent.id,
              name: agent.name,
              status: agent.status,
              lastActivity: agent.lastActivity
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get performance summary for all agents or filtered set
   */
  async getPerformanceSummary(args: { 
    swarmId?: string; 
    type?: string 
  } = {}): Promise<any> {
    const { swarmId, type } = args;
    
    let agents = Array.from(this.agents.values());

    // Apply filters
    if (swarmId) {
      agents = agents.filter(agent => agent.swarmId === swarmId);
    }

    if (type) {
      agents = agents.filter(agent => agent.type === type);
    }

    // Calculate aggregate metrics
    const summary = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'idle' || a.status === 'busy').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      performance: {
        totalTasksCompleted: agents.reduce((sum, a) => sum + a.performance.tasksCompleted, 0),
        totalErrors: agents.reduce((sum, a) => sum + a.performance.errorCount, 0),
        totalTokenUsage: agents.reduce((sum, a) => sum + a.performance.tokenUsage, 0),
        avgResponseTime: agents.length > 0 
          ? agents.reduce((sum, a) => sum + a.performance.avgResponseTime, 0) / agents.length 
          : 0,
        overallSuccessRate: agents.length > 0 
          ? agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length 
          : 1.0
      },
      agentsByType: this.groupAgentsByType(agents),
      filters: { swarmId, type }
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get default skills based on agent type
   */
  private getDefaultSkills(type: string): string[] {
    const skillMap: Record<string, string[]> = {
      coder: ['programming', 'debugging', 'code-review', 'refactoring'],
      researcher: ['information-gathering', 'analysis', 'documentation', 'fact-checking'],
      reviewer: ['code-review', 'quality-assurance', 'testing', 'feedback'],
      architect: ['system-design', 'architecture', 'planning', 'scalability'],
      worker: ['task-execution', 'processing', 'basic-operations'],
      peer: ['collaboration', 'communication', 'distributed-processing'],
      hub: ['coordination', 'message-routing', 'load-balancing'],
      spoke: ['specialized-processing', 'reporting', 'data-collection'],
      node: ['networking', 'communication', 'processing'],
      coordinator: ['orchestration', 'planning', 'resource-management'],
      'adaptive-coordinator': ['orchestration', 'planning', 'adaptive-scaling'],
      'adaptive-worker': ['task-execution', 'adaptive-processing', 'learning'],
      cognitive: ['cognitive-processing', 'pattern-recognition', 'adaptive-thinking']
    };

    return skillMap[type] || ['general-processing'];
  }

  /**
   * Group agents by type for summary reporting
   */
  private groupAgentsByType(agents: AgentStatus[]): Record<string, number> {
    return agents.reduce((groups, agent) => {
      groups[agent.type] = (groups[agent.type] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  /**
   * Get agent by name (helper method)
   */
  async getAgentByName(name: string): Promise<AgentStatus | undefined> {
    return Array.from(this.agents.values()).find(agent => agent.name === name);
  }

  /**
   * Get agents by swarm ID (helper method)
   */
  async getAgentsBySwarm(swarmId: string): Promise<AgentStatus[]> {
    return Array.from(this.agents.values()).filter(agent => agent.swarmId === swarmId);
  }

  /**
   * Spawn agent with specific cognitive diversity pattern
   */
  async cognitiveSpawn(args: { pattern: string; role: string; context?: Record<string, any> }): Promise<any> {
    const { pattern, role, context = {} } = args;

    // Validate cognitive pattern
    const validPatterns = ['analytical', 'creative', 'systematic', 'intuitive', 'holistic', 'detail-oriented'];
    if (!validPatterns.includes(pattern)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: `Invalid cognitive pattern: ${pattern}. Valid patterns: ${validPatterns.join(', ')}`,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }

    // Get cognitive pattern configuration
    const cognitiveConfig = this.getCognitivePatternConfig(pattern as any);
    
    // Create agent with cognitive pattern
    const agentConfig: AgentConfig = {
      type: 'cognitive',
      name: `${pattern}-agent-${Date.now()}`,
      skills: [...cognitiveConfig.strengths, ...cognitiveConfig.characteristics],
      context: {
        ...context,
        cognitivePattern: pattern,
        characteristics: cognitiveConfig.characteristics,
        strengths: cognitiveConfig.strengths,
        optimalTasks: cognitiveConfig.optimalTasks
      },
      role: role || pattern
    };

    // Spawn the agent using existing spawn logic
    const result = await this.spawnAgent(agentConfig);
    
    // Parse the result to enhance with cognitive pattern info
    const spawnResult = JSON.parse(result.content[0].text);
    
    // Add cognitive pattern information to the response
    const enhancedResult = {
      ...spawnResult,
      cognitivePattern: {
        pattern,
        role,
        characteristics: cognitiveConfig.characteristics,
        strengths: cognitiveConfig.strengths,
        optimalTasks: cognitiveConfig.optimalTasks
      },
      behaviorTraits: cognitiveConfig.characteristics,
      decisionMakingStyle: this.getDecisionMakingStyle(pattern)
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(enhancedResult, null, 2)
        }
      ]
    };
  }

  /**
   * Intelligently spawn agents based on workload analysis
   */
  async smartSpawn(args: { topology?: string; analyze?: boolean; threshold?: number; maxAgents?: number }): Promise<any> {
    const { topology = 'adaptive', analyze = true, threshold = 5, maxAgents = 8 } = args;

    const result = {
      topology,
      analyze,
      threshold,
      maxAgents,
      analysis: {
        currentAgents: this.agents.size,
        activeAgents: 0,
        busyAgents: 0,
        workloadScore: 0,
        recommendation: 'no-action'
      },
      actions: [] as any[],
      spawnedAgents: [] as any[],
      timestamp: new Date().toISOString()
    };

    // Analyze current workload if requested
    if (analyze) {
      const activeAgents = Array.from(this.agents.values());
      result.analysis.activeAgents = activeAgents.filter(a => a.status === 'idle' || a.status === 'busy').length;
      result.analysis.busyAgents = activeAgents.filter(a => a.status === 'busy').length;
      
      // Calculate workload score (0-10)
      const utilizationRate = result.analysis.activeAgents > 0 ? 
        result.analysis.busyAgents / result.analysis.activeAgents : 0;
      result.analysis.workloadScore = Math.round(utilizationRate * 10);

      // Determine action based on workload
      if (result.analysis.workloadScore >= threshold && this.agents.size < maxAgents) {
        result.analysis.recommendation = 'spawn-workers';
        
        // Determine optimal agent types based on topology
        const agentTypes = this.getOptimalAgentTypesForTopology(topology);
        const agentsToSpawn = Math.min(2, maxAgents - this.agents.size);

        for (let i = 0; i < agentsToSpawn; i++) {
          const agentType = agentTypes[i % agentTypes.length];
          
          try {
            const spawnResult = await this.spawnAgent({
              type: agentType as any,
              name: `smart-${agentType}-${Date.now()}-${i}`,
              skills: ['smart-spawned', 'adaptive', 'load-balancing'],
              context: {
                spawnReason: 'high-workload',
                workloadScore: result.analysis.workloadScore,
                topology
              }
            });

            const agentData = JSON.parse(spawnResult.content[0].text);
            result.spawnedAgents.push(agentData);
            result.actions.push(`Spawned ${agentType} agent: ${agentData.agentId}`);
          } catch (error: any) {
            result.actions.push(`Failed to spawn ${agentType}: ${error.message}`);
          }
        }
      } else if (result.analysis.workloadScore < 2 && this.agents.size > 2) {
        result.analysis.recommendation = 'consider-scaling-down';
        result.actions.push('Workload is low - consider terminating idle agents');
      } else {
        result.analysis.recommendation = 'maintain-current';
        result.actions.push('Current agent count is optimal for workload');
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Automatically spawn appropriate agents for a given task
   */
  async autoAgent(args: { task: string; maxAgents?: number; strategy?: string }): Promise<any> {
    const { task, maxAgents = 5, strategy = 'balanced' } = args;

    const result = {
      task,
      maxAgents,
      strategy,
      analysis: {
        taskType: 'unknown',
        complexity: 'medium',
        requiredSkills: [] as string[],
        recommendedAgents: [] as string[]
      },
      spawnedAgents: [] as any[],
      actions: [] as string[],
      timestamp: new Date().toISOString()
    };

    // Analyze task to determine optimal agent configuration
    const taskAnalysis = this.analyzeTask(task);
    result.analysis = taskAnalysis;

    // Spawn agents based on task analysis
    const agentConfigs = this.generateAgentConfigsForTask(taskAnalysis, maxAgents, strategy);

    for (const config of agentConfigs) {
      try {
        const spawnResult = await this.spawnAgent({
          ...config,
          context: {
            ...config.context,
            autoConfiguredFor: task,
            taskAnalysis: taskAnalysis,
            strategy
          }
        });

        const agentData = JSON.parse(spawnResult.content[0].text);
        result.spawnedAgents.push(agentData);
        result.actions.push(`Spawned ${config.type} agent: ${agentData.agentId}`);
      } catch (error: any) {
        result.actions.push(`Failed to spawn ${config.type}: ${error.message}`);
      }
    }

    // Add coordination suggestions
    if (result.spawnedAgents.length > 1) {
      result.actions.push(`Coordination pattern: ${this.getCoordinationPattern(strategy, result.spawnedAgents.length)}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Get decision making style for cognitive pattern
   */
  private getDecisionMakingStyle(pattern: string): string {
    const styles: Record<string, string> = {
      analytical: 'Data-driven with logical reasoning',
      creative: 'Intuitive with innovative approaches',
      systematic: 'Methodical with structured processes',
      intuitive: 'Quick insights with pattern recognition',
      holistic: 'Big-picture perspective with system integration',
      'detail-oriented': 'Thorough analysis with precision focus'
    };
    return styles[pattern] || 'Balanced approach';
  }

  /**
   * Get cognitive pattern configuration
   */
  private getCognitivePatternConfig(pattern: CognitivePattern['pattern']): CognitivePattern {
    const patterns: Record<CognitivePattern['pattern'], CognitivePattern> = {
      analytical: {
        pattern: 'analytical',
        characteristics: ['logical-reasoning', 'data-driven', 'systematic-thinking'],
        strengths: ['problem-solving', 'pattern-recognition', 'critical-analysis'],
        optimalTasks: ['debugging', 'data-analysis', 'algorithm-design', 'testing']
      },
      creative: {
        pattern: 'creative',
        characteristics: ['innovative-thinking', 'brainstorming', 'lateral-thinking'],
        strengths: ['idea-generation', 'creative-solutions', 'out-of-box-thinking'],
        optimalTasks: ['design', 'ideation', 'problem-reframing', 'innovation']
      },
      systematic: {
        pattern: 'systematic',
        characteristics: ['methodical-approach', 'process-oriented', 'structured-thinking'],
        strengths: ['organization', 'planning', 'process-optimization', 'documentation'],
        optimalTasks: ['project-planning', 'documentation', 'process-design', 'quality-assurance']
      },
      intuitive: {
        pattern: 'intuitive',
        characteristics: ['gut-feeling', 'pattern-intuition', 'holistic-understanding'],
        strengths: ['quick-insights', 'pattern-matching', 'rapid-decision-making'],
        optimalTasks: ['initial-assessment', 'triage', 'rapid-prototyping', 'user-experience']
      },
      holistic: {
        pattern: 'holistic',
        characteristics: ['big-picture-thinking', 'system-perspective', 'integration-focus'],
        strengths: ['system-design', 'integration', 'strategic-thinking', 'architecture'],
        optimalTasks: ['architecture', 'system-integration', 'strategic-planning', 'coordination']
      },
      'detail-oriented': {
        pattern: 'detail-oriented',
        characteristics: ['precision', 'thoroughness', 'attention-to-detail'],
        strengths: ['quality-control', 'precision-work', 'error-detection', 'validation'],
        optimalTasks: ['code-review', 'testing', 'validation', 'quality-assurance']
      }
    };

    return patterns[pattern];
  }

  /**
   * Get optimal agent types for a given topology
   */
  private getOptimalAgentTypesForTopology(topology: string): string[] {
    const topologyAgents: Record<string, string[]> = {
      hierarchical: ['coordinator', 'worker', 'worker'],
      mesh: ['peer', 'peer', 'peer'],
      star: ['hub', 'spoke', 'spoke'],
      ring: ['node', 'node', 'node'],
      adaptive: ['adaptive-coordinator', 'adaptive-worker', 'worker']
    };

    return topologyAgents[topology] || ['worker', 'worker', 'peer'];
  }

  /**
   * Analyze a task to determine optimal agent configuration
   */
  private analyzeTask(task: string): any {
    const taskLower = task.toLowerCase();
    
    // Determine task type
    let taskType = 'general';
    if (taskLower.includes('code') || taskLower.includes('implement') || taskLower.includes('develop')) {
      taskType = 'coding';
    } else if (taskLower.includes('research') || taskLower.includes('analyze') || taskLower.includes('investigate')) {
      taskType = 'research';
    } else if (taskLower.includes('review') || taskLower.includes('test') || taskLower.includes('validate')) {
      taskType = 'review';
    } else if (taskLower.includes('design') || taskLower.includes('architecture') || taskLower.includes('plan')) {
      taskType = 'design';
    }

    // Determine complexity
    let complexity = 'medium';
    if (taskLower.includes('complex') || taskLower.includes('advanced') || taskLower.includes('enterprise')) {
      complexity = 'high';
    } else if (taskLower.includes('simple') || taskLower.includes('basic') || taskLower.includes('quick')) {
      complexity = 'low';
    }

    // Extract required skills
    const requiredSkills = [];
    const skillKeywords: Record<string, string[]> = {
      'programming': ['code', 'implement', 'develop', 'script'],
      'analysis': ['analyze', 'research', 'investigate', 'study'],
      'testing': ['test', 'validate', 'verify', 'quality'],
      'design': ['design', 'architect', 'plan', 'model'],
      'documentation': ['document', 'write', 'explain', 'guide'],
      'integration': ['integrate', 'connect', 'combine', 'merge']
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => taskLower.includes(keyword))) {
        requiredSkills.push(skill);
      }
    }

    // Recommend agent types
    const recommendedAgents = [];
    if (taskType === 'coding') {
      recommendedAgents.push('coder', 'reviewer');
    } else if (taskType === 'research') {
      recommendedAgents.push('researcher');
    } else if (taskType === 'review') {
      recommendedAgents.push('reviewer');
    } else if (taskType === 'design') {
      recommendedAgents.push('architect');
    } else {
      recommendedAgents.push('worker');
    }

    return {
      taskType,
      complexity,
      requiredSkills,
      recommendedAgents
    };
  }

  /**
   * Generate agent configurations for a task
   */
  private generateAgentConfigsForTask(taskAnalysis: any, maxAgents: number, strategy: string): AgentConfig[] {
    const configs: AgentConfig[] = [];
    const { recommendedAgents, requiredSkills, complexity } = taskAnalysis;

    // Determine number of agents based on complexity and strategy
    let agentCount = 1;
    if (complexity === 'high') {
      agentCount = Math.min(maxAgents, 3);
    } else if (complexity === 'medium' && strategy === 'balanced') {
      agentCount = Math.min(maxAgents, 2);
    }

    // Create primary agent configs
    for (let i = 0; i < agentCount; i++) {
      const agentType = recommendedAgents[i % recommendedAgents.length] || 'worker';
      
      configs.push({
        type: agentType as any,
        name: `auto-${agentType}-${Date.now()}-${i}`,
        skills: [...requiredSkills, ...this.getDefaultSkills(agentType)],
        context: {
          complexity,
          primaryRole: i === 0,
          supportRole: i > 0
        }
      });
    }

    // Add coordinator if multiple agents
    if (configs.length > 1 && strategy === 'balanced') {
      configs.unshift({
        type: 'coordinator',
        name: `auto-coordinator-${Date.now()}`,
        skills: ['coordination', 'planning', 'task-management'],
        context: {
          role: 'coordinator',
          managedAgents: configs.length
        }
      });
    }

    return configs.slice(0, maxAgents);
  }

  /**
   * Get coordination pattern for multiple agents
   */
  private getCoordinationPattern(strategy: string, agentCount: number): string {
    if (agentCount === 1) return 'single-agent';
    if (agentCount === 2) return 'pair-programming';
    if (strategy === 'balanced') return 'hierarchical-coordination';
    return 'mesh-collaboration';
  }

  /**
   * Alias for spawnAgent to match test expectations
   */
  async spawn(args: any): Promise<any> {
    return this.spawnAgent(args);
  }
}
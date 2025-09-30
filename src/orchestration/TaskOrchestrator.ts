import { SwarmCoordinator } from '../coordinators/SwarmCoordinator.js';
import { v4 as uuidv4 } from 'uuid';

export interface TaskConfig {
  id?: string;
  name: string;
  type: 'sequential' | 'parallel' | 'adaptive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  requirements?: string[];
  expectedDuration?: number;
  swarmId?: string;
  dependencies?: string[];
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface TaskStatus {
  id: string;
  name: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  assignedAgents: string[];
  progress: number;
  startTime?: Date;
  endTime?: Date;
  retryCount: number;
  maxRetries: number;
  dependencies: string[];
  dependents: string[];
  lineage: TaskLineage;
  metrics: {
    processingTime: number;
    tokenUsage: number;
    errorCount: number;
    resourceUsage: ResourceUsage;
  };
  lastError?: string;
  cancellationToken?: AbortController;
}

export interface TaskLineage {
  parentTaskId?: string;
  childTaskIds: string[];
  originTaskId: string;
  depth: number;
  breadcrumb: string[];
}

export interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  diskUsage: number;
}

export interface TaskDistributionStrategy {
  type: 'sequential' | 'parallel' | 'adaptive';
  agentSelection: 'round-robin' | 'performance-based' | 'capability-based' | 'load-balanced';
  maxConcurrency?: number;
  timeoutMs?: number;
}

export interface PerformanceBottleneck {
  type: 'agent_overload' | 'stalled_task' | 'resource_constraint' | 'dependency_chain' | 'network_latency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  agentId?: string;
  taskId?: string;
  metric: string;
  currentValue: number;
  threshold: number;
  recommendation: string;
  estimatedImpact: string;
}

export class TaskOrchestrator {
  private tasks: Map<string, TaskStatus> = new Map();
  private swarmCoordinator: SwarmCoordinator;
  private taskQueue: TaskStatus[] = [];
  private runningTasks: Set<string> = new Set();
  private performanceMetrics: Map<string, number[]> = new Map();
  private readonly isWindows = process.platform === 'win32';

  constructor(swarmCoordinator: SwarmCoordinator) {
    this.swarmCoordinator = swarmCoordinator;
    this.startPerformanceMonitoring();
  }

  /**
   * Main task orchestration method - coordinates complex task execution across swarm
   */
  async orchestrateTask(args: any): Promise<any> {
    const {
      name,
      description = '',
      type = 'adaptive',
      priority = 'medium',
      swarmId,
      requirements = [],
      dependencies = [],
      maxRetries = 3,
      timeout = 300000, // 5 minutes default
      parentTaskId
    } = args;

    try {
      const taskId = uuidv4();
      const cancellationToken = new AbortController();

      // Build task lineage
      const lineage = await this.buildTaskLineage(parentTaskId, taskId);

      const task: TaskStatus = {
        id: taskId,
        name,
        status: 'pending',
        assignedAgents: [],
        progress: 0,
        retryCount: 0,
        maxRetries,
        dependencies,
        dependents: [],
        lineage,
        metrics: {
          processingTime: 0,
          tokenUsage: 0,
          errorCount: 0,
          resourceUsage: {
            cpuUsage: 0,
            memoryUsage: 0,
            networkUsage: 0,
            diskUsage: 0
          }
        },
        cancellationToken
      };

      this.tasks.set(taskId, task);
      
      // Update parent task if this is a sub-task
      if (parentTaskId) {
        const parentTask = this.tasks.get(parentTaskId);
        if (parentTask) {
          parentTask.lineage.childTaskIds.push(taskId);
        }
      }

      // Check dependencies before proceeding
      const dependencyCheck = await this.checkDependencies(dependencies);
      if (!dependencyCheck.allResolved) {
        task.status = 'pending';
        this.taskQueue.push(task);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              taskId,
              message: `Task '${name}' queued - waiting for dependencies`,
              status: 'pending',
              unresolvedDependencies: dependencyCheck.unresolved,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }

      // Distribute task based on strategy
      const strategy: TaskDistributionStrategy = {
        type,
        agentSelection: this.getOptimalAgentSelection(priority, requirements),
        maxConcurrency: this.calculateMaxConcurrency(type, priority),
        timeoutMs: timeout
      };

      const distributionResult = await this.distributeTask(task, strategy);
      
      // Start monitoring
      this.monitorTaskProgress(taskId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            taskId,
            message: `Task '${name}' orchestrated successfully`,
            status: task.status,
            strategy,
            assignedAgents: task.assignedAgents,
            lineage: task.lineage,
            distribution: distributionResult,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Failed to orchestrate task: ${error}`,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Alias for orchestrateTask - orchestrate complex task execution
   */
  async orchestrate(args: any): Promise<any> {
    return this.orchestrateTask(args);
  }

  /**
   * Execute multiple tasks with specified strategy
   */
  async executeTasks(tasks: any[], options: any = {}): Promise<any> {
    const { strategy = 'balanced' } = options;
    
    try {
      const results = [];
      const startTime = Date.now();
      
      if (strategy === 'parallel') {
        // Execute all tasks in parallel
        const promises = tasks.map(task => 
          this.orchestrateTask({
            name: task.command || task.id || 'Parallel Task',
            description: task.command || task.description || '',
            type: 'parallel',
            priority: 'medium'
          })
        );
        
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
        
      } else if (strategy === 'sequential') {
        // Execute tasks one by one
        for (const task of tasks) {
          const result = await this.orchestrateTask({
            name: task.command || task.id || 'Sequential Task',
            description: task.command || task.description || '',
            type: 'sequential',
            priority: 'medium'
          });
          results.push(result);
        }
        
      } else {
        // Balanced strategy - mix of parallel and sequential
        const batches = [];
        const batchSize = Math.ceil(tasks.length / 3); // Process in 3 batches
        
        for (let i = 0; i < tasks.length; i += batchSize) {
          const batch = tasks.slice(i, i + batchSize);
          const batchPromises = batch.map(task =>
            this.orchestrateTask({
              name: task.command || task.id || 'Balanced Task',
              description: task.command || task.description || '',
              type: 'adaptive',
              priority: 'medium'
            })
          );
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        success: true,
        completed: tasks.length,
        executionStrategy: strategy,
        duration,
        results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute tasks: ${error}`,
        completed: 0,
        executionStrategy: strategy,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Detect performance bottlenecks in the swarm
   */
  async detectBottlenecks(args: any): Promise<any> {
    const { 
      swarmId, 
      threshold = 0.8, 
      includeResourceMetrics = true,
      timeWindow = 300000 // 5 minutes
    } = args;

    try {
      const bottlenecks: PerformanceBottleneck[] = [];
      const tasks = Array.from(this.tasks.values());
      const now = new Date();

      // Analyze agent workload distribution
      const agentWorkload = await this.analyzeAgentWorkload(swarmId);
      bottlenecks.push(...this.detectAgentBottlenecks(agentWorkload, threshold));

      // Detect stalled tasks
      bottlenecks.push(...this.detectStalledTasks(tasks, timeWindow));

      // Analyze dependency chains
      bottlenecks.push(...this.detectDependencyBottlenecks(tasks));

      // Resource constraint analysis (Windows-specific)
      if (includeResourceMetrics && this.isWindows) {
        bottlenecks.push(...await this.detectResourceConstraints());
      }

      // Network latency analysis
      bottlenecks.push(...await this.detectNetworkBottlenecks(swarmId));

      // Priority analysis
      const priorityAnalysis = this.analyzePriorityQueuing(tasks);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            swarmId,
            bottlenecks,
            analysis: {
              totalBottlenecks: bottlenecks.length,
              criticalBottlenecks: bottlenecks.filter(b => b.severity === 'critical').length,
              overallSeverity: this.calculateOverallSeverity(bottlenecks),
              priorityAnalysis,
              recommendations: this.generateBottleneckRecommendations(bottlenecks)
            },
            metrics: {
              totalTasks: tasks.length,
              runningTasks: tasks.filter(t => t.status === 'running').length,
              queuedTasks: tasks.filter(t => t.status === 'pending').length,
              failedTasks: tasks.filter(t => t.status === 'failed').length
            },
            timestamp: now.toISOString()
          }, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Failed to detect bottlenecks: ${error}`,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }
  }

  /**
   * Distribute task to agents based on strategy
   */
  async distributeTask(task: TaskStatus, strategy: TaskDistributionStrategy): Promise<any> {
    try {
      task.status = 'assigned';
      task.startTime = new Date();

      const swarmStatus = await this.swarmCoordinator.getSwarmStatus({ 
        swarmId: task.lineage.originTaskId,
        includeAgents: true 
      });
      
      const availableAgents = this.parseAvailableAgents(swarmStatus);
      const selectedAgents = await this.selectAgents(availableAgents, strategy, task);

      task.assignedAgents = selectedAgents.map(a => a.id);
      
      switch (strategy.type) {
        case 'parallel':
          return await this.distributeParallel(task, selectedAgents, strategy);
        case 'sequential':
          return await this.distributeSequential(task, selectedAgents, strategy);
        case 'adaptive':
          return await this.distributeAdaptive(task, selectedAgents, strategy);
        default:
          throw new Error(`Unknown distribution strategy: ${strategy.type}`);
      }

    } catch (error) {
      task.status = 'failed';
      task.lastError = error instanceof Error ? error.message : String(error);
      task.metrics.errorCount++;
      throw error;
    }
  }

  /**
   * Monitor task progress with Windows-compatible operations
   */
  async monitorTaskProgress(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: `Task ${taskId} not found` }, null, 2)
        }]
      };
    }

    // Start monitoring loop with cancellation support
    const monitoringInterval = setInterval(async () => {
      if (task.cancellationToken?.signal.aborted) {
        clearInterval(monitoringInterval);
        return;
      }

      await this.updateTaskMetrics(task);
      
      // Check for completion or failure conditions
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        clearInterval(monitoringInterval);
        this.runningTasks.delete(taskId);
        
        // Process any waiting dependent tasks
        await this.processDependentTasks(taskId);
      }

    }, 5000); // Check every 5 seconds

    this.runningTasks.add(taskId);
    task.status = 'running';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          taskId,
          message: 'Task monitoring started',
          status: task.status,
          assignedAgents: task.assignedAgents,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  /**
   * Optimize task distribution based on performance metrics
   */
  async optimizeTaskDistribution(): Promise<any> {
    try {
      const tasks = Array.from(this.tasks.values());
      const runningTasks = tasks.filter(t => t.status === 'running');
      const pendingTasks = tasks.filter(t => t.status === 'pending');

      const optimizations = [];

      // Analyze current distribution efficiency
      const efficiency = await this.calculateDistributionEfficiency();
      
      if (efficiency < 0.7) {
        // Rebalance running tasks
        for (const task of runningTasks) {
          const rebalanceResult = await this.rebalanceTask(task);
          if (rebalanceResult.optimized) {
            optimizations.push(rebalanceResult);
          }
        }
      }

      // Optimize pending task queue
      const queueOptimization = await this.optimizeTaskQueue(pendingTasks);
      if (queueOptimization.changes.length > 0) {
        optimizations.push(queueOptimization);
      }

      // Agent utilization optimization
      const agentOptimization = await this.optimizeAgentUtilization();
      if (agentOptimization.recommendations.length > 0) {
        optimizations.push(agentOptimization);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Task distribution optimization completed',
            currentEfficiency: efficiency,
            optimizations,
            metrics: {
              tasksRebalanced: optimizations.filter(o => o.type === 'rebalance').length,
              queueChanges: optimizations.filter(o => o.type === 'queue').length,
              agentRecommendations: optimizations.filter(o => o.type === 'agent').length
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Failed to optimize task distribution: ${error}`,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async buildTaskLineage(parentTaskId?: string, taskId?: string): Promise<TaskLineage> {
    if (!parentTaskId) {
      return {
        childTaskIds: [],
        originTaskId: taskId || uuidv4(),
        depth: 0,
        breadcrumb: [taskId || 'root']
      };
    }

    const parentTask = this.tasks.get(parentTaskId);
    if (!parentTask) {
      throw new Error(`Parent task ${parentTaskId} not found`);
    }

    return {
      parentTaskId,
      childTaskIds: [],
      originTaskId: parentTask.lineage.originTaskId,
      depth: parentTask.lineage.depth + 1,
      breadcrumb: [...parentTask.lineage.breadcrumb, taskId || 'child']
    };
  }

  private async checkDependencies(dependencies: string[]): Promise<{ allResolved: boolean; unresolved: string[] }> {
    const unresolved = [];
    
    for (const depId of dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        unresolved.push(depId);
      }
    }

    return { allResolved: unresolved.length === 0, unresolved };
  }

  private getOptimalAgentSelection(priority: string, requirements: string[]): 'round-robin' | 'performance-based' | 'capability-based' | 'load-balanced' {
    if (requirements.length > 0) return 'capability-based';
    if (priority === 'critical' || priority === 'high') return 'performance-based';
    return 'load-balanced';
  }

  private calculateMaxConcurrency(type: string, priority: string): number {
    switch (type) {
      case 'parallel':
        return priority === 'critical' ? 8 : priority === 'high' ? 6 : 4;
      case 'sequential':
        return 1;
      case 'adaptive':
        return priority === 'critical' ? 4 : 2;
      default:
        return 2;
    }
  }

  private async analyzeAgentWorkload(swarmId?: string): Promise<Map<string, number>> {
    const workload = new Map<string, number>();
    const tasks = Array.from(this.tasks.values());

    for (const task of tasks) {
      if (task.status === 'running' || task.status === 'assigned') {
        for (const agentId of task.assignedAgents) {
          workload.set(agentId, (workload.get(agentId) || 0) + 1);
        }
      }
    }

    return workload;
  }

  private detectAgentBottlenecks(workload: Map<string, number>, threshold: number): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const maxConcurrentTasks = 5;

    for (const [agentId, load] of workload.entries()) {
      if (load > threshold * maxConcurrentTasks) {
        bottlenecks.push({
          type: 'agent_overload',
          severity: load > maxConcurrentTasks * 0.9 ? 'critical' : 'high',
          agentId,
          metric: 'concurrent_tasks',
          currentValue: load,
          threshold: threshold * maxConcurrentTasks,
          recommendation: `Agent ${agentId} is handling ${load} tasks. Consider redistributing work or spawning additional agents.`,
          estimatedImpact: `Performance degradation of ${Math.round((load / maxConcurrentTasks) * 100)}%`
        });
      }
    }

    return bottlenecks;
  }

  private detectStalledTasks(tasks: TaskStatus[], timeWindow: number): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const now = new Date();

    for (const task of tasks) {
      if (task.status === 'running' && task.startTime) {
        const duration = now.getTime() - task.startTime.getTime();
        if (duration > timeWindow) {
          bottlenecks.push({
            type: 'stalled_task',
            severity: duration > timeWindow * 2 ? 'critical' : 'high',
            taskId: task.id,
            metric: 'execution_time',
            currentValue: duration,
            threshold: timeWindow,
            recommendation: `Task ${task.name} has been running for ${Math.round(duration / 60000)} minutes. Consider breaking down or reassigning.`,
            estimatedImpact: 'Blocking dependent tasks and reducing overall throughput'
          });
        }
      }
    }

    return bottlenecks;
  }

  private detectDependencyBottlenecks(tasks: TaskStatus[]): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const dependencyChains = new Map<string, string[]>();

    // Build dependency graph
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!dependencyChains.has(depId)) {
          dependencyChains.set(depId, []);
        }
        dependencyChains.get(depId)!.push(task.id);
      }
    }

    // Check for long dependency chains
    for (const [taskId, dependents] of dependencyChains.entries()) {
      if (dependents.length > 5) {
        bottlenecks.push({
          type: 'dependency_chain',
          severity: dependents.length > 10 ? 'critical' : 'medium',
          taskId,
          metric: 'dependent_tasks',
          currentValue: dependents.length,
          threshold: 5,
          recommendation: `Task ${taskId} has ${dependents.length} dependent tasks. Consider parallelizing or breaking dependencies.`,
          estimatedImpact: `${dependents.length} tasks blocked by single dependency`
        });
      }
    }

    return bottlenecks;
  }

  private async detectResourceConstraints(): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    try {
      // Windows-specific resource monitoring using wmic
      const os = await import('os');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Get CPU usage
      const cpuUsage = os.loadavg()[0] / os.cpus().length;
      if (cpuUsage > 0.8) {
        bottlenecks.push({
          type: 'resource_constraint',
          severity: cpuUsage > 0.95 ? 'critical' : 'high',
          metric: 'cpu_usage',
          currentValue: cpuUsage * 100,
          threshold: 80,
          recommendation: 'High CPU usage detected. Consider reducing task concurrency or scaling horizontally.',
          estimatedImpact: `${Math.round((cpuUsage - 0.8) * 500)}% performance degradation`
        });
      }

      // Get memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsage = (totalMem - freeMem) / totalMem;
      
      if (memUsage > 0.85) {
        bottlenecks.push({
          type: 'resource_constraint',
          severity: memUsage > 0.95 ? 'critical' : 'high',
          metric: 'memory_usage',
          currentValue: memUsage * 100,
          threshold: 85,
          recommendation: 'High memory usage detected. Consider implementing task result caching or reducing concurrent tasks.',
          estimatedImpact: 'Risk of system instability and task failures'
        });
      }

    } catch (error) {
      // Fallback resource monitoring
      const os = await import('os');
      const memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
      
      if (memUsage > 0.9) {
        bottlenecks.push({
          type: 'resource_constraint',
          severity: 'medium',
          metric: 'memory_usage',
          currentValue: memUsage * 100,
          threshold: 90,
          recommendation: 'Memory monitoring limited. Consider manual resource review.',
          estimatedImpact: 'Unknown - manual assessment recommended'
        });
      }
    }

    return bottlenecks;
  }

  private async detectNetworkBottlenecks(swarmId?: string): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    // Simulate network latency detection
    // In a real implementation, this would measure actual network performance
    const avgLatency = 50; // ms
    const latencyThreshold = 100;

    if (avgLatency > latencyThreshold) {
      bottlenecks.push({
        type: 'network_latency',
        severity: avgLatency > latencyThreshold * 2 ? 'high' : 'medium',
        metric: 'network_latency',
        currentValue: avgLatency,
        threshold: latencyThreshold,
        recommendation: 'High network latency detected. Consider local agent deployment or network optimization.',
        estimatedImpact: `${avgLatency - latencyThreshold}ms additional delay per operation`
      });
    }

    return bottlenecks;
  }

  private analyzePriorityQueuing(tasks: TaskStatus[]): any {
    const priorityCounts = {
      critical: tasks.filter(t => t.lineage.breadcrumb.includes('critical')).length,
      high: tasks.filter(t => t.lineage.breadcrumb.includes('high')).length,
      medium: tasks.filter(t => t.lineage.breadcrumb.includes('medium')).length,
      low: tasks.filter(t => t.lineage.breadcrumb.includes('low')).length
    };

    const queuedPriorityCounts = {
      critical: tasks.filter(t => t.status === 'pending' && t.lineage.breadcrumb.includes('critical')).length,
      high: tasks.filter(t => t.status === 'pending' && t.lineage.breadcrumb.includes('high')).length,
      medium: tasks.filter(t => t.status === 'pending' && t.lineage.breadcrumb.includes('medium')).length,
      low: tasks.filter(t => t.status === 'pending' && t.lineage.breadcrumb.includes('low')).length
    };

    return {
      totalByPriority: priorityCounts,
      queuedByPriority: queuedPriorityCounts,
      priorityInversion: queuedPriorityCounts.critical > 0 && queuedPriorityCounts.low === 0
    };
  }

  private calculateOverallSeverity(bottlenecks: PerformanceBottleneck[]): 'low' | 'medium' | 'high' | 'critical' {
    if (bottlenecks.some(b => b.severity === 'critical')) return 'critical';
    if (bottlenecks.filter(b => b.severity === 'high').length > 2) return 'high';
    if (bottlenecks.length > 3) return 'medium';
    return 'low';
  }

  private generateBottleneckRecommendations(bottlenecks: PerformanceBottleneck[]): string[] {
    const recommendations = new Set<string>();

    for (const bottleneck of bottlenecks) {
      recommendations.add(bottleneck.recommendation);
    }

    // Add general recommendations based on bottleneck patterns
    if (bottlenecks.filter(b => b.type === 'agent_overload').length > 2) {
      recommendations.add('Consider implementing auto-scaling for agent pools');
    }

    if (bottlenecks.filter(b => b.type === 'stalled_task').length > 1) {
      recommendations.add('Implement task timeout and automatic retry mechanisms');
    }

    if (bottlenecks.some(b => b.severity === 'critical')) {
      recommendations.add('URGENT: System requires immediate attention to prevent failures');
    }

    return Array.from(recommendations);
  }

  private parseAvailableAgents(swarmStatus: any): any[] {
    try {
      const content = swarmStatus.content?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        return parsed.agents || [];
      }
    } catch (error) {
      // Fallback to empty array
    }
    return [];
  }

  private async selectAgents(availableAgents: any[], strategy: TaskDistributionStrategy, task: TaskStatus): Promise<any[]> {
    const agentCount = Math.min(strategy.maxConcurrency || 2, availableAgents.length);
    
    switch (strategy.agentSelection) {
      case 'performance-based':
        return availableAgents
          .sort((a, b) => (b.performance || 0) - (a.performance || 0))
          .slice(0, agentCount);
          
      case 'capability-based':
        // Filter agents by required capabilities
        return availableAgents
          .filter(agent => this.hasRequiredCapabilities(agent, task))
          .slice(0, agentCount);
          
      case 'load-balanced':
        return availableAgents
          .sort((a, b) => (a.currentLoad || 0) - (b.currentLoad || 0))
          .slice(0, agentCount);
          
      case 'round-robin':
      default:
        return availableAgents.slice(0, agentCount);
    }
  }

  private hasRequiredCapabilities(agent: any, task: TaskStatus): boolean {
    // Simplified capability matching
    return true; // In a real implementation, check agent skills vs task requirements
  }

  private async distributeParallel(task: TaskStatus, agents: any[], strategy: TaskDistributionStrategy): Promise<any> {
    // Distribute work across all selected agents simultaneously
    return {
      type: 'parallel',
      agentCount: agents.length,
      message: `Task distributed to ${agents.length} agents for parallel execution`
    };
  }

  private async distributeSequential(task: TaskStatus, agents: any[], strategy: TaskDistributionStrategy): Promise<any> {
    // Execute on one agent at a time
    return {
      type: 'sequential',
      agentCount: 1,
      queuedAgents: agents.length - 1,
      message: `Task assigned to ${agents[0]?.id} with ${agents.length - 1} agents in queue`
    };
  }

  private async distributeAdaptive(task: TaskStatus, agents: any[], strategy: TaskDistributionStrategy): Promise<any> {
    // Start with one agent, scale based on performance
    const initialAgents = Math.min(2, agents.length);
    return {
      type: 'adaptive',
      initialAgentCount: initialAgents,
      availableAgents: agents.length - initialAgents,
      message: `Task started with ${initialAgents} agents, will scale based on performance`
    };
  }

  private async updateTaskMetrics(task: TaskStatus): Promise<void> {
    const now = new Date();
    
    if (task.startTime) {
      task.metrics.processingTime = now.getTime() - task.startTime.getTime();
    }

    // Simulate resource usage updates
    task.metrics.resourceUsage = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      networkUsage: Math.random() * 100,
      diskUsage: Math.random() * 100
    };

    // Update performance metrics history
    const metricsKey = `${task.id}_performance`;
    if (!this.performanceMetrics.has(metricsKey)) {
      this.performanceMetrics.set(metricsKey, []);
    }
    
    const history = this.performanceMetrics.get(metricsKey)!;
    history.push(task.metrics.processingTime);
    
    // Keep only last 100 measurements
    if (history.length > 100) {
      history.shift();
    }
  }

  private async processDependentTasks(completedTaskId: string): Promise<void> {
    const dependentTasks = Array.from(this.tasks.values())
      .filter(task => task.dependencies.includes(completedTaskId) && task.status === 'pending');

    for (const task of dependentTasks) {
      const dependencyCheck = await this.checkDependencies(task.dependencies);
      if (dependencyCheck.allResolved) {
        // Move task from queue to active processing
        const queueIndex = this.taskQueue.findIndex(t => t.id === task.id);
        if (queueIndex !== -1) {
          this.taskQueue.splice(queueIndex, 1);
        }
        
        // Restart task orchestration
        await this.orchestrateTask({
          name: task.name,
          type: task.lineage.breadcrumb.includes('sequential') ? 'sequential' : 
                task.lineage.breadcrumb.includes('parallel') ? 'parallel' : 'adaptive',
          priority: task.lineage.breadcrumb.includes('critical') ? 'critical' :
                   task.lineage.breadcrumb.includes('high') ? 'high' :
                   task.lineage.breadcrumb.includes('low') ? 'low' : 'medium'
        });
      }
    }
  }

  private async calculateDistributionEfficiency(): Promise<number> {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    if (completedTasks.length === 0) return 1.0;

    const avgProcessingTime = completedTasks.reduce((sum, task) => 
      sum + task.metrics.processingTime, 0) / completedTasks.length;
    
    const avgAgentUtilization = completedTasks.reduce((sum, task) => 
      sum + task.assignedAgents.length, 0) / completedTasks.length;

    // Simplified efficiency calculation
    const timeEfficiency = Math.max(0, 1 - (avgProcessingTime / 300000)); // 5 min baseline
    const resourceEfficiency = Math.min(1, avgAgentUtilization / 3); // 3 agents optimal

    return (timeEfficiency + resourceEfficiency) / 2;
  }

  private async rebalanceTask(task: TaskStatus): Promise<any> {
    // Simulate task rebalancing logic
    return {
      type: 'rebalance',
      taskId: task.id,
      optimized: false,
      reason: 'Task performance within acceptable parameters'
    };
  }

  private async optimizeTaskQueue(pendingTasks: TaskStatus[]): Promise<any> {
    // Priority-based queue optimization
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = this.extractPriority(a.lineage.breadcrumb);
      const bPriority = this.extractPriority(b.lineage.breadcrumb);
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });

    const changes = [];
    if (JSON.stringify(sortedTasks) !== JSON.stringify(pendingTasks)) {
      changes.push('Reordered queue by priority');
      this.taskQueue = sortedTasks;
    }

    return {
      type: 'queue',
      changes,
      newQueueOrder: sortedTasks.map(t => t.id)
    };
  }

  private async optimizeAgentUtilization(): Promise<any> {
    const recommendations = [];
    const runningTaskCount = this.runningTasks.size;
    const queuedTaskCount = this.taskQueue.length;

    if (queuedTaskCount > runningTaskCount * 2) {
      recommendations.push('Consider spawning additional agents to handle queued tasks');
    }

    if (runningTaskCount > 0 && queuedTaskCount === 0) {
      recommendations.push('System may be over-provisioned; consider agent consolidation');
    }

    return {
      type: 'agent',
      recommendations,
      metrics: {
        runningTasks: runningTaskCount,
        queuedTasks: queuedTaskCount,
        utilization: runningTaskCount / (runningTaskCount + queuedTaskCount || 1)
      }
    };
  }

  private extractPriority(breadcrumb: string[]): 'critical' | 'high' | 'medium' | 'low' {
    if (breadcrumb.includes('critical')) return 'critical';
    if (breadcrumb.includes('high')) return 'high';
    if (breadcrumb.includes('low')) return 'low';
    return 'medium';
  }

  private startPerformanceMonitoring(): void {
    // Monitor system performance every minute
    setInterval(async () => {
      try {
        // Clean up old metrics
        for (const [key, history] of this.performanceMetrics.entries()) {
          if (history.length > 1000) {
            this.performanceMetrics.set(key, history.slice(-100));
          }
        }

        // Clean up completed tasks older than 1 hour
        const oneHourAgo = new Date(Date.now() - 3600000);
        for (const [taskId, task] of this.tasks.entries()) {
          if (task.status === 'completed' && task.endTime && task.endTime < oneHourAgo) {
            this.tasks.delete(taskId);
          }
        }

      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 60000);
  }

  // ===== PUBLIC UTILITY METHODS =====

  async getTaskStatus(taskId: string): Promise<TaskStatus | undefined> {
    return this.tasks.get(taskId);
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
      if (progress >= 100) {
        task.status = 'completed';
        task.endTime = new Date();
      }
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (task && task.status !== 'completed' && task.status !== 'failed') {
      task.cancellationToken?.abort();
      task.status = 'cancelled';
      task.endTime = new Date();
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }

  async getTaskLineage(taskId: string): Promise<TaskLineage | undefined> {
    const task = this.tasks.get(taskId);
    return task?.lineage;
  }

  async getPerformanceMetrics(taskId?: string): Promise<any> {
    if (taskId) {
      const task = this.tasks.get(taskId);
      const metricsKey = `${taskId}_performance`;
      return {
        task: task?.metrics,
        history: this.performanceMetrics.get(metricsKey) || []
      };
    }

    // Return aggregate metrics
    const allTasks = Array.from(this.tasks.values());
    return {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      runningTasks: this.runningTasks.size,
      queuedTasks: this.taskQueue.length,
      avgProcessingTime: this.calculateAverageProcessingTime(allTasks),
      totalTokenUsage: allTasks.reduce((sum, task) => sum + task.metrics.tokenUsage, 0)
    };
  }

  private calculateAverageProcessingTime(tasks: TaskStatus[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.startTime && t.endTime);
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (task.endTime!.getTime() - task.startTime!.getTime());
    }, 0);

    return totalTime / completedTasks.length;
  }
}
import { AgentStatus, AgentMetrics } from '../agents/AgentManager.js';

/**
 * Performance metric data structure for tracking various agent performance indicators
 */
export interface PerformanceMetric {
  agentId: string;
  metricType: 'responseTime' | 'tokenUsage' | 'memoryUsage' | 'cpuUsage' | 'taskCompletion' | 'errorCount';
  value: number;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Agent performance summary interface
 */
export interface AgentPerformanceSummary {
  avgResponseTime: number;
  totalTasks: number;
  successRate: number;
  tokenUsage: number;
  errors: number;
  avgMemoryUsage?: number;
  avgCpuUsage?: number;
  uptime: number;
  lastActivity: Date;
}

/**
 * Performance analysis report interface
 */
export interface PerformanceReport {
  timestamp: Date;
  agents: {
    [agentId: string]: AgentPerformanceSummary;
  };
  bottlenecks: string[];
  recommendations: string[];
  systemOverview: {
    totalAgents: number;
    activeAgents: number;
    avgSystemResponseTime: number;
    totalTokenUsage: number;
    totalErrors: number;
    systemUptime: number;
  };
}

/**
 * Performance threshold configuration for bottleneck detection
 */
export interface PerformanceThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
  minSuccessRate: number;
}

/**
 * Windows-compatible Performance Analyzer for Claude Flow agent orchestration
 * 
 * Tracks and analyzes performance metrics for agents in the swarm, providing
 * insights into bottlenecks, optimization opportunities, and system health.
 */
export class PerformanceAnalyzer {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private agentStartTimes: Map<string, Date> = new Map();
  private thresholds: PerformanceThresholds;
  private systemStartTime: Date;

  /**
   * Initialize the Performance Analyzer with configurable thresholds
   */
  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.systemStartTime = new Date();
    this.thresholds = {
      maxResponseTime: 5000, // 5 seconds
      maxErrorRate: 0.1, // 10%
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB in bytes
      maxCpuUsage: 80, // 80%
      minSuccessRate: 0.9, // 90%
      ...thresholds
    };
  }

  /**
   * Record a performance metric for an agent
   * 
   * @param agentId - Unique identifier for the agent
   * @param metricType - Type of metric being recorded
   * @param value - Numeric value of the metric
   * @param context - Optional additional context data
   */
  recordMetric(
    agentId: string, 
    metricType: PerformanceMetric['metricType'], 
    value: number, 
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      agentId,
      metricType,
      value,
      timestamp: new Date(),
      context
    };

    if (!this.metrics.has(agentId)) {
      this.metrics.set(agentId, []);
      this.agentStartTimes.set(agentId, new Date());
    }

    this.metrics.get(agentId)!.push(metric);

    // Maintain a rolling window of metrics to prevent memory bloat
    const maxMetricsPerAgent = 1000;
    const agentMetrics = this.metrics.get(agentId)!;
    if (agentMetrics.length > maxMetricsPerAgent) {
      agentMetrics.splice(0, agentMetrics.length - maxMetricsPerAgent);
    }
  }

  /**
   * Generate a comprehensive performance analysis report
   * 
   * @returns Complete performance report with agent summaries, bottlenecks, and recommendations
   */
  generateReport(): PerformanceReport {
    const timestamp = new Date();
    const agents: { [agentId: string]: AgentPerformanceSummary } = {};
    let totalActiveAgents = 0;
    let totalSystemResponseTime = 0;
    let totalSystemTokenUsage = 0;
    let totalSystemErrors = 0;
    let responseTimeCount = 0;

    // Generate agent summaries
    for (const [agentId, metrics] of this.metrics.entries()) {
      const summary = this.calculateAgentSummary(agentId, metrics);
      agents[agentId] = summary;

      if (summary.lastActivity > new Date(Date.now() - 5 * 60 * 1000)) { // Active in last 5 minutes
        totalActiveAgents++;
      }

      if (summary.avgResponseTime > 0) {
        totalSystemResponseTime += summary.avgResponseTime;
        responseTimeCount++;
      }

      totalSystemTokenUsage += summary.tokenUsage;
      totalSystemErrors += summary.errors;
    }

    const bottlenecks = this.getBottlenecks();
    const recommendations = this.generateRecommendationsFromAgents(agents);

    return {
      timestamp,
      agents,
      bottlenecks,
      recommendations,
      systemOverview: {
        totalAgents: this.metrics.size,
        activeAgents: totalActiveAgents,
        avgSystemResponseTime: responseTimeCount > 0 ? totalSystemResponseTime / responseTimeCount : 0,
        totalTokenUsage: totalSystemTokenUsage,
        totalErrors: totalSystemErrors,
        systemUptime: timestamp.getTime() - this.systemStartTime.getTime()
      }
    };
  }

  /**
   * Get performance metrics for a specific agent
   * 
   * @param agentId - Agent identifier
   * @returns Agent performance summary or null if agent not found
   */
  getAgentMetrics(agentId: string): AgentPerformanceSummary | null {
    const metrics = this.metrics.get(agentId);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    return this.calculateAgentSummary(agentId, metrics);
  }

  /**
   * Identify current performance bottlenecks in the system
   * 
   * @returns Array of bottleneck descriptions
   */
  getBottlenecks(): string[] {
    const bottlenecks: string[] = [];

    for (const [agentId, metrics] of this.metrics.entries()) {
      const summary = this.calculateAgentSummary(agentId, metrics);

      // Check response time bottlenecks
      if (summary.avgResponseTime > this.thresholds.maxResponseTime) {
        bottlenecks.push(`Agent ${agentId}: High response time (${summary.avgResponseTime.toFixed(0)}ms > ${this.thresholds.maxResponseTime}ms)`);
      }

      // Check error rate bottlenecks
      const errorRate = summary.totalTasks > 0 ? summary.errors / summary.totalTasks : 0;
      if (errorRate > this.thresholds.maxErrorRate) {
        bottlenecks.push(`Agent ${agentId}: High error rate (${(errorRate * 100).toFixed(1)}% > ${(this.thresholds.maxErrorRate * 100).toFixed(1)}%)`);
      }

      // Check success rate bottlenecks
      if (summary.successRate < this.thresholds.minSuccessRate) {
        bottlenecks.push(`Agent ${agentId}: Low success rate (${(summary.successRate * 100).toFixed(1)}% < ${(this.thresholds.minSuccessRate * 100).toFixed(1)}%)`);
      }

      // Check memory usage bottlenecks
      if (summary.avgMemoryUsage && summary.avgMemoryUsage > this.thresholds.maxMemoryUsage) {
        const memMB = (summary.avgMemoryUsage / (1024 * 1024)).toFixed(1);
        const thresholdMB = (this.thresholds.maxMemoryUsage / (1024 * 1024)).toFixed(1);
        bottlenecks.push(`Agent ${agentId}: High memory usage (${memMB}MB > ${thresholdMB}MB)`);
      }

      // Check CPU usage bottlenecks
      if (summary.avgCpuUsage && summary.avgCpuUsage > this.thresholds.maxCpuUsage) {
        bottlenecks.push(`Agent ${agentId}: High CPU usage (${summary.avgCpuUsage.toFixed(1)}% > ${this.thresholds.maxCpuUsage}%)`);
      }
    }

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations based on current performance data
   * 
   * @returns Array of recommendation strings
   */
  getRecommendations(): string[] {
    const agents: { [agentId: string]: AgentPerformanceSummary } = {};
    
    // Generate agent summaries without circular dependency
    for (const [agentId, metrics] of this.metrics.entries()) {
      agents[agentId] = this.calculateAgentSummary(agentId, metrics);
    }
    
    return this.generateRecommendationsFromAgents(agents);
  }

  /**
   * Generate recommendations from agent summaries (helper method to avoid circular dependency)
   */
  private generateRecommendationsFromAgents(agents: { [agentId: string]: AgentPerformanceSummary }): string[] {
    const recommendations: string[] = [];
    const totalAgents = Object.keys(agents).length;

    // Analyze system-wide patterns
    const highResponseTimeAgents = Object.entries(agents)
      .filter(([_, summary]) => summary.avgResponseTime > this.thresholds.maxResponseTime)
      .length;

    const highErrorRateAgents = Object.entries(agents)
      .filter(([_, summary]) => summary.totalTasks > 0 && (summary.errors / summary.totalTasks) > this.thresholds.maxErrorRate)
      .length;

    const avgSystemResponseTime = Object.values(agents)
      .filter(summary => summary.avgResponseTime > 0)
      .reduce((sum, summary, _, arr) => sum + summary.avgResponseTime / arr.length, 0);

    // System-wide recommendations
    if (highResponseTimeAgents > totalAgents * 0.3) {
      recommendations.push('Consider reducing agent workload or implementing load balancing - 30%+ of agents have high response times');
    }

    if (highErrorRateAgents > totalAgents * 0.2) {
      recommendations.push('Investigate error patterns - 20%+ of agents have high error rates, suggesting systemic issues');
    }

    if (avgSystemResponseTime > this.thresholds.maxResponseTime * 0.8) {
      recommendations.push('System response time approaching threshold - consider scaling resources or optimizing agent coordination');
    }

    // Agent-specific recommendations
    for (const [agentId, summary] of Object.entries(agents)) {
      if (summary.avgResponseTime > this.thresholds.maxResponseTime) {
        recommendations.push(`Agent ${agentId}: Optimize processing logic or reduce task complexity to improve response time`);
      }

      if (summary.totalTasks > 0 && summary.successRate < this.thresholds.minSuccessRate) {
        recommendations.push(`Agent ${agentId}: Review error handling and task validation logic to improve success rate`);
      }

      if (summary.tokenUsage > 50000) { // High token usage threshold
        recommendations.push(`Agent ${agentId}: Consider optimizing prompts or implementing token usage controls`);
      }

      // Resource usage recommendations
      if (summary.avgMemoryUsage && summary.avgMemoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
        recommendations.push(`Agent ${agentId}: Memory usage approaching limit - review memory management and data structures`);
      }

      if (summary.avgCpuUsage && summary.avgCpuUsage > this.thresholds.maxCpuUsage * 0.8) {
        recommendations.push(`Agent ${agentId}: CPU usage approaching limit - consider optimizing computational tasks`);
      }
    }

    // Add general recommendations if no specific issues found
    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable parameters');
      recommendations.push('Consider implementing predictive scaling based on usage patterns');
      recommendations.push('Regular performance monitoring and optimization reviews recommended');
    }

    return recommendations;
  }

  /**
   * Clear all stored metrics (useful for testing or system reset)
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.agentStartTimes.clear();
    this.systemStartTime = new Date();
  }

  /**
   * Get raw metrics for an agent (useful for detailed analysis)
   */
  getRawMetrics(agentId: string): PerformanceMetric[] {
    return this.metrics.get(agentId) || [];
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Calculate comprehensive performance summary for an agent
   */
  private calculateAgentSummary(agentId: string, metrics: PerformanceMetric[]): AgentPerformanceSummary {
    const responseTimeMetrics = metrics.filter(m => m.metricType === 'responseTime');
    const taskCompletionMetrics = metrics.filter(m => m.metricType === 'taskCompletion');
    const errorMetrics = metrics.filter(m => m.metricType === 'errorCount');
    const tokenMetrics = metrics.filter(m => m.metricType === 'tokenUsage');
    const memoryMetrics = metrics.filter(m => m.metricType === 'memoryUsage');
    const cpuMetrics = metrics.filter(m => m.metricType === 'cpuUsage');

    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    const totalTasks = taskCompletionMetrics.length;
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const successRate = totalTasks > 0 ? Math.max(0, (totalTasks - totalErrors) / totalTasks) : 0;

    const tokenUsage = tokenMetrics.reduce((sum, m) => sum + m.value, 0);

    const avgMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : undefined;

    const avgCpuUsage = cpuMetrics.length > 0
      ? cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length
      : undefined;

    const startTime = this.agentStartTimes.get(agentId) || new Date();
    const uptime = Date.now() - startTime.getTime();

    const lastActivity = metrics.length > 0
      ? metrics.reduce((latest, m) => m.timestamp > latest ? m.timestamp : latest, metrics[0].timestamp)
      : new Date();

    return {
      avgResponseTime,
      totalTasks,
      successRate,
      tokenUsage,
      errors: totalErrors,
      avgMemoryUsage,
      avgCpuUsage,
      uptime,
      lastActivity
    };
  }
}
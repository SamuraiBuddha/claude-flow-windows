/**
 * Analysis module for Claude Flow Windows
 * 
 * Provides performance monitoring, bottleneck detection, and optimization
 * recommendations for agent orchestration systems.
 */

export {
  PerformanceAnalyzer,
  type PerformanceMetric,
  type AgentPerformanceSummary,
  type PerformanceReport,
  type PerformanceThresholds
} from './PerformanceAnalyzer.js';

// Re-export commonly used types from other modules for convenience
export type { AgentStatus, AgentMetrics } from '../agents/AgentManager.js';
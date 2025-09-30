// Export all public APIs for the package
export { ClaudeFlowServer } from './index.js';
export { SwarmCoordinator } from './coordinators/SwarmCoordinator.js';
export { AgentManager } from './agents/AgentManager.js';
export { AgentCoordinator } from './agents/AgentCoordinator.js';
export { RealAgent, type RealAgentConfig, type AgentMessage } from './agents/RealAgent.js';
export { MemoryManager } from './memory/MemoryManager.js';
export { TaskOrchestrator } from './orchestration/TaskOrchestrator.js';
export { TerminalUI } from './ui/terminal-ui.js';
export { WindowsShellAdapter } from './adapters/WindowsShellAdapter.js';
export { 
  PerformanceAnalyzer,
  type PerformanceMetric,
  type AgentPerformanceSummary,
  type PerformanceReport,
  type PerformanceThresholds
} from './analysis/index.js';
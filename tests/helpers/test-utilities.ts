import { vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * General test utilities and helpers
 */

/**
 * Load test fixtures from JSON files
 */
export function loadFixture<T = any>(filename: string): T {
  const fixturePath = join(__dirname, '..', 'fixtures', filename);
  const content = readFileSync(fixturePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Create a mock MCP response structure
 */
export function createMCPResponse(content: any, isError: boolean = false) {
  if (isError) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: content.error || 'Unknown error',
            message: content.message || 'An error occurred',
            code: content.code || 'UNKNOWN'
          })
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: typeof content === 'string' ? content : JSON.stringify(content)
      }
    ]
  };
}

/**
 * Generate random test data
 */
export class TestDataGenerator {
  static randomId(prefix: string = 'test'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static randomAgentId(): string {
    return this.randomId('agent');
  }

  static randomSwarmId(): string {
    return this.randomId('swarm');
  }

  static randomTaskId(): string {
    return this.randomId('task');
  }

  static randomAgentConfig(type?: string) {
    const types = ['supervisor', 'worker', 'specialist', 'orchestrator', 'executor'];
    const skills = [
      'code_generation', 'testing', 'documentation', 'monitoring',
      'coordination', 'task_distribution', 'resource_management'
    ];

    return {
      id: this.randomAgentId(),
      type: type || types[Math.floor(Math.random() * types.length)],
      skills: this.randomSubset(skills, 2, 4),
      maxConcurrentTasks: Math.floor(Math.random() * 10) + 1,
      timeout: Math.floor(Math.random() * 30000) + 5000
    };
  }

  static randomSwarmConfig(topology?: string) {
    const topologies = ['hierarchical', 'mesh', 'star', 'ring', 'adaptive'];
    const strategies = ['balanced', 'parallel', 'centralized', 'sequential', 'dynamic'];

    return {
      topology: topology || topologies[Math.floor(Math.random() * topologies.length)],
      maxAgents: Math.floor(Math.random() * 15) + 3,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      enableMemory: Math.random() > 0.5
    };
  }

  static randomMetrics() {
    return {
      tasksCompleted: Math.floor(Math.random() * 100),
      tasksInProgress: Math.floor(Math.random() * 10),
      tasksFailed: Math.floor(Math.random() * 5),
      avgResponseTime: Math.floor(Math.random() * 1000) + 100,
      successRate: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      uptime: Math.floor(Math.random() * 86400000), // Up to 24 hours
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 1024 // MB
    };
  }

  private static randomSubset<T>(array: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

/**
 * Time utilities for testing
 */
export class TimeUtils {
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await this.sleep(intervalMs);
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  static measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const resultOrPromise = fn();
    
    if (resultOrPromise instanceof Promise) {
      return resultOrPromise.then(result => ({
        result,
        duration: Date.now() - start
      }));
    }
    
    return Promise.resolve({
      result: resultOrPromise,
      duration: Date.now() - start
    });
  }
}

/**
 * Mock server setup utilities
 */
export class MockServerUtils {
  static createMockServer() {
    return {
      swarmCoordinator: {
        initializeSwarm: vi.fn(),
        getSwarmStatus: vi.fn(),
        generatePerformanceReport: vi.fn(),
        detectBottlenecks: vi.fn(),
        terminateSwarm: vi.fn()
      },
      agentManager: {
        spawnAgent: vi.fn(),
        terminateAgent: vi.fn(),
        getAgentMetrics: vi.fn(),
        listAgents: vi.fn(),
        filterAgents: vi.fn()
      },
      shellAdapter: {
        execute: vi.fn(),
        convertToWindows: vi.fn(),
        wslBridge: vi.fn(),
        executeElevated: vi.fn()
      },
      memoryManager: {
        store: vi.fn(),
        retrieve: vi.fn(),
        persist: vi.fn(),
        clear: vi.fn(),
        export: vi.fn(),
        import: vi.fn()
      },
      taskOrchestrator: {
        orchestrateTask: vi.fn(),
        detectBottlenecks: vi.fn(),
        distributeLoad: vi.fn(),
        monitorProgress: vi.fn()
      }
    };
  }

  static setupDefaultMocks(server: ReturnType<typeof MockServerUtils.createMockServer>) {
    const fixtures = loadFixture('mock-responses.json');
    
    // Setup swarm coordinator mocks
    server.swarmCoordinator.initializeSwarm.mockResolvedValue(
      createMCPResponse(fixtures.swarm_responses.initialize_success)
    );
    
    server.swarmCoordinator.getSwarmStatus.mockResolvedValue(
      createMCPResponse(fixtures.swarm_responses.status_response)
    );
    
    server.swarmCoordinator.generatePerformanceReport.mockResolvedValue(
      createMCPResponse(fixtures.swarm_responses.performance_report)
    );

    // Setup agent manager mocks
    server.agentManager.spawnAgent.mockResolvedValue(
      createMCPResponse(fixtures.agent_responses.spawn_success)
    );
    
    server.agentManager.getAgentMetrics.mockResolvedValue(
      createMCPResponse(fixtures.agent_responses.agent_metrics)
    );
    
    server.agentManager.listAgents.mockResolvedValue(
      createMCPResponse(fixtures.agent_responses.list_agents)
    );

    // Setup shell adapter mocks
    server.shellAdapter.execute.mockResolvedValue(
      createMCPResponse(fixtures.shell_responses.powershell_success)
    );
    
    server.shellAdapter.wslBridge.mockResolvedValue(
      createMCPResponse(fixtures.shell_responses.wsl_bridge_success)
    );

    // Setup memory manager mocks
    server.memoryManager.store.mockResolvedValue(
      createMCPResponse(fixtures.memory_responses.store_success)
    );
    
    server.memoryManager.retrieve.mockResolvedValue(
      createMCPResponse(fixtures.memory_responses.retrieve_success)
    );

    return server;
  }
}

/**
 * Assertion utilities for Windows-specific testing
 */
export class WindowsAssertions {
  static expectValidWindowsPath(path: string) {
    expect(path).toMatch(/^[A-Za-z]:[\\\/].*$/);
  }

  static expectPowerShellCommand(command: string) {
    const powershellCmdlets = [
      'Get-ChildItem', 'Get-Content', 'Get-Process', 'Select-String',
      'New-Item', 'Copy-Item', 'Move-Item', 'Remove-Item',
      'Invoke-RestMethod', 'Start-Process', 'Stop-Process'
    ];
    
    const hasValidCmdlet = powershellCmdlets.some(cmdlet => 
      command.includes(cmdlet)
    );
    
    expect(hasValidCmdlet).toBe(true);
  }

  static expectValidSwarmResponse(response: any) {
    expect(response).toHaveProperty('swarmId');
    expect(response).toHaveProperty('topology');
    expect(response).toHaveProperty('status');
    expect(['hierarchical', 'mesh', 'star', 'ring', 'adaptive'])
      .toContain(response.topology);
    expect(['active', 'inactive', 'error', 'initializing'])
      .toContain(response.status);
  }

  static expectValidAgentResponse(response: any) {
    expect(response).toHaveProperty('agentId');
    expect(response).toHaveProperty('type');
    expect(response).toHaveProperty('status');
    expect(['supervisor', 'worker', 'specialist', 'orchestrator', 'executor'])
      .toContain(response.type);
    expect(['active', 'idle', 'busy', 'error', 'terminated'])
      .toContain(response.status);
  }

  static expectValidPerformanceMetrics(metrics: any) {
    expect(metrics).toHaveProperty('totalTasks');
    expect(metrics).toHaveProperty('completedTasks');
    expect(metrics).toHaveProperty('avgResponseTime');
    expect(metrics).toHaveProperty('successRate');
    
    expect(typeof metrics.totalTasks).toBe('number');
    expect(typeof metrics.completedTasks).toBe('number');
    expect(typeof metrics.avgResponseTime).toBe('number');
    expect(typeof metrics.successRate).toBe('number');
    
    expect(metrics.successRate).toBeGreaterThanOrEqual(0);
    expect(metrics.successRate).toBeLessThanOrEqual(1);
    expect(metrics.completedTasks).toBeLessThanOrEqual(metrics.totalTasks);
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceUtils {
  static async measureThroughput<T>(
    operation: () => Promise<T>,
    durationMs: number = 10000
  ): Promise<{ operationsPerSecond: number; totalOperations: number }> {
    const startTime = Date.now();
    let operations = 0;
    
    while (Date.now() - startTime < durationMs) {
      await operation();
      operations++;
    }
    
    const actualDuration = Date.now() - startTime;
    
    return {
      operationsPerSecond: (operations * 1000) / actualDuration,
      totalOperations: operations
    };
  }

  static async measureLatency<T>(
    operation: () => Promise<T>,
    samples: number = 100
  ): Promise<{ avg: number; min: number; max: number; p95: number; p99: number }> {
    const latencies: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      const start = Date.now();
      await operation();
      latencies.push(Date.now() - start);
    }
    
    latencies.sort((a, b) => a - b);
    
    return {
      avg: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      min: latencies[0],
      max: latencies[latencies.length - 1],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)]
    };
  }
}

/**
 * Cleanup utilities
 */
export class CleanupUtils {
  private static cleanupFunctions: (() => void)[] = [];
  
  static addCleanup(fn: () => void) {
    this.cleanupFunctions.push(fn);
  }
  
  static runCleanup() {
    while (this.cleanupFunctions.length > 0) {
      const cleanup = this.cleanupFunctions.pop();
      try {
        cleanup?.();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    }
  }
  
  static reset() {
    this.cleanupFunctions = [];
  }
}
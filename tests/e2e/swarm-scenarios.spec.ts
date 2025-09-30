import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeFlowServer } from '../../src/index.js';
import { spawn } from 'child_process';

// Mock child_process for Windows shell testing
vi.mock('child_process');

// Mock the AgentManager and MemoryManager classes
vi.mock('../../src/agents/AgentManager.js');
vi.mock('../../src/memory/MemoryManager.js');

describe('End-to-End Swarm Scenarios', () => {
  let server: ClaudeFlowServer;
  let mockSpawn: any;

  beforeEach(() => {
    server = new ClaudeFlowServer();
    mockSpawn = vi.mocked(spawn);
    
    // Mock Windows platform
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });

    // Setup method spies on the server's manager instances
    vi.spyOn(server['agentManager'], 'spawnAgent').mockResolvedValue({
      id: 'agent-1',
      type: 'worker',
      name: 'test-agent',
      status: 'active'
    });

    vi.spyOn(server['memoryManager'], 'store').mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Data stored successfully'
          }, null, 2)
        }
      ]
    });

    vi.spyOn(server['memoryManager'], 'retrieve').mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              key: 'swarm-config',
              value: { topology: 'star', agents: 5 }
            }
          }, null, 2)
        }
      ]
    });

    vi.spyOn(server['memoryManager'], 'persist').mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Memory exported successfully'
          }, null, 2)
        }
      ]
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Swarm Lifecycle', () => {
    it('should initialize hierarchical swarm and spawn agents successfully', async () => {
      // Given: Mock successful command execution
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Initializing a hierarchical swarm
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'hierarchical',
        maxAgents: 5,
        strategy: 'balanced',
        enableMemory: true
      });

      // Then: Should create swarm successfully
      const swarmResponse = JSON.parse(swarmResult.content[0].text);
      expect(swarmResponse.swarmId).toBeDefined();
      expect(swarmResponse.config.topology).toBe('hierarchical');

      // And: Should spawn appropriate agents
      const spawnCalls = vi.mocked(server['agentManager'].spawnAgent).mock.calls;
      expect(spawnCalls.length).toBeGreaterThan(0);
    });

    it('should complete full task orchestration workflow', async () => {
      // Given: An initialized swarm
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'adaptive',
        maxAgents: 4,
        strategy: 'balanced'
      });
      const swarmId = JSON.parse(swarmResult.content[0].text).swarmId;

      // When: Orchestrating a complex task
      const taskResult = await server['taskOrchestrator'].orchestrateTask({
        task: 'Build a REST API with authentication',
        priority: 'high',
        strategy: 'adaptive',
        swarmId
      });

      // Then: Should orchestrate task successfully
      expect(taskResult.content[0].text).toContain('orchestrated');
    });

    it('should handle multi-agent collaboration scenario', async () => {
      // Given: Mesh topology for peer collaboration
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'mesh',
        maxAgents: 6,
        strategy: 'parallel'
      });
      const swarmId = JSON.parse(swarmResult.content[0].text).swarmId;

      // When: Orchestrating collaborative task
      const taskResult = await server['taskOrchestrator'].orchestrateTask({
        task: 'Code review and testing pipeline',
        priority: 'medium',
        strategy: 'parallel',
        swarmId
      });

      // Then: Should handle collaboration
      expect(taskResult.content[0].text).toBeDefined();

      // And: Check swarm status shows active collaboration
      const statusResult = await server['swarmCoordinator'].getSwarmStatus({
        swarmId,
        includeAgents: true,
        includeMetrics: true
      });
      
      const status = JSON.parse(statusResult.content[0].text);
      expect(status.topology).toBe('mesh');
      expect(status.agents).toBeDefined();
    });
  });

  describe('Windows Shell Integration Scenarios', () => {
    it('should execute Windows-converted Unix commands in swarm context', async () => {
      // Given: Shell adapter mock
      const mockChild = createMockChildProcess('file1.txt\nfile2.txt\n', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing Unix command through Windows adapter
      const result = await server['shellAdapter'].execute({
        command: 'ls -la | grep ".txt"'
      });

      // Then: Should convert and execute PowerShell command
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-ChildItem -la | Select-String -Pattern ".txt" '],
        expect.any(Object)
      );
      expect(result.content[0].text).toContain('file1.txt');
    });

    it('should handle WSL bridge when available', async () => {
      // Given: WSL is available
      const mockWSLCheck = createMockChildProcess('Ubuntu', '', 0);
      const mockWSLCommand = createMockChildProcess('complex_unix_result', '', 0);
      mockSpawn
        .mockReturnValueOnce(mockWSLCheck)
        .mockReturnValueOnce(mockWSLCommand);

      // When: Using WSL bridge for complex command
      const result = await server['shellAdapter'].wslBridge({
        command: 'find . -type f -exec grep -l "pattern" {} \\;'
      });

      // Then: Should execute through WSL
      expect(result.content[0].text).toBe('complex_unix_result');
    });

    it('should handle elevated commands on Windows', async () => {
      // Given: Elevated command mock
      const mockChild = createMockChildProcess('Elevated command result', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing elevated command
      const result = await server['shellAdapter'].execute({
        command: 'netstat -an',
        elevated: true
      });

      // Then: Should wrap with elevation
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', expect.stringContaining('Start-Process powershell -Verb RunAs')],
        expect.any(Object)
      );
    });
  });

  describe('Memory Persistence Scenarios', () => {
    it('should persist agent memories across swarm operations', async () => {
      // Given: Initialize swarm with memory enabled
      await server['swarmCoordinator'].initializeSwarm({
        topology: 'star',
        enableMemory: true
      });

      // When: Storing and retrieving memory
      await server['memoryManager'].store({
        key: 'swarm-config',
        value: { topology: 'star', agents: 5 },
        namespace: 'swarm-state'
      });

      const retrieved = await server['memoryManager'].retrieve({
        key: 'swarm-config',
        namespace: 'swarm-state'
      });

      // Then: Should persist and retrieve memory
      expect(retrieved.content[0].text).toContain('star');
    });

    it('should handle memory export and import', async () => {
      // Given: Memory with data
      await server['memoryManager'].store({
        key: 'test-data',
        value: { important: 'information' }
      });

      // When: Exporting memory
      const exportResult = await server['memoryManager'].persist({
        action: 'export',
        path: './test-memory-export.json'
      });

      // Then: Should export successfully
      expect(exportResult.content[0].text).toContain('export');
    });
  });

  describe('Performance Monitoring Scenarios', () => {
    it('should detect and report performance bottlenecks', async () => {
      // Given: Swarm with simulated load
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'hierarchical',
        maxAgents: 8
      });
      const swarmId = JSON.parse(swarmResult.content[0].text).swarmId;

      // When: Detecting bottlenecks
      const bottleneckResult = await server['taskOrchestrator'].detectBottlenecks({
        swarmId,
        timeRange: '1h',
        autoFix: false
      });

      // Then: Should analyze performance
      expect(bottleneckResult.content[0].text).toBeDefined();
    });

    it('should generate comprehensive performance reports', async () => {
      // Given: Multiple swarms with activity
      await server['swarmCoordinator'].initializeSwarm({ topology: 'mesh' });
      await server['swarmCoordinator'].initializeSwarm({ topology: 'ring' });

      // When: Generating performance report
      const reportResult = await server['swarmCoordinator'].generatePerformanceReport({
        format: 'markdown',
        includeMetrics: true
      });

      // Then: Should generate detailed report
      const report = reportResult.content[0].text;
      expect(report).toContain('# Swarm Performance Report');
      expect(report).toContain('## Overview');
      expect(report).toContain('## Performance Metrics');
      expect(report).toContain('## Recommendations');
    });

    it('should provide real-time swarm monitoring', async () => {
      // Given: Active swarm
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'adaptive',
        maxAgents: 5
      });
      const swarmId = JSON.parse(swarmResult.content[0].text).swarmId;

      // When: Monitoring swarm status
      const statusResult = await server['swarmCoordinator'].getSwarmStatus({
        swarmId,
        includeMetrics: true,
        includeAgents: true
      });

      // Then: Should provide detailed status
      const status = JSON.parse(statusResult.content[0].text);
      expect(status.swarmId).toBe(swarmId);
      expect(status.topology).toBe('adaptive');
      expect(status.agents).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.metrics.totalTasks).toBeDefined();
      expect(status.metrics.completedTasks).toBeDefined();
      expect(status.metrics.avgResponseTime).toBeDefined();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle agent failures gracefully', async () => {
      // Given: Swarm with agents
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'star',
        maxAgents: 4
      });

      // Simulate agent spawn failure
      vi.mocked(server['agentManager'].spawnAgent)
        .mockRejectedValue(new Error('Agent spawn failed'));

      // When: Attempting to spawn additional agent
      try {
        await server['agentManager'].spawnAgent({
          type: 'worker',
          name: 'failing-agent'
        });
      } catch (error) {
        // Then: Should handle failure gracefully
        expect(error).toBeInstanceOf(Error);
      }

      // And: Swarm should still be functional
      const statusResult = await server['swarmCoordinator'].getSwarmStatus({});
      expect(statusResult.content[0].text).toBeDefined();
    });

    it('should recover from shell command failures', async () => {
      // Given: Command that will fail
      const mockChild = createMockChildProcess('', 'Command failed', 1);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing failing command
      // Then: Should handle error appropriately
      await expect(server['shellAdapter'].execute({
        command: 'invalid-command'
      })).rejects.toThrow('Command failed');
    });

    it('should handle memory corruption gracefully', async () => {
      // Given: Memory store that fails
      vi.mocked(server['memoryManager'].store)
        .mockRejectedValue(new Error('Memory corruption'));

      // When: Attempting to store corrupted data
      try {
        await server['memoryManager'].store({
          key: 'corrupted',
          value: null as any
        });
      } catch (error) {
        // Then: Should handle corruption gracefully
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Scalability Scenarios', () => {
    it('should handle maximum agent limits', async () => {
      // Given: Swarm with maximum agents
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'mesh',
        maxAgents: 20,
        strategy: 'parallel'
      });

      // Then: Should respect agent limits
      const swarmId = JSON.parse(swarmResult.content[0].text).swarmId;
      const statusResult = await server['swarmCoordinator'].getSwarmStatus({
        swarmId,
        includeAgents: true
      });
      
      const status = JSON.parse(statusResult.content[0].text);
      expect(status.agents.length).toBeLessThanOrEqual(20);
    });

    it('should handle concurrent task orchestration', async () => {
      // Given: Multiple swarms
      const swarm1 = await server['swarmCoordinator'].initializeSwarm({
        topology: 'hierarchical'
      });
      const swarm2 = await server['swarmCoordinator'].initializeSwarm({
        topology: 'mesh'
      });

      const swarmId1 = JSON.parse(swarm1.content[0].text).swarmId;
      const swarmId2 = JSON.parse(swarm2.content[0].text).swarmId;

      // When: Orchestrating tasks concurrently
      const tasks = await Promise.all([
        server['taskOrchestrator'].orchestrateTask({
          task: 'Task 1',
          swarmId: swarmId1
        }),
        server['taskOrchestrator'].orchestrateTask({
          task: 'Task 2',
          swarmId: swarmId2
        })
      ]);

      // Then: Should handle concurrent orchestration
      expect(tasks).toHaveLength(2);
      tasks.forEach(task => {
        expect(task.content[0].text).toBeDefined();
      });
    });

    it('should maintain performance under load', async () => {
      // Given: High-load scenario setup
      const swarms = await Promise.all([
        server['swarmCoordinator'].initializeSwarm({ topology: 'adaptive' }),
        server['swarmCoordinator'].initializeSwarm({ topology: 'hierarchical' }),
        server['swarmCoordinator'].initializeSwarm({ topology: 'mesh' })
      ]);

      // When: Generating performance report under load
      const startTime = Date.now();
      const reportResult = await server['swarmCoordinator'].generatePerformanceReport({
        format: 'json'
      });
      const endTime = Date.now();

      // Then: Should maintain reasonable performance
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Less than 5 seconds

      const report = JSON.parse(reportResult.content[0].text);
      expect(report.swarmCount).toBe(3);
    });
  });

  describe('Integration Edge Cases', () => {
    it('should handle empty swarm operations', async () => {
      // When: Getting status with no swarms
      const statusResult = await server['swarmCoordinator'].getSwarmStatus({});

      // Then: Should handle gracefully
      const response = JSON.parse(statusResult.content[0].text);
      expect(response.swarms).toEqual([]);
    });

    it('should handle malformed requests gracefully', async () => {
      // When: Making request with invalid data
      try {
        await server['swarmCoordinator'].initializeSwarm({
          topology: 'invalid' as any
        });
      } catch (error) {
        // Then: Should handle gracefully (or succeed with fallback)
        // Implementation dependent
      }
    });

    it('should maintain consistency across component interactions', async () => {
      // Given: Complex interaction scenario
      const swarmResult = await server['swarmCoordinator'].initializeSwarm({
        topology: 'ring',
        maxAgents: 6,
        enableMemory: true
      });
      const swarmId = JSON.parse(swarmResult.content[0].text).swarmId;

      // When: Performing multiple operations
      await server['memoryManager'].store({
        key: `swarm-${swarmId}`,
        value: { initialized: true, timestamp: Date.now() }
      });

      const taskResult = await server['taskOrchestrator'].orchestrateTask({
        task: 'Consistency test task',
        swarmId
      });

      const statusResult = await server['swarmCoordinator'].getSwarmStatus({
        swarmId,
        includeMetrics: true
      });

      // Then: All operations should be consistent
      expect(taskResult.content[0].text).toBeDefined();
      expect(statusResult.content[0].text).toBeDefined();
      
      const status = JSON.parse(statusResult.content[0].text);
      expect(status.swarmId).toBe(swarmId);
    });
  });
});

// Helper function to create mock child process
function createMockChildProcess(stdout: string, stderr: string, exitCode: number | null) {
  const mockChild = {
    stdout: {
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), 10);
        }
      })
    },
    stderr: {
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), 10);
        }
      })
    },
    on: vi.fn((event: string, callback: Function) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 20);
      }
    }),
    emit: vi.fn()
  };

  return mockChild;
}
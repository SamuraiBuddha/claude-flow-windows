import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SwarmCoordinator, SwarmConfig, SwarmStatus } from '../../src/coordinators/SwarmCoordinator.js';
import { AgentManager } from '../../src/agents/AgentManager.js';
import { MemoryManager } from '../../src/memory/MemoryManager.js';

// Mock dependencies
vi.mock('../../src/agents/AgentManager.js');
vi.mock('../../src/memory/MemoryManager.js');

describe('SwarmCoordinator', () => {
  let swarmCoordinator: SwarmCoordinator;
  let mockAgentManager: AgentManager;
  let mockMemoryManager: MemoryManager;

  beforeEach(() => {
    mockMemoryManager = new MemoryManager();
    mockAgentManager = new AgentManager(mockMemoryManager);
    swarmCoordinator = new SwarmCoordinator(mockAgentManager);

    // Mock AgentManager methods
    vi.mocked(mockAgentManager.spawnAgent).mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ agentId: 'mock-agent-id' }) }]
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Swarm Initialization', () => {
    it('should initialize a hierarchical swarm successfully', async () => {
      // Given: Hierarchical swarm configuration
      const config = {
        topology: 'hierarchical',
        maxAgents: 5,
        strategy: 'balanced',
        enableMemory: true
      };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should create swarm with hierarchical topology
      expect(result.content[0].text).toContain('hierarchical topology');
      const response = JSON.parse(result.content[0].text);
      expect(response.config.topology).toBe('hierarchical');
      expect(response.config.maxAgents).toBe(5);
      expect(response.swarmId).toBeDefined();
    });

    it('should initialize a mesh swarm successfully', async () => {
      // Given: Mesh swarm configuration
      const config = {
        topology: 'mesh',
        maxAgents: 8,
        strategy: 'parallel',
        enableMemory: true
      };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should create swarm with mesh topology
      expect(result.content[0].text).toContain('mesh topology');
      const response = JSON.parse(result.content[0].text);
      expect(response.config.topology).toBe('mesh');
      expect(response.config.strategy).toBe('parallel');
    });

    it('should initialize a star swarm successfully', async () => {
      // Given: Star swarm configuration
      const config = {
        topology: 'star',
        maxAgents: 6,
        strategy: 'sequential',
        enableMemory: false
      };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should create swarm with star topology
      expect(result.content[0].text).toContain('star topology');
      const response = JSON.parse(result.content[0].text);
      expect(response.config.topology).toBe('star');
      expect(response.config.enableMemory).toBe(false);
    });

    it('should initialize a ring swarm successfully', async () => {
      // Given: Ring swarm configuration
      const config = {
        topology: 'ring',
        maxAgents: 4,
        strategy: 'balanced'
      };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should create swarm with ring topology
      expect(result.content[0].text).toContain('ring topology');
      const response = JSON.parse(result.content[0].text);
      expect(response.config.topology).toBe('ring');
    });

    it('should initialize an adaptive swarm successfully', async () => {
      // Given: Adaptive swarm configuration
      const config = {
        topology: 'adaptive',
        maxAgents: 10,
        strategy: 'balanced'
      };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should create swarm with adaptive topology
      expect(result.content[0].text).toContain('adaptive topology');
      const response = JSON.parse(result.content[0].text);
      expect(response.config.topology).toBe('adaptive');
      expect(response.config.maxAgents).toBe(10);
    });

    it('should use default values for optional parameters', async () => {
      // Given: Minimal swarm configuration
      const config = {
        topology: 'hierarchical'
      };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should use default values
      const response = JSON.parse(result.content[0].text);
      expect(response.config.maxAgents).toBe(8);
      expect(response.config.strategy).toBe('balanced');
      expect(response.config.enableMemory).toBe(true);
    });
  });

  describe('Topology-Specific Agent Spawning', () => {
    it('should spawn correct agents for hierarchical topology', async () => {
      // Given: Hierarchical swarm initialization
      const config = { topology: 'hierarchical', maxAgents: 5 };
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn queen and worker agents
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'coordinator',
          role: 'queen'
        })
      );
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'worker',
          role: 'worker'
        })
      );
    });

    it('should spawn correct agents for mesh topology', async () => {
      // Given: Mesh swarm initialization
      const config = { topology: 'mesh', maxAgents: 6 };
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn peer agents
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'peer',
          role: 'peer'
        })
      );
    });

    it('should spawn correct agents for star topology', async () => {
      // Given: Star swarm initialization
      const config = { topology: 'star', maxAgents: 5 };
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn hub and spoke agents
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hub',
          role: 'hub'
        })
      );
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'spoke',
          role: 'spoke'
        })
      );
    });

    it('should spawn correct agents for ring topology', async () => {
      // Given: Ring swarm initialization
      const config = { topology: 'ring', maxAgents: 4 };
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn node agents with neighbor relationships
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node',
          role: 'ring-node',
          neighbors: expect.any(Array)
        })
      );
    });

    it('should spawn correct agents for adaptive topology', async () => {
      // Given: Adaptive swarm initialization
      const config = { topology: 'adaptive', maxAgents: 5 };
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn adaptive coordinator and workers
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'adaptive-coordinator',
          role: 'coordinator'
        })
      );
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'adaptive-worker',
          role: 'worker'
        })
      );
    });
  });

  describe('Swarm Status Monitoring', () => {
    it('should return status for specific swarm when ID provided', async () => {
      // Given: An initialized swarm
      const initResult = await swarmCoordinator.initializeSwarm({ topology: 'hierarchical' });
      const swarmId = JSON.parse(initResult.content[0].text).swarmId;

      // When: Getting status for specific swarm
      const result = await swarmCoordinator.getSwarmStatus({ 
        swarmId, 
        includeMetrics: true, 
        includeAgents: true 
      });

      // Then: Should return detailed status
      const status = JSON.parse(result.content[0].text);
      expect(status.swarmId).toBe(swarmId);
      expect(status.topology).toBe('hierarchical');
      expect(status.agents).toBeDefined();
      expect(status.metrics).toBeDefined();
    });

    it('should return status without metrics when requested', async () => {
      // Given: An initialized swarm
      const initResult = await swarmCoordinator.initializeSwarm({ topology: 'mesh' });
      const swarmId = JSON.parse(initResult.content[0].text).swarmId;

      // When: Getting status without metrics
      const result = await swarmCoordinator.getSwarmStatus({ 
        swarmId, 
        includeMetrics: false 
      });

      // Then: Should return status without metrics
      const status = JSON.parse(result.content[0].text);
      expect(status.swarmId).toBe(swarmId);
      expect(status.metrics).toBeUndefined();
      expect(status.agents).toBeDefined();
    });

    it('should return status without agents when requested', async () => {
      // Given: An initialized swarm
      const initResult = await swarmCoordinator.initializeSwarm({ topology: 'star' });
      const swarmId = JSON.parse(initResult.content[0].text).swarmId;

      // When: Getting status without agents
      const result = await swarmCoordinator.getSwarmStatus({ 
        swarmId, 
        includeAgents: false,
        includeMetrics: true
      });

      // Then: Should return status without agents
      const status = JSON.parse(result.content[0].text);
      expect(status.swarmId).toBe(swarmId);
      expect(status.agents).toBeUndefined();
      expect(status.metrics).toBeDefined();
    });

    it('should return all swarms when no ID specified', async () => {
      // Given: Multiple initialized swarms
      await swarmCoordinator.initializeSwarm({ topology: 'hierarchical' });
      await swarmCoordinator.initializeSwarm({ topology: 'mesh' });

      // When: Getting status for all swarms
      const result = await swarmCoordinator.getSwarmStatus({});

      // Then: Should return all swarms
      const response = JSON.parse(result.content[0].text);
      expect(response.swarms).toBeDefined();
      expect(response.swarms.length).toBe(2);
      expect(response.swarms[0].topology).toBeDefined();
      expect(response.swarms[1].topology).toBeDefined();
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate JSON performance report', async () => {
      // Given: Multiple swarms with some activity
      await swarmCoordinator.initializeSwarm({ topology: 'hierarchical' });
      await swarmCoordinator.initializeSwarm({ topology: 'mesh' });

      // When: Generating performance report
      const result = await swarmCoordinator.generatePerformanceReport({ format: 'json' });

      // Then: Should return comprehensive JSON report
      const report = JSON.parse(result.content[0].text);
      expect(report.timestamp).toBeDefined();
      expect(report.swarmCount).toBe(2);
      expect(report.totalAgents).toBeDefined();
      expect(report.performance).toMatchObject({
        avgTaskCompletion: expect.any(Number),
        totalTokenUsage: expect.any(Number),
        successRate: expect.any(Number)
      });
    });

    it('should generate Markdown performance report', async () => {
      // Given: A swarm with some activity
      await swarmCoordinator.initializeSwarm({ topology: 'adaptive' });

      // When: Generating Markdown report
      const result = await swarmCoordinator.generatePerformanceReport({ format: 'markdown' });

      // Then: Should return formatted Markdown report
      const markdown = result.content[0].text;
      expect(markdown).toContain('# Swarm Performance Report');
      expect(markdown).toContain('## Overview');
      expect(markdown).toContain('## Performance Metrics');
      expect(markdown).toContain('## Recommendations');
    });

    it('should include recommendations based on performance', async () => {
      // Given: A swarm initialized
      await swarmCoordinator.initializeSwarm({ topology: 'hierarchical' });

      // When: Generating report with default good performance
      const result = await swarmCoordinator.generatePerformanceReport({ format: 'markdown' });

      // Then: Should include positive recommendations
      const markdown = result.content[0].text;
      expect(markdown).toContain('System performing within optimal parameters');
    });

    it('should handle empty swarm collection gracefully', async () => {
      // Given: No swarms initialized
      // When: Generating performance report
      const result = await swarmCoordinator.generatePerformanceReport({});

      // Then: Should return report with zero values
      const report = JSON.parse(result.content[0].text);
      expect(report.swarmCount).toBe(0);
      expect(report.totalAgents).toBe(0);
      expect(report.performance.successRate).toBe(0);
    });
  });

  describe('Agent Limit Enforcement', () => {
    it('should respect maxAgents limit for hierarchical topology', async () => {
      // Given: Hierarchical swarm with low agent limit
      const config = { topology: 'hierarchical', maxAgents: 3 };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn appropriate number of agents (1 queen + 2 workers)
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledTimes(3);
    });

    it('should respect maxAgents limit for mesh topology', async () => {
      // Given: Mesh swarm with limit
      const config = { topology: 'mesh', maxAgents: 3 };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn up to limit (min of 5 default or limit)
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledTimes(3);
    });

    it('should respect maxAgents limit for star topology', async () => {
      // Given: Star swarm with limit
      const config = { topology: 'star', maxAgents: 3 };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn hub + 2 spokes
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledTimes(3);
    });

    it('should respect maxAgents limit for ring topology', async () => {
      // Given: Ring swarm with limit
      const config = { topology: 'ring', maxAgents: 4 };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn 4 ring nodes
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledTimes(4);
    });

    it('should respect maxAgents limit for adaptive topology', async () => {
      // Given: Adaptive swarm with minimal limit
      const config = { topology: 'adaptive', maxAgents: 2 };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should spawn coordinator + 1 worker (respects minimum viable structure)
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Ring Topology Neighbor Configuration', () => {
    it('should configure correct neighbor relationships in ring topology', async () => {
      // Given: Ring topology with 4 agents
      const config = { topology: 'ring', maxAgents: 4 };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should configure circular neighbor relationships
      const spawnCalls = vi.mocked(mockAgentManager.spawnAgent).mock.calls;
      
      // Check first node (should connect to last and second)
      const firstNodeCall = spawnCalls.find(call => call[0].name?.includes('-0'));
      expect(firstNodeCall?.[0].neighbors.some((neighbor: string) => neighbor.startsWith('node-'))).toBe(true);
      
      // Check that neighbors array is properly configured
      spawnCalls.forEach(call => {
        if (call[0].role === 'ring-node') {
          expect(call[0].neighbors).toHaveLength(2);
        }
      });
    });
  });

  describe('Strategy Configuration', () => {
    it('should store strategy configuration correctly', async () => {
      // Given: Various strategy configurations
      const strategies = ['parallel', 'sequential', 'balanced'];

      for (const strategy of strategies) {
        // When: Initializing swarm with specific strategy
        const result = await swarmCoordinator.initializeSwarm({ 
          topology: 'hierarchical', 
          strategy: strategy as any 
        });

        // Then: Should store strategy in configuration
        const response = JSON.parse(result.content[0].text);
        expect(response.config.strategy).toBe(strategy);
      }
    });
  });

  describe('Memory Configuration', () => {
    it('should handle memory enabled configuration', async () => {
      // Given: Memory enabled configuration
      const config = { topology: 'mesh', enableMemory: true };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should store memory configuration
      const response = JSON.parse(result.content[0].text);
      expect(response.config.enableMemory).toBe(true);
    });

    it('should handle memory disabled configuration', async () => {
      // Given: Memory disabled configuration
      const config = { topology: 'star', enableMemory: false };

      // When: Initializing the swarm
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should store memory configuration
      const response = JSON.parse(result.content[0].text);
      expect(response.config.enableMemory).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle agent spawning failures gracefully', async () => {
      // Given: Agent manager that fails to spawn agents
      vi.mocked(mockAgentManager.spawnAgent).mockRejectedValue(new Error('Spawn failed'));

      // When: Attempting to initialize swarm
      // Then: Should propagate error appropriately
      await expect(swarmCoordinator.initializeSwarm({ topology: 'hierarchical' }))
        .rejects
        .toThrow('Spawn failed');
    });

    it('should handle invalid topology gracefully', async () => {
      // Given: Invalid topology (this would be caught by TypeScript, but testing runtime)
      const config = { topology: 'invalid' as any };

      // When: Initializing with invalid topology
      const result = await swarmCoordinator.initializeSwarm(config);

      // Then: Should still create swarm (implementation handles unknown topologies)
      expect(result.content[0].text).toContain('swarmId');
    });

    it('should handle status request for non-existent swarm', async () => {
      // Given: Request for non-existent swarm
      const nonExistentId = 'non-existent-swarm-id';

      // When: Getting status for non-existent swarm
      const result = await swarmCoordinator.getSwarmStatus({ swarmId: nonExistentId });

      // Then: Should return empty swarms list
      const response = JSON.parse(result.content[0].text);
      expect(response.swarms).toBeDefined();
      expect(response.swarms.length).toBe(0);
    });
  });

  describe('Metrics Tracking', () => {
    it('should initialize metrics correctly for new swarms', async () => {
      // Given: New swarm initialization
      const config = { topology: 'hierarchical' };

      // When: Initializing the swarm
      await swarmCoordinator.initializeSwarm(config);

      // Then: Should have initialized metrics
      const result = await swarmCoordinator.getSwarmStatus({});
      const response = JSON.parse(result.content[0].text);
      const swarm = response.swarms[0];
      
      expect(swarm.metrics).toBeUndefined(); // Only included when includeMetrics is true
    });

    it('should track swarm count correctly', async () => {
      // Given: Multiple swarms
      await swarmCoordinator.initializeSwarm({ topology: 'hierarchical' });
      await swarmCoordinator.initializeSwarm({ topology: 'mesh' });
      await swarmCoordinator.initializeSwarm({ topology: 'star' });

      // When: Generating performance report
      const result = await swarmCoordinator.generatePerformanceReport({});

      // Then: Should report correct swarm count
      const report = JSON.parse(result.content[0].text);
      expect(report.swarmCount).toBe(3);
    });
  });
});
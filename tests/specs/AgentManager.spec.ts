import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentManager, AgentConfig, AgentStatus, AgentMetrics } from '../../src/agents/AgentManager.js';
import { MemoryManager, AgentMemory } from '../../src/memory/MemoryManager.js';

// Mock dependencies
vi.mock('../../src/memory/MemoryManager.js');

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let mockMemoryManager: MemoryManager;

  beforeEach(() => {
    mockMemoryManager = {
      storeAgentMemory: vi.fn().mockResolvedValue(undefined),
      updateAgentMemory: vi.fn().mockResolvedValue(undefined),
      getAllAgentMemories: vi.fn().mockResolvedValue([]),
      getAgentMemory: vi.fn().mockResolvedValue(null)
    } as any;

    agentManager = new AgentManager(mockMemoryManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Spawning', () => {
    it('should spawn a coder agent with default configuration', async () => {
      // Given: Basic coder agent configuration
      const config = {
        type: 'coder',
        name: 'test-coder'
      };

      // When: Spawning the agent
      const result = await agentManager.spawnAgent(config);

      // Then: Should create agent with coder skills and store in memory
      const response = JSON.parse(result.content[0].text);
      expect(response.agentId).toBeDefined();
      expect(response.message).toContain('test-coder');
      expect(response.message).toContain('coder');
      expect(response.status.type).toBe('coder');
      expect(response.status.name).toBe('test-coder');
      expect(response.status.skills).toContain('programming');
      expect(response.status.skills).toContain('debugging');
      expect(mockMemoryManager.storeAgentMemory).toHaveBeenCalled();
    });

    it('should spawn a researcher agent with custom skills', async () => {
      // Given: Researcher agent with custom skills
      const config = {
        type: 'researcher',
        name: 'data-researcher',
        skills: ['data-analysis', 'web-scraping', 'report-writing']
      };

      // When: Spawning the agent
      const result = await agentManager.spawnAgent(config);

      // Then: Should create agent with custom skills
      const response = JSON.parse(result.content[0].text);
      expect(response.status.type).toBe('researcher');
      expect(response.status.skills).toEqual(['data-analysis', 'web-scraping', 'report-writing']);
    });

    it('should spawn an agent with skills as comma-separated string', async () => {
      // Given: Agent configuration with skills as string
      const config = {
        type: 'reviewer',
        name: 'code-reviewer',
        skills: 'security-review,performance-analysis,best-practices'
      };

      // When: Spawning the agent
      const result = await agentManager.spawnAgent(config);

      // Then: Should parse skills string into array
      const response = JSON.parse(result.content[0].text);
      expect(response.status.skills).toEqual(['security-review', 'performance-analysis', 'best-practices']);
    });

    it('should spawn an agent with swarm association', async () => {
      // Given: Agent configuration with swarm ID
      const config = {
        type: 'worker',
        name: 'swarm-worker',
        swarmId: 'test-swarm-123',
        role: 'data-processor'
      };

      // When: Spawning the agent
      const result = await agentManager.spawnAgent(config);

      // Then: Should associate agent with swarm
      const response = JSON.parse(result.content[0].text);
      expect(response.status.swarmId).toBe('test-swarm-123');
      expect(response.status.role).toBe('data-processor');
    });

    it('should spawn an agent with context and neighbors', async () => {
      // Given: Agent configuration with context and neighbors
      const config = {
        type: 'node',
        name: 'ring-node-1',
        context: { position: 'north', zone: 'A' },
        neighbors: ['ring-node-0', 'ring-node-2']
      };

      // When: Spawning the agent
      const result = await agentManager.spawnAgent(config);

      // Then: Should store context and neighbors in metadata
      const response = JSON.parse(result.content[0].text);
      expect(response.status.metadata.context).toEqual({ position: 'north', zone: 'A' });
      expect(response.status.metadata.neighbors).toEqual(['ring-node-0', 'ring-node-2']);
    });

    it('should use default skills for unknown agent types', async () => {
      // Given: Unknown agent type
      const config = {
        type: 'unknown-type' as any,
        name: 'mystery-agent'
      };

      // When: Spawning the agent
      const result = await agentManager.spawnAgent(config);

      // Then: Should use general processing skills
      const response = JSON.parse(result.content[0].text);
      expect(response.status.skills).toEqual(['general-processing']);
    });

    it('should generate unique agent IDs', async () => {
      // Given: Multiple agent spawn requests
      const config1 = { type: 'coder', name: 'agent-1' };
      const config2 = { type: 'coder', name: 'agent-2' };

      // When: Spawning multiple agents
      const result1 = await agentManager.spawnAgent(config1);
      const result2 = await agentManager.spawnAgent(config2);

      // Then: Should generate unique IDs
      const response1 = JSON.parse(result1.content[0].text);
      const response2 = JSON.parse(result2.content[0].text);
      expect(response1.agentId).not.toBe(response2.agentId);
    });
  });

  describe('Agent Termination', () => {
    it('should terminate an existing agent successfully', async () => {
      // Given: An active agent
      const spawnResult = await agentManager.spawnAgent({ type: 'coder', name: 'test-agent' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Terminating the agent
      const result = await agentManager.terminateAgent({ agentId });

      // Then: Should terminate and update memory
      const response = JSON.parse(result.content[0].text);
      expect(response.agentId).toBe(agentId);
      expect(response.message).toContain('terminated successfully');
      expect(response.finalStatus.status).toBe('terminated');
      expect(mockMemoryManager.updateAgentMemory).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({
          status: 'terminated'
        })
      );
    });

    it('should handle termination of non-existent agent', async () => {
      // Given: Non-existent agent ID
      const nonExistentId = 'non-existent-agent-id';

      // When: Attempting to terminate non-existent agent
      const result = await agentManager.terminateAgent({ agentId: nonExistentId });

      // Then: Should return error message
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('not found');
      expect(response.error).toContain(nonExistentId);
    });
  });

  describe('Agent Status Management', () => {
    it('should get status of existing agent', async () => {
      // Given: An active agent
      const spawnResult = await agentManager.spawnAgent({ type: 'researcher', name: 'status-test' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Getting agent status
      const result = await agentManager.getAgentStatus({ agentId });

      // Then: Should return detailed status
      const response = JSON.parse(result.content[0].text);
      expect(response.agentId).toBe(agentId);
      expect(response.status.name).toBe('status-test');
      expect(response.status.type).toBe('researcher');
      expect(response.status.status).toBe('idle');
    });

    it('should handle status request for non-existent agent', async () => {
      // Given: Non-existent agent ID
      const nonExistentId = 'non-existent-agent-id';

      // When: Getting status of non-existent agent
      const result = await agentManager.getAgentStatus({ agentId: nonExistentId });

      // Then: Should return error
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('not found');
    });

    it('should set agent status successfully', async () => {
      // Given: An active agent
      const spawnResult = await agentManager.spawnAgent({ type: 'worker', name: 'status-change' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Setting agent status to busy
      const result = await agentManager.setAgentStatus({ agentId, status: 'busy' });

      // Then: Should update status and memory
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toContain("'idle' to 'busy'");
      expect(response.agent.status).toBe('busy');
      expect(mockMemoryManager.updateAgentMemory).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({
          status: 'busy'
        })
      );
    });
  });

  describe('Agent Listing and Filtering', () => {
    beforeEach(async () => {
      // Setup multiple agents for testing
      await agentManager.spawnAgent({ type: 'coder', name: 'coder-1', swarmId: 'swarm-1' });
      await agentManager.spawnAgent({ type: 'researcher', name: 'researcher-1', swarmId: 'swarm-1' });
      await agentManager.spawnAgent({ type: 'coder', name: 'coder-2', swarmId: 'swarm-2' });
      await agentManager.spawnAgent({ type: 'reviewer', name: 'reviewer-1' });
    });

    it('should list all agents without filters', async () => {
      // When: Listing all agents
      const result = await agentManager.listAgents();

      // Then: Should return all active agents
      const response = JSON.parse(result.content[0].text);
      expect(response.totalCount).toBe(4);
      expect(response.activeCount).toBe(4);
      expect(response.agents).toHaveLength(4);
    });

    it('should filter agents by swarm ID', async () => {
      // When: Filtering by swarm ID
      const result = await agentManager.listAgents({ swarmId: 'swarm-1' });

      // Then: Should return only agents from that swarm
      const response = JSON.parse(result.content[0].text);
      expect(response.totalCount).toBe(2);
      expect(response.agents.every((agent: any) => agent.swarmId === 'swarm-1')).toBe(true);
    });

    it('should filter agents by type', async () => {
      // When: Filtering by agent type
      const result = await agentManager.listAgents({ type: 'coder' });

      // Then: Should return only coder agents
      const response = JSON.parse(result.content[0].text);
      expect(response.totalCount).toBe(2);
      expect(response.agents.every((agent: any) => agent.type === 'coder')).toBe(true);
    });

    it('should filter agents by status', async () => {
      // Given: Change one agent to busy status
      const allAgents = await agentManager.listAgents();
      const firstAgent = JSON.parse(allAgents.content[0].text).agents[0];
      await agentManager.setAgentStatus({ agentId: firstAgent.id, status: 'busy' });

      // When: Filtering by status
      const result = await agentManager.listAgents({ status: 'busy' });

      // Then: Should return only busy agents
      const response = JSON.parse(result.content[0].text);
      expect(response.totalCount).toBe(1);
      expect(response.agents[0].status).toBe('busy');
    });

    it('should combine multiple filters', async () => {
      // When: Filtering by swarm and type
      const result = await agentManager.listAgents({ swarmId: 'swarm-1', type: 'coder' });

      // Then: Should return agents matching both criteria
      const response = JSON.parse(result.content[0].text);
      expect(response.totalCount).toBe(1);
      expect(response.agents[0].type).toBe('coder');
      expect(response.agents[0].swarmId).toBe('swarm-1');
    });

    it('should include terminated agents when requested', async () => {
      // Given: Terminate one agent
      const allAgents = await agentManager.listAgents();
      const firstAgent = JSON.parse(allAgents.content[0].text).agents[0];
      await agentManager.terminateAgent({ agentId: firstAgent.id });

      // Mock memory manager to return terminated agent
      vi.mocked(mockMemoryManager.getAllAgentMemories).mockResolvedValue([
        {
          agentId: firstAgent.id,
          type: 'coder',
          name: 'terminated-agent',
          status: 'terminated',
          metrics: { tasksCompleted: 5, avgResponseTime: 100, errorCount: 1, tokenUsage: 500 },
          skills: ['programming'],
          context: {},
          createdAt: new Date(),
          lastActivity: new Date()
        }
      ]);

      // When: Including terminated agents
      const result = await agentManager.listAgents({ includeTerminated: true });

      // Then: Should include terminated agents
      const response = JSON.parse(result.content[0].text);
      expect(response.totalCount).toBe(4); // 3 active + 1 terminated
      expect(response.activeCount).toBe(3);
    });
  });

  describe('Performance Metrics Management', () => {
    it('should update agent metrics successfully', async () => {
      // Given: An active agent
      const spawnResult = await agentManager.spawnAgent({ type: 'coder', name: 'metrics-test' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Updating metrics
      const metrics: AgentMetrics = {
        responseTime: 150,
        tasksCompleted: 3,
        errorCount: 1,
        tokenUsage: 250
      };
      const result = await agentManager.updateAgentMetrics({ agentId, metrics });

      // Then: Should update all metrics and recalculate averages
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toContain('updated successfully');
      expect(response.updatedMetrics.tasksCompleted).toBe(3);
      expect(response.updatedMetrics.errorCount).toBe(1);
      expect(response.updatedMetrics.tokenUsage).toBe(250);
      expect(response.updatedMetrics.avgResponseTime).toBe(150);
      expect(response.updatedMetrics.successRate).toBe(0.75); // 3/(3+1)
    });

    it('should calculate average response time correctly', async () => {
      // Given: An agent with existing metrics
      const spawnResult = await agentManager.spawnAgent({ type: 'worker', name: 'avg-test' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Adding multiple response times
      await agentManager.updateAgentMetrics({ agentId, metrics: { responseTime: 100, tasksCompleted: 1 } });
      await agentManager.updateAgentMetrics({ agentId, metrics: { responseTime: 200, tasksCompleted: 1 } });

      // Then: Should calculate correct average
      const status = await agentManager.getAgentStatus({ agentId });
      const agent = JSON.parse(status.content[0].text).status;
      expect(agent.performance.avgResponseTime).toBe(150); // (100 + 200) / 2
      expect(agent.performance.tasksCompleted).toBe(2);
    });

    it('should handle metrics update for non-existent agent', async () => {
      // Given: Non-existent agent ID
      const nonExistentId = 'non-existent-agent-id';

      // When: Updating metrics for non-existent agent
      const result = await agentManager.updateAgentMetrics({ 
        agentId: nonExistentId, 
        metrics: { tasksCompleted: 1 } 
      });

      // Then: Should return error
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('not found');
    });
  });

  describe('Performance Summary Generation', () => {
    beforeEach(async () => {
      // Setup agents with different performance metrics
      const coder1 = await agentManager.spawnAgent({ type: 'coder', name: 'coder-1', swarmId: 'swarm-1' });
      const coder1Id = JSON.parse(coder1.content[0].text).agentId;
      await agentManager.updateAgentMetrics({ 
        agentId: coder1Id, 
        metrics: { tasksCompleted: 5, responseTime: 100, tokenUsage: 500 }
      });
      await agentManager.setAgentStatus({ agentId: coder1Id, status: 'busy' });

      const researcher1 = await agentManager.spawnAgent({ type: 'researcher', name: 'researcher-1', swarmId: 'swarm-1' });
      const researcher1Id = JSON.parse(researcher1.content[0].text).agentId;
      await agentManager.updateAgentMetrics({ 
        agentId: researcher1Id, 
        metrics: { tasksCompleted: 3, responseTime: 200, errorCount: 1, tokenUsage: 300 }
      });

      const reviewer1 = await agentManager.spawnAgent({ type: 'reviewer', name: 'reviewer-1', swarmId: 'swarm-2' });
      const reviewer1Id = JSON.parse(reviewer1.content[0].text).agentId;
      await agentManager.updateAgentMetrics({ 
        agentId: reviewer1Id, 
        metrics: { tasksCompleted: 2, responseTime: 150, tokenUsage: 200 }
      });
    });

    it('should generate performance summary for all agents', async () => {
      // When: Getting performance summary
      const result = await agentManager.getPerformanceSummary();

      // Then: Should return comprehensive summary
      const response = JSON.parse(result.content[0].text);
      expect(response.summary.totalAgents).toBe(3);
      expect(response.summary.activeAgents).toBe(3);
      expect(response.summary.busyAgents).toBe(1);
      expect(response.summary.performance.totalTasksCompleted).toBe(10);
      expect(response.summary.performance.totalErrors).toBe(1);
      expect(response.summary.performance.totalTokenUsage).toBe(1000);
      expect(response.summary.agentsByType).toEqual({
        coder: 1,
        researcher: 1,
        reviewer: 1
      });
    });

    it('should filter performance summary by swarm', async () => {
      // When: Getting performance summary for specific swarm
      const result = await agentManager.getPerformanceSummary({ swarmId: 'swarm-1' });

      // Then: Should return summary for that swarm only
      const response = JSON.parse(result.content[0].text);
      expect(response.summary.totalAgents).toBe(2);
      expect(response.summary.performance.totalTasksCompleted).toBe(8); // 5 + 3
      expect(response.summary.agentsByType).toEqual({
        coder: 1,
        researcher: 1
      });
    });

    it('should filter performance summary by type', async () => {
      // When: Getting performance summary for specific type
      const result = await agentManager.getPerformanceSummary({ type: 'coder' });

      // Then: Should return summary for that type only
      const response = JSON.parse(result.content[0].text);
      expect(response.summary.totalAgents).toBe(1);
      expect(response.summary.performance.totalTasksCompleted).toBe(5);
      expect(response.summary.agentsByType).toEqual({
        coder: 1
      });
    });
  });

  describe('Default Skills Assignment', () => {
    const agentTypeSkillTests = [
      { type: 'coder', expectedSkills: ['programming', 'debugging', 'code-review', 'refactoring'] },
      { type: 'researcher', expectedSkills: ['information-gathering', 'analysis', 'documentation', 'fact-checking'] },
      { type: 'reviewer', expectedSkills: ['code-review', 'quality-assurance', 'testing', 'feedback'] },
      { type: 'architect', expectedSkills: ['system-design', 'architecture', 'planning', 'scalability'] },
      { type: 'worker', expectedSkills: ['task-execution', 'processing', 'basic-operations'] },
      { type: 'peer', expectedSkills: ['collaboration', 'communication', 'distributed-processing'] },
      { type: 'hub', expectedSkills: ['coordination', 'message-routing', 'load-balancing'] },
      { type: 'spoke', expectedSkills: ['specialized-processing', 'reporting', 'data-collection'] },
      { type: 'node', expectedSkills: ['networking', 'communication', 'processing'] },
      { type: 'coordinator', expectedSkills: ['orchestration', 'planning', 'resource-management'] },
      { type: 'adaptive-coordinator', expectedSkills: ['orchestration', 'planning', 'adaptive-scaling'] },
      { type: 'adaptive-worker', expectedSkills: ['task-execution', 'adaptive-processing', 'learning'] }
    ];

    agentTypeSkillTests.forEach(({ type, expectedSkills }) => {
      it(`should assign correct default skills for ${type} agent`, async () => {
        // Given: Agent configuration without custom skills
        const config = { type: type as any, name: `test-${type}` };

        // When: Spawning the agent
        const result = await agentManager.spawnAgent(config);

        // Then: Should assign type-specific skills
        const response = JSON.parse(result.content[0].text);
        expect(response.status.skills).toEqual(expectedSkills);
      });
    });
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      await agentManager.spawnAgent({ type: 'coder', name: 'helper-test-1', swarmId: 'test-swarm' });
      await agentManager.spawnAgent({ type: 'researcher', name: 'helper-test-2', swarmId: 'test-swarm' });
      await agentManager.spawnAgent({ type: 'reviewer', name: 'unique-name', swarmId: 'other-swarm' });
    });

    it('should find agent by name', async () => {
      // When: Finding agent by name
      const agent = await agentManager.getAgentByName('unique-name');

      // Then: Should return the correct agent
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('unique-name');
      expect(agent?.type).toBe('reviewer');
    });

    it('should return undefined for non-existent agent name', async () => {
      // When: Finding non-existent agent
      const agent = await agentManager.getAgentByName('non-existent-name');

      // Then: Should return undefined
      expect(agent).toBeUndefined();
    });

    it('should get agents by swarm ID', async () => {
      // When: Getting agents by swarm
      const agents = await agentManager.getAgentsBySwarm('test-swarm');

      // Then: Should return all agents from that swarm
      expect(agents).toHaveLength(2);
      expect(agents.every(agent => agent.swarmId === 'test-swarm')).toBe(true);
    });

    it('should return empty array for non-existent swarm', async () => {
      // When: Getting agents from non-existent swarm
      const agents = await agentManager.getAgentsBySwarm('non-existent-swarm');

      // Then: Should return empty array
      expect(agents).toHaveLength(0);
    });
  });

  describe('Memory Integration', () => {
    it('should store agent in memory on spawn', async () => {
      // When: Spawning an agent
      await agentManager.spawnAgent({ type: 'coder', name: 'memory-test' });

      // Then: Should call memory manager to store
      expect(mockMemoryManager.storeAgentMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'coder',
          name: 'memory-test',
          status: 'idle'
        })
      );
    });

    it('should update memory on status change', async () => {
      // Given: An active agent
      const spawnResult = await agentManager.spawnAgent({ type: 'worker', name: 'memory-update' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Changing agent status
      await agentManager.setAgentStatus({ agentId, status: 'busy' });

      // Then: Should update memory
      expect(mockMemoryManager.updateAgentMemory).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({
          status: 'busy'
        })
      );
    });

    it('should update memory on metrics change', async () => {
      // Given: An active agent
      const spawnResult = await agentManager.spawnAgent({ type: 'coder', name: 'metrics-memory' });
      const agentId = JSON.parse(spawnResult.content[0].text).agentId;

      // When: Updating metrics
      await agentManager.updateAgentMetrics({ 
        agentId, 
        metrics: { tasksCompleted: 1, responseTime: 100 } 
      });

      // Then: Should update memory with metrics
      expect(mockMemoryManager.updateAgentMemory).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({
          metrics: expect.objectContaining({
            tasksCompleted: 1,
            avgResponseTime: 100
          })
        })
      );
    });
  });
});
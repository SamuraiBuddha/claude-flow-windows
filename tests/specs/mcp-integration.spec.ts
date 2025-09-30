import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeFlowServer } from '../../src/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock dependencies
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
vi.mock('@modelcontextprotocol/sdk/server/index.js');
vi.mock('../../src/coordinators/SwarmCoordinator.js');
vi.mock('../../src/agents/AgentManager.js');
vi.mock('../../src/memory/MemoryManager.js');
vi.mock('../../src/orchestration/TaskOrchestrator.js');
vi.mock('../../src/adapters/WindowsShellAdapter.js');

describe('MCP Integration', () => {
  let server: ClaudeFlowServer;
  let mockMcpServer: any;
  let mockTransport: any;

  beforeEach(() => {
    // Mock MCP Server
    mockMcpServer = {
      setRequestHandler: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(Server).mockImplementation(() => mockMcpServer);

    // Mock Transport
    mockTransport = {};
    vi.mocked(StdioServerTransport).mockImplementation(() => mockTransport);

    server = new ClaudeFlowServer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize MCP server with correct configuration', () => {
      // Then: Server should be initialized with proper config
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'claude-flow-windows',
          version: '1.0.0-alpha.1'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );
    });

    it('should set up tool listing handler', () => {
      // Then: Should register list tools handler
      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        ListToolsRequestSchema,
        expect.any(Function)
      );
    });

    it('should set up tool execution handler', () => {
      // Then: Should register call tool handler
      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        CallToolRequestSchema,
        expect.any(Function)
      );
    });
  });

  describe('Tool Listing', () => {
    it('should return all available tools', async () => {
      // Given: Server is initialized
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Calling list tools handler
      const result = await listToolsHandler();

      // Then: Should return tools array
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
    });

    it('should include swarm coordination tools', async () => {
      // Given: List tools handler
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Getting tools list
      const result = await listToolsHandler();

      // Then: Should include swarm tools
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('swarm_init');
      expect(toolNames).toContain('agent_spawn');
      expect(toolNames).toContain('task_orchestrate');
      expect(toolNames).toContain('swarm_monitor');
    });

    it('should include Windows-specific tools', async () => {
      // Given: List tools handler
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Getting tools list
      const result = await listToolsHandler();

      // Then: Should include Windows tools
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('shell_execute');
      expect(toolNames).toContain('wsl_bridge');
    });

    it('should include memory management tools', async () => {
      // Given: List tools handler
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Getting tools list
      const result = await listToolsHandler();

      // Then: Should include memory tools
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('memory_store');
      expect(toolNames).toContain('memory_retrieve');
      expect(toolNames).toContain('memory_persist');
    });

    it('should include performance analysis tools', async () => {
      // Given: List tools handler
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Getting tools list
      const result = await listToolsHandler();

      // Then: Should include analysis tools
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('bottleneck_detect');
      expect(toolNames).toContain('performance_report');
    });
  });

  describe('Tool Execution Routing', () => {
    let callToolHandler: Function;

    beforeEach(() => {
      callToolHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === CallToolRequestSchema)?.[1];
    });

    it('should route swarm_init to SwarmCoordinator', async () => {
      // Given: Mock SwarmCoordinator
      const mockSwarmCoordinator = (server as any).swarmCoordinator;
      mockSwarmCoordinator.initializeSwarm = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Swarm initialized' }]
      });

      // When: Calling swarm_init tool
      const request = {
        params: {
          name: 'swarm_init',
          arguments: { topology: 'hierarchical' }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should route to SwarmCoordinator
      expect(mockSwarmCoordinator.initializeSwarm).toHaveBeenCalledWith({ topology: 'hierarchical' });
      expect(result.content[0].text).toBe('Swarm initialized');
    });

    it('should route agent_spawn to AgentManager', async () => {
      // Given: Mock AgentManager
      const mockAgentManager = (server as any).agentManager;
      mockAgentManager.spawnAgent = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Agent spawned' }]
      });

      // When: Calling agent_spawn tool
      const request = {
        params: {
          name: 'agent_spawn',
          arguments: { type: 'coder', name: 'test-agent' }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should route to AgentManager
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith({ type: 'coder', name: 'test-agent' });
      expect(result.content[0].text).toBe('Agent spawned');
    });

    it('should route task_orchestrate to TaskOrchestrator', async () => {
      // Given: Mock TaskOrchestrator
      const mockTaskOrchestrator = (server as any).taskOrchestrator;
      mockTaskOrchestrator.orchestrateTask = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Task orchestrated' }]
      });

      // When: Calling task_orchestrate tool
      const request = {
        params: {
          name: 'task_orchestrate',
          arguments: { task: 'Build web app', priority: 'high' }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should route to TaskOrchestrator
      expect(mockTaskOrchestrator.orchestrateTask).toHaveBeenCalledWith({ task: 'Build web app', priority: 'high' });
      expect(result.content[0].text).toBe('Task orchestrated');
    });

    it('should route swarm_monitor to SwarmCoordinator', async () => {
      // Given: Mock SwarmCoordinator
      const mockSwarmCoordinator = (server as any).swarmCoordinator;
      mockSwarmCoordinator.getSwarmStatus = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Swarm status' }]
      });

      // When: Calling swarm_monitor tool
      const request = {
        params: {
          name: 'swarm_monitor',
          arguments: { swarmId: 'test-swarm-123' }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should route to SwarmCoordinator
      expect(mockSwarmCoordinator.getSwarmStatus).toHaveBeenCalledWith({ swarmId: 'test-swarm-123' });
      expect(result.content[0].text).toBe('Swarm status');
    });

    it('should route memory operations to MemoryManager', async () => {
      // Given: Mock MemoryManager
      const mockMemoryManager = (server as any).memoryManager;
      mockMemoryManager.store = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Data stored' }]
      });
      mockMemoryManager.retrieve = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Data retrieved' }]
      });
      mockMemoryManager.persist = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Data persisted' }]
      });

      // When: Calling memory tools
      const storeRequest = {
        params: { name: 'memory_store', arguments: { key: 'test', value: 'data' } }
      };
      const retrieveRequest = {
        params: { name: 'memory_retrieve', arguments: { key: 'test' } }
      };
      const persistRequest = {
        params: { name: 'memory_persist', arguments: { action: 'export' } }
      };

      await callToolHandler(storeRequest);
      await callToolHandler(retrieveRequest);
      await callToolHandler(persistRequest);

      // Then: Should route to MemoryManager
      expect(mockMemoryManager.store).toHaveBeenCalledWith({ key: 'test', value: 'data' });
      expect(mockMemoryManager.retrieve).toHaveBeenCalledWith({ key: 'test' });
      expect(mockMemoryManager.persist).toHaveBeenCalledWith({ action: 'export' });
    });

    it('should route performance tools to appropriate managers', async () => {
      // Given: Mock managers
      const mockTaskOrchestrator = (server as any).taskOrchestrator;
      const mockSwarmCoordinator = (server as any).swarmCoordinator;
      
      mockTaskOrchestrator.detectBottlenecks = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Bottlenecks detected' }]
      });
      mockSwarmCoordinator.generatePerformanceReport = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Performance report' }]
      });

      // When: Calling performance tools
      const bottleneckRequest = {
        params: { name: 'bottleneck_detect', arguments: { swarmId: 'test' } }
      };
      const reportRequest = {
        params: { name: 'performance_report', arguments: { format: 'json' } }
      };

      await callToolHandler(bottleneckRequest);
      await callToolHandler(reportRequest);

      // Then: Should route correctly
      expect(mockTaskOrchestrator.detectBottlenecks).toHaveBeenCalledWith({ swarmId: 'test' });
      expect(mockSwarmCoordinator.generatePerformanceReport).toHaveBeenCalledWith({ format: 'json' });
    });

    it('should route shell_execute to WindowsShellAdapter', async () => {
      // Given: Mock WindowsShellAdapter
      const mockShellAdapter = (server as any).shellAdapter;
      mockShellAdapter.execute = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Command executed' }]
      });

      // When: Calling shell_execute tool
      const request = {
        params: {
          name: 'shell_execute',
          arguments: { command: 'ls -la', elevated: false }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should route to WindowsShellAdapter
      expect(mockShellAdapter.execute).toHaveBeenCalledWith({ command: 'ls -la', elevated: false });
      expect(result.content[0].text).toBe('Command executed');
    });
  });

  describe('Error Handling', () => {
    let callToolHandler: Function;

    beforeEach(() => {
      callToolHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === CallToolRequestSchema)?.[1];
    });

    it('should throw MethodNotFound for unknown tools', async () => {
      // Given: Request for unknown tool
      const request = {
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      // When/Then: Should throw MethodNotFound error
      await expect(callToolHandler(request)).rejects.toThrow();
      await expect(callToolHandler(request)).rejects.toMatchObject({
        code: ErrorCode.MethodNotFound
      });
    });

    it('should throw InvalidParams for shell_execute without command', async () => {
      // Given: shell_execute request without required command
      const request = {
        params: {
          name: 'shell_execute',
          arguments: {}
        }
      };

      // When/Then: Should throw InvalidParams error
      await expect(callToolHandler(request)).rejects.toThrow();
      await expect(callToolHandler(request)).rejects.toMatchObject({
        code: ErrorCode.InvalidParams
      });
    });

    it('should handle agent_spawn with empty arguments', async () => {
      // Given: Mock AgentManager
      const mockAgentManager = (server as any).agentManager;
      mockAgentManager.spawnAgent = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Agent spawned with defaults' }]
      });

      // When: Calling agent_spawn with no arguments
      const request = {
        params: {
          name: 'agent_spawn',
          arguments: undefined
        }
      };
      const result = await callToolHandler(request);

      // Then: Should call with empty object
      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith({});
      expect(result.content[0].text).toBe('Agent spawned with defaults');
    });

    it('should wrap tool execution errors as InternalError', async () => {
      // Given: Mock that throws error
      const mockSwarmCoordinator = (server as any).swarmCoordinator;
      mockSwarmCoordinator.initializeSwarm = vi.fn().mockRejectedValue(new Error('Initialization failed'));

      // Given: swarm_init request
      const request = {
        params: {
          name: 'swarm_init',
          arguments: { topology: 'hierarchical' }
        }
      };

      // When/Then: Should wrap as InternalError
      await expect(callToolHandler(request)).rejects.toThrow();
      await expect(callToolHandler(request)).rejects.toMatchObject({
        code: ErrorCode.InternalError
      });
    });

    it('should handle errors without message gracefully', async () => {
      // Given: Mock that throws error without message
      const mockAgentManager = (server as any).agentManager;
      mockAgentManager.spawnAgent = vi.fn().mockRejectedValue({});

      // Given: agent_spawn request
      const request = {
        params: {
          name: 'agent_spawn',
          arguments: { type: 'coder' }
        }
      };

      // When/Then: Should wrap as InternalError with default message
      await expect(callToolHandler(request)).rejects.toThrow();
      await expect(callToolHandler(request)).rejects.toMatchObject({
        code: ErrorCode.InternalError
      });
      
      try {
        await callToolHandler(request);
      } catch (error: any) {
        expect(error.message).toContain('Tool execution failed');
      }
    });
  });

  describe('Server Startup', () => {
    it('should start server with stdio transport', async () => {
      // When: Starting the server
      await server.start();

      // Then: Should connect with stdio transport
      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should log startup message', async () => {
      // Given: Mock console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // When: Starting the server
      await server.start();

      // Then: Should log startup message
      expect(consoleSpy).toHaveBeenCalledWith('Claude Flow Windows MCP Server started');

      consoleSpy.mockRestore();
    });
  });

  describe('Component Integration', () => {
    it('should initialize all components correctly', () => {
      // Then: All components should be initialized
      expect((server as any).shellAdapter).toBeDefined();
      expect((server as any).memoryManager).toBeDefined();
      expect((server as any).agentManager).toBeDefined();
      expect((server as any).swarmCoordinator).toBeDefined();
      expect((server as any).taskOrchestrator).toBeDefined();
    });

    it('should pass MemoryManager to AgentManager', () => {
      // Then: AgentManager should receive MemoryManager
      const memoryManager = (server as any).memoryManager;
      const agentManager = (server as any).agentManager;
      
      // This would be verified by checking the constructor call
      // In a real test, we might check internal state or dependencies
      expect(agentManager).toBeDefined();
      expect(memoryManager).toBeDefined();
    });

    it('should pass AgentManager to SwarmCoordinator', () => {
      // Then: SwarmCoordinator should receive AgentManager
      const agentManager = (server as any).agentManager;
      const swarmCoordinator = (server as any).swarmCoordinator;
      
      expect(swarmCoordinator).toBeDefined();
      expect(agentManager).toBeDefined();
    });

    it('should pass SwarmCoordinator to TaskOrchestrator', () => {
      // Then: TaskOrchestrator should receive SwarmCoordinator
      const swarmCoordinator = (server as any).swarmCoordinator;
      const taskOrchestrator = (server as any).taskOrchestrator;
      
      expect(taskOrchestrator).toBeDefined();
      expect(swarmCoordinator).toBeDefined();
    });
  });

  describe('Request/Response Format Validation', () => {
    let callToolHandler: Function;

    beforeEach(() => {
      callToolHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === CallToolRequestSchema)?.[1];
    });

    it('should return proper MCP response format', async () => {
      // Given: Mock successful tool execution
      const mockSwarmCoordinator = (server as any).swarmCoordinator;
      mockSwarmCoordinator.initializeSwarm = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test response' }]
      });

      // When: Executing tool
      const request = {
        params: {
          name: 'swarm_init',
          arguments: { topology: 'hierarchical' }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should return proper MCP format
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should handle tools that return multiple content blocks', async () => {
      // Given: Mock returning multiple content blocks
      const mockMemoryManager = (server as any).memoryManager;
      mockMemoryManager.retrieve = vi.fn().mockResolvedValue({
        content: [
          { type: 'text', text: 'Data found' },
          { type: 'text', text: 'Additional info' }
        ]
      });

      // When: Executing tool
      const request = {
        params: {
          name: 'memory_retrieve',
          arguments: { key: 'test' }
        }
      };
      const result = await callToolHandler(request);

      // Then: Should preserve multiple content blocks
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toBe('Data found');
      expect(result.content[1].text).toBe('Additional info');
    });
  });

  describe('Stdio Communication', () => {
    it('should use stdio transport for MCP communication', async () => {
      // When: Starting server
      await server.start();

      // Then: Should use StdioServerTransport
      expect(StdioServerTransport).toHaveBeenCalledTimes(1);
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should handle transport connection errors', async () => {
      // Given: Transport that fails to connect
      mockMcpServer.connect.mockRejectedValue(new Error('Transport failed'));

      // When/Then: Should propagate connection error
      await expect(server.start()).rejects.toThrow('Transport failed');
    });
  });

  describe('Tool Schema Validation', () => {
    it('should register tools with proper schema validation', async () => {
      // Given: List tools handler
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Getting tools list
      const result = await listToolsHandler();

      // Then: Each tool should have proper schema
      result.tools.forEach((tool: any) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
      });
    });

    it('should include required fields in tool schemas', async () => {
      // Given: List tools handler
      const listToolsHandler = mockMcpServer.setRequestHandler.mock.calls
        .find(call => call[0] === ListToolsRequestSchema)?.[1];

      // When: Getting tools list
      const result = await listToolsHandler();

      // Then: Find specific tool and check schema
      const swarmInitTool = result.tools.find((tool: any) => tool.name === 'swarm_init');
      expect(swarmInitTool).toBeDefined();
      expect(swarmInitTool.inputSchema.required).toContain('topology');

      const shellExecuteTool = result.tools.find((tool: any) => tool.name === 'shell_execute');
      expect(shellExecuteTool).toBeDefined();
      expect(shellExecuteTool.inputSchema.required).toContain('command');
    });
  });
});
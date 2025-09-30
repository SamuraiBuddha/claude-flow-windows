# Claude-Flow-Windows Gap Specification & Test Criteria

## Critical Gaps to Fix

### Gap 1: Tool Handler Connection (Priority: CRITICAL)
**Problem**: Tools are defined but not connected to execution logic
**Location**: `src/index.ts` - handleToolCall method
**Test Criteria**:
```typescript
// Test: Each tool should execute its corresponding manager method
test('swarm_init tool should call SwarmCoordinator.initSwarm', async () => {
  const result = await server.handleToolCall('swarm_init', { topology: 'mesh' });
  expect(mockSwarmCoordinator.initSwarm).toHaveBeenCalledWith({ topology: 'mesh' });
  expect(result).toHaveProperty('swarmId');
});
```

### Gap 2: Missing Manager Methods (Priority: HIGH)
**Problem**: Manager classes missing critical methods
**Locations**: 
- `src/swarm/SwarmCoordinator.ts` - missing optimizeTopology, monitor, terminateAll
- `src/agents/AgentManager.ts` - missing cognitiveSpawn, smartSpawn, autoAgent
**Test Criteria**:
```typescript
// Test: SwarmCoordinator methods exist and function
test('SwarmCoordinator.optimizeTopology should analyze and switch topology', async () => {
  const result = await coordinator.optimizeTopology();
  expect(result).toHaveProperty('oldTopology');
  expect(result).toHaveProperty('newTopology');
  expect(result).toHaveProperty('reason');
});
```

### Gap 3: Windows Shell Command Translation (Priority: HIGH)
**Problem**: Unix commands not properly translated to PowerShell
**Location**: `src/utils/WindowsShellAdapter.ts`
**Test Criteria**:
```typescript
// Test: Unix to PowerShell translation
test('should convert grep to Select-String correctly', () => {
  const result = adapter.translateCommand('ls -la | grep ".txt"');
  expect(result).toBe('Get-ChildItem -la | Select-String -Pattern ".txt"');
});
```

### Gap 4: Performance Analyzer Missing (Priority: MEDIUM)
**Problem**: PerformanceAnalyzer class doesn't exist
**Location**: Need to create `src/analysis/PerformanceAnalyzer.ts`
**Test Criteria**:
```typescript
// Test: PerformanceAnalyzer tracks metrics
test('PerformanceAnalyzer should track agent performance', async () => {
  const analyzer = new PerformanceAnalyzer();
  analyzer.recordMetric('agent-1', 'responseTime', 150);
  const report = await analyzer.generateReport();
  expect(report).toHaveProperty('agents');
  expect(report.agents['agent-1']).toHaveProperty('avgResponseTime');
});
```

### Gap 5: Error Code Propagation (Priority: HIGH)
**Problem**: MCP error codes not properly propagated
**Location**: `src/index.ts` - error handling
**Test Criteria**:
```typescript
// Test: Proper MCP error codes
test('should return -32601 for unknown method', async () => {
  try {
    await server.handleToolCall('unknown_tool', {});
  } catch (error) {
    expect(error.code).toBe(-32601);
  }
});
```

### Gap 6: Agent Limit Enforcement (Priority: MEDIUM)
**Problem**: maxAgents not enforced in spawning
**Location**: `src/swarm/SwarmCoordinator.ts`
**Test Criteria**:
```typescript
// Test: Agent limits enforced
test('should not spawn agents beyond maxAgents limit', async () => {
  const swarm = await coordinator.initSwarm({ maxAgents: 2 });
  await agentManager.spawnAgent({ type: 'coder' });
  await agentManager.spawnAgent({ type: 'reviewer' });
  await expect(agentManager.spawnAgent({ type: 'tester' }))
    .rejects.toThrow('Agent limit reached');
});
```

### Gap 7: Memory Import/Export (Priority: LOW)
**Problem**: Memory persistence import/export not implemented
**Location**: `src/memory/MemoryManager.ts`
**Test Criteria**:
```typescript
// Test: Memory export and import
test('should export and import memory state', async () => {
  await memory.store('key1', { data: 'test' });
  const exported = await memory.export('memory.json');
  await memory.clear();
  await memory.import('memory.json');
  const retrieved = await memory.retrieve('key1');
  expect(retrieved.data).toBe('test');
});
```

### Gap 8: Ring Topology Neighbors (Priority: LOW)
**Problem**: Ring topology not setting up neighbor relationships
**Location**: `src/swarm/SwarmCoordinator.ts`
**Test Criteria**:
```typescript
// Test: Ring topology neighbor setup
test('should configure ring topology neighbors correctly', async () => {
  await coordinator.initSwarm({ topology: 'ring' });
  const agents = await agentManager.listAgents();
  expect(agents[0].neighbors).toContain(agents[1].id);
  expect(agents[agents.length-1].neighbors).toContain(agents[0].id);
});
```

## Implementation Plan

### Phase 1: Critical Fixes (Must Have)
1. Connect tool handlers to manager methods
2. Fix error code propagation
3. Fix Windows shell command translation

### Phase 2: Core Functionality (Should Have)
1. Implement missing manager methods
2. Add agent limit enforcement
3. Create PerformanceAnalyzer class

### Phase 3: Enhanced Features (Nice to Have)
1. Add memory import/export
2. Fix ring topology neighbors
3. Add comprehensive examples

## Success Criteria
- All 157 existing tests pass
- 20 new tests for gap fixes pass
- MCP tools execute properly when called
- Windows commands translate correctly
- Performance metrics are tracked
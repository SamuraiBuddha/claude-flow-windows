/**
 * Claude Flow Windows - Live Functionality Test
 * This script demonstrates what's actually working
 */
import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n🚀 Claude Flow Windows - Live Test\n'));

// Test 1: Check if MCP server can be started
console.log(chalk.yellow('Test 1: Starting MCP Server...'));

const mcpProcess = spawn('node', ['dist/index.js'], {
  cwd: 'C:\\Users\\JordanEhrig\\Documents\\GitHub\\claude-flow-windows',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send initialization
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '0.1.0',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

// Listen for response
mcpProcess.stdout.on('data', (data) => {
  console.log(chalk.green('✓ Server Response:'), data.toString());
});

mcpProcess.stderr.on('data', (data) => {
  console.log(chalk.red('✗ Server Error:'), data.toString());
});

// Test 2: List available tools
setTimeout(() => {
  console.log(chalk.yellow('\nTest 2: Listing Available Tools...'));
  
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  mcpProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Test 3: Try swarm initialization
setTimeout(() => {
  console.log(chalk.yellow('\nTest 3: Initializing Swarm...'));
  
  const swarmInitRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'swarm_init',
      arguments: {
        topology: 'adaptive',
        maxAgents: 5,
        strategy: 'balanced',
        enableMemory: true
      }
    }
  };

  mcpProcess.stdin.write(JSON.stringify(swarmInitRequest) + '\n');
}, 2000);

// Test 4: Check Windows shell adapter
setTimeout(() => {
  console.log(chalk.yellow('\nTest 4: Testing Windows Shell...'));
  
  const shellRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'shell_execute',
      arguments: {
        command: 'echo "Claude Flow Windows Test"'
      }
    }
  };

  mcpProcess.stdin.write(JSON.stringify(shellRequest) + '\n');
}, 3000);

// Cleanup
setTimeout(() => {
  console.log(chalk.blue('\n📊 Test Summary:'));
  console.log('  • MCP Server: Check output above');
  console.log('  • Tool Registry: Check if tools were listed');
  console.log('  • Swarm Init: Check if initialization succeeded');
  console.log('  • Windows Shell: Check if command executed');
  
  mcpProcess.kill();
  process.exit(0);
}, 5000);

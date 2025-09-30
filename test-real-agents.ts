#!/usr/bin/env node
import { AgentCoordinator } from './src/agents/AgentCoordinator.js';
import { TerminalUI } from './src/ui/terminal-ui.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRealAgents() {
  console.log('🚀 Testing Real Agent System with Claude API');
  console.log('============================================\n');
  
  // Check for API key
  if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable not set');
    console.log('Please set your Anthropic API key in .env file:');
    console.log('CLAUDE_API_KEY=your-api-key-here');
    process.exit(1);
  }

  const coordinator = new AgentCoordinator({
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    maxAgents: 5,
    model: 'claude-3-haiku-20240307' // Using Haiku for cost-efficiency
  });

  const ui = new TerminalUI(coordinator);

  try {
    // Start the UI
    await ui.start();
    
    console.log('📊 Starting Terminal UI...\n');

    // Spawn a team of diverse agents
    console.log('🤖 Spawning agent team...');
    
    const coder = await coordinator.spawnRealAgent({
      name: 'Coder-1',
      type: 'coder',
      systemPrompt: 'You are a coding agent. Focus on implementation and writing clean code.'
    });
    
    const reviewer = await coordinator.spawnRealAgent({
      name: 'Reviewer-1',
      type: 'reviewer',
      systemPrompt: 'You are a code review agent. Focus on quality, best practices, and finding issues.'
    });
    
    const architect = await coordinator.spawnRealAgent({
      name: 'Architect-1',
      type: 'architect',
      systemPrompt: 'You are an architecture agent. Focus on system design and structure.'
    });

    console.log(`✅ Spawned 3 agents: ${coder}, ${reviewer}, ${architect}\n`);

    // Connect agents for collaboration
    coordinator.connectAgents(coder, reviewer);
    coordinator.connectAgents(reviewer, architect);
    coordinator.connectAgents(architect, coder);
    console.log('🔗 Agents connected in collaborative network\n');

    // Test 1: Simple task assignment
    console.log('📝 Test 1: Assigning simple task to coder...');
    const task1 = await coordinator.assignTask(
      'Write a Python function that calculates the factorial of a number',
      { agentId: coder }
    );
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Parallel task execution
    console.log('\n📝 Test 2: Distributing task across all agents...');
    const task2 = await coordinator.assignTask(
      'What are the best practices for error handling in production systems?',
      { parallel: true }
    );
    
    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Test 3: Agent-to-agent communication
    console.log('\n📝 Test 3: Testing agent communication...');
    // This would trigger through the agent's sendToAgent method
    
    // Monitor for 30 seconds
    console.log('\n👁️  Monitoring swarm activity for 30 seconds...');
    console.log('Press Ctrl+C to stop\n');
    
    // Keep running to show the UI
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Get final status
    const status = coordinator.getSwarmStatus();
    console.log('\n📊 Final Swarm Status:');
    console.log(JSON.stringify(status, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await coordinator.terminate();
    ui.stop();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Shutting down gracefully...');
  process.exit(0);
});

// Run the test
testRealAgents().catch(console.error);
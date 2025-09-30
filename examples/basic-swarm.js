/**
 * Claude Flow Windows - Basic Swarm Example
 * 
 * This example demonstrates how to initialize and use a basic swarm
 * for common development tasks on Windows.
 */

// Example 1: Initialize a Development Swarm
async function createDevelopmentSwarm() {
  console.log('🚀 Initializing development swarm...');
  
  // Initialize swarm with adaptive topology for flexible task handling
  const swarm = await swarm_init({
    topology: 'adaptive',
    maxAgents: 6,
    strategy: 'balanced',
    enableMemory: true
  });
  
  console.log(`✅ Swarm initialized: ${swarm.swarmId}`);
  return swarm;
}

// Example 2: Spawn Specialized Agents
async function spawnDevelopmentTeam() {
  console.log('👥 Spawning development team...');
  
  // Spawn a Python/Django specialist
  const pythonAgent = await agent_spawn({
    type: 'coder',
    name: 'python-django-specialist',
    skills: 'python,django,rest-api,postgresql,testing',
    context: 'C:\\Projects\\WebAPI'
  });
  
  // Spawn a DevOps specialist with Windows focus
  const devopsAgent = await agent_spawn({
    type: 'devops', 
    name: 'windows-devops-specialist',
    skills: 'powershell,docker,iis,azure,ci-cd,windows-server',
    context: 'C:\\Projects\\Infrastructure'
  });
  
  // Spawn a code reviewer
  const reviewerAgent = await agent_spawn({
    type: 'reviewer',
    name: 'senior-code-reviewer',
    skills: 'code-review,security,performance,best-practices',
    context: 'C:\\Projects'
  });
  
  console.log('✅ Development team spawned successfully');
  return { pythonAgent, devopsAgent, reviewerAgent };
}

// Example 3: Orchestrate a Complex Task
async function orchestrateWebAPIProject() {
  console.log('🎯 Orchestrating web API project...');
  
  const task = await task_orchestrate({
    task: `
      Build a RESTful API for an e-commerce platform with the following requirements:
      - User authentication and authorization (JWT)
      - Product catalog management
      - Shopping cart functionality  
      - Order processing
      - Payment integration (Stripe)
      - Admin dashboard
      - Comprehensive testing
      - Docker deployment on Windows Server
    `,
    priority: 'high',
    strategy: 'adaptive'
  });
  
  console.log(`✅ Task orchestrated: ${task.taskId}`);
  console.log(`📋 Subtasks created: ${task.subtasks.length}`);
  
  return task;
}

// Example 4: Monitor Swarm Performance
async function monitorSwarmHealth() {
  console.log('📊 Monitoring swarm health...');
  
  const status = await swarm_monitor({
    includeMetrics: true,
    includeAgents: true
  });
  
  console.log(`🏥 Swarm Status: ${status.status}`);
  console.log(`👥 Active Agents: ${status.agents.active}/${status.agents.total}`);
  console.log(`⚡ Efficiency: ${status.metrics.efficiency}%`);
  console.log(`🎯 Tasks Completed: ${status.metrics.tasksCompleted}`);
  
  return status;
}

// Example 5: Use Windows-Specific Features
async function demonstrateWindowsFeatures() {
  console.log('🪟 Demonstrating Windows-specific features...');
  
  // Execute PowerShell command to check system info
  const systemInfo = await shell_execute({
    command: `
      Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory | 
      ConvertTo-Json
    `,
    elevated: false
  });
  
  console.log('💻 System Information:');
  console.log(systemInfo.output);
  
  // Check running services
  const services = await shell_execute({
    command: `
      Get-Service | Where-Object {$_.Status -eq 'Running'} | 
      Select-Object Name, Status | Sort-Object Name | 
      Select-Object -First 10 | ConvertTo-Json
    `
  });
  
  console.log('🔧 Running Services (Top 10):');
  console.log(services.output);
  
  // Demonstrate WSL bridge (if available)
  try {
    const wslCheck = await wsl_bridge({
      command: 'echo "WSL is available and working"',
      distribution: 'Ubuntu'
    });
    
    if (wslCheck.success) {
      console.log('🐧 WSL Bridge: Available');
      
      // Use WSL for Linux-specific commands
      const linuxInfo = await wsl_bridge({
        command: 'uname -a && lsb_release -a',
        distribution: 'Ubuntu'
      });
      
      console.log('🐧 Linux Environment:');
      console.log(linuxInfo.output);
    }
  } catch (error) {
    console.log('🐧 WSL Bridge: Not available');
  }
}

// Example 6: Memory Management
async function demonstrateMemoryFeatures() {
  console.log('🧠 Demonstrating memory management...');
  
  // Store project configuration
  await memory_store({
    key: 'project_config',
    value: {
      name: 'E-commerce API',
      version: '1.0.0',
      framework: 'Django',
      database: 'PostgreSQL',
      deployment: 'Docker on Windows Server',
      team: ['python-django-specialist', 'windows-devops-specialist']
    },
    namespace: 'projects',
    ttl: 3600 // 1 hour
  });
  
  // Store team preferences
  await memory_store({
    key: 'team_preferences',
    value: {
      codeStyle: 'black + flake8',
      testFramework: 'pytest',
      cicd: 'GitHub Actions',
      monitoring: 'Azure Monitor',
      shell: 'PowerShell 7'
    },
    namespace: 'configuration'
  });
  
  // Retrieve and use stored configuration
  const projectConfig = await memory_retrieve({
    key: 'project_config',
    namespace: 'projects'
  });
  
  console.log('📋 Retrieved project configuration:');
  console.log(JSON.stringify(projectConfig.value, null, 2));
}

// Example 7: Complete Workflow
async function completeWorkflowExample() {
  console.log('🔄 Running complete workflow example...');
  
  try {
    // Step 1: Initialize the swarm
    const swarm = await createDevelopmentSwarm();
    
    // Step 2: Spawn the team
    const team = await spawnDevelopmentTeam();
    
    // Step 3: Set up memory with project context
    await demonstrateMemoryFeatures();
    
    // Step 4: Orchestrate the main task
    const task = await orchestrateWebAPIProject();
    
    // Step 5: Demonstrate Windows features
    await demonstrateWindowsFeatures();
    
    // Step 6: Monitor progress
    const status = await monitorSwarmHealth();
    
    console.log('🎉 Complete workflow executed successfully!');
    console.log(`📊 Final Status: ${status.status}`);
    
    return {
      swarm,
      team,
      task,
      status
    };
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    throw error;
  }
}

// Example 8: Error Handling and Resilience
async function demonstrateErrorHandling() {
  console.log('🛡️ Demonstrating error handling...');
  
  try {
    // Attempt to spawn an agent with invalid configuration
    await agent_spawn({
      type: 'invalid_type',
      name: 'test-agent'
    });
  } catch (error) {
    console.log('✅ Caught expected error for invalid agent type:', error.message);
  }
  
  try {
    // Attempt to execute invalid PowerShell command
    await shell_execute({
      command: 'Get-NonExistentCommand',
      elevated: false
    });
  } catch (error) {
    console.log('✅ Caught expected error for invalid PowerShell command');
  }
  
  // Demonstrate graceful degradation with WSL
  try {
    await wsl_bridge({
      command: 'echo "Testing WSL"',
      distribution: 'NonExistentDistro'
    });
  } catch (error) {
    console.log('✅ WSL gracefully handled non-existent distribution');
  }
}

// Main execution function
async function main() {
  console.log('🌟 Claude Flow Windows - Basic Swarm Example');
  console.log('=' .repeat(50));
  
  try {
    // Run the complete workflow
    await completeWorkflowExample();
    
    // Demonstrate error handling
    await demonstrateErrorHandling();
    
    console.log('\n🎯 Example completed successfully!');
    console.log('💡 Check the Claude Flow Windows documentation for more advanced features.');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other examples
module.exports = {
  createDevelopmentSwarm,
  spawnDevelopmentTeam,
  orchestrateWebAPIProject,
  monitorSwarmHealth,
  demonstrateWindowsFeatures,
  demonstrateMemoryFeatures,
  completeWorkflowExample,
  demonstrateErrorHandling
};

// Run if called directly
if (require.main === module) {
  main();
}
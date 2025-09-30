/**
 * Claude Flow Windows - Windows Command Examples
 * 
 * This example demonstrates PowerShell integration, command conversion,
 * and Windows-specific functionality in Claude Flow Windows.
 */

// Example 1: Basic PowerShell Command Execution
async function basicPowerShellCommands() {
  console.log('🪟 Basic PowerShell Commands');
  console.log('-'.repeat(30));
  
  // Get system information
  const systemInfo = await shell_execute({
    command: 'Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory'
  });
  
  console.log('System Information:');
  console.log(systemInfo.output);
  
  // List running processes with high CPU usage
  const processes = await shell_execute({
    command: `
      Get-Process | 
      Where-Object {$_.CPU -gt 10} | 
      Select-Object Name, CPU, WorkingSet | 
      Sort-Object CPU -Descending | 
      Select-Object -First 10
    `
  });
  
  console.log('\nHigh CPU Processes:');
  console.log(processes.output);
  
  // Check disk space
  const diskSpace = await shell_execute({
    command: `
      Get-WmiObject -Class Win32_LogicalDisk | 
      Select-Object DeviceID, 
                    @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, 
                    @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}, 
                    @{Name="PercentFree";Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}}
    `
  });
  
  console.log('\nDisk Space:');
  console.log(diskSpace.output);
}

// Example 2: Unix to PowerShell Command Conversion
async function demonstrateCommandConversion() {
  console.log('\n🔄 Unix to PowerShell Command Conversion');
  console.log('-'.repeat(40));
  
  // These Unix commands will be automatically converted to PowerShell equivalents
  const conversions = [
    {
      unix: 'ls -la',
      description: 'List all files with details',
      powershell: 'Get-ChildItem -Force'
    },
    {
      unix: 'ps aux',
      description: 'List all processes',
      powershell: 'Get-Process | Format-Table'
    },
    {
      unix: 'grep -r "TODO" .',
      description: 'Search for TODO in files',
      powershell: 'Select-String -Path . -Pattern "TODO" -Recurse'
    },
    {
      unix: 'find . -name "*.js"',
      description: 'Find JavaScript files',
      powershell: 'Get-ChildItem -Path . -Filter "*.js" -Recurse'
    },
    {
      unix: 'tail -f logfile.txt',
      description: 'Follow log file',
      powershell: 'Get-Content logfile.txt -Wait -Tail 10'
    }
  ];
  
  for (const cmd of conversions) {
    console.log(`\n📝 ${cmd.description}`);
    console.log(`Unix:       ${cmd.unix}`);
    console.log(`PowerShell: ${cmd.powershell}`);
    
    try {
      // Execute the PowerShell equivalent
      const result = await shell_execute({
        command: cmd.powershell,
        workingDir: 'C:\\Projects'
      });
      
      if (result.success) {
        console.log(`✅ Executed successfully (${result.executionTime})`);
      }
    } catch (error) {
      console.log(`ℹ️  Command syntax demonstrated (actual execution may vary)`);
    }
  }
}

// Example 3: Advanced PowerShell Features
async function advancedPowerShellFeatures() {
  console.log('\n⚡ Advanced PowerShell Features');
  console.log('-'.repeat(35));
  
  // Working with JSON data
  const jsonExample = await shell_execute({
    command: `
      $data = @{
          Project = "Claude Flow Windows"
          Version = "1.0.0"
          Features = @("Swarm Coordination", "Windows Integration", "PowerShell Native")
          Agents = @{
              Total = 8
              Active = 6
              Types = @("coder", "reviewer", "devops", "architect")
          }
      }
      $data | ConvertTo-Json -Depth 3
    `
  });
  
  console.log('\nJSON Data Processing:');
  console.log(jsonExample.output);
  
  // Working with objects and pipelines
  const pipelineExample = await shell_execute({
    command: `
      Get-Service | 
      Where-Object {$_.Status -eq 'Running'} | 
      Group-Object Status | 
      Select-Object Name, Count | 
      ConvertTo-Json
    `
  });
  
  console.log('\nPipeline Processing:');
  console.log(pipelineExample.output);
  
  // File operations with error handling
  const fileOperations = await shell_execute({
    command: `
      try {
          $tempFile = [System.IO.Path]::GetTempFileName()
          "Claude Flow Windows Test" | Out-File -FilePath $tempFile
          $content = Get-Content -Path $tempFile
          Remove-Item -Path $tempFile
          Write-Output "File operations successful: $content"
      } catch {
          Write-Output "Error: $($_.Exception.Message)"
      }
    `
  });
  
  console.log('\nFile Operations:');
  console.log(fileOperations.output);
}

// Example 4: Elevated Commands
async function demonstrateElevatedCommands() {
  console.log('\n🔐 Elevated Command Examples');
  console.log('-'.repeat(30));
  
  // Check if running as administrator
  const adminCheck = await shell_execute({
    command: `
      $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
      $isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
      if ($isAdmin) { "Running as Administrator" } else { "Running as Standard User" }
    `
  });
  
  console.log('Admin Status:');
  console.log(adminCheck.output);
  
  // Example of commands that might require elevation
  const elevatedExamples = [
    {
      command: 'Get-Service',
      description: 'Get all services (may require elevation for some details)',
      requiresElevation: false
    },
    {
      command: 'Get-EventLog -LogName System -Newest 5',
      description: 'Read system event log',
      requiresElevation: true
    },
    {
      command: 'Get-LocalUser',
      description: 'List local users',
      requiresElevation: true
    }
  ];
  
  for (const example of elevatedExamples) {
    console.log(`\n📋 ${example.description}`);
    console.log(`Command: ${example.command}`);
    console.log(`Requires Elevation: ${example.requiresElevation ? 'Yes' : 'No'}`);
    
    try {
      const result = await shell_execute({
        command: example.command,
        elevated: example.requiresElevation
      });
      
      if (result.success) {
        console.log('✅ Executed successfully');
        // Show truncated output for demo
        const truncated = result.output.length > 200 
          ? result.output.substring(0, 200) + '...' 
          : result.output;
        console.log(`Output: ${truncated}`);
      }
    } catch (error) {
      console.log(`⚠️  May require elevation: ${error.message}`);
    }
  }
}

// Example 5: WSL Bridge Integration
async function demonstrateWSLBridge() {
  console.log('\n🐧 WSL Bridge Integration');
  console.log('-'.repeat(30));
  
  try {
    // Check WSL availability
    const wslStatus = await wsl_bridge({
      command: 'echo "WSL is available"',
      distribution: 'Ubuntu'
    });
    
    if (wslStatus.success) {
      console.log('✅ WSL is available and working');
      
      // Compare Windows vs Linux commands for the same task
      console.log('\n📊 Performance Comparison: File Search');
      
      // Windows PowerShell approach
      console.time('Windows PowerShell');
      const windowsSearch = await shell_execute({
        command: 'Get-ChildItem -Path C:\\Windows\\System32 -Filter "*.exe" | Measure-Object | Select-Object Count'
      });
      console.timeEnd('Windows PowerShell');
      console.log('Windows result:', windowsSearch.output);
      
      // Linux approach via WSL
      console.time('WSL Linux');
      const linuxSearch = await wsl_bridge({
        command: 'find /mnt/c/Windows/System32 -name "*.exe" 2>/dev/null | wc -l',
        distribution: 'Ubuntu'
      });
      console.timeEnd('WSL Linux');
      console.log('Linux result:', linuxSearch.output);
      
      // Demonstrate Linux-specific tools
      const linuxTools = await wsl_bridge({
        command: `
          echo "=== System Info ==="
          uname -a
          echo "=== Memory Usage ==="
          free -h
          echo "=== Disk Usage ==="
          df -h | head -5
        `,
        distribution: 'Ubuntu'
      });
      
      console.log('\n🐧 Linux System Information:');
      console.log(linuxTools.output);
      
      // Text processing comparison
      const testText = "line1\nline2\nTODO: fix this\nline4\nTODO: improve performance";
      
      // PowerShell approach
      const powershellGrep = await shell_execute({
        command: `
          $text = @"
${testText}
"@
          $text -split "\\n" | Where-Object { $_ -match "TODO" }
        `
      });
      
      // Linux approach
      const linuxGrep = await wsl_bridge({
        command: `echo "${testText}" | grep TODO`,
        distribution: 'Ubuntu'
      });
      
      console.log('\n🔍 Text Processing Comparison:');
      console.log('PowerShell approach:', powershellGrep.output);
      console.log('Linux approach:', linuxGrep.output);
      
    }
  } catch (error) {
    console.log('ℹ️  WSL not available or not configured');
    console.log('   To enable WSL: wsl --install');
    console.log('   To install Ubuntu: wsl --install -d Ubuntu');
  }
}

// Example 6: Windows Development Workflow
async function windowsDevelopmentWorkflow() {
  console.log('\n🛠️ Windows Development Workflow');
  console.log('-'.repeat(35));
  
  // Check development environment
  const devEnvCheck = await shell_execute({
    command: `
      $env = @{}
      
      # Check Node.js
      try {
          $nodeVersion = & node --version 2>$null
          $env.NodeJS = $nodeVersion
      } catch {
          $env.NodeJS = "Not installed"
      }
      
      # Check Git
      try {
          $gitVersion = & git --version 2>$null
          $env.Git = $gitVersion
      } catch {
          $env.Git = "Not installed"
      }
      
      # Check PowerShell version
      $env.PowerShell = $PSVersionTable.PSVersion.ToString()
      
      # Check Visual Studio Code
      try {
          $codeVersion = & code --version 2>$null | Select-Object -First 1
          $env.VSCode = $codeVersion
      } catch {
          $env.VSCode = "Not installed"
      }
      
      $env | ConvertTo-Json
    `
  });
  
  console.log('Development Environment:');
  console.log(devEnvCheck.output);
  
  // Demonstrate project setup
  const projectSetup = await shell_execute({
    command: `
      $projectPath = "$env:TEMP\\claude-flow-demo"
      
      # Create project structure
      if (Test-Path $projectPath) {
          Remove-Item $projectPath -Recurse -Force
      }
      
      New-Item -ItemType Directory -Path $projectPath | Out-Null
      New-Item -ItemType Directory -Path "$projectPath\\src" | Out-Null
      New-Item -ItemType Directory -Path "$projectPath\\tests" | Out-Null
      New-Item -ItemType Directory -Path "$projectPath\\docs" | Out-Null
      
      # Create sample files
      @"
{
  "name": "claude-flow-demo",
  "version": "1.0.0",
  "description": "Demo project for Claude Flow Windows",
  "scripts": {
    "start": "node src/index.js",
    "test": "npm test"
  }
}
"@ | Out-File -FilePath "$projectPath\\package.json" -Encoding UTF8
      
      @"
console.log('Hello from Claude Flow Windows!');
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
"@ | Out-File -FilePath "$projectPath\\src\\index.js" -Encoding UTF8
      
      # List created structure
      Get-ChildItem -Path $projectPath -Recurse | 
      Select-Object FullName, @{Name="Type";Expression={if($_.PSIsContainer){"Directory"}else{"File"}}} |
      Format-Table -AutoSize
    `,
    workingDir: process.env.TEMP
  });
  
  console.log('\nProject Setup:');
  console.log(projectSetup.output);
  
  // Demonstrate Git operations
  const gitOps = await shell_execute({
    command: `
      $projectPath = "$env:TEMP\\claude-flow-demo"
      Set-Location $projectPath
      
      # Initialize git repo
      git init 2>$null | Out-Null
      git config user.name "Claude Flow Demo" 2>$null
      git config user.email "demo@claude-flow.local" 2>$null
      
      # Add files
      git add . 2>$null
      git commit -m "Initial commit from Claude Flow Windows" 2>$null
      
      # Show status
      Write-Output "=== Git Status ==="
      git status --porcelain
      Write-Output "=== Git Log ==="
      git log --oneline -3
    `,
    workingDir: process.env.TEMP
  });
  
  console.log('\nGit Operations:');
  console.log(gitOps.output);
}

// Example 7: Performance Monitoring
async function performanceMonitoring() {
  console.log('\n📊 Performance Monitoring');
  console.log('-'.repeat(25));
  
  // Monitor system performance
  const performanceData = await shell_execute({
    command: `
      $perf = @{}
      
      # CPU usage
      $cpu = Get-Counter "\\Processor(_Total)\\% Processor Time" -SampleInterval 1 -MaxSamples 3
      $perf.AverageCPU = [math]::Round(($cpu.CounterSamples | Measure-Object CookedValue -Average).Average, 2)
      
      # Memory usage
      $memory = Get-CimInstance Win32_OperatingSystem
      $perf.TotalMemoryGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
      $perf.FreeMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
      $perf.MemoryUsagePercent = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)
      
      # Disk usage for system drive
      $disk = Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq "C:"
      $perf.DiskTotalGB = [math]::Round($disk.Size / 1GB, 2)
      $perf.DiskFreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
      $perf.DiskUsagePercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
      
      $perf | ConvertTo-Json
    `
  });
  
  console.log('System Performance:');
  console.log(performanceData.output);
  
  // Monitor Claude Flow processes specifically
  const claudeFlowProcs = await shell_execute({
    command: `
      $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
                   Where-Object { $_.CommandLine -like "*claude-flow*" }
      
      if ($processes) {
          $processes | ForEach-Object {
              @{
                  PID = $_.Id
                  Name = $_.ProcessName
                  CPU = [math]::Round($_.CPU, 2)
                  MemoryMB = [math]::Round($_.WorkingSet / 1MB, 2)
                  StartTime = $_.StartTime
                  CommandLine = $_.CommandLine
              }
          } | ConvertTo-Json
      } else {
          Write-Output "No Claude Flow processes found"
      }
    `
  });
  
  console.log('\nClaude Flow Processes:');
  console.log(claudeFlowProcs.output);
}

// Main execution function
async function main() {
  console.log('🌟 Claude Flow Windows - Windows Command Examples');
  console.log('='.repeat(55));
  
  try {
    await basicPowerShellCommands();
    await demonstrateCommandConversion();
    await advancedPowerShellFeatures();
    await demonstrateElevatedCommands();
    await demonstrateWSLBridge();
    await windowsDevelopmentWorkflow();
    await performanceMonitoring();
    
    console.log('\n🎯 Windows command examples completed successfully!');
    console.log('💡 These examples show the power of native Windows integration in Claude Flow.');
    
  } catch (error) {
    console.error('\n❌ Examples failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other examples
module.exports = {
  basicPowerShellCommands,
  demonstrateCommandConversion,
  advancedPowerShellFeatures,
  demonstrateElevatedCommands,
  demonstrateWSLBridge,
  windowsDevelopmentWorkflow,
  performanceMonitoring
};

// Run if called directly
if (require.main === module) {
  main();
}
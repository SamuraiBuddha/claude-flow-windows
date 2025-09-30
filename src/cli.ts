#!/usr/bin/env node
import { program } from 'commander';
import { ClaudeFlowServer } from './index.js';
import chalk from 'chalk';
import { WindowsShellAdapter } from './adapters/WindowsShellAdapter.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
);

program
  .name('claude-flow-windows')
  .description('Windows-compatible MCP server for Claude swarm coordination')
  .version(packageJson.version);

program
  .command('serve')
  .description('Start the Claude Flow Windows MCP server')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting Claude Flow Windows MCP Server...'));
    console.log(chalk.gray('Platform: Windows'));
    console.log(chalk.gray('Shell: PowerShell'));
    
    const server = new ClaudeFlowServer();
    try {
      await server.start();
      console.log(chalk.green('✅ Server started successfully'));
      console.log(chalk.gray('Ready for MCP connections via stdio'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to start server:'), error);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check Windows environment compatibility')
  .action(async () => {
    console.log(chalk.blue('🔍 Checking Windows Environment...'));
    
    const adapter = new WindowsShellAdapter();
    const sysInfo = adapter.getSystemInfo();
    
    console.log(chalk.green('\n✅ System Information:'));
    console.log(chalk.gray(`  Platform: ${sysInfo.platform}`));
    console.log(chalk.gray(`  Architecture: ${sysInfo.arch}`));
    console.log(chalk.gray(`  Release: ${sysInfo.release}`));
    console.log(chalk.gray(`  Hostname: ${sysInfo.hostname}`));
    console.log(chalk.gray(`  CPUs: ${sysInfo.cpus}`));
    console.log(chalk.gray(`  Memory: ${sysInfo.memory}`));
    console.log(chalk.gray(`  Shell: ${sysInfo.shell}`));
    
    // Check WSL availability
    console.log(chalk.blue('\n🔍 Checking WSL availability...'));
    const hasWSL = await adapter.checkWSL();
    if (hasWSL) {
      console.log(chalk.green('✅ WSL is available (optional for complex Unix commands)'));
    } else {
      console.log(chalk.yellow('⚠️  WSL not available (Unix commands will be converted to PowerShell)'));
    }
    
    // Check PowerShell version
    console.log(chalk.blue('\n🔍 Checking PowerShell version...'));
    try {
      const result = await adapter.execute({ 
        command: '$PSVersionTable.PSVersion.ToString()' 
      });
      const version = result.content[0].text.trim();
      console.log(chalk.green(`✅ PowerShell version: ${version}`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not determine PowerShell version'));
    }
    
    console.log(chalk.green('\n✅ Environment check complete!'));
  });

program
  .command('convert <command>')
  .description('Convert Unix command to Windows PowerShell equivalent')
  .action((command) => {
    const adapter = new WindowsShellAdapter();
    const converted = (adapter as any).convertToWindows(command);
    
    console.log(chalk.blue('🔄 Command Conversion:'));
    console.log(chalk.gray('Unix:      ') + command);
    console.log(chalk.green('PowerShell: ') + converted);
  });

program
  .command('config')
  .description('Generate Claude Desktop configuration for Windows')
  .action(() => {
    const config = {
      mcpServers: {
        "claude-flow-windows": {
          command: "npx",
          args: ["claude-flow-windows", "serve"],
          env: {}
        }
      }
    };
    
    console.log(chalk.blue('📝 Claude Desktop Configuration for Windows:'));
    console.log(chalk.gray('\nAdd this to your claude_desktop_config.json:'));
    console.log(chalk.green(JSON.stringify(config, null, 2)));
    
    const configPath = path.join(
      process.env.APPDATA || '',
      'Claude',
      'claude_desktop_config.json'
    );
    console.log(chalk.gray(`\nConfiguration file location: ${configPath}`));
  });

program
  .command('ui')
  .description('Launch visual agent swarm monitor with colored indicators')
  .option('-d, --demo', 'Run in demo mode with simulated agents')
  .action(async (options) => {
    console.log(chalk.cyan('🚀 Launching Visual Agent Swarm Monitor...'));
    
    try {
      const { TerminalUI } = await import('./ui/terminal-ui.js');
      const ui = new TerminalUI();
      
      if (options.demo) {
        console.log(chalk.yellow('Running in demo mode with simulated agents...'));
        ui.simulateAgentActivity();
      } else {
        try {
          const server = new ClaudeFlowServer();
          ui.connectToServer(server);
          console.log(chalk.green('✅ Connected to MCP server'));
        } catch (error) {
          console.log(chalk.yellow('⚠️  MCP server not available, running in demo mode'));
          ui.simulateAgentActivity();
        }
      }
    } catch (error) {
      console.error(chalk.red('Failed to launch UI:'), error);
      console.log(chalk.yellow('\nMake sure blessed and blessed-contrib are installed:'));
      console.log(chalk.gray('npm install blessed blessed-contrib'));
      process.exit(1);
    }
  });

program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
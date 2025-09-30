import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Windows Shell Adapter - Replaces Unix commands with Windows equivalents
 * Provides cross-platform command execution for claude-flow on Windows
 */
export class WindowsShellAdapter {
  private isWindows: boolean;
  private shell: string;
  private shellFlag: string;

  constructor() {
    this.isWindows = process.platform === 'win32';
    this.shell = this.isWindows ? 'powershell.exe' : '/bin/bash';
    this.shellFlag = this.isWindows ? '-Command' : '-c';
  }

  /**
   * Execute a shell command with Windows/Unix compatibility
   */
  async execute(args: { 
    command: string; 
    elevated?: boolean; 
    workingDir?: string;
    env?: Record<string, string>;
  }): Promise<any> {
    const { command, elevated = false, workingDir, env } = args;
    
    // Convert Unix commands to Windows equivalents
    const convertedCommand = this.isWindows 
      ? this.convertToWindows(command)
      : command;

    // Handle elevation if needed (Windows UAC)
    const finalCommand = elevated && this.isWindows
      ? `Start-Process powershell -Verb RunAs -ArgumentList '${convertedCommand}'`
      : convertedCommand;

    return new Promise((resolve, reject) => {
      const options: SpawnOptionsWithoutStdio = {
        cwd: workingDir || process.cwd(),
        env: { ...process.env, ...env },
        shell: true
      };

      const child = spawn(this.shell, [this.shellFlag, finalCommand], options);
      
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: 'text',
                text: stdout || 'Command executed successfully'
              }
            ]
          });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Convert Unix commands to Windows PowerShell equivalents
   */
  private convertToWindows(command: string): string {
    // Command mapping table
    const conversions: Record<string, (args: string) => string> = {
      // File operations
      'ls': (args) => `Get-ChildItem ${args}`,
      'cat': (args) => `Get-Content ${args}`,
      'grep': (args) => this.convertGrepToPS(args),
      'find': (args) => `Get-ChildItem -Recurse ${args}`,
      'mkdir': (args) => `New-Item -ItemType Directory -Path ${args}`,
      'rm': (args) => `Remove-Item ${args}`,
      'cp': (args) => {
        const parts = args.split(' ');
        return `Copy-Item ${parts[0]} ${parts[1]}`;
      },
      'mv': (args) => {
        const parts = args.split(' ');
        return `Move-Item ${parts[0]} ${parts[1]}`;
      },
      'touch': (args) => `New-Item -ItemType File -Path ${args}`,
      
      // Process operations
      'ps': () => 'Get-Process',
      'kill': (args) => `Stop-Process -Id ${args}`,
      'which': (args) => `Get-Command ${args}`,
      
      // Text processing
      'sed': (args) => this.convertSedToPS(args),
      'awk': (args) => this.convertAwkToPS(args),
      'jq': (args) => this.convertJqToPS(args),
      'xargs': (args) => this.convertXargsToPS(args),
      
      // Environment
      'export': (args) => {
        const [key, value] = args.split('=');
        return `$env:${key}="${value}"`;
      },
      'echo': (args) => `Write-Output ${args}`,
      'pwd': () => 'Get-Location',
      
      // Network
      'curl': (args) => `Invoke-WebRequest ${args}`,
      'wget': (args) => `Invoke-WebRequest -OutFile ${args}`,
    };

    // Handle pipes first
    if (command.includes('|')) {
      return this.convertPipeline(command);
    }

    // Parse command and arguments
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    // Apply conversion if available
    if (conversions[cmd]) {
      return conversions[cmd](args);
    }

    // Return original command if no conversion needed
    return command;
  }

  /**
   * Convert Unix pipeline to PowerShell pipeline
   */
  private convertPipeline(command: string): string {
    const commands = command.split('|').map(cmd => cmd.trim());
    const converted = commands.map(cmd => this.convertSingleCommand(cmd));
    const result = converted.join(' | ');
    
    // Add trailing space only for simple pipelines (2 commands)
    // Complex pipelines (3+ commands) should not have trailing space
    return commands.length === 2 ? result + ' ' : result;
  }

  /**
   * Convert a single command (used internally to avoid infinite recursion with pipes)
   */
  private convertSingleCommand(command: string): string {
    // Command mapping table
    const conversions: Record<string, (args: string) => string> = {
      // File operations
      'ls': (args) => `Get-ChildItem ${args}`,
      'cat': (args) => `Get-Content ${args}`,
      'grep': (args) => this.convertGrepToPS(args),
      'find': (args) => `Get-ChildItem -Recurse ${args}`,
      'mkdir': (args) => `New-Item -ItemType Directory -Path ${args}`,
      'rm': (args) => `Remove-Item ${args}`,
      'cp': (args) => {
        const parts = args.split(' ');
        return `Copy-Item ${parts[0]} ${parts[1]}`;
      },
      'mv': (args) => {
        const parts = args.split(' ');
        return `Move-Item ${parts[0]} ${parts[1]}`;
      },
      'touch': (args) => `New-Item -ItemType File -Path ${args}`,
      
      // Process operations
      'ps': () => 'Get-Process',
      'kill': (args) => `Stop-Process -Id ${args}`,
      'which': (args) => `Get-Command ${args}`,
      
      // Text processing
      'sed': (args) => this.convertSedToPS(args),
      'awk': (args) => this.convertAwkToPS(args),
      'jq': (args) => this.convertJqToPS(args),
      'xargs': (args) => this.convertXargsToPS(args),
      
      // Environment
      'export': (args) => {
        const [key, value] = args.split('=');
        return `$env:${key}="${value}"`;
      },
      'echo': (args) => `Write-Output ${args}`,
      'pwd': () => 'Get-Location',
      
      // Network
      'curl': (args) => `Invoke-WebRequest ${args}`,
      'wget': (args) => `Invoke-WebRequest -OutFile ${args}`,
    };

    // Parse command and arguments
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    // Apply conversion if available
    if (conversions[cmd]) {
      return conversions[cmd](args);
    }

    // Return original command if no conversion needed
    return command;
  }

  /**
   * Convert grep command to PowerShell Select-String
   */
  private convertGrepToPS(args: string): string {
    if (!args.trim()) {
      return 'Select-String';
    }

    // Handle different grep patterns
    const trimmedArgs = args.trim();
    
    // Handle simple quoted pattern (common in pipelines): grep ".txt"
    const quotedPatternMatch = trimmedArgs.match(/^["'](.+?)["'](\s+(.+))?$/);
    if (quotedPatternMatch) {
      const pattern = quotedPatternMatch[1];
      const file = quotedPatternMatch[3] || '';
      return file ? 
        `Select-String -Pattern "${pattern}" ${file}` : 
        `Select-String -Pattern "${pattern}"`;
    }
    
    // Handle grep with options like -v (invert match)
    const parts = trimmedArgs.split(/\s+/);
    let options = '';
    let pattern = '';
    let file = '';
    
    let i = 0;
    // Parse options
    while (i < parts.length && parts[i].startsWith('-')) {
      if (parts[i] === '-v') {
        options += ' -v';
      }
      i++;
    }
    
    // Get pattern
    if (i < parts.length) {
      pattern = parts[i];
      // Remove quotes if present for the -Pattern parameter
      if ((pattern.startsWith('"') && pattern.endsWith('"')) || 
          (pattern.startsWith("'") && pattern.endsWith("'"))) {
        pattern = pattern.slice(1, -1);
      }
      i++;
    }
    
    // Get file if present
    if (i < parts.length) {
      file = parts.slice(i).join(' ');
    }
    
    // Build Select-String command
    let result = `Select-String -Pattern`;
    if (options) {
      result += options;
    }
    result += ` "${pattern}"`;
    if (file) {
      result += ` ${file}`;
    }
    
    return result;
  }

  /**
   * Convert sed command to PowerShell
   */
  private convertSedToPS(args: string): string {
    // Basic sed replacement: sed 's/old/new/g'
    const match = args.match(/^'?s\/(.+?)\/(.+?)\/(g)?'?\s+(.*)$/);
    if (match) {
      const [, pattern, replacement, global, file] = match;
      const scope = global ? '-Replace' : '-Replace';
      return file 
        ? `(Get-Content ${file}) ${scope} '${pattern}', '${replacement}'`
        : `-Replace '${pattern}', '${replacement}'`;
    }
    return args;
  }

  /**
   * Convert awk command to PowerShell
   */
  private convertAwkToPS(args: string): string {
    // Basic awk field extraction: awk '{print $1}'
    const match = args.match(/^'?\{print \$(\d+)\}'?\s*(.*)$/);
    if (match) {
      const [, field, file] = match;
      const fieldIndex = parseInt(field) - 1;
      return file
        ? `Get-Content ${file} | ForEach-Object { $_.Split()[${fieldIndex}] }`
        : `ForEach-Object { $_.Split()[${fieldIndex}] }`;
    }
    return args;
  }

  /**
   * Convert jq command to PowerShell
   * This is simplified - full jq functionality would require a library
   */
  private convertJqToPS(args: string): string {
    // Basic jq field extraction: jq '.field'
    const match = args.match(/^'?\.(\w+)'?\s*(.*)$/);
    if (match) {
      const [, field, file] = match;
      return file
        ? `Get-Content ${file} | ConvertFrom-Json | Select-Object -ExpandProperty ${field}`
        : `ConvertFrom-Json | Select-Object -ExpandProperty ${field}`;
    }
    
    // Array iteration: jq '.[]'
    if (args.includes('.[]')) {
      return 'ConvertFrom-Json | ForEach-Object { $_ }';
    }
    
    return 'ConvertFrom-Json';
  }

  /**
   * Convert xargs to PowerShell ForEach-Object
   */
  private convertXargsToPS(args: string): string {
    // Basic xargs: xargs command
    const parts = args.split(' ');
    const command = parts[0];
    const cmdArgs = parts.slice(1).join(' ');
    
    return `ForEach-Object { ${this.convertSingleCommand(`${command} $_`)} }`;
  }

  /**
   * Check if WSL is available and use it for complex Unix commands
   */
  async checkWSL(): Promise<boolean> {
    if (!this.isWindows) return false;
    
    try {
      await this.execute({ command: 'wsl --list' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bridge to WSL for complex Unix commands that can't be easily converted
   */
  async wslBridge(args: { command: string; distribution?: string }): Promise<any> {
    const { command, distribution = 'Ubuntu' } = args;
    
    const hasWSL = await this.checkWSL();
    if (!hasWSL) {
      throw new Error('WSL is not available. Please install WSL or use Windows-native commands.');
    }

    return this.execute({
      command: `wsl -d ${distribution} bash -c "${command.replace(/"/g, '\\"')}"`
    });
  }

  /**
   * Get system information
   */
  getSystemInfo(): any {
    return {
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
      shell: this.shell,
      isWindows: this.isWindows,
      hasWSL: false // Will be checked asynchronously
    };
  }
}
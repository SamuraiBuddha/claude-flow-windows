import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { WindowsShellAdapter } from '../../src/adapters/WindowsShellAdapter.js';

// Mock child_process
vi.mock('child_process');

describe('WindowsShellAdapter', () => {
  let adapter: WindowsShellAdapter;
  let mockSpawn: any;

  beforeEach(() => {
    adapter = new WindowsShellAdapter();
    mockSpawn = vi.mocked(spawn);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock process.platform for Windows testing
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset process.platform to Windows for consistency
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });
  });

  describe('Command Conversion', () => {
    it('should convert ls command to Get-ChildItem', async () => {
      // Given: A Unix ls command
      const command = 'ls -la /some/path';
      
      // Mock successful command execution
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell equivalent
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-ChildItem -la /some/path'],
        expect.any(Object)
      );
    });

    it('should convert grep command to Select-String', async () => {
      // Given: A Unix grep command
      const command = 'grep "pattern" file.txt';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell Select-String
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Select-String -Pattern "pattern" file.txt'],
        expect.any(Object)
      );
    });

    it('should convert cat command to Get-Content', async () => {
      // Given: A Unix cat command
      const command = 'cat file.txt';
      
      const mockChild = createMockChildProcess('file contents', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      const result = await adapter.execute({ command });

      // Then: Should convert to PowerShell Get-Content
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-Content file.txt'],
        expect.any(Object)
      );
      expect(result.content[0].text).toBe('file contents');
    });

    it('should convert find command to Get-ChildItem with -Recurse', async () => {
      // Given: A Unix find command
      const command = 'find /path -name "*.js"';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell recursive search
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-ChildItem -Recurse /path -name "*.js"'],
        expect.any(Object)
      );
    });

    it('should convert mkdir command to New-Item', async () => {
      // Given: A Unix mkdir command
      const command = 'mkdir new-directory';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell New-Item
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'New-Item -ItemType Directory -Path new-directory'],
        expect.any(Object)
      );
    });

    it('should convert cp command to Copy-Item', async () => {
      // Given: A Unix cp command
      const command = 'cp source.txt dest.txt';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell Copy-Item
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Copy-Item source.txt dest.txt'],
        expect.any(Object)
      );
    });

    it('should convert mv command to Move-Item', async () => {
      // Given: A Unix mv command
      const command = 'mv oldname.txt newname.txt';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell Move-Item
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Move-Item oldname.txt newname.txt'],
        expect.any(Object)
      );
    });

    it('should convert ps command to Get-Process', async () => {
      // Given: A Unix ps command
      const command = 'ps';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell Get-Process
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-Process'],
        expect.any(Object)
      );
    });

    it('should convert curl command to Invoke-WebRequest', async () => {
      // Given: A Unix curl command
      const command = 'curl https://example.com';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell Invoke-WebRequest
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Invoke-WebRequest https://example.com'],
        expect.any(Object)
      );
    });
  });

  describe('Pipeline Conversion', () => {
    it('should convert Unix pipeline to PowerShell pipeline', async () => {
      // Given: A Unix pipeline command
      const command = 'ls -la | grep ".txt"';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert both commands and preserve pipeline
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-ChildItem -la | Select-String -Pattern ".txt" '],
        expect.any(Object)
      );
    });

    it('should handle complex pipelines with multiple commands', async () => {
      // Given: A complex Unix pipeline
      const command = 'cat file.txt | grep "error" | grep -v "warning"';
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert all commands in pipeline
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-Content file.txt | Select-String -Pattern "error" | Select-String -Pattern -v "warning"'],
        expect.any(Object)
      );
    });
  });

  describe('Advanced Command Conversion', () => {
    it('should convert sed replacement command', async () => {
      // Given: A sed replacement command
      const command = "sed 's/old/new/g' file.txt";
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell replacement
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', "(Get-Content file.txt) -Replace 'old', 'new'"],
        expect.any(Object)
      );
    });

    it('should convert awk field extraction', async () => {
      // Given: An awk field extraction command
      const command = "awk '{print $1}' data.txt";
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell field extraction
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', "Get-Content data.txt | ForEach-Object { $_.Split()[0] }"],
        expect.any(Object)
      );
    });

    it('should convert jq JSON field extraction', async () => {
      // Given: A jq field extraction command
      const command = "jq '.name' data.json";
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell JSON processing
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', "Get-Content data.json | ConvertFrom-Json | Select-Object -ExpandProperty name"],
        expect.any(Object)
      );
    });

    it('should convert xargs command to ForEach-Object', async () => {
      // Given: An xargs command
      const command = "xargs rm";
      
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should convert to PowerShell ForEach-Object
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', "ForEach-Object { Remove-Item $_ }"],
        expect.any(Object)
      );
    });
  });

  describe('WSL Bridge Functionality', () => {
    it('should check WSL availability', async () => {
      // Given: WSL is available
      const mockChild = createMockChildProcess('Ubuntu', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Checking WSL availability
      const hasWSL = await adapter.checkWSL();

      // Then: Should return true and check with wsl --list
      expect(hasWSL).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'wsl --list'],
        expect.any(Object)
      );
    });

    it('should return false when WSL is not available', async () => {
      // Given: WSL command fails
      const mockChild = createMockChildProcess('', 'WSL not found', 1);
      mockSpawn.mockReturnValue(mockChild);

      // When: Checking WSL availability
      const hasWSL = await adapter.checkWSL();

      // Then: Should return false
      expect(hasWSL).toBe(false);
    });

    it('should bridge complex commands to WSL', async () => {
      // Given: A complex Unix command that needs WSL
      const command = 'find . -type f -exec grep -l "pattern" {} \\;';
      
      // Mock WSL check success
      const mockWSLCheck = createMockChildProcess('Ubuntu', '', 0);
      const mockWSLCommand = createMockChildProcess('result', '', 0);
      mockSpawn
        .mockReturnValueOnce(mockWSLCheck)  // WSL check call
        .mockReturnValueOnce(mockWSLCommand); // Actual WSL command

      // When: Using WSL bridge
      const result = await adapter.wslBridge({ command });

      // Then: Should execute command through WSL (check second call which is the actual command)
      expect(mockSpawn).toHaveBeenNthCalledWith(2,
        'powershell.exe',
        ['-Command', 'wsl -d Ubuntu bash -c "find . -type f -exec grep -l \\"pattern\\" {} \\;"'],
        expect.any(Object)
      );
      expect(result.content[0].text).toBe('result');
    });

    it('should throw error when WSL bridge is attempted without WSL', async () => {
      // Given: WSL is not available
      const mockChild = createMockChildProcess('', 'WSL not found', 1);
      mockSpawn.mockReturnValue(mockChild);

      // When: Attempting to use WSL bridge
      // Then: Should throw error
      await expect(adapter.wslBridge({ command: 'complex unix command' }))
        .rejects
        .toThrow('WSL is not available. Please install WSL or use Windows-native commands.');
    });
  });

  describe('Error Handling', () => {
    it('should handle command execution errors', async () => {
      // Given: A command that fails
      const command = 'ls /nonexistent';
      const mockChild = createMockChildProcess('', 'Path not found', 1);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the failing command
      // Then: Should reject with error message
      await expect(adapter.execute({ command }))
        .rejects
        .toThrow('Command failed with code 1: Path not found');
    });

    it('should handle spawn errors', async () => {
      // Given: A spawn error
      const command = 'ls';
      const mockChild = createMockChildProcess('', '', null);
      mockSpawn.mockReturnValue(mockChild);

      // When: A spawn error occurs
      const executePromise = adapter.execute({ command });
      
      // Simulate spawn error
      setTimeout(() => {
        mockChild.emit('error', new Error('Spawn failed'));
      }, 10);

      // Then: Should reject with spawn error
      await expect(executePromise)
        .rejects
        .toThrow('Command failed with code null:');
    });
  });

  describe('Elevated Command Execution', () => {
    it('should handle elevated command execution on Windows', async () => {
      // Given: An elevated command
      const command = 'netstat -an';
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing with elevation
      await adapter.execute({ command, elevated: true });

      // Then: Should wrap command with Start-Process RunAs
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', "Start-Process powershell -Verb RunAs -ArgumentList 'netstat -an'"],
        expect.any(Object)
      );
    });

    it('should not elevate commands on non-Windows platforms', async () => {
      // Given: A non-Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });
      
      // Create new adapter after platform change
      const linuxAdapter = new WindowsShellAdapter();
      
      const command = 'netstat -an';
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing with elevation request
      await linuxAdapter.execute({ command, elevated: true });

      // Then: Should not wrap with elevation
      expect(mockSpawn).toHaveBeenCalledWith(
        '/bin/bash',
        ['-c', 'netstat -an'],
        expect.any(Object)
      );
    });
  });

  describe('Environment and Working Directory', () => {
    it('should use provided working directory', async () => {
      // Given: A command with working directory
      const command = 'ls';
      const workingDir = 'C:\\custom\\path';
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing with custom working directory
      await adapter.execute({ command, workingDir });

      // Then: Should pass working directory to spawn
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-ChildItem '],
        expect.objectContaining({
          cwd: workingDir
        })
      );
    });

    it('should merge environment variables', async () => {
      // Given: Custom environment variables
      const command = 'echo $env:CUSTOM_VAR';
      const env = { CUSTOM_VAR: 'test-value' };
      const mockChild = createMockChildProcess('test-value', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing with custom environment
      await adapter.execute({ command, env });

      // Then: Should merge with process environment
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Write-Output $env:CUSTOM_VAR'],
        expect.objectContaining({
          env: expect.objectContaining({
            CUSTOM_VAR: 'test-value'
          })
        })
      );
    });
  });

  describe('System Information', () => {
    it('should return comprehensive system information', () => {
      // Given: System is Windows
      // When: Getting system information
      const sysInfo = adapter.getSystemInfo();

      // Then: Should return Windows-specific information
      expect(sysInfo).toMatchObject({
        platform: 'win32',
        shell: 'powershell.exe',
        isWindows: true,
        hasWSL: false
      });
      expect(sysInfo).toHaveProperty('arch');
      expect(sysInfo).toHaveProperty('release');
      expect(sysInfo).toHaveProperty('hostname');
      expect(sysInfo).toHaveProperty('cpus');
      expect(sysInfo).toHaveProperty('memory');
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle commands that do not need conversion', async () => {
      // Given: A Windows-native PowerShell command
      const command = 'Get-Process | Where-Object {$_.CPU -gt 100}';
      const mockChild = createMockChildProcess('process list', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should execute as-is without conversion (with trailing space from pipeline conversion)
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Get-Process | Where-Object {$_.CPU -gt 100} '],
        expect.any(Object)
      );
    });

    it('should handle empty command gracefully', async () => {
      // Given: An empty command
      const command = '';
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing empty command
      await adapter.execute({ command });

      // Then: Should handle gracefully
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', ''],
        expect.any(Object)
      );
    });

    it('should handle commands with quotes and special characters', async () => {
      // Given: A command with quotes and special characters
      const command = 'grep "complex pattern with spaces" file.txt';
      const mockChild = createMockChildProcess('', '', 0);
      mockSpawn.mockReturnValue(mockChild);

      // When: Executing the command
      await adapter.execute({ command });

      // Then: Should preserve quotes in conversion
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        ['-Command', 'Select-String -Pattern "complex pattern with spaces" file.txt'],
        expect.any(Object)
      );
    });
  });
});

// Helper function to create mock child process
function createMockChildProcess(stdout: string, stderr: string, exitCode: number | null) {
  const mockChild = {
    stdout: {
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(Buffer.from(stdout)), 10);
        }
      })
    },
    stderr: {
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(Buffer.from(stderr)), 10);
        }
      })
    },
    on: vi.fn((event: string, callback: Function) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 20);
      }
      if (event === 'error' && exitCode === null) {
        // Will be triggered manually for error test cases
      }
    }),
    emit: vi.fn()
  };

  return mockChild;
}
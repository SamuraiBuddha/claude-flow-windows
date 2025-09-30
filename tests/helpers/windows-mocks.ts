import { vi } from 'vitest';
import { ChildProcess } from 'child_process';

/**
 * Windows-specific mock utilities for testing
 */

/**
 * Mock child process for Windows PowerShell commands
 */
export function createMockChildProcess(
  stdout: string = '',
  stderr: string = '',
  exitCode: number | null = 0,
  signal: string | null = null
): Partial<ChildProcess> {
  const mockChild = {
    stdout: {
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'data' && stdout) {
          // Simulate async data chunks
          setTimeout(() => {
            callback(Buffer.from(stdout));
          }, 10);
        }
        return mockChild.stdout;
      }),
      pipe: vi.fn(),
      readable: true,
      setEncoding: vi.fn()
    },
    stderr: {
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'data' && stderr) {
          setTimeout(() => {
            callback(Buffer.from(stderr));
          }, 15);
        }
        return mockChild.stderr;
      }),
      pipe: vi.fn(),
      readable: true,
      setEncoding: vi.fn()
    },
    stdin: {
      write: vi.fn(),
      end: vi.fn(),
      writable: true
    },
    on: vi.fn((event: string, callback: Function) => {
      if (event === 'close') {
        setTimeout(() => {
          callback(exitCode, signal);
        }, 20);
      } else if (event === 'exit') {
        setTimeout(() => {
          callback(exitCode, signal);
        }, 25);
      } else if (event === 'error') {
        if (exitCode !== 0 && stderr) {
          setTimeout(() => {
            callback(new Error(stderr));
          }, 5);
        }
      }
      return mockChild;
    }),
    once: vi.fn((event: string, callback: Function) => {
      return mockChild.on(event, callback);
    }),
    emit: vi.fn(),
    kill: vi.fn(),
    pid: Math.floor(Math.random() * 10000) + 1000,
    exitCode: null,
    signalCode: null,
    spawnargs: [],
    spawnfile: 'powershell.exe'
  };

  return mockChild;
}

/**
 * Mock Windows platform detection
 */
export function mockWindowsPlatform() {
  Object.defineProperty(process, 'platform', {
    value: 'win32',
    writable: false,
    configurable: true
  });
}

/**
 * Mock PowerShell execution results
 */
export const mockPowerShellResults = {
  getChildItem: `
    Directory: C:\\test

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----          1/20/2025   10:30 AM           1024 file1.txt
-a----          1/20/2025   10:31 AM           2048 file2.txt
d-----          1/20/2025   10:25 AM                subdir
  `,
  
  getProcess: `
ProcessName      Id  CPU(s)   WorkingSet(M)
-----------      --  ------   -------------
chrome         1234    45.2           256.8
node           5678    12.1            89.4
powershell     9012     2.3            45.6
  `,
  
  selectString: `
file1.txt:5:Found pattern in this line
file2.txt:12:Another pattern match here
  `,
  
  getContent: `
Line 1 of file content
Line 2 with some data
Line 3 with pattern
Line 4 final line
  `,
  
  invokeRestMethod: `
{
  "status": "success",
  "data": {
    "id": 123,
    "message": "API call successful"
  }
}
  `
};

/**
 * Mock WSL (Windows Subsystem for Linux) responses
 */
export const mockWSLResults = {
  checkWSL: 'Ubuntu-20.04',
  
  findCommand: `
./src/index.js
./src/utils.js
./tests/test.js
./config/settings.js
  `,
  
  grepCommand: `
src/index.js:15:const pattern = 'search_term';
src/utils.js:23:// Pattern matching function
tests/test.js:8:expect(result).toMatch(/pattern/);
  `,
  
  complexPipeline: `
agent_001  1234  supervisor  active
agent_002  5678  worker      idle
agent_003  9012  specialist  busy
  `
};

/**
 * Mock Windows file system operations
 */
export const mockWindowsFileSystem = {
  paths: {
    userProfile: 'C:\\Users\\TestUser',
    programFiles: 'C:\\Program Files',
    appData: 'C:\\Users\\TestUser\\AppData\\Roaming',
    temp: 'C:\\Temp',
    documents: 'C:\\Users\\TestUser\\Documents'
  },
  
  directoryListing: [
    { name: 'file1.txt', type: 'file', size: 1024 },
    { name: 'file2.txt', type: 'file', size: 2048 },
    { name: 'subdir', type: 'directory', size: 0 },
    { name: 'script.ps1', type: 'file', size: 512 }
  ],
  
  permissions: {
    read: true,
    write: true,
    execute: false,
    admin: false
  }
};

/**
 * Mock Windows service operations
 */
export const mockWindowsServices = {
  runningServices: [
    { name: 'Spooler', status: 'Running', startType: 'Automatic' },
    { name: 'BITS', status: 'Running', startType: 'Manual' },
    { name: 'Themes', status: 'Stopped', startType: 'Automatic' }
  ],
  
  serviceControl: {
    start: { status: 'success', message: 'Service started successfully' },
    stop: { status: 'success', message: 'Service stopped successfully' },
    restart: { status: 'success', message: 'Service restarted successfully' }
  }
};

/**
 * Mock elevated command execution
 */
export function mockElevatedExecution(command: string, result: string = '') {
  return createMockChildProcess(
    result || `Elevated execution of: ${command}`,
    '',
    0
  );
}

/**
 * Mock Windows registry operations
 */
export const mockWindowsRegistry = {
  read: {
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion': {
      'ProductName': 'Windows 11 Pro',
      'CurrentVersion': '10.0',
      'BuildNumber': '22000'
    }
  },
  
  write: {
    success: true,
    message: 'Registry value set successfully'
  }
};

/**
 * Mock Windows network operations
 */
export const mockWindowsNetwork = {
  netstat: `
Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    127.0.0.1:3000         0.0.0.0:0              LISTENING
  TCP    127.0.0.1:5432         0.0.0.0:0              LISTENING
  TCP    192.168.1.100:443      52.96.0.1:443          ESTABLISHED
  `,
  
  ipconfig: `
Windows IP Configuration

Ethernet adapter Ethernet:
   Connection-specific DNS Suffix  . : 
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
  `,
  
  ping: `
Pinging google.com [172.217.0.142] with 32 bytes of data:
Reply from 172.217.0.142: bytes=32 time=15ms TTL=56
Reply from 172.217.0.142: bytes=32 time=14ms TTL=56
Reply from 172.217.0.142: bytes=32 time=16ms TTL=56
Reply from 172.217.0.142: bytes=32 time=15ms TTL=56

Ping statistics for 172.217.0.142:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 14ms, Maximum = 16ms, Average = 15ms
  `
};

/**
 * Create a comprehensive Windows environment mock
 */
export function setupWindowsEnvironment() {
  mockWindowsPlatform();
  
  // Mock environment variables
  process.env.USERPROFILE = mockWindowsFileSystem.paths.userProfile;
  process.env.APPDATA = mockWindowsFileSystem.paths.appData;
  process.env.PROGRAMFILES = mockWindowsFileSystem.paths.programFiles;
  process.env.TEMP = mockWindowsFileSystem.paths.temp;
  process.env.COMSPEC = 'C:\\Windows\\System32\\cmd.exe';
  process.env.PROCESSOR_ARCHITECTURE = 'AMD64';
  process.env.OS = 'Windows_NT';
  
  return {
    cleanup: () => {
      // Restore original environment
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true
      });
    }
  };
}

/**
 * Assert Windows-specific command execution
 */
export function expectWindowsCommand(
  mockSpawn: any,
  expectedCommand: string,
  expectedArgs?: string[]
) {
  expect(mockSpawn).toHaveBeenCalledWith(
    'powershell.exe',
    expectedArgs || ['-Command', expectedCommand],
    expect.objectContaining({
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true
    })
  );
}

/**
 * Assert WSL bridge command execution
 */
export function expectWSLCommand(
  mockSpawn: any,
  expectedCommand: string
) {
  expect(mockSpawn).toHaveBeenCalledWith(
    'wsl.exe',
    ['--', 'bash', '-c', expectedCommand],
    expect.objectContaining({
      stdio: ['pipe', 'pipe', 'pipe']
    })
  );
}
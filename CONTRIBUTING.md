# Contributing to Claude Flow Windows

Thank you for your interest in contributing to Claude Flow Windows! This guide will help you get started with development, testing, and contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Testing](#testing)
5. [Windows Compatibility Requirements](#windows-compatibility-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)
8. [Documentation](#documentation)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed on your Windows development machine:

- **Windows 10/11** or **Windows Server 2019+**
- **Node.js 18.x LTS** or later
- **PowerShell 7.x** (recommended) or PowerShell 5.1+
- **Git for Windows** with proper line ending configuration
- **Visual Studio Code** or **Visual Studio** (recommended IDEs)
- **Windows Terminal** (recommended)

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```powershell
   git clone https://github.com/your-username/claude-flow-windows.git
   cd claude-flow-windows
   ```

3. **Configure Git for Windows development:**
   ```powershell
   git config core.autocrlf true
   git config core.eol crlf
   ```

4. **Install dependencies:**
   ```powershell
   npm install
   ```

5. **Build the project:**
   ```powershell
   npm run build
   ```

6. **Run tests:**
   ```powershell
   npm test
   ```

---

## Development Environment

### Recommended VS Code Extensions

Install these extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.powershell",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.test-adapter-converter",
    "ms-vscode.vscode-node-debug2"
  ]
}
```

### Development Scripts

```powershell
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Environment Variables

Create a `.env.development` file for local development:

```env
# Core Configuration
CLAUDE_FLOW_DEBUG=true
CLAUDE_FLOW_LOG_LEVEL=verbose
CLAUDE_FLOW_MEMORY=persistent

# Windows-Specific
CLAUDE_FLOW_SHELL=pwsh
CLAUDE_FLOW_WSL_ENABLED=true
CLAUDE_FLOW_WSL_DISTRO=Ubuntu-22.04

# Development
CLAUDE_FLOW_PORT=3001
CLAUDE_FLOW_HOST=localhost
CLAUDE_FLOW_CORS_ENABLED=true
```

---

## Code Style Guidelines

### TypeScript Style

We follow strict TypeScript coding standards:

```typescript
// ✅ Good: Use explicit types
interface AgentConfig {
  readonly type: AgentType;
  readonly name: string;
  readonly skills: string[];
  readonly context?: string;
}

// ✅ Good: Use meaningful names
const createSpecializedAgent = async (config: AgentConfig): Promise<Agent> => {
  // Implementation
};

// ❌ Bad: Avoid any types
const processData = (data: any) => {
  // Avoid this
};

// ✅ Good: Use proper error handling
class AgentSpawnError extends Error {
  constructor(
    message: string,
    public readonly agentType: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AgentSpawnError';
  }
}
```

### File Organization

```
src/
├── adapters/           # Windows shell adapters
│   ├── PowerShellAdapter.ts
│   ├── WSLBridge.ts
│   └── index.ts
├── agents/            # Agent management
│   ├── AgentManager.ts
│   ├── CognitiveAgent.ts
│   └── types.ts
├── coordinators/      # Swarm coordination
│   ├── SwarmCoordinator.ts
│   ├── TopologyManager.ts
│   └── index.ts
├── memory/           # Memory management
│   ├── MemoryStore.ts
│   ├── PersistentMemory.ts
│   └── types.ts
├── orchestration/    # Task orchestration
│   ├── TaskOrchestrator.ts
│   ├── WorkflowEngine.ts
│   └── index.ts
├── tools/           # MCP tool definitions
│   ├── index.ts
│   ├── swarm-tools.ts
│   └── windows-tools.ts
├── types/           # Shared type definitions
│   ├── global.ts
│   └── mcp.ts
└── utils/           # Utility functions
    ├── logger.ts
    ├── performance.ts
    └── windows-utils.ts
```

### Naming Conventions

```typescript
// Classes: PascalCase
class SwarmCoordinator {}
class AgentManager {}

// Interfaces: PascalCase with descriptive names
interface SwarmConfiguration {}
interface AgentCapabilities {}

// Functions: camelCase with descriptive verbs
function initializeSwarm() {}
function spawnSpecializedAgent() {}

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_MAX_AGENTS = 8;
const WINDOWS_SHELL_TIMEOUT = 5000;

// Files: kebab-case for multi-word names
// swarm-coordinator.ts
// agent-manager.ts
// windows-utils.ts
```

### Code Formatting

Use Prettier with these settings (`.prettierrc`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "endOfLine": "crlf"
}
```

---

## Testing

### Test Structure

We use Vitest for testing with comprehensive coverage requirements:

```typescript
// tests/agents/AgentManager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentManager } from '../../src/agents/AgentManager';

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('spawnAgent', () => {
    it('should spawn agent with correct configuration', async () => {
      // Arrange
      const config = {
        type: 'coder' as const,
        name: 'test-agent',
        skills: ['typescript', 'testing'],
      };

      // Act
      const agent = await agentManager.spawnAgent(config);

      // Assert
      expect(agent.id).toBeDefined();
      expect(agent.type).toBe('coder');
      expect(agent.name).toBe('test-agent');
      expect(agent.skills).toEqual(['typescript', 'testing']);
    });

    it('should handle spawn failures gracefully', async () => {
      // Arrange
      const invalidConfig = {
        type: 'invalid' as any,
      };

      // Act & Assert
      await expect(agentManager.spawnAgent(invalidConfig)).rejects.toThrow(
        'Invalid agent type'
      );
    });
  });
});
```

### Windows-Specific Testing

```typescript
// tests/adapters/PowerShellAdapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PowerShellAdapter } from '../../src/adapters/PowerShellAdapter';

describe('PowerShellAdapter', () => {
  let adapter: PowerShellAdapter;

  beforeEach(() => {
    adapter = new PowerShellAdapter();
  });

  describe('Windows commands', () => {
    it('should execute PowerShell commands', async () => {
      const result = await adapter.execute('Get-Process -Name "explorer"');
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('explorer');
    });

    it('should handle elevated commands appropriately', async () => {
      const result = await adapter.execute('Get-Service', { elevated: true });
      
      expect(result.requiresElevation).toBe(true);
    });

    it('should convert Unix commands to PowerShell', () => {
      expect(adapter.convertCommand('ls -la')).toBe('Get-ChildItem -Force');
      expect(adapter.convertCommand('ps aux')).toBe('Get-Process | Format-Table');
    });
  });
});
```

### Test Categories

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **Windows Compatibility Tests**: Test Windows-specific functionality
4. **Performance Tests**: Test performance requirements
5. **MCP Protocol Tests**: Test MCP server compliance

### Running Tests

```powershell
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/agents/AgentManager.test.ts

# Run tests in watch mode
npm run test:watch

# Run Windows-specific tests only
npm test -- --testPathPattern=windows
```

### Coverage Requirements

- **Minimum overall coverage**: 80%
- **Critical components**: 90%+ coverage
- **Windows adapters**: 95%+ coverage
- **MCP tools**: 85%+ coverage

---

## Windows Compatibility Requirements

### Cross-Platform Considerations

All code must work on Windows while maintaining cross-platform compatibility:

```typescript
// ✅ Good: Use path module for cross-platform paths
import path from 'path';
const configPath = path.join(process.env.APPDATA!, 'claude-flow', 'config.json');

// ❌ Bad: Hardcoded Windows paths
const configPath = 'C:\\Users\\...\\AppData\\Roaming\\claude-flow\\config.json';

// ✅ Good: Use os module for platform detection
import os from 'os';
const isWindows = os.platform() === 'win32';

// ✅ Good: Handle line endings properly
const content = data.replace(/\r?\n/g, os.EOL);
```

### PowerShell Integration

```typescript
// PowerShell command execution
interface PowerShellOptions {
  elevated?: boolean;
  workingDirectory?: string;
  timeout?: number;
  encoding?: string;
}

class PowerShellAdapter {
  async execute(
    command: string, 
    options: PowerShellOptions = {}
  ): Promise<PowerShellResult> {
    // Implementation must handle:
    // - Command escaping
    // - Error handling
    // - Timeout management
    // - Elevation requests
  }
}
```

### WSL Bridge Requirements

```typescript
// WSL integration must be optional
interface WSLBridgeOptions {
  distribution?: string;
  fallbackToWindows?: boolean;
  timeout?: number;
}

class WSLBridge {
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Test WSL availability without throwing
      await this.execute('wsl --list --quiet');
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }
  }
}
```

### File System Compatibility

```typescript
// Handle Windows file system specifics
class WindowsFileSystemUtils {
  // Handle long paths (> 260 characters)
  static enableLongPaths(path: string): string {
    if (os.platform() === 'win32' && path.length > 260) {
      return `\\\\?\\${path}`;
    }
    return path;
  }

  // Handle Windows reserved names
  static isReservedName(filename: string): boolean {
    const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];
    return reserved.includes(filename.toUpperCase());
  }
}
```

---

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass:**
   ```powershell
   npm test
   npm run lint
   npm run type-check
   ```

2. **Test on Windows:**
   - Test with PowerShell 5.1 and 7.x
   - Test with and without WSL
   - Test elevated and non-elevated scenarios

3. **Update documentation** if needed

4. **Add appropriate tests** for new functionality

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Windows Compatibility
- [ ] Tested on Windows 10/11
- [ ] Tested with PowerShell 5.1+
- [ ] Tested with PowerShell 7.x
- [ ] WSL bridge functionality tested (if applicable)
- [ ] Elevated permissions tested (if applicable)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Windows-specific tests added (if applicable)
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Windows compatibility** verification
4. **Performance impact** assessment
5. **Documentation** review

---

## Issue Reporting

### Bug Reports

Use this template for bug reports:

```markdown
**Bug Description**
Clear description of the bug.

**Environment**
- OS: Windows 10/11/Server
- PowerShell Version: 
- Node.js Version:
- Claude Flow Windows Version:
- WSL Status: Available/Not Available

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happened.

**Logs**
```powershell
# Include relevant logs
```

**Additional Context**
Any other relevant information.
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the proposed feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Windows Considerations**
Any Windows-specific requirements or considerations.

**Alternatives**
Any alternative solutions considered.
```

---

## Documentation

### Documentation Standards

1. **API Documentation**: Use TSDoc comments
2. **User Guides**: Write in Markdown
3. **Code Comments**: Explain why, not what
4. **Examples**: Provide Windows-specific examples

### TSDoc Comments

```typescript
/**
 * Spawns a new agent with the specified configuration.
 * 
 * @param config - Agent configuration including type, name, and skills
 * @param options - Optional spawn options for Windows compatibility
 * @returns Promise resolving to the spawned agent instance
 * 
 * @throws {AgentSpawnError} When agent cannot be spawned due to configuration issues
 * @throws {ResourceLimitError} When maximum agent limit is reached
 * 
 * @example
 * ```typescript
 * const agent = await agentManager.spawnAgent({
 *   type: 'coder',
 *   name: 'python-specialist',
 *   skills: ['python', 'django', 'api-development']
 * });
 * ```
 * 
 * @example Windows PowerShell specialist
 * ```typescript
 * const agent = await agentManager.spawnAgent({
 *   type: 'devops',
 *   name: 'powershell-admin',
 *   skills: ['powershell', 'windows-admin', 'active-directory']
 * });
 * ```
 */
async spawnAgent(
  config: AgentConfig,
  options?: SpawnOptions
): Promise<Agent> {
  // Implementation
}
```

### Documentation Checklist

- [ ] All public APIs documented with TSDoc
- [ ] Windows-specific behavior noted
- [ ] Examples include PowerShell commands
- [ ] Cross-references to related functionality
- [ ] Performance considerations noted
- [ ] Security implications documented

---

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussion
- **Discord**: Real-time chat (link in README)

### Development Questions

When asking for help:

1. **Provide context**: What are you trying to achieve?
2. **Include environment**: Windows version, PowerShell version, etc.
3. **Share code**: Minimal reproducible example
4. **Include logs**: Relevant error messages or debug output

### Mentorship

New contributors can request mentorship for:

- **First-time contributions**
- **Windows-specific development**
- **MCP protocol implementation**
- **Performance optimization**

---

## Recognition

Contributors are recognized in:

- **README.md**: Major contributors
- **CHANGELOG.md**: Release contributions
- **GitHub releases**: Feature contributions
- **Documentation**: Example credits

### Contribution Types

We recognize various types of contributions:

- 🔧 **Code**: Features, bug fixes, optimizations
- 📚 **Documentation**: Guides, API docs, examples
- 🧪 **Testing**: Test cases, test infrastructure
- 🐛 **Bug Reports**: Quality bug reports with reproduction steps
- 💡 **Ideas**: Feature suggestions and discussions
- 🎨 **Design**: UI/UX improvements
- 🌐 **Translation**: Documentation translation
- 🔍 **Review**: Code and documentation reviews

---

Thank you for contributing to Claude Flow Windows! Your help makes this project better for the entire Windows development community.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful** of differing viewpoints and experiences
- **Be collaborative** and helpful to other contributors
- **Be constructive** in feedback and criticism
- **Focus on the best** for the community and project
- **Show empathy** towards other community members

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to unacceptable behavior.
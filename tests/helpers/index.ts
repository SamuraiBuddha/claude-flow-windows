/**
 * Test helpers index - exports all testing utilities
 */

// Windows-specific mocking utilities
export {
  createMockChildProcess,
  mockWindowsPlatform,
  mockPowerShellResults,
  mockWSLResults,
  mockWindowsFileSystem,
  mockWindowsServices,
  mockElevatedExecution,
  mockWindowsRegistry,
  mockWindowsNetwork,
  setupWindowsEnvironment,
  expectWindowsCommand,
  expectWSLCommand
} from './windows-mocks';

// General test utilities
export {
  loadFixture,
  createMCPResponse,
  TestDataGenerator,
  TimeUtils,
  MockServerUtils,
  WindowsAssertions,
  PerformanceUtils,
  CleanupUtils
} from './test-utilities';

// Re-export commonly used types for convenience
export type { ChildProcess } from 'child_process';

/**
 * Common test setup function that configures Windows environment
 */
export function setupTestEnvironment() {
  const windowsEnv = setupWindowsEnvironment();
  
  // Common test setup
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    CleanupUtils.runCleanup();
  });
  
  afterAll(() => {
    windowsEnv.cleanup();
    CleanupUtils.reset();
  });
  
  return windowsEnv;
}

/**
 * Quick fixture loader with type safety
 */
export const fixtures = {
  swarmConfigs: () => loadFixture('swarm-configs.json'),
  mockResponses: () => loadFixture('mock-responses.json'),
  testData: () => loadFixture('test-data.json')
};

/**
 * Common assertions for Windows testing
 */
export const windowsExpects = WindowsAssertions;

/**
 * Performance testing shortcuts
 */
export const performance = PerformanceUtils;

/**
 * Test data generation shortcuts
 */
export const generate = TestDataGenerator;
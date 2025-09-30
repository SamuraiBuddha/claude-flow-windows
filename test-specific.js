// Test the specific conversion issue
const fs = require('fs');
const path = require('path');

// Read the compiled JavaScript file
const adapterPath = path.join(__dirname, 'dist', 'adapters', 'WindowsShellAdapter.js');

if (!fs.existsSync(adapterPath)) {
  console.log('Compiled adapter not found. Please run npm run build first.');
  process.exit(1);
}

const { WindowsShellAdapter } = require(adapterPath);

const adapter = new WindowsShellAdapter();

// Test the problematic pipeline
const testCommand = 'ls -la | grep ".txt"';
console.log('Testing command:', testCommand);

// Access the private method via mockExecute to bypass actual execution
// We'll mock the execute method to just return the converted command
const originalExecute = adapter.execute;
adapter.execute = function(args) {
  console.log('Converted command:', args.command);
  return Promise.resolve({ content: [{ type: 'text', text: 'mocked result' }] });
};

// Mock process.platform to ensure Windows conversion
Object.defineProperty(process, 'platform', {
  value: 'win32',
  configurable: true
});

// Run the test
adapter.execute({ command: testCommand })
  .then(() => {
    console.log('Test completed');
  })
  .catch(err => {
    console.error('Test failed:', err);
  });
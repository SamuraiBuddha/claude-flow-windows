// Test the conversion directly
const { WindowsShellAdapter } = require('./dist/adapters/WindowsShellAdapter.js');

const adapter = new WindowsShellAdapter();

// Test the conversion method directly
const testCommand = 'ls -la | grep ".txt"';
console.log('Original command:', testCommand);

try {
  const converted = adapter.convertToWindows(testCommand);
  console.log('Converted command:', converted);
  console.log('Expected: Get-ChildItem -la | Select-String -Pattern ".txt"');
  console.log('Match?', converted === 'Get-ChildItem -la | Select-String -Pattern ".txt"');
} catch (error) {
  console.error('Error calling convertToWindows:', error.message);
  console.log('Method might be private. Trying different approach...');
  
  // Let's try by examining what execute would call
  const originalSpawn = require('child_process').spawn;
  require('child_process').spawn = function(command, args, options) {
    console.log('Would execute:', command, args);
    return originalSpawn('echo', ['test'], options);
  };
  
  adapter.execute({ command: testCommand })
    .then(() => console.log('Execute test completed'))
    .catch(err => console.error('Execute test failed:', err));
}
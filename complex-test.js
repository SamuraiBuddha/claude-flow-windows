// Test the complex pipeline conversion
const { WindowsShellAdapter } = require('./dist/adapters/WindowsShellAdapter.js');

const adapter = new WindowsShellAdapter();

const testCommand = 'cat file.txt | grep "error" | grep -v "warning"';
const converted = adapter.convertToWindows(testCommand);

console.log('Original command:', testCommand);
console.log('Converted command:', `"${converted}"`);
console.log('Test expects:', `"Get-Content file.txt | Select-String -Pattern "error" | Select-String -Pattern -v "warning""`);

// What it should probably be (correct PowerShell):
console.log('Correct PowerShell would be:', `"Get-Content file.txt | Select-String -Pattern "error" | Select-String -Pattern "warning" -NotMatch "`);

// Test each part separately
console.log('\nTesting individual conversions:');
console.log('cat file.txt ->', adapter.convertToWindows('cat file.txt'));
console.log('grep "error" ->', adapter.convertToWindows('grep "error"'));
console.log('grep -v "warning" ->', adapter.convertToWindows('grep -v "warning"'));
// Test if the trailing space is the issue
const { WindowsShellAdapter } = require('./dist/adapters/WindowsShellAdapter.js');

const adapter = new WindowsShellAdapter();

const testCommand = 'ls -la | grep ".txt"';
const converted = adapter.convertToWindows(testCommand);

console.log('Converted command:', `"${converted}"`);
console.log('Expected with space:', `"Get-ChildItem -la | Select-String -Pattern ".txt" "`);
console.log('Expected without space:', `"Get-ChildItem -la | Select-String -Pattern ".txt""`);

console.log('Match with space?', converted === 'Get-ChildItem -la | Select-String -Pattern ".txt" ');
console.log('Match without space?', converted === 'Get-ChildItem -la | Select-String -Pattern ".txt"');

console.log('Length converted:', converted.length);
console.log('Length expected with space:', 'Get-ChildItem -la | Select-String -Pattern ".txt" '.length);
console.log('Length expected without space:', 'Get-ChildItem -la | Select-String -Pattern ".txt"'.length);
// Debug the WindowsShellAdapter
const { WindowsShellAdapter } = require('./dist/adapters/WindowsShellAdapter.js');

const adapter = new WindowsShellAdapter();

console.log('Platform:', process.platform);
console.log('Adapter isWindows:', adapter.isWindows);

// Test if we can access the conversion method directly
console.log('Adapter properties:', Object.getOwnPropertyNames(adapter));
console.log('Adapter prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));

// Let's try to create our own test
const testCommand = 'ls -la | grep ".txt"';
console.log('Test command:', testCommand);

// Mock the execute call to see what convertToWindows returns
const originalConvertToWindows = adapter.convertToWindows;
if (originalConvertToWindows) {
    console.log('Found convertToWindows method');
} else {
    console.log('convertToWindows method not found - it might be private');
}
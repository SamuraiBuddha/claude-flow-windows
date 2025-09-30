// Quick test script to verify WindowsShellAdapter conversion
const { WindowsShellAdapter } = require('./dist/adapters/WindowsShellAdapter.js');

const adapter = new WindowsShellAdapter();

// Test the problematic case
console.log('Testing pipeline conversion:');
console.log('Input: ls -la | grep ".txt"');

// Use reflection to call private method
const convertToWindows = adapter.convertToWindows || adapter.convertPipeline;
if (convertToWindows) {
    try {
        const result = convertToWindows.call(adapter, 'ls -la | grep ".txt"');
        console.log('Output:', result);
        console.log('Expected: Get-ChildItem -la | Select-String -Pattern ".txt" ');
        console.log('Match?', result === 'Get-ChildItem -la | Select-String -Pattern ".txt" ');
    } catch (error) {
        console.error('Error:', error);
    }
} else {
    console.log('Method not found');
}
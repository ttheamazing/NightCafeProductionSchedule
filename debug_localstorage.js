// Debug script to check localStorage functionality
console.log('=== DEBUG: localStorage check ===');

// Check if localStorage is available
if (typeof localStorage === 'undefined') {
    console.error('localStorage is not available in this browser!');
} else {
    console.log('localStorage is available');
    
    // List all items in localStorage
    console.log('Current localStorage contents:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log();
    }
    
    // Test writing to localStorage
    try {
        localStorage.setItem('debug_test', 'This is a test ' + new Date().toISOString());
        console.log('Successfully wrote to localStorage');
        
        // Read it back
        const testValue = localStorage.getItem('debug_test');
        console.log('Read back test value:', testValue);
        
        // Clean up
        localStorage.removeItem('debug_test');
    } catch (e) {
        console.error('Error writing to localStorage:', e);
    }
}

// Check if we're in private browsing mode (which can affect localStorage)
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('Not in private browsing mode');
} catch (e) {
    console.error('Possibly in private browsing mode, which can affect localStorage:', e);
}

console.log('=== END DEBUG ===');

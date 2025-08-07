// Debug script to check if React is working
console.log('Debug script loaded');
console.log('Current URL:', window.location.href);
console.log('Root element exists:', !!document.getElementById('root'));

// Check if any errors occurred during rendering
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Check DOM ready state
console.log('Document ready state:', document.readyState);

export default {};
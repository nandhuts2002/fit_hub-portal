import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Use the generated Tailwind CSS build
import './generated.css';
import './debug.js';
import SessionManager from './utils/sessionManager';

console.log('Index.js loaded - React app starting...');

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found! Make sure there is a div with id="root" in your HTML.');
} else {
  console.log('Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering React app:', error);
  }
}

// Function to check authentication and redirect if needed
const checkAuthAndRedirect = () => {
  try {
    const path = window.location.pathname;
    const isAuthenticated = SessionManager.isAuthenticated();
    
    console.log('Auth check:', { path, isAuthenticated });
    
    const protectedMatchers = [
      '/user-home',
      '/admin-home',
      '/trainer-home',
      '/tutorials',
      '/queries',
      /^\/queries\//,
      '/shop',
      '/wishlist',
      '/cart',
      '/community',
      '/orders',
      /^\/orders\//,
    ];

    const isProtected = protectedMatchers.some((m) =>
      typeof m === 'string' ? m === path : m.test(path)
    );

    console.log('Route protection check:', { path, isProtected, isAuthenticated });

    // Only redirect if user is on a protected route AND not authenticated
    if (isProtected && !isAuthenticated) {
      console.log('Redirecting to login from protected route');
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const from = encodeURIComponent(`${path}${search}${hash}`);
      window.location.replace(`/login?from=${from}`);
    }
  } catch (err) {
    console.error('Auth check error:', err);
  }
};

// Check authentication on page load
checkAuthAndRedirect();

// Ensure auth is re-validated on back/forward cache restores
window.addEventListener('pageshow', (event) => {
  try {
    // Check on both BFCache restores and regular page shows
    const isBfcacheRestore = event.persisted === true;
    
    if (isBfcacheRestore) {
      // Add a small delay for BFCache restores to ensure localStorage is accessible
      setTimeout(checkAuthAndRedirect, 100);
    } else {
      // Immediate check for regular page shows
      checkAuthAndRedirect();
    }
  } catch (err) {
    // no-op
  }
});

// Check authentication on back/forward button navigation
window.addEventListener('popstate', () => {
  setTimeout(checkAuthAndRedirect, 50);
});


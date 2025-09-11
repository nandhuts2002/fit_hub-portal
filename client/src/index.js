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

// Ensure auth is re-validated on back/forward cache restores
window.addEventListener('pageshow', (event) => {
  try {
    // Only enforce on true BFCache restores to avoid false positives
    const isBfcacheRestore = event.persisted === true;

    if (!isBfcacheRestore) return;

    const path = window.location.pathname;
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
    ];

    const isProtected = protectedMatchers.some((m) =>
      typeof m === 'string' ? m === path : m.test(path)
    );

    if (isProtected && !SessionManager.isAuthenticated()) {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const from = encodeURIComponent(`${path}${search}${hash}`);
      window.location.replace(`/login?from=${from}`);
    }
  } catch (err) {
    // no-op
  }
});


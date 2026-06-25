import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Use the generated Tailwind CSS build
import './generated.css';
import SessionManager from './utils/sessionManager';

console.log('Index.js loaded - React app starting...');

// Handle redirect from 404.html
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  console.log('Restoring URL from 404 redirect:', redirect);
  sessionStorage.removeItem('redirect');
  // Use window.location.replace instead of history.replaceState for more reliable redirect
  window.location.replace(redirect);
} else {
  // Check if we're on index.html with query parameters and redirect appropriately
  if (window.location.pathname === '/index.html') {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) {
      try {
        const decodedFrom = decodeURIComponent(from);
        console.log('Redirecting from index.html to:', decodedFrom);
        // Remove the query parameter and redirect to the proper path
        window.location.replace(decodedFrom);
      } catch (e) {
        console.error('Error decoding redirect path:', e);
        // Fallback to home
        window.location.replace('/');
      }
    }
  }
}

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

// Authentication is now handled by ProtectedRoute components in React Router
// No need for global authentication checks here
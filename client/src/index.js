import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Use the generated Tailwind CSS build
import './generated.css';
import './debug.js';
import SessionManager from './utils/sessionManager';

console.log('Index.js loaded - React app starting...');

// Handle redirect from 404.html
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  console.log('Restoring URL from 404 redirect:', redirect);
  sessionStorage.removeItem('redirect');
  window.history.replaceState(null, '', redirect);
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
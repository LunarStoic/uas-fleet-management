// =============================================================================
// main.jsx — React Application Entry Point
// =============================================================================
// Mounts the App component to the DOM. Uses StrictMode for development
// warnings (double-rendering in dev to catch side effects).
// =============================================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

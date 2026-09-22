import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { setupGlobalFetchInterceptor, initApiKeepAlive } from './utils/api';

// Initialize global fetch direct routing to bypass proxy 429 errors & start backend keep-alive
setupGlobalFetchInterceptor();
initApiKeepAlive();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

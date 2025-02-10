import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { msalConfig } from './authConfig';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import './index.css';
import './index.js';
import App from './App.jsx'
const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
)

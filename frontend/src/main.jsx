import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { MockAuth0Provider } from './api/mockAuth0.jsx';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './index.css';

// Use mock Auth0 if credentials not configured
const USE_MOCK_AUTH = !import.meta.env.VITE_AUTH0_DOMAIN || !import.meta.env.VITE_AUTH0_CLIENT_ID;

const AuthWrapper = USE_MOCK_AUTH ? MockAuth0Provider : Auth0Provider;
const authProps = USE_MOCK_AUTH ? {} : {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE
  },
  cacheLocation: 'localstorage'
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthWrapper {...authProps}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </AuthWrapper>
  </StrictMode>,
);

// Mock Auth0 Provider for development without Auth0 setup
import { createContext, useContext, useState } from 'react';

const MockAuth0Context = createContext();

export const MockAuth0Provider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <MockAuth0Context.Provider value={{
      isAuthenticated,
      isLoading: false,
      user,
      loginWithRedirect: async (options) => {
        console.log('Mock login with options:', options);
        // Simulate login
        setIsAuthenticated(true);
        setUser({
          sub: 'mock-user-123',
          email: 'demo@craftconnect.com',
          given_name: 'Demo',
          family_name: 'User'
        });
      },
      logout: () => {
        setIsAuthenticated(false);
        setUser(null);
      },
      getAccessTokenSilently: async () => 'mock-token'
    }}>
      {children}
    </MockAuth0Context.Provider>
  );
};

export const useAuth0 = () => {
  const context = useContext(MockAuth0Context);
  if (!context) {
    throw new Error('useAuth0 must be used within MockAuth0Provider');
  }
  return context;
};

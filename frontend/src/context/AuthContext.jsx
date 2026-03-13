import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api/auth0Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user: auth0User, isAuthenticated, isLoading, loginWithRedirect, logout: auth0Logout, getAccessTokenSilently } = useAuth0();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!isAuthenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchUser();
    }
  }, [isAuthenticated, isLoading]);

  const isAdmin = user?.role === 'admin';
  const isArtisan = user?.role === 'artisan';
  const isBuyer = user?.role === 'buyer';

  return (
    <AuthContext.Provider value={{
      user,
      loading: loading || isLoading,
      isAdmin,
      isArtisan,
      isBuyer,
      login: () => loginWithRedirect(),
      logout: () => auth0Logout({ logoutParams: { returnTo: window.location.origin } }),
      getAccessToken: getAccessTokenSilently,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

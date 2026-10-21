import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../lib/api.js';

const AuthContext = createContext(null);

// Load the existing server session once, then share its user state throughout the app.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // The server identifies the user from its HTTP-only cookie; no password is kept here.
    request('/api/auth/me')
      .then((result) => setUser(result.user))
      .catch((error) => setAuthError(error.message))
      .finally(() => setLoading(false));
  }, []);

  // Update shared auth state after login/logout/profile changes and clear stale errors.
  const updateUser = (nextUser) => {
    setUser(nextUser);
    setAuthError(null);
  };
  const clearAuthError = () => setAuthError(null);
  const value = useMemo(
    () => ({ user, setUser: updateUser, loading, authError, clearAuthError }),
    [user, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Fail early with a useful message if a component is rendered outside the provider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}

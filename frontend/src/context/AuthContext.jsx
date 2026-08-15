import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/auth/me')
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await apiClient.post('/api/auth/login', { email, password });
    setUser(data);
    return data;
  }

  async function register(email, password) {
    const data = await apiClient.post('/api/auth/register', { email, password });
    setUser(data);
    return data;
  }

  async function logout() {
    await apiClient.post('/api/auth/logout');
    setUser(null);
  }

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
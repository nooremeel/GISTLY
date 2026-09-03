import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profilePicture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<AuthUser, 'profilePicture'>>) => Promise<AuthUser>;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount — a successful /me call means the httpOnly
  // cookie is still valid and we have a logged-in user.
  useEffect(() => {
    apiClient
      .get<AuthUser>('/api/auth/me')
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    const data = await apiClient.post<AuthUser>('/api/auth/login', { email, password });
    setUser(data);
    return data;
  }

  async function register(email: string, password: string): Promise<AuthUser> {
    const data = await apiClient.post<AuthUser>('/api/auth/register', { email, password });
    setUser(data);
    return data;
  }

  async function logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
    setUser(null);
  }

  async function updateProfile(
    data: Partial<Pick<AuthUser, 'profilePicture'>>
  ): Promise<AuthUser> {
    const updatedUser = await apiClient.put<AuthUser>('/api/auth/me', data);
    setUser(updatedUser);
    return updatedUser;
  }

  const value: AuthContextValue = { user, loading, login, register, logout, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

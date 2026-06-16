'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  accountId: string;
  username: string;
  role: string;
  token: string;
  features: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

async function fetchFeatures(): Promise<Record<string, boolean>> {
  try {
    const res = await api.get('/cpanel/account');
    return (res.data.data.features as Record<string, boolean>) || {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cpanel_user');
    if (stored) {
      try {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
        // Refresh features in background so sidebar reflects any admin changes
        fetchFeatures().then((features) => {
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, features };
            localStorage.setItem('cpanel_user', JSON.stringify(updated));
            return updated;
          });
        });
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/cpanel/login', { username, password });
    const { token, role, accountId } = res.data.data;

    // Set token in localStorage first so the api interceptor picks it up for the features call
    localStorage.setItem('cpanel_token', token);

    const features = await fetchFeatures();

    const userData: User = { accountId, username, role, token, features };
    localStorage.setItem('cpanel_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cpanel_token');
    localStorage.removeItem('cpanel_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

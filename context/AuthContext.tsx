'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { identifyUser, resetUser } from '@/lib/posthog';

export interface AuthUser {
  convexUserId: string;
  workosUserId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          identifyUser(data.user.email, { role: data.user.role });
        }
      } catch (error) {
        console.error('Session fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const login = () => {
    const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || `${window.location.origin}/api/auth/callback`;
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || '';
    const url = `https://api.workos.com/user_management/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&provider=authkit`;
    window.location.href = url;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      resetUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

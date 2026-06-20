'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    if (!response.ok) {
      setUser(null);
      return;
    }

    const data = (await response.json()) as { user: User | null };
    setUser(data.user);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await refreshUser();
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const signInWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, signInWithGoogle, signOut }),
    [user, loading, refreshUser, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

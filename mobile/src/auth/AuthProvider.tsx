import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from './authStore';
import type { AuthSession, AuthUser } from './types';
import { http } from '../api/http';

type AuthState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'authed'; token: string; user: AuthUser };

type AuthContextValue = {
  state: AuthState;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const SESSION_KEY = 'fithub_session_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const hydrate = async () => {
    setState({ status: 'loading' });
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (!raw) {
        setAuthToken(null);
        setState({ status: 'guest' });
        return;
      }
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.token || !parsed?.user?.email) {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        setAuthToken(null);
        setState({ status: 'guest' });
        return;
      }
      setAuthToken(parsed.token);
      setState({ status: 'authed', token: parsed.token, user: parsed.user });
    } catch {
      setAuthToken(null);
      setState({ status: 'guest' });
    }
  };

  useEffect(() => {
    void hydrate();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const res = await http.post('/login', { email, password });
    const token = res.data?.token as string;
    const user = res.data?.user as AuthUser;
    if (!token || !user?.email) throw new Error('Invalid login response');

    const session: AuthSession = { token, user };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    setAuthToken(token);
    setState({ status: 'authed', token, user });
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setAuthToken(null);
    setState({ status: 'guest' });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ state, signInWithPassword, signOut, hydrate }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}


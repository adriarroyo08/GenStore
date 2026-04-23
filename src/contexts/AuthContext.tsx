import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/apiClient';
import type { User, AuthState, LoginCredentials, SignupData } from '../types/auth';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Build user from Supabase session (no API call needed)
  const buildUserFromSession = useCallback(async (): Promise<User | null> => {
    try {
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (!supaUser) return null;
      const meta = supaUser.user_metadata || {};
      return {
        id: supaUser.id,
        email: supaUser.email ?? '',
        username: meta.username ?? '',
        nombre: meta.nombre ?? meta.name ?? '',
        apellidos: meta.apellidos ?? '',
        role: meta.role ?? 'customer',
      };
    } catch {
      return null;
    }
  }, []);

  // Load user profile from API, fallback to Supabase session data
  const loadProfile = useCallback(async () => {
    try {
      const profile = await apiClient.get<User>('/auth/me');
      setState({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      // API failed — fallback to Supabase session
      const fallbackUser = await buildUserFromSession();
      if (fallbackUser) {
        setState({ user: fallbackUser, isAuthenticated: true, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  }, [buildUserFromSession]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // First set user immediately from session to avoid delay
          const supaUser = session.user;
          const meta = supaUser.user_metadata || {};
          setState({
            user: {
              id: supaUser.id,
              email: supaUser.email ?? '',
              username: meta.username ?? '',
              nombre: meta.nombre ?? meta.name ?? '',
              apellidos: meta.apellidos ?? '',
              role: meta.role ?? 'customer',
            },
            isAuthenticated: true,
            isLoading: false,
          });
          // Then try to enrich with API profile (has role from DB)
          loadProfile();
        } else {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile();
      else setState(s => ({ ...s, isLoading: false }));
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // If identifier looks like a username (not an email), use API to resolve
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email);
    if (!isEmail) {
      // Login via API which resolves username → email
      const data = await apiClient.post<any>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      if (data.error) throw new Error(data.error);
      // Set session from API tokens
      const { error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (error) throw new Error('Credenciales inválidas');
    } else {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message);
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    await apiClient.post('/auth/signup', {
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      apellidos: data.apellidos,
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

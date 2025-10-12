"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from './auth-service';
import { AuthUser, AuthSession, AuthError, SignUpFormData } from './auth-types';
import { UsersService } from './services/users.service';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpFormData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Helper function to fetch and merge user profile data
  const fetchUserProfile = async (authUser: AuthUser): Promise<AuthUser> => {
    try {
      const userProfile = await UsersService.getUserProfile();
        return {
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            avatar_url: userProfile.avatar_url,
            username: userProfile.username ?? undefined,
          }
        };
    } catch (error) {
      console.warn('Failed to fetch user profile, using auth user data only:', error);
      return authUser;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const currentSession = await authService.getCurrentSession();
        if (currentSession) {
          setSession(currentSession);
          // Fetch user profile data and merge with auth user
          const userWithProfile = await fetchUserProfile(currentSession.user);
          setUser(userWithProfile);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError({
          message: err instanceof Error ? err.message : 'Authentication initialization failed',
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        
        if (session) {
          setSession(session);
          // Fetch user profile data and merge with auth user
          const userWithProfile = await fetchUserProfile(session.user);
          setUser(userWithProfile);
        } else {
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signIn({ email, password });
      
      if (!result.success) {
        setError(result.error || { message: 'Sign in failed' });
        return { success: false, error: result.error?.message };
      }

      // Immediately hydrate session/user locally to avoid redirect races
      const currentSession = await authService.getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
        // Fetch user profile data and merge with auth user
        const userWithProfile = await fetchUserProfile(currentSession.user);
        setUser(userWithProfile);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError({ message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpFormData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signUp(data);
      
      if (!result.success) {
        setError(result.error || { message: 'Sign up failed' });
        return { success: false, error: result.error?.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError({ message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signOut();
      
      if (!result.success) {
        setError(result.error || { message: 'Sign out failed' });
        return { success: false, error: result.error?.message };
      }

      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError({ message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.resendVerification({ email });
      
      if (!result.success) {
        setError(result.error || { message: 'Resend verification failed' });
        return { success: false, error: result.error?.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Resend verification failed';
      setError({ message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const result = await authService.refreshSession();
      if (result.success && result.data) {
        setSession(result.data);
        setUser(result.data.user);
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resendVerification,
    isAuthenticated: !!user && !!session,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
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

// Custom hook for protected routes
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  
  return {
    user,
    loading,
    isAuthenticated,
    isReady: !loading,
  };
}

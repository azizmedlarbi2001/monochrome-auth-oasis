
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('Checking admin status for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      const isAdminUser = !!data;
      console.log('Admin status result:', isAdminUser);
      setIsAdmin(isAdminUser);
    } catch (error) {
      console.error('Exception checking admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Initializing auth context');
    
    let isMounted = true;

    // Clear any existing invalid sessions first
    const clearInvalidSession = async () => {
      try {
        // Try to get the current session to test if tokens are valid
        const { data: { session: testSession }, error } = await supabase.auth.getSession();
        
        if (error && (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token'))) {
          console.log('Detected invalid tokens, clearing localStorage');
          // Force clear the session from localStorage
          await supabase.auth.signOut({ scope: 'local' });
          if (isMounted) {
            clearAuthState();
          }
          return true; // Indicates we cleared invalid session
        }
        return false; // No clearing needed
      } catch (error) {
        console.error('Error during session validation:', error);
        if (isMounted) {
          clearAuthState();
        }
        return true;
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change event:', event, newSession?.user?.email || 'No user');
        
        if (!isMounted) return;

        // Handle different auth events
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !newSession)) {
          console.log('User signed out or token refresh failed, clearing state');
          clearAuthState();
          return;
        }

        if (event === 'SIGNED_IN' || (event === 'TOKEN_REFRESHED' && newSession)) {
          console.log('User signed in or token refreshed successfully');
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession?.user) {
            // Use setTimeout to prevent potential deadlocks
            setTimeout(() => {
              if (isMounted) {
                checkAdminStatus(newSession.user.id);
              }
            }, 100);
          } else {
            setIsAdmin(false);
          }
        }
        
        // Mark loading as complete
        setIsLoading(false);
      }
    );

    // Initialize auth state
    const initializeAuth = async () => {
      // First clear any invalid sessions
      const wasCleared = await clearInvalidSession();
      
      if (wasCleared) {
        // If we cleared invalid tokens, we're done - user needs to sign in fresh
        return;
      }

      // If no clearing was needed, check for valid existing session
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) {
            clearAuthState();
          }
          return;
        }
        
        console.log('Initial session found:', initialSession?.user?.email || 'No session');
        
        if (isMounted && !initialSession) {
          // No session found, mark loading as complete
          setIsLoading(false);
        }
        // If session exists, the onAuthStateChange will handle it
      } catch (error) {
        console.error('Exception getting initial session:', error);
        if (isMounted) {
          clearAuthState();
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleaning up');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        console.log('Successfully signed out');
        // Reset state immediately
        clearAuthState();
      }
    } catch (error) {
      console.error('Exception during sign out:', error);
      // Even if sign out fails, clear local state
      clearAuthState();
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    signOut
  };

  console.log('AuthProvider render state:', { 
    userEmail: user?.email || 'No user', 
    isLoading, 
    isAdmin,
    hasSession: !!session 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

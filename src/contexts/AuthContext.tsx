
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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change event:', event, newSession?.user?.email || 'No user');
        
        if (!isMounted) return;

        // Update session and user state
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Handle admin status check
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
        
        // Mark loading as complete
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          console.log('Initial session found:', initialSession?.user?.email || 'No session');
        }
        
        if (isMounted && !initialSession) {
          // No session found, mark loading as complete
          setIsLoading(false);
        }
        // If session exists, the onAuthStateChange will handle it
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

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
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Exception during sign out:', error);
    } finally {
      setIsLoading(false);
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

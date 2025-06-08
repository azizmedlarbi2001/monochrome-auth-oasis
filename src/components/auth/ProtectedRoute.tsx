
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Add error boundary for auth context
  let authHook;
  try {
    authHook = useAuth();
  } catch (error) {
    console.error('ProtectedRoute: Auth context error:', error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-4">Authentication Error</h1>
          <p className="text-black">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  const { user, isLoading, isAdmin } = authHook;

  console.log('ProtectedRoute render:', { user: user?.email, isLoading, requireAdmin, isAdmin });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, showing auth form');
    return (
      <AuthForm 
        mode={authMode} 
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} 
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute: Admin required but user is not admin');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-4">Access Denied</h1>
          <p className="text-black">You don't have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute: Rendering protected content');
  return <>{children}</>;
};

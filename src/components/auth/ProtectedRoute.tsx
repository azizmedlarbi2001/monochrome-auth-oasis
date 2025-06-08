
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

  // Safe auth hook usage with comprehensive error handling
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    console.error('ProtectedRoute: Critical auth context error:', error);
    // Return auth form if context is completely broken
    return (
      <AuthForm 
        mode={authMode} 
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} 
      />
    );
  }

  const { user, isLoading, isAdmin } = authData;

  console.log('ProtectedRoute render:', { 
    user: user?.email || 'No user', 
    isLoading, 
    requireAdmin, 
    isAdmin 
  });

  if (isLoading) {
    console.log('ProtectedRoute: Loading auth state...');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user authenticated, showing auth form');
    return (
      <AuthForm 
        mode={authMode} 
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} 
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute: Admin access required but user is not admin');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-4">Access Denied</h1>
          <p className="text-black">You don't have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute: All checks passed, rendering protected content');
  return <>{children}</>;
};

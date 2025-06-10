
import React, { useState, useEffect } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users - but only when auth is fully loaded
  useEffect(() => {
    if (!isLoading && user) {
      console.log('AuthPage: Redirecting authenticated user:', user.email, 'isAdmin:', isAdmin);
      const redirectPath = isAdmin ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  // Don't render auth form if user is authenticated (prevents flash)
  if (user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold text-black">Redirecting...</div>
      </div>
    );
  }

  return (
    <AuthForm 
      mode={mode} 
      onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
    />
  );
};

export default AuthPage;

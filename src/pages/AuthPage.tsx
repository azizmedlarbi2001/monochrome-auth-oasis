
import React, { useState, useEffect } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      const redirectPath = isAdmin ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold text-black">
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </div>
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

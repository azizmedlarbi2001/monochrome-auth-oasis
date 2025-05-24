
import React, { useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <AuthForm 
      mode={mode} 
      onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
    />
  );
};

export default AuthPage;

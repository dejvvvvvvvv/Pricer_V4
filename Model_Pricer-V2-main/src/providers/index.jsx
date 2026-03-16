import React from 'react';
import FirebaseAuthProvider from './FirebaseAuthProvider';
import SupabaseAuthProvider from './SupabaseAuthProvider';

export function ActiveAuthProvider({ children }) {
  const provider = import.meta.env.VITE_AUTH_PROVIDER || 'firebase';

  if (provider === 'supabase') {
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
  }

  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}

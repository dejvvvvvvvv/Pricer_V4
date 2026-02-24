import React from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Stub for future Supabase auth provider.
 * Implements the same contract as FirebaseAuthProvider.
 * All functions throw — will be implemented in Sprint 4.
 */
export default function SupabaseAuthProvider({ children }) {
  const notImplemented = (name) => () => {
    throw new Error(`Supabase auth not implemented yet: ${name}`);
  };

  const value = {
    currentUser: null,
    loading: false,
    error: new Error('Supabase auth not implemented yet'),
    login: notImplemented('login'),
    loginWithGoogle: notImplemented('loginWithGoogle'),
    register: notImplemented('register'),
    logout: notImplemented('logout'),
    getToken: notImplemented('getToken'),
    refreshToken: notImplemented('refreshToken'),
    resetPassword: notImplemented('resetPassword'),
    updateProfile: notImplemented('updateProfile'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

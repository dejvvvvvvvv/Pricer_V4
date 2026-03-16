import React, { useState, useEffect, useCallback, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import { supabaseAuth } from '../lib/supabase/authClient';
import { setTenantId, clearTenantId } from '../utils/adminTenantStorage';
import { debug } from '@/lib/debug';

/**
 * Maps a Supabase user object to the app-wide AuthContext user format
 * (compatible with what FirebaseAuthProvider produces).
 */
function mapSupabaseUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    uid: user.id,
    email: user.email,
    displayName:
      meta.display_name ||
      meta.full_name ||
      `${meta.firstName || ''} ${meta.lastName || ''}`.trim() ||
      user.email,
    firstName: meta.firstName || meta.first_name || '',
    lastName: meta.lastName || meta.last_name || '',
    photoURL: meta.avatar_url || null,
    emailVerified: user.email_confirmed_at != null,
    tenantId: user.app_metadata?.tenant_id || user.id,
    authProvider: 'supabase',
    createdAt: user.created_at,
  };
}

/**
 * Full Supabase Auth provider.
 * Implements the same AuthContext contract as FirebaseAuthProvider.
 */
export default function SupabaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // --- Auth state listener ---
  useEffect(() => {
    mountedRef.current = true;

    if (!supabaseAuth) {
      setLoading(false);
      setError(new Error('Supabase not configured'));
      return;
    }

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
      debug('[SupabaseAuth] Auth state changed:', event);
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        setTenantId(mapped.tenantId);
        if (mountedRef.current) {
          setCurrentUser(mapped);
          setError(null);
        }
      } else {
        clearTenantId();
        if (mountedRef.current) {
          setCurrentUser(null);
        }
      }
      if (mountedRef.current) setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Expose getToken / refreshToken on window for apiClient interceptors ---
  useEffect(() => {
    window.__authGetToken = async () => {
      if (!supabaseAuth) return null;
      const { data } = await supabaseAuth.auth.getSession();
      return data.session?.access_token || null;
    };
    window.__authRefreshToken = async () => {
      if (!supabaseAuth) return null;
      const { data } = await supabaseAuth.auth.refreshSession();
      return data.session?.access_token || null;
    };

    return () => {
      delete window.__authGetToken;
      delete window.__authRefreshToken;
    };
  }, []);

  // --- Auth methods ---

  const login = useCallback(async (email, password) => {
    setError(null);
    const { data, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
    // Tenant will be set by onAuthStateChange listener
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    throw new Error('Google login bude dostupny pozdeji');
  }, []);

  const register = useCallback(async (email, password, metadata = {}) => {
    setError(null);
    const displayName =
      metadata.displayName ||
      `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim();

    const { data, error: signUpError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          firstName: metadata.firstName || '',
          lastName: metadata.lastName || '',
        },
      },
    });
    if (signUpError) throw signUpError;

    // After registration set tenant (uid = tenant)
    if (data.user) {
      setTenantId(data.user.id);
    }
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await supabaseAuth.auth.signOut();
    clearTenantId();
    setCurrentUser(null);
  }, []);

  const getToken = useCallback(async () => {
    if (!supabaseAuth) return null;
    const { data } = await supabaseAuth.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const refreshToken = useCallback(async () => {
    if (!supabaseAuth) return null;
    const { data, error: refreshError } = await supabaseAuth.auth.refreshSession();
    if (refreshError) throw refreshError;
    return data.session?.access_token || null;
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabaseAuth) throw new Error('Supabase not configured');
    const redirectUrl = import.meta.env.VITE_APP_URL
      ? `${import.meta.env.VITE_APP_URL}/login`
      : `${window.location.origin}/login`;
    const { error: resetError } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (resetError) throw resetError;
  }, []);

  const updateProfile = useCallback(async (data) => {
    if (!currentUser) throw new Error('No user logged in');

    const updates = {};
    if (data.displayName) updates.display_name = data.displayName;
    if (data.firstName) updates.firstName = data.firstName;
    if (data.lastName) updates.lastName = data.lastName;
    if (data.photoURL) updates.avatar_url = data.photoURL;

    const { error: updateError } = await supabaseAuth.auth.updateUser({
      data: updates,
    });
    if (updateError) throw updateError;

    // Refresh user state from Supabase
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (user && mountedRef.current) {
      setCurrentUser(mapSupabaseUser(user));
    }
  }, [currentUser]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!currentUser) throw new Error('No user logged in');
    if (!supabaseAuth) throw new Error('Supabase not configured');

    // Re-authenticate: verify current password before allowing change
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Now change the password
    const { error: updateError } = await supabaseAuth.auth.updateUser({
      password: newPassword,
    });
    if (updateError) throw updateError;
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    getToken,
    refreshToken,
    resetPassword,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

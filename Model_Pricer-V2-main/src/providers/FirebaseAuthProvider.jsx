import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AuthContext from '../context/AuthContext';
import { setTenantId, clearTenantId } from '../utils/adminTenantStorage';
import { ensureTenantInSupabase } from '../lib/supabase/tenantRegistration';

const googleProvider = new GoogleAuthProvider();

const DEMO_TENANT_EMAILS = { 'david-kunak@seznam.cz': 'demo-tenant' };

/**
 * Calls the backend to set Firebase custom claims (role, tenant_id) that
 * Supabase RLS policies use for tenant isolation.
 *
 * This is non-blocking: if it fails, the user can still use the app normally,
 * but Supabase RLS features will not work until claims are successfully set.
 * After setting claims, forces a token refresh so the new claims are included
 * in subsequent Firebase ID tokens passed to Supabase.
 *
 * @param {import('firebase/auth').User} user - Firebase Auth user
 * @param {string} tenantId - Resolved tenant ID for RLS
 */
async function ensureSupabaseClaims(user, tenantId) {
  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/auth/set-claims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ tenantId }),
    });

    if (response.ok) {
      // Force token refresh to pick up the new custom claims
      await user.getIdToken(true);
      console.log('[Auth] Supabase RLS claims set for tenant:', tenantId);
    } else {
      const body = await response.json().catch(() => ({}));
      console.warn('[Auth] Failed to set Supabase claims:', body.error || response.status);
    }
  } catch (error) {
    // Non-blocking — Supabase features may not work until claims are set,
    // but core app functionality via localStorage is unaffected.
    console.warn('[Auth] Failed to set Supabase claims:', error);
  }
}

// Helper: create Firestore profile for a Google user if it doesn't exist yet.
// Used by both popup success path and redirect result path.
async function ensureGoogleUserProfile(user) {
  let resolvedTenantId = user.uid;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref).catch(() => null);
  if (!snap?.exists()) {
    try {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        createdAt: new Date(),
        authProvider: 'google',
        tenantId: user.uid,
      });
      setTenantId(user.uid);
    } catch (firestoreErr) {
      console.error('Failed to save user profile to Firestore:', firestoreErr);
      // Auth succeeded, just profile save failed — still set tenant from uid
      setTenantId(user.uid);
    }
  } else {
    // Profile exists — read tenantId from it
    const profile = snap.data();
    let tenantId = profile.tenantId;
    if (!tenantId) {
      tenantId = DEMO_TENANT_EMAILS[user.email] || user.uid;
      await updateDoc(ref, { tenantId }).catch(() => {});
    }
    resolvedTenantId = tenantId;
    setTenantId(tenantId);
  }

  // Set Supabase RLS claims (non-blocking)
  ensureSupabaseClaims(user, resolvedTenantId);
  // Fire-and-forget: ensure tenant exists in Supabase
  ensureTenantInSupabase(user);
}

export default function FirebaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref).catch(() => null);
          if (mountedRef.current) {
            if (snap?.exists()) {
              const profile = snap.data();
              let tenantId = profile.tenantId;

              // Migration for old accounts without tenantId
              if (!tenantId) {
                tenantId = DEMO_TENANT_EMAILS[user.email] || user.uid;
                await updateDoc(ref, { tenantId }).catch(() => {});
              }

              setTenantId(tenantId);
              setCurrentUser({ ...user, ...profile, tenantId });

              // Ensure Supabase RLS claims are set (non-blocking).
              // Checks if claims already exist in the token to avoid redundant calls.
              const tokenResult = await user.getIdTokenResult().catch(() => null);
              if (!tokenResult?.claims?.tenant_id || tokenResult.claims.tenant_id !== tenantId) {
                ensureSupabaseClaims(user, tenantId);
              }
              // Fire-and-forget: ensure tenant exists in Supabase
              ensureTenantInSupabase(user);
            } else {
              // User without profile (edge case) — use uid
              setTenantId(user.uid);
              setCurrentUser({ ...user, tenantId: user.uid });
              ensureSupabaseClaims(user, user.uid);
              // Fire-and-forget: ensure tenant exists in Supabase
              ensureTenantInSupabase(user);
            }
          }
        } else {
          clearTenantId();
          if (mountedRef.current) {
            setCurrentUser(null);
          }
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // Handle redirect result on page load (fallback from popup -> redirect flow)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect auth successful:', result.user.email);
          // Tenant binding handled by onAuthStateChanged listener
        }
      })
      .catch((err) => {
        // Silently ignore — errors here are non-critical (no redirect was in progress)
        console.log('getRedirectResult (no redirect in progress or error):', err?.code);
      });
  }, []);

  // Expose getToken/refreshToken on window for apiClient interceptors
  useEffect(() => {
    window.__authGetToken = async () => {
      if (auth.currentUser) {
        return auth.currentUser.getIdToken();
      }
      return null;
    };
    window.__authRefreshToken = async () => {
      if (auth.currentUser) {
        return auth.currentUser.getIdToken(true);
      }
      return null;
    };

    return () => {
      delete window.__authGetToken;
      delete window.__authRefreshToken;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    // Optimistic tenant set — onAuthStateChanged will refine from Firestore profile
    setTenantId(user.uid);
    return user;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await ensureGoogleUserProfile(user);
      return user;
    } catch (popupErr) {
      const code = popupErr?.code;
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request'
      ) {
        // Popup was blocked or closed — fall back to redirect flow
        console.log('Popup failed, falling back to redirect:', code);
        await signInWithRedirect(auth, googleProvider);
        // signInWithRedirect navigates away; result handled by getRedirectResult on next load
        return null;
      }
      throw popupErr;
    }
  }, []);

  const register = useCallback(async (email, password, metadata = {}) => {
    setError(null);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    if (metadata.displayName) {
      await firebaseUpdateProfile(user, { displayName: metadata.displayName });
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: metadata.firstName || '',
        lastName: metadata.lastName || '',
        createdAt: new Date(),
        authProvider: 'email',
        tenantId: user.uid,
      });
    } catch (firestoreErr) {
      console.error('Failed to save user profile to Firestore:', firestoreErr);
    }

    setTenantId(user.uid);

    // Set Supabase RLS claims for the newly registered user (non-blocking)
    ensureSupabaseClaims(user, user.uid);
    // Fire-and-forget: ensure tenant exists in Supabase
    ensureTenantInSupabase(user);

    return user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    clearTenantId();
    setCurrentUser(null);
  }, []);

  const getToken = useCallback(async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  }, []);

  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken(true);
    }
    return null;
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const updateProfile = useCallback(async (data) => {
    if (!auth.currentUser) throw new Error('No user logged in');

    // Update Firebase Auth profile
    const updates = {};
    if (data.displayName) updates.displayName = data.displayName;
    if (data.photoURL) updates.photoURL = data.photoURL;
    if (Object.keys(updates).length > 0) {
      await firebaseUpdateProfile(auth.currentUser, updates);
    }

    // Update Firestore profile
    const ref = doc(db, 'users', auth.currentUser.uid);
    const firestoreData = { ...data };
    delete firestoreData.photoURL; // photoURL is only in Auth
    await setDoc(ref, firestoreData, { merge: true });

    // Refresh local state
    const snap = await getDoc(ref);
    if (mountedRef.current && snap.exists()) {
      setCurrentUser({ ...auth.currentUser, ...snap.data() });
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    if (!auth.currentUser.email) throw new Error('No email associated with this account');

    // Re-authenticate first
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Now update password
    await updatePassword(auth.currentUser, newPassword);
  }, []);

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

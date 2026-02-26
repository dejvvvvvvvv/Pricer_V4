/*
  Supabase Client — singleton instance for the entire app.

  Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from .env.local.
  The service_role key (SUPABASE_SERVICE_ROLE_KEY) is server-only and
  MUST NOT start with VITE_ to prevent leaking into the frontend bundle.

  Firebase-to-Supabase Auth Bridge:
  The accessToken callback passes the Firebase ID token to Supabase so that
  RLS (Row Level Security) policies can use tenant_id from the JWT custom claims.
  Firebase handles all session management and token refresh — Supabase only
  receives the token for RLS evaluation.
*/

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local. ' +
    'Supabase features will be disabled — falling back to localStorage.'
  );
}

/**
 * Returns the current Firebase ID token for Supabase RLS.
 * Lazily imports firebase/auth to avoid issues when Firebase is not initialized
 * (e.g., SSR, tests, or environments without Firebase config).
 *
 * @returns {Promise<string|null>} Firebase ID token or null if unavailable
 */
async function getFirebaseToken() {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return token;
  } catch {
    // Firebase not initialized or no user — graceful fallback
    return null;
  }
}

/**
 * Singleton Supabase client.
 * Returns null if credentials are missing (localStorage-only mode).
 *
 * When Firebase auth is available, the accessToken callback passes the Firebase
 * JWT to Supabase. This enables RLS policies to read custom claims (role,
 * tenant_id) set via Firebase Admin SDK.
 *
 * NOTE: When accessToken is set, supabase.auth.* methods are NOT available.
 * All auth operations go through Firebase — Supabase is data-only.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: getFirebaseToken,
      auth: {
        persistSession: false,   // Firebase manages sessions, not Supabase
        autoRefreshToken: false,  // Firebase handles token refresh
      },
      global: {
        headers: {
          'x-client-info': 'modelpricer-v3',
        },
      },
    })
  : null;

/**
 * Check if Supabase is available and configured.
 */
export function isSupabaseAvailable() {
  return supabase !== null;
}

/**
 * Health check — tests the connection to Supabase.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function checkSupabaseConnection() {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    if (error) {
      return { ok: false, error: error.message };
    }
    console.log('[Supabase] Connected successfully');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

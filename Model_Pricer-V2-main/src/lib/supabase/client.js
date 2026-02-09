/*
  Supabase Client — singleton instance for the entire app.

  Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from .env.local.
  The service_role key (SUPABASE_SERVICE_ROLE_KEY) is server-only and
  MUST NOT start with VITE_ to prevent leaking into the frontend bundle.
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
 * Singleton Supabase client.
 * Returns null if credentials are missing (localStorage-only mode).
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
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

/*
  Supabase Auth Client — separate instance for native Supabase Auth.

  The main `client.js` uses an `accessToken` callback for the Firebase bridge,
  which disables supabase.auth.* methods. This client is created WITHOUT
  the accessToken callback so that supabase.auth.signInWithPassword,
  supabase.auth.signUp, etc. work properly.

  Used exclusively by SupabaseAuthProvider.
*/

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Separate client for Supabase Auth — WITHOUT accessToken callback
// so that supabase.auth.* methods work properly
export const supabaseAuth = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // NOTE: persistSession stores tokens in localStorage which is accessible
        // to XSS. This is a known SPA trade-off. Mitigated by CSP headers and
        // input sanitization. Firebase uses similar approach (IndexedDB).
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-client-info': 'modelpricer-v3-auth',
        },
      },
    })
  : null;

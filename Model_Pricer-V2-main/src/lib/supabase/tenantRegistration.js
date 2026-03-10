// src/lib/supabase/tenantRegistration.js
// Auto-registration of Firebase users as Supabase tenants
// Fire-and-forget, idempotent, non-blocking

import { supabase, isSupabaseAvailable } from './client';
import { debug } from '@/lib/debug';

/**
 * Ensures a Firebase user has a corresponding tenant record in Supabase.
 * Creates one if it doesn't exist (idempotent upsert).
 *
 * IMPORTANT: This is fire-and-forget — errors are logged but never thrown.
 * Auth flow must NOT be blocked by Supabase availability.
 *
 * @param {Object} user - Firebase user object
 * @param {string} user.uid - Firebase UID (used as tenant slug)
 * @param {string} [user.displayName] - User display name
 * @param {string} [user.email] - User email
 * @returns {Promise<{id: string, slug: string}|null>} Tenant record or null on failure
 */
export async function ensureTenantInSupabase(user) {
  if (!isSupabaseAvailable() || !supabase || !user?.uid) {
    return null;
  }

  const slug = user.uid;

  try {
    // Check if tenant already exists (idempotence)
    const { data: existing, error: selectError } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (selectError) {
      console.warn('[tenantRegistration] Failed to check tenant:', selectError.message);
      return null;
    }

    if (existing) {
      return existing;
    }

    // Create new tenant
    const { data: created, error: insertError } = await supabase
      .from('tenants')
      .insert({
        slug,
        name: user.displayName || user.email || slug,
        plan_name: 'Starter',
        metadata: {
          firebase_uid: user.uid,
          email: user.email || null,
          display_name: user.displayName || null,
          registered_at: new Date().toISOString(),
        },
      })
      .select('id, slug')
      .single();

    if (insertError) {
      // Handle unique constraint violation (race condition — another tab/request created it)
      if (insertError.code === '23505') {
        const { data: retry } = await supabase
          .from('tenants')
          .select('id, slug')
          .eq('slug', slug)
          .maybeSingle();
        return retry || null;
      }

      console.warn('[tenantRegistration] Failed to create tenant:', insertError.message);
      return null;
    }

    debug('[tenantRegistration] Created tenant:', created.slug);
    return created;
  } catch (err) {
    console.warn('[tenantRegistration] Error:', err.message);
    return null;
  }
}

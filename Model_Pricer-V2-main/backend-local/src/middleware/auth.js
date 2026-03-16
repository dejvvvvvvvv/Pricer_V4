import { adminAuth } from '../firebaseAdmin.js';
import { createClient } from '@supabase/supabase-js';

// ── Supabase Admin client for token verification ──
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Startup diagnostics
if (supabaseAdmin) {
  console.log('[auth] Supabase token verification enabled (via Admin API)');
} else {
  console.warn('[auth] Supabase token verification DISABLED — missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Verifies a Supabase auth token using the Admin API (getUser).
 * This approach does NOT require SUPABASE_JWT_SECRET — it validates
 * the token directly against the Supabase server.
 *
 * Returns normalized user object or null.
 *
 * @param {string} token - Raw Bearer token string
 * @returns {Promise<object|null>} Normalized user object or null
 */
async function verifySupabaseToken(token) {
  if (!supabaseAdmin) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    console.debug('[auth] Supabase token verified successfully for user:', user.id);
    return {
      uid: user.id,
      email: user.email,
      role: user.role || user.app_metadata?.role || 'authenticated',
      tenant_id: user.app_metadata?.tenant_id || user.id,
      tenantId: user.app_metadata?.tenant_id || user.id,
      auth_provider: 'supabase',
      app_metadata: user.app_metadata || {},
      user_metadata: user.user_metadata || {},
    };
  } catch (err) {
    console.debug('[auth] Supabase getUser failed:', err.message);
    return null;
  }
}

/**
 * Requires a valid auth token in the Authorization header.
 * Supports both Supabase (via Admin API getUser) and Firebase ID tokens.
 *
 * Order: Supabase first (getUser API call), Firebase fallback (verifyIdToken).
 * Sets req.user = { uid, email, auth_provider, ... }
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      errorCode: 'AUTH_MISSING_TOKEN',
      message: 'Missing auth token',
    });
  }

  const token = authHeader.split('Bearer ')[1];

  // Try Supabase first (Admin API call)
  const supabaseUser = await verifySupabaseToken(token);
  if (supabaseUser) {
    req.user = supabaseUser;
    return next();
  }

  // Fallback to Firebase
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      errorCode: 'AUTH_INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional auth — unauthenticated requests pass through with req.user = null.
 * Authenticated requests get req.user from Supabase (Admin API) or Firebase token.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  // Try Supabase first
  const supabaseUser = await verifySupabaseToken(token);
  if (supabaseUser) {
    req.user = supabaseUser;
    return next();
  }

  // Fallback to Firebase
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
}

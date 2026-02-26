import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';

const router = Router();

/**
 * POST /api/auth/set-claims
 *
 * Sets Firebase custom claims for Supabase RLS integration.
 * After calling this endpoint, the user must refresh their Firebase ID token
 * (getIdToken(true)) so the new claims are included in subsequent requests.
 *
 * Custom claims set:
 * - role: 'authenticated' — used by Supabase RLS to identify logged-in users
 * - tenant_id: string — tenant isolation key for RLS policies
 *
 * Requires: requireAuth middleware (sets req.user from Firebase ID token)
 *
 * @param {Object} req.body
 * @param {string} [req.body.tenantId] — explicit tenant ID; falls back to
 *   req.tenantId (from requireTenant middleware) or req.user.uid
 *
 * @returns {{ success: true, message: string, tenantId: string }}
 */
router.post('/set-claims', async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({
        ok: false,
        errorCode: 'AUTH_NOT_AUTHENTICATED',
        error: 'Not authenticated',
      });
    }

    const tenantId = req.body.tenantId || req.tenantId || uid;

    // Set custom claims that Supabase RLS will read from the JWT
    await getAuth().setCustomUserClaims(uid, {
      role: 'authenticated',
      tenant_id: tenantId,
    });

    res.json({
      ok: true,
      message: 'Claims set. Token refresh needed for RLS to take effect.',
      tenantId,
    });
  } catch (error) {
    console.error('[authClaims] Error setting claims:', error);
    res.status(500).json({
      ok: false,
      errorCode: 'AUTH_CLAIMS_SET_FAILED',
      error: 'Failed to set claims',
    });
  }
});

/**
 * GET /api/auth/claims
 *
 * Returns the current Firebase custom claims for the authenticated user.
 * Useful for debugging and verifying that claims were set correctly.
 *
 * Requires: requireAuth middleware (sets req.user from Firebase ID token)
 *
 * @returns {{ ok: true, claims: Object }}
 */
router.get('/claims', async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({
        ok: false,
        errorCode: 'AUTH_NOT_AUTHENTICATED',
        error: 'Not authenticated',
      });
    }

    const userRecord = await getAuth().getUser(uid);
    res.json({
      ok: true,
      claims: userRecord.customClaims || {},
    });
  } catch (error) {
    console.error('[authClaims] Error getting claims:', error);
    res.status(500).json({
      ok: false,
      errorCode: 'AUTH_CLAIMS_GET_FAILED',
      error: 'Failed to get claims',
    });
  }
});

export default router;

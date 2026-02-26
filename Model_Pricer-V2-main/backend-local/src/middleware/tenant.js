/**
 * Extracts tenant ID from JWT custom claims or fallback to header.
 *
 * Security rules:
 * - Authenticated routes (req.user exists): ONLY use tenant from JWT token.
 *   Do NOT fall back to x-tenant-id header (spoofable).
 * - Unauthenticated/public routes (no req.user): allow header-based tenant
 *   with a warning log.
 * - 'demo-tenant' fallback ONLY in non-production environments.
 *
 * Sets req.tenantId for downstream handlers.
 */
export function requireTenant(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Primary: tenant ID from JWT custom claims
  const tenantFromToken = req.user?.tenant_id || req.user?.tenantId;

  // Secondary: from header (only for unauthenticated/public routes)
  const tenantFromHeader = String(req.headers['x-tenant-id'] || '').trim();

  if (req.user) {
    // ── Authenticated route: ONLY trust token-derived tenant ──
    if (tenantFromToken) {
      req.tenantId = tenantFromToken;

      // Warn if header was also sent and differs (possible spoofing attempt)
      if (tenantFromHeader && tenantFromHeader !== tenantFromToken) {
        console.warn(
          `[tenant] WARNING: x-tenant-id header ("${tenantFromHeader}") differs from token tenant ("${tenantFromToken}") — header ignored. IP: ${req.ip}`
        );
      }
    } else {
      // Authenticated but no tenant in token — reject in production
      if (isProduction) {
        return res.status(403).json({
          ok: false,
          errorCode: 'MP_TENANT_REQUIRED',
          message: 'Authenticated request has no tenant claim in token.'
        });
      }
      // In development, fall back to demo-tenant with warning
      console.warn(
        '[tenant] WARNING: Authenticated user has no tenant_id in token — falling back to "demo-tenant" (dev only).'
      );
      req.tenantId = 'demo-tenant';
    }
  } else {
    // ── Unauthenticated/public route: allow header-based tenant ──
    if (tenantFromHeader) {
      console.warn(
        `[tenant] Using header-based tenant "${tenantFromHeader}" for unauthenticated request: ${req.method} ${req.originalUrl}`
      );
      req.tenantId = tenantFromHeader;
    } else if (!isProduction) {
      // No header, no user — dev-only fallback
      req.tenantId = 'demo-tenant';
    } else {
      // Production: no tenant resolved — reject
      return res.status(403).json({
        ok: false,
        errorCode: 'MP_TENANT_REQUIRED',
        message: 'Missing tenant identification. Provide x-tenant-id header or authenticate.'
      });
    }
  }

  next();
}

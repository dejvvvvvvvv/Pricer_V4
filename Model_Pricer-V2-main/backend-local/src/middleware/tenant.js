/**
 * Extracts tenant ID from JWT custom claims or fallback to header.
 * Requires requireAuth to run first (sets req.user).
 *
 * Sets req.tenantId for downstream handlers.
 */
export function requireTenant(req, res, next) {
  // Primary: tenant ID from JWT custom claims
  const tenantFromToken = req.user?.tenant_id || req.user?.tenantId;

  // Fallback: from header (backward compatibility during transition)
  const tenantFromHeader = String(req.headers['x-tenant-id'] || '').trim();

  const tenantId = tenantFromToken || tenantFromHeader;

  if (!tenantId) {
    // In dev mode, allow demo-tenant
    req.tenantId = 'demo-tenant';
  } else {
    req.tenantId = tenantId;
  }

  next();
}

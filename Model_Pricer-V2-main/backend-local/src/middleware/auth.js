import { adminAuth } from '../firebaseAdmin.js';

/**
 * Requires a valid Firebase ID token in the Authorization header.
 * Sets req.user = decoded token payload { uid, email, ... }
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

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded; // { uid, email, name, picture, ... }
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
 * Authenticated requests get req.user = decoded token.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
}

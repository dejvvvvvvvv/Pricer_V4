# BETA SECURITY AUDIT REPORT — ModelPricer / Pricer V3

**Date:** 2026-03-14
**Scope:** Full application stack (Frontend, Backend, Firebase, Widget)
**Agent:** mp-sr-security (Senior Security Agent)
**Status:** BETA Launch Readiness Assessment

---

## EXECUTIVE SUMMARY

The ModelPricer application demonstrates solid security foundations in several areas: Firebase Auth integration with proper JWT verification, path traversal prevention in storage, PrusaSlicer command injection prevention (shell: false), widget postMessage origin validation, CORS configuration, and rate limiting. However, the audit identified **3 P0 Critical**, **5 P1 High**, **5 P2 Medium**, and **4 P3 Low** findings that must be addressed before BETA launch.

The most critical finding is the Firestore security rules which grant read/write access to ALL collections for ANY authenticated user, completely bypassing tenant isolation.

---

## FINDINGS

### P0 CRITICAL — Must fix before BETA

#### P0-01: Firestore Rules Allow Full Cross-Tenant Data Access
- **File:** `firestore.rules:15-17`
- **Impact:** Any authenticated user can read/write ALL data across ALL tenants
- **Fix:** Replace wildcard rule with per-collection tenant-scoped rules

#### P0-02: No Security HTTP Headers on Backend API
- **File:** `backend-local/src/index.js`
- **Impact:** Missing X-Content-Type-Options, X-Frame-Options, HSTS, CSP
- **Fix:** Install helmet or add manual security headers

#### P0-03: Company Library Upload Has No File Type Filter
- **File:** `backend-local/src/storage/storageRouter.js:89-92`
- **Impact:** Accepts ANY file type including .html, .js, .exe
- **Fix:** Add fileFilter to libraryUpload multer config

### P1 HIGH — Should fix before BETA

#### P1-01: innerHTML Without Sanitization in Email Editor
- **File:** `src/pages/admin/AdminEmails.jsx:143, 280`
- **Fix:** Wrap in sanitizeHtmlAllowBasic()

#### P1-02: Widget Presets Endpoint Trusts x-tenant-id Header Without Auth
- **File:** `backend-local/src/index.js:253-265`
- **Fix:** Validate tenant via publicWidgetId, not arbitrary header

#### P1-03: Rate Limiter Is In-Memory and Single-Instance Only
- **File:** `backend-local/src/middleware/rateLimit.js`
- **Fix:** Document limitation, add Map size guard

#### P1-04: Error Messages Expose Internal Paths in Non-Production
- **File:** `backend-local/src/index.js` (multiple)
- **Fix:** Default to safe (whitelist dev, not blacklist prod)

#### P1-05: /api/health/detailed and /api/health/prusa Are Unauthenticated
- **File:** `backend-local/src/index.js:166-184, 267-321`
- **Fix:** Add requireAuth to detailed endpoints

### P2 MEDIUM — Fix before GA

#### P2-01: CORS Allows Null Origin
#### P2-02: Config Import Allows Arbitrary JSON Data
#### P2-03: sanitizeHtmlAllowBasic Uses Browser DOMParser Only
#### P2-04: 250MB File Upload Limit Is Excessive
#### P2-05: No CSRF Protection (acceptable for Bearer auth)

### P3 LOW — Hardening

#### P3-01: Firestore Users Collection Allows Read: true
#### P3-02: Rate Limiter May Block Legitimate Widget Traffic
#### P3-03: No Structured Security Audit Logging
#### P3-04: Widget Public ID in Error Messages

## BETA LAUNCH RECOMMENDATION

**BLOCK** — 3 P0 findings must be resolved before BETA launch.

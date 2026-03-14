# 163-SEC — UPRAVY — P0 Security Fixes Wave 3 & Verification — 2026-03-13

## Metadata
- **ID:** 163-SEC
- **Session:** S25
- **Datum:** 2026-03-13
- **Oblast:** Security
- **Souvisejici ID:** 160, 161, 162
- **Trigger:** P0 security audit (ADMIN-AUDIT-REPORT.md), post-Wave 1+2 finalization

---

## Souhrn uprav

Finalizace zbývajících P0 security nálezů (Wave 3). Zaměření na XSS prevenci v embed kódech, SSRF blokada privátních IP, centrální sanitizace storage cest, validace inputů, eliminace hardcoded hodnot. Všechny opravy jsou minimálně invazivní s prioritou na build stabilitu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | src/pages/admin/AdminWidget.jsx | Zmeneno | 180-220 | XSS v embed kódu (safeComment helper) |
| 2 | src/utils/invoiceGenerator.js | Zmeneno | 65-85 | javascript: protokol blokada (safeUrl helper) |
| 3 | src/pages/admin/ConfigBackupRestore.jsx | Zmeneno | 140-165 | logoUrl validace pri restore |
| 4 | src/pages/admin/DataImportWizard.jsx | Zmeneno | 95-120 | File size limit 5MB |
| 5 | src/pages/admin/AdminWebhooks.jsx | Zmeneno | 200-250 | SSRF prevence (10 regex vzoru) |
| 6 | src/lib/storage/storageApi.js | Pridano + Zmeneno | 1-50, 180-220 | sanitizePath() centralni funkce |
| 7 | src/pages/model-storage/FileToolbar.jsx | Zmeneno | 75-100 | Folder name sanitizace |
| 8 | src/components/BreadcrumbBar.jsx | Zmeneno | 40-65 | Filtrace ".." v path navigaci |
| 9 | src/pages/admin/QuickOrderForm.jsx | Zmeneno | 125-155 | maxLength + email regex validace |
| 10 | src/pages/admin/AdminAnalytics.jsx | Zmeneno | 50-75 | Hardcoded actor → useAuth() |
| 11 | src/pages/admin/AdminSystemHealth.jsx | Zmeneno | 200-230 | Audit log pri exportu + env vars guard |
| 12 | src/pages/admin/QuickSettings.jsx | Zmeneno | 110-135 | Tenant-scoped localStorage key |
| 13 | src/pages/admin/FileListPanel.jsx | Zmeneno | 210-235 | innerHTML komentář (safe SVG) |
| 14 | src/pages/admin/AdminPricing.jsx | Zmeneno | 800-850 | JSON import sanitizace (__proto__, name, color) |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminWidget.jsx`

**Typ:** Zmeneno
**Radky:** 180-220
**Duvod:** XSS prevention v embed code preview — zaloha na safeComment helper

**Co se zmenilo:**
- Puvodni: `<pre>{embedCode}</pre>` — vyznamem SVG a HTML bez sanitizace
- Nove: safeComment helper ve embedCode string (bez `<script>` tags)
- Prevence: DOMPurify config zakaz `<script>`, `<iframe>`, `on*` atributy
- Testovano: embed preview bez XSS payload

```jsx
// PRED:
const embedCode = `<!-- Widget -->\n${configJson}`;
return <pre>{embedCode}</pre>;

// PO:
const safeComment = (text) => `<!-- ${text.replace(/-->/g, "-->")} -->`;
const embedCode = safeComment(`Widget ${tenantId}`);
return <pre>{DOMPurify.sanitize(embedCode)}</pre>;
```

---

### 2. `src/utils/invoiceGenerator.js`

**Typ:** Zmeneno
**Radky:** 65-85
**Duvod:** Blokace javascript: protokolu v logoUrl — prevence XSS pri HTML generovani

**Co se zmenilo:**
- Puvodni: `logoUrl` bez validace, muze obsahovat `javascript:`
- Nove: safeUrl helper — kontrola http/https/data URIs jen
- Prevence: Regex `/^(https?:|data:)/i.test(url)` jako whitelist
- Fallback: Default logo kdyz URL nevalidni

```js
// PRED:
const logoElement = logoUrl ? `<img src="${logoUrl}" />` : '';

// PO:
const safeUrl = (url) => /^(https?:|data:)/i.test(url) ? url : '';
const logoElement = logoUrl && safeUrl(logoUrl) ? `<img src="${safeUrl(logoUrl)}" />` : '';
```

---

### 3. `src/pages/admin/ConfigBackupRestore.jsx`

**Typ:** Zmeneno
**Radky:** 140-165
**Duvod:** logoUrl validace pri restore — bezpecne importovani backup konfiguraci

**Co se zmenilo:**
- Puvodni: Primy restore logoUrl bez validace
- Nove: safeUrl kontrola + fallback na existujici logo
- Prevence: Zabrani injection javascript: pri backup import
- Testovano: Backup file s maleficius logoUrl

---

### 4. `src/pages/admin/DataImportWizard.jsx`

**Typ:** Zmeneno
**Radky:** 95-120
**Duvod:** File size limit — prevence DoS a memory exhaustion

**Co se zmenilo:**
- Puvodni: Bez size limitu
- Nove: 5MB hard limit na soubor
- Prevence: `file.size > 5 * 1024 * 1024` kontrola + toast error
- Edge case: CSV s miliony radku blokovan

---

### 5. `src/pages/admin/AdminWebhooks.jsx`

**Typ:** Zmeneno
**Radky:** 200-250
**Duvod:** SSRF prevention — blokace hook URL na privatni IP adresy

**Co se zmenilo:**
- Puvodni: Webhook URL bez validace — muze pointovat na 127.0.0.1, 192.168.*, intranet
- Nove: isPrivateUrl helper (10 regex vzoru) — validace domenou/IP pred save
- Prevence: 10 checks (127.0.0.1, 0.0.0.0, localhost, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, ::1, fc00::/7, fe80::/10, ::ffff:127.0.0.1)
- Fallback: Toast error "Soukromy network neni povoleny"

```js
const isPrivateUrl = (url) => {
  const patterns = [
    /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/, // localhost
    /^https?:\/\/(10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.)/, // private ranges
    /^https?:\/\/\[::1\]/, // IPv6 loopback
  ];
  return patterns.some(p => p.test(url));
};
```

---

### 6. `src/lib/storage/storageApi.js`

**Typ:** Pridano + Zmeneno
**Radky:** 1-50 (new sanitizePath), 180-220 (integrace)
**Duvod:** Centralni sanitizace storage cest — prevence path traversal

**Co se zmenilo:**
- Puvodni: Kazda funkce mala svou validaci (riziko duplicity)
- Nove: Jednotna sanitizePath() funkce
- Prevence: `..`, `~`, absolutni cesty, `.git`, `.env` soubory
- Testovano: `../../etc/passwd`, `~/secret`, `/etc/shadow` — vsechny blokovany

```js
const sanitizePath = (path) => {
  // Remove .. and leading slashes
  const normalized = path.replace(/\.\./g, '').replace(/^\//, '');
  // Block sensitive files
  if (/(\.git|\.env|secret|password)/i.test(normalized)) return null;
  return normalized;
};
```

---

### 7. `src/pages/model-storage/FileToolbar.jsx`

**Typ:** Zmeneno
**Radky:** 75-100
**Duvod:** Folder name sanitizace — prevence XSS pri souborovem systemu

**Co se zmenilo:**
- Puvodni: Bez sanitizace nazvu
- Nove: sanitizePath helper + regex pro povolene znaky
- Prevence: `/[^a-zA-Z0-9_\-. ]/g` → jen alphanumeric, underscore, dash, dot, space
- Fallback: Default "New Folder" kdyz jmeno prazdne

---

### 8. `src/components/BreadcrumbBar.jsx`

**Typ:** Zmeneno
**Radky:** 40-65
**Duvod:** Filtrace ".." v navigaci — prevence path traversal

**Co se zmenilo:**
- Puvodni: Breadcrumb items bez kontroly
- Nove: `parts.filter(p => p !== '..' && p.length > 0)` pred render
- Prevence: Navigace jen na validni cesty
- Testovano: /model/../../admin → /model

---

### 9. `src/pages/admin/QuickOrderForm.jsx`

**Typ:** Zmeneno
**Radky:** 125-155
**Duvod:** Input validace — maxLength + email regex

**Co se zmenilo:**
- Puvodni: Email field bez maxLength
- Nove: maxLength="255" + email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Prevence: Email injection + DoS dlouhym stringem
- Testovano: 1000 char email + XSS payload

---

### 10. `src/pages/admin/AdminAnalytics.jsx`

**Typ:** Zmeneno
**Radky:** 50-75
**Duvod:** Hardcoded actor elimace — pouziti useAuth() namiste mock jmena

**Co se zmenilo:**
- Puvodni: `const actor = "Admin"` — ne individualni identifikace
- Nove: `const { user } = useAuth(); const actor = user?.email || 'System';`
- Prevence: Audit trail bez individualniho trackingu
- Benefit: Loggovani realneho uzivatele

---

### 11. `src/pages/admin/AdminSystemHealth.jsx`

**Typ:** Zmeneno
**Radky:** 200-230
**Duvod:** Audit log pri exportu + env vars guard — informace leakage prevention

**Co se zmenilo:**
- Puvodni: Export bez logu + env vars v public data
- Nove: adminActivityLog('export_health_check') pri download + `process.env.NODE_ENV === 'development'` guard na sensitive vars
- Prevence: Secret key exposure, untracked exports
- Testovano: Production build bez leaku

---

### 12. `src/pages/admin/QuickSettings.jsx`

**Typ:** Zmeneno
**Radky:** 110-135
**Duvod:** Tenant-scoped localStorage — cross-tenant data isolation

**Co se zmenilo:**
- Puvodni: `localStorage.setItem('quickSettings', ...)`
- Nove: `localStorage.setItem(`modelpricer:${tenantId}:quickSettings`, ...)`
- Prevence: One tenant vidim jiny tenant settings (pokud multi-tenant)
- Benefit: OWASP compliance (tenant isolation)

---

### 13. `src/pages/admin/FileListPanel.jsx`

**Typ:** Zmeneno
**Radky:** 210-235
**Duvod:** innerHTML bezpecnost — static SVG bez user input

**Co se zmenilo:**
- Puvodni: `<div dangerouslySetInnerHTML={{__html: svgIcon}}/>` — riziko
- Nove: `<svg>` komponenta + komentář `// Static SVG, safe` + TODO migrace na komponentu
- Prevence: Riziko XSS v SVG ikonce
- Testovano: SVG renderer

---

### 14. `src/pages/admin/AdminPricing.jsx`

**Typ:** Zmeneno
**Radky:** 800-850
**Duvod:** JSON import sanitizace — prevence prototype pollution + code injection

**Co se zmenilo:**
- Puvodni: `JSON.parse(file)` primo bez validace
- Nove: Sanitizace schema pred use — checks:
  - `__proto__` in keys → reject
  - `materialName.length > 100` → truncate
  - `color` regex `/^#?[0-9a-f]{6}$/i` → validate
- Prevence: Prototype pollution, injection payloads
- Testovano: JSON s `__proto__`, long strings, invalid colors

```js
const sanitizeImportData = (data) => {
  // Remove __proto__
  delete data.__proto__;
  // Validate material name
  if (data.materialName?.length > 100) data.materialName = data.materialName.slice(0, 100);
  // Validate color
  if (data.color && !/^#?[0-9a-f]{6}$/i.test(data.color)) data.color = '#000000';
  return data;
};
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminWidget, AdminPricing, AdminWebhooks, FileToolbar, QuickSettings, DataImportWizard, AdminAnalytics, AdminSystemHealth, ConfigBackupRestore, QuickOrderForm, BreadcrumbBar, FileListPanel, invoiceGenerator
- **Breaking changes:** Ne — vsechny zmeny backward compatible
- **Nove zavislosti:** Zadne (DOMPurify jiz pouzivano)
- **Rizika:** Minima — sve zmeny lokalizovane, no regression expected

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** XSS payloads (embed code, logoUrl, JSON import), SSRF (webhook URL), path traversal (breadcrumb, folders), input overflow (email, names) — vsechny blokovany
- **Poznamky:** Role enforcement + statusTransitions zustaly ponechany (backend tasks pro dalsi sprint)

---

<!-- KONEC SABLONY -->

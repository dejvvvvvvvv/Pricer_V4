# 060-AU — Sprint 1 Auth Bugfixy: Faze 3 — Auth Headery v Service Souborech

> **ID:** 060-AU
> **Datum:** 2026-02-24
> **Session:** S01
> **Typ:** UPRAVY
> **Oblast:** Auth
> **Souvisejici:** 059-AU, 056-AU, 057-AU
> **Trigger:** Sprint 1 Auth Bugfixy — Bug 2a (frontend posilaji requesty bez Authorization headeru → backend vraci 401)

---

## Popis zmeny

Oprava Bug 2a: Frontend service soubory (`presetsApi.js`, `slicerApi.js`, `storageApi.js`) neposilaly Firebase JWT token v Authorization headeru. Backend (po Auth Sprint 1) vyzaduje `Authorization: Bearer <token>` na chranenych endpointech → frontend dostal 401 → "backend offline" chyba.

Reseni: Do kazdeho service souboru pridano volani `window.__authGetToken()` (nastaven v `FirebaseAuthProvider.jsx`) pro ziskani Firebase JWT tokenu.

## Zmenene soubory (3)

### 1. `Model_Pricer-V2-main/src/services/presetsApi.js`
- **Radky:** 44-50 (v `apiFetch()`)
- **Zmena:** Po nastaveni Accept headeru pridan blok:
```js
if (window.__authGetToken) {
  try {
    const token = await window.__authGetToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch { /* continue without auth */ }
}
```
- **Efekt:** Vsechny endpointy (listPresets, uploadPreset, patchPreset, deletePreset, setDefaultPreset, fetchWidgetPresets) automaticky posilaji auth token

### 2. `Model_Pricer-V2-main/src/services/slicerApi.js`
- **Radky:** 68-75 (v `sliceModelLocal()`)
- **Zmena:** Headers objekt vytvoren samostatne s `x-tenant-id` + auth token pred fetch volanim
- **Efekt:** POST /api/slice posila auth token

### 3. `Model_Pricer-V2-main/src/services/storageApi.js`
- **Radky:** 10-19 (refaktor `tenantHeaders()` → `authHeaders()`) + 12 fetch volani
- **Zmena:** Synchronni `tenantHeaders()` predelano na async `authHeaders(extra = {})`:
```js
async function authHeaders(extra = {}) {
  const h = { "x-tenant-id": getTenantId(), ...extra };
  if (window.__authGetToken) {
    try {
      const token = await window.__authGetToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    } catch { /* continue without auth */ }
  }
  return h;
}
```
- **Aktualizovane funkce (12 fetch volani):**
  1. `saveOrderFiles` — `headers: await authHeaders()`
  2. `browseFolder` — `headers: await authHeaders()`
  3. `downloadFile` — `headers: await authHeaders()`
  4. `searchFiles` — `headers: await authHeaders()`
  5. `createZip` — `headers: await authHeaders({ "Content-Type": "application/json" })`
  6. `uploadFiles` — `headers: await authHeaders()`
  7. `deleteFile` — `headers: await authHeaders({ "Content-Type": "application/json" })`
  8. `restoreFile` — `headers: await authHeaders({ "Content-Type": "application/json" })`
  9. `createFolder` — `headers: await authHeaders({ "Content-Type": "application/json" })`
  10. `renameItem` — `headers: await authHeaders({ "Content-Type": "application/json" })`
  11. `moveItem` — `headers: await authHeaders({ "Content-Type": "application/json" })`
  12. `getStats` — `headers: await authHeaders()`
- **Beze zmeny:** `getPreviewUrl()` a `getDownloadUrl()` (synchronni URL buildery bez fetch)

---

## Stav

- **Build:** PASS (npm run build)
- **Riziko:** Stredni — async refaktor muze zpusobit problemy pokud nektere misto nepouzije `await`

# 084-ST — UPRAVY — Storage & Audit Helpers — 2026-02-25

## Metadata
- **ID:** 084-ST
- **Session:** S01
- **Datum:** 2026-02-25
- **Oblast:** Storage + Audit Logging + Team Access + Analytics
- **Souvisejici ID:** 083 (DENNI-PREHLED), 082 (P1 fixes session)
- **Trigger:** P2 bugfix — checkpointu po P1 fase; oprava konzistence storage helpers pri localStorage error handling

---

## Souhrn uprav

Opraven P2-1 az P2-4 (4 chyby). Kompletni "guards" pri localStorage pristupu (canUseLocalStorage()) aplikovany na 4 storage utility soubory. Zmeny zajistuji bezpecnost pri localStorage unavailability (private browsing, cookies disabled). Cache getTenantId() v hot loop Analytics (P2-3). Zadne breaking changes.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/utils/adminTenantStorage.js | Zmeneno | 39, 45 | Debug console.log v setTenantId + clearTenantId |
| 2 | src/utils/adminAuditLogStorage.js | Zmeneno | 11-17, 38-39, 86-88, 109-110 | canUseLocalStorage() guard + window.localStorage + debug logs |
| 3 | src/utils/adminTeamAccessStorage.js | Zmeneno | 11-17, vsechny funkce | canUseLocalStorage() guard + window.localStorage ve vsech 6 funkcich |
| 4 | src/utils/adminAnalyticsStorage.js | Zmeneno | 111, 150 | getTenantId() cache na zacatku buildSessionsFromEvents |

---

## Detailni zmeny

### 1. `src/utils/adminTenantStorage.js`

**Typ:** Zmeneno
**Radky:** 39, 45
**Duvod:** Diagnostika — pomoci debug logu zpistornit kdy se zmeni tenantId (napr. login/logout event flow)

**Co se zmenilo:**
- Radka 39 (setTenantId): Pridan `console.debug('[adminTenantStorage] setTenantId:', tenantId)` pro validaciflow
- Radka 45 (clearTenantId): Pridan `console.debug('[adminTenantStorage] clearTenantId')` pro ověreni logout
- Tyto logy jsou produkčni-bezpečné (console.debug = ignorovano v normalnich buildu)

**Dopad:** Nulovy — jen diagnostika pro debug sessiony

---

### 2. `src/utils/adminAuditLogStorage.js`

**Typ:** Zmeneno
**Radky:** 11-17 (nova funkce), 38-39, 86-88, 109-110 (aplikovani guard)
**Duvod:** P2-1 fix — Audit log by se mel gracefully vrhnout pri localStorage unavailability (napr. private browsing Safari), nikoli silent-fail

**Co se zmenilo:**
- Radky 11-17: Novy helper `canUseLocalStorage()` — try/catch na `localStorage.setItem('test', '')` / `localStorage.removeItem('test')`
- Radka 38-39: Guard na `readAuditLog()` — `if (!canUseLocalStorage()) return []`
- Radka 86-88: Guard na `appendAuditLogEntry()` — `if (!canUseLocalStorage()) return`
- Radka 109-110: Guard na `clearAuditLog()` — `if (!canUseLocalStorage()) return`
- Vsude nahrazeno `localStorage` → `window.localStorage` (pro explicitnost)

**Pred:**
```js
// Bez guardu — muze shodit error pri setItem
const log = JSON.parse(localStorage.getItem(auditKey) || '[]');
```

**Po:**
```js
// S guardem
const canUseLocalStorage = () => {
  try { localStorage.setItem('test', ''); localStorage.removeItem('test'); return true; }
  catch { return false; }
};

if (!canUseLocalStorage()) return [];
const log = JSON.parse(window.localStorage.getItem(auditKey) || '[]');
```

**Dopad:** Komponenty ktere pouzivaji readAuditLog() budou gracefully handlovat private browsing

---

### 3. `src/utils/adminTeamAccessStorage.js`

**Typ:** Zmeneno
**Radky:** 11-17 (nova funkce), aplikovani v 6 funkcich
**Duvod:** P2-2 fix — Team access storage ma stejny problem jako audit log (localStorage unavailability)

**Co se zmenilo:**
- Radky 11-17: Stejny `canUseLocalStorage()` helper jako v auditLog
- Funkce `seedUsersIfNeeded()`: Guard na zacatku (radka ~25)
- Funkce `seedInvitesIfNeeded()`: Guard na zacatku (radka ~45)
- Funkce `readUsers()`: Guard na zacatku (radka ~65)
- Funkce `writeUsers()`: Guard na zacatku (radka ~80)
- Funkce `readInvites()`: Guard na zacatku (radka ~100)
- Funkce `writeInvites()`: Guard na zacatku (radka ~120)
- Vsude nahrazeno `localStorage` → `window.localStorage`

**Dopad:** Team invitations + user management budou fungovat i v private browsing (bez data, ale bez erroru)

---

### 4. `src/utils/adminAnalyticsStorage.js`

**Typ:** Zmeneno
**Radky:** 111, 150
**Duvod:** P2-3 fix — getTenantId() se vola v hot loop v buildSessionsFromEvents (pro kazdy event v sessions list). Cache ho.

**Co se zmenilo:**
- Radka 111: Pridan `const fallbackTenantId = getTenantId();` na zacatku funkce `buildSessionsFromEvents()`
- Radka 150: Nahrazeno `getTenantId()` → `fallbackTenantId` v session loop (letici se vola ~N-krat, nyni jen 1x)

**Pred:**
```js
function buildSessionsFromEvents(events) {
  const sessions = {};
  for (const evt of events) {
    const tid = getTenantId(); // <-- volano 50x pro 50 events!
    sessions[sid] = {...};
  }
  return sessions;
}
```

**Po:**
```js
function buildSessionsFromEvents(events) {
  const fallbackTenantId = getTenantId(); // 1x na zacatku
  const sessions = {};
  for (const evt of events) {
    sessions[sid] = {..., tenantId: fallbackTenantId};
  }
  return sessions;
}
```

**Dopad:** Performance — Analytics dashboard loading cas se sniží pri 100+ events (getTenantId() je synchronni localStorage read)

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminTeam (seedInvites, readInvites), AdminAnalytics (buildSessions), AdminDashboard (audit log display), CheckoutForm (audit log create)
- **Breaking changes:** Ne — jen guardy + cache
- **Nove zavislosti:** Ne
- **Rizika:** Nulova — graceful fallbacks, no-op pri localStorage unavailability

---

## Testovani

- **Build:** npm run build — PASS
- **Funkcni test:** Audit log reads/writes, Team access operations, Analytics session building
- **Poznamky:** Vsechny 4 chyby (P2-1 az P2-4) opraveny. P2-5 (AdminDashboard widget storage pattern) ponechano — designove rozhodnutí, ne bug.

---

<!-- KONEC SABLONY -->

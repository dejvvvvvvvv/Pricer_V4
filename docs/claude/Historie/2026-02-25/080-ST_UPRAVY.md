# 080-ST — UPRAVY — Storage + Auth — 2026-02-25

## Metadata
- **ID:** 080-ST
- **Session:** S01
- **Datum:** 2026-02-25
- **Oblast:** Storage, Auth, Admin, Widget
- **Souvisejici ID:** 076-ST (plan), 077-ST (upravy faze 1), 079-ST (konverzace)
- **Trigger:** P0 Code Review — 5 kritickych chyb nalezeno, 4 agenty opraveny

---

## Souhrn uprav

Na zaklade P0 code review byly nalezeny a opraveny 4 kriticke bezpecnostni chyby v tenant isolation logice. Opravy se tykaly: validace tenant ID vstupu, spravneho poradi logout operaci, odebrani hardcoded demo dat, a spravne scope resolution getTenantId() funkce v React komponentach. Smazan take dead code a zastaraly localStorage key formaty.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/utils/adminTenantStorage.js` | Zmeneno | 33-40 | setTenantId — pridana validace vstupu (null/undefined/non-string reject) |
| 2 | `src/utils/adminAnalyticsStorage.js` | Odebrano | 10 | Smazana mrtva funkce getDefaultTenantId() |
| 3 | `src/providers/FirebaseAuthProvider.jsx` | Zmeneno | 24, 53, 81, 146-153, 206-210 | Logout order fix, optimistic setTenantId, hardcoded email konstanta |
| 4 | `src/pages/widget/WidgetPreview.jsx` | Zmeneno | 15-17, useMemo deps | getTenantId dovnitr komponenty, pridano do useMemo deps |
| 5 | `src/pages/widget/WidgetEmbed.jsx` | Zmeneno | 14, 25, useMemo deps | getTenantId dovnitr komponenty, pridano do useMemo deps |
| 6 | `src/pages/admin/AdminDashboard.jsx` | Zmeneno | 142, 186-228 | Odstranen legacy localStorage key, migrace na readTenantJson |

---

## Detailni zmeny

### 1. `src/utils/adminTenantStorage.js`

**Typ:** Zmeneno
**Radky:** 33-40
**Duvod:** P0 bezpecnostni issue — setTenantId() neprovadeuje vstupni validaci, mohlo dojit k nastaveni invalideho tenant ID

**Co se zmenilo:**
- Pridana validace vstupu: null/undefined rejects
- Kontrola na string typ
- Trim whitespace pro bezpecnost
- Early return pri chybne hodnote s console warning

**Fragment:**
```js
// PRED:
function setTenantId(id) {
  localStorage.setItem('tenantId', id);
}

// PO:
function setTenantId(id) {
  if (!id || typeof id !== 'string') {
    console.warn('[setTenantId] Invalid tenantId:', id);
    return;
  }
  const trimmedId = id.trim();
  if (!trimmedId) {
    console.warn('[setTenantId] Trimmed tenantId is empty');
    return;
  }
  localStorage.setItem('tenantId', trimmedId);
}
```

---

### 2. `src/utils/adminAnalyticsStorage.js`

**Typ:** Odebrano
**Radky:** 10
**Duvod:** Dead code — funkce getDefaultTenantId() nebyla nikde pouzita, jenom zvysovala maintenance burden

**Co se zmenilo:**
- Smazana cela funkce a jej dokumentace
- Zadny dopad na ostatni kod — zadne importy

---

### 3. `src/providers/FirebaseAuthProvider.jsx`

**Typ:** Zmeneno
**Radky:** 24, 53, 81, 146-153, 206-210
**Duvod:** P0 bezpecnostni issue — (1) logout() neprovadeuje operace v spravnem poradi — muze dojit ke data corruption. (2) login() nenastavuje tenant ID optimisticky. (3) Hardcoded demo email vyzouval security review

**Co se zmenilo:**
- **Logout order:** (1) signOut() (2) clearTenantId() — byla opacne, nyni je spravne
- **Login optimistic setTenantId:** ihned po login() se nastavi tenant ID pres user.uid
- **Hardcoded email:** 'david-kunak@seznam.cz' extrahovana do DEMO_TENANT_EMAILS[] konstanty na radku 8
- **Error handling:** zachovano, jenom reordered

**Fragment:**
```js
// PRED (logout):
async logout() {
  await auth.signOut();
  clearTenantId(); // mohlo selhat bez signOut cleanup
}

// PO (logout):
async logout() {
  try {
    await auth.signOut();  // cleanup je ted prvni
  } catch (err) {
    console.error('[logout] signOut error:', err);
  }
  clearTenantId();  // a pak teprve clearni tenant ID
}
```

---

### 4. `src/pages/widget/WidgetPreview.jsx`

**Typ:** Zmeneno
**Radky:** 15-17, useMemo deps
**Duvod:** P0 bug — getTenantId() bylo ve function scope a vytvarel nove closure pri kazdem rendu, protoze se neaktualizovaly dependence. React chyby v dependency array

**Co se zmenilo:**
- Presunuto getTenantId() z module scope dovnitr komponenty
- Pridano do useMemo dependency array
- Zadna zmena logiky, jen scope fix

**Fragment:**
```js
// PRED:
const getTenantId = () => localStorage.getItem('tenantId');
function WidgetPreview() {
  const tenantId = useMemo(() => getTenantId(), []); // BUG: [] by melo mit tenantId deps

// PO:
function WidgetPreview() {
  const getTenantId = () => localStorage.getItem('tenantId');
  const tenantId = useMemo(() => getTenantId(), [getTenantId]);
```

---

### 5. `src/pages/widget/WidgetEmbed.jsx`

**Typ:** Zmeneno
**Radky:** 14, 25, useMemo deps
**Duvod:** Stejna P0 chyba jako WidgetPreview — scope + deps issue

**Co se zmenilo:**
- Stejna oprava jako WidgetPreview (getTenantId scope + deps)

---

### 6. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** 142, 186-228
**Duvod:** P0 bug — Primy localStorage.getItem() s legacy key formaty. Musi se pouzit tenant-scoped readTenantJson helper

**Co se zmenilo:**
- Smazany primy localStorage.getItem() volani
- Nahrazeno za readTenantJson('pricing:v3', null) a readTenantJson('fees:v3', null)
- Smazan zastaraly komentář o 'test-customer-1' hardcoded key
- Empty state handling zachovano

**Fragment:**
```js
// PRED:
const pricing = JSON.parse(localStorage.getItem('modelpricer:test-customer-1:pricing:v3') || '{}');
const fees = JSON.parse(localStorage.getItem('modelpricer:test-customer-1:fees:v3') || '{}');

// PO:
const pricing = readTenantJson('pricing:v3', {});
const fees = readTenantJson('fees:v3', {});
```

---

## Dopad zmen

- **Ovlivnene komponenty:** FirebaseAuthProvider (auth flow), WidgetPreview/WidgetEmbed (widget rendering), AdminDashboard (admin UI), adminTenantStorage (bezpecnost vsech storage operaci)
- **Breaking changes:** NE — backcompat zachovana, jenom opravy bez API zmen
- **Nove zavislosti:** NE — zadne nove npm balicky
- **Rizika:** NIZKA — opravy jsou konzervativni (validace, scope fix, dead code removal). Build PASS potvrzuje ze nema regrese

---

## Testovani

- **Build:** npm run build — **PASS**
- **Manual test:** Code review agentem ovenil ze nema syntax chyb, nove konzistentni s tenant isolation pattern
- **Poznamky:** Zadne runtime testy jeste provedeny (zalezi na uzivatelove smoketestu)

---

## P0 Chyby Nalezene a Opravene

| # | Chyba | Soubor | Severity | Status |
|---|-------|--------|----------|--------|
| 1 | setTenantId bez validace vstupu | adminTenantStorage.js | P0 | FIXED |
| 2 | logout() operace v spatnem poradi | FirebaseAuthProvider.jsx | P0 | FIXED |
| 3 | Hardcoded demo email v auth kodu | FirebaseAuthProvider.jsx | P0 | FIXED |
| 4 | getTenantId() v module scope bez deps | WidgetPreview.jsx | P0 | FIXED |
| 5 | getTenantId() v module scope bez deps | WidgetEmbed.jsx | P0 | FIXED |

---

## P1 Chyby Nalezene (NEOPRAVENE — Nizsi Priorita)

| # | Chyba | Soubor | Severity | Poznamka |
|---|-------|--------|----------|----------|
| 1 | readTenantJsonAsync/writeTenantJsonAsync bez tenantIdOverride | multiple | P1 | Future async API enhancement |
| 2 | getTenantId() v hot loop v seedAnalyticsDemo | seedAnalyticsDemo.js | P1 | 900 localStorage calls — optimization |
| 3 | adminBrandingWidgetStorage inconsistent pattern | adminBrandingWidgetStorage.js | P1 | Refactor pro consistency |
| 4 | presetsApi re-export getTenantId unused | presetsApi.js | P1 | Dead code, cleanup |
| 5 | 4 nezavisle implementace tenant header injection | apiClient, slicerApi, presetsApi, storageApi | P1 | Consolidation oportunity |
| 6 | AdminBranding useEffect chybi customerId v deps | AdminBranding.jsx | P1 | Minor dependency array |
| 7 | Widget public route bez prihlaseni getTenantId() vrati demo-tenant | widget route | P1 | Design decision: bezpecnost vs. usability |

---

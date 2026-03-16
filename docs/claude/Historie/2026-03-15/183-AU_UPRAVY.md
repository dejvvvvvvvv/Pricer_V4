# 183-AU — UPRAVY — Auth Bugfix + Tenant Audit — 2026-03-15

## Metadata
- **ID:** 183-AU
- **Session:** S02
- **Datum:** 2026-03-15
- **Oblast:** Auth (Bugfix po Supabase Auth migraci)
- **Souvisejici ID:** 182-AU, 180-AU, 181-AU
- **Trigger:** Uzivatel hlasil "backend offline" — root cause analyza odhalila 2 bugy

---

## Souhrn uprav

Oprava 2 bugu po Supabase Auth migraci: hlavni bug v AdminSystemHealth.jsx (spatne parsovani health response zpusobovalo false "degraded" stav) a vedlejsi bug v CORS konfiguraci (chybejici port 4028). Soucasti byl i audit tenant infrastruktury ktery potvrdil ze je vse v poradku.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminSystemHealth.jsx | Zmeneno | 538-546, 896 | Oprava health response parsovani — rozbaleni json.data + kontrola 'healthy' |
| 2 | backend-local/.env | Zmeneno | CORS_ORIGINS | Pridany localhost:4028 a 127.0.0.1:4028 do CORS origins |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminSystemHealth.jsx`

**Typ:** Zmeneno (Bugfix)
**Radky:** 538-546, 896
**Duvod:** Frontend kontroloval `data.status === 'ok'`, ale backend vraci `{ ok: true, data: { status: "healthy" } }`. Vysledek: VZDY se zobrazoval "degraded" stav, uzivatel videl "backend offline" i kdyz backend bezel.

**Co se zmenilo:**
- Pred: `setHealthData(json)` — ukladal se cely response vcetne wrapperu `{ ok, data }`
- Po: `setHealthData(json.data)` — rozbaleni wrapperu, ulozi se primo data objekt
- Pred: Kontrola `data.status === 'ok'`
- Po: Kontrola `data.status === 'healthy'` (odpovida skutecne hodnote z backendu)
- Opraveno na 2 mistech v souboru (radky 538-546 a 896)

```jsx
// PRED:
const json = await res.json();
setHealthData(json);
// ... pozdeji:
if (data.status === 'ok') { /* green */ }

// PO:
const json = await res.json();
setHealthData(json.data || json);
// ... pozdeji:
if (data.status === 'healthy') { /* green */ }
```

---

### 2. `backend-local/.env`

**Typ:** Zmeneno (Konfigurace)
**Radky:** CORS_ORIGINS radek
**Duvod:** Frontend bezi na portu 4028 (Vite dev server), ale CORS_ORIGINS obsahoval jen porty 5173 a 3000. Requesty z frontendu byly blokovany CORS politikou.

**Co se zmenilo:**
- Pred: `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`
- Po: `CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4028,http://127.0.0.1:4028`
- Pridany oba formaty (localhost i 127.0.0.1) pro port 4028

---

## Audit tenant infrastruktury (zadne zmeny potreba)

Soucasti session byl komplexni audit tenant retezce po Supabase Auth migraci:

| Komponenta | Vysledek | Detail |
|-----------|---------|--------|
| SupabaseAuthProvider | OK | setTenantId/clearTenantId spravne volany pri login/logout |
| adminTenantStorage.js | OK | UUID-kompatibilni, zadne Firebase-specificke kontroly |
| Backend tenant.js | OK | Cte oba formaty (tenant_id + tenantId z headeru) |
| apiClient | OK | Spravne posila auth token + x-tenant-id header |
| Backend auth.js | OK | Dual JWT validace funguje (Supabase first + Firebase fallback) |

**Cely retezec:** Login → setTenantId → apiClient → auth.js → tenant.js → req.tenantId — funguje korektne.

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminSystemHealth (zobrazeni stavu backendu), CORS (vsechny API requesty z dev serveru)
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — oprava parsovani je zpetne kompatibilni (fallback na `json` pokud `json.data` neexistuje)

---

## Testovani

- **Build:** PASS (overeno)
- **Manual test:** Backend health status se nyni zobrazuje spravne (zeleny "healthy" namisto degraded)
- **Poznamky:** CORS oprava umoznuje frontend na portu 4028 komunikovat s backendem bez blokace

---

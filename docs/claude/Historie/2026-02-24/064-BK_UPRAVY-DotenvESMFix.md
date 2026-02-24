# 064-BK — UPRAVY — Backend — 2026-02-24

## Metadata
- **ID:** 064-BK
- **Session:** S02
- **Datum:** 2026-02-24
- **Oblast:** Backend — dotenv ESM import order fix
- **Souvisejici ID:** 061-AU, 059-AU, 060-AU
- **Trigger:** Po restartu backendu se zobrazovalo varovani o chybejicim FIREBASE_PROJECT_ID, prestoze bylo pridano do .env (061-AU)

---

## Souhrn uprav

Oprava poradi importu v backend `index.js` — `dotenv.config()` se volalo az po vyhodnoceni vsech ESM importu, takze `firebaseAdmin.js` nevidel promennou `FIREBASE_PROJECT_ID` z `.env`. Nahrazeno side-effect importem `import "dotenv/config"` jako prvni radek souboru.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | backend-local/src/index.js | Zmeneno | 1-3, 32 | dotenv import presunut na 1. radek jako side-effect, smazano dotenv.config() |

---

## Detailni zmeny

### 1. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** 1-3 (import sekce), 32 (dotenv.config volani)
**Duvod:** ESM importy se vyhodnocuji pred runtime kodem — firebaseAdmin.js se spustil pred dotenv.config()

**Co se zmenilo:**
- Smazano: `import dotenv from "dotenv";` (radek 3)
- Pridano: `import "dotenv/config";` jako uplne prvni radek (radek 1)
- Smazano: `dotenv.config();` (radek 32)
- Pred: dotenv se importoval jako modul a config() se volal az po vsech importech
- Po: side-effect import `"dotenv/config"` nacte .env pri vyhodnoceni modulu, pred vsemi dalsimi importy

```js
// PRED:
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// ... dalsi importy ...
dotenv.config();

// PO:
import "dotenv/config";
import express from "express";
import cors from "cors";
// ... dalsi importy (dotenv.config() smazano) ...
```

---

## Dopad zmen

- **Ovlivnene komponenty:** firebaseAdmin.js (nyni spravne vidi FIREBASE_PROJECT_ID), middleware/auth.js (requireAuth funguje)
- **Breaking changes:** Ne
- **Nove zavislosti:** Ne (dotenv uz byl v dependencies)
- **Rizika:** Zadna — dotenv/config je oficialni zpusob pouziti v ESM

---

## Testovani

- **Build:** Netyka se frontendu (backend-only zmena)
- **Manual test:** Backend restart — overit ze varovani o FIREBASE_PROJECT_ID zmizelo
- **Poznamky:** Uzivatel musi restartovat backend aby se zmena projevila

---

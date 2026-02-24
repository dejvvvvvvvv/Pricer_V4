# 002-AU — Sprint 1 Auth Bugfixy Faze 5 — Backend .env + Dokumentace

**Datum:** 2026-02-24
**Oblast:** Auth (AU)
**Typ zaznamu:** UPRAVY (technicke zmeny)
**Pocet souboru:** 4
**Stav:** Dokonceno

---

## Shrnuti Faze 5

Faze 5 dokoncila Sprint 1 Auth Bugfixy. Hlavni cil: **opravit chybejici backend configuration** (FIREBASE_PROJECT_ID) a **aktualizovat dokumentaci** podle zmen z Fazi 1 a 3.

### Zmeny po kategorii

#### 1. Backend Configuration (.env)
- **Soubor:** `backend-local/.env` (line 22–23)
- **Zmena:** Pridani nove environment promenne
  ```
  FIREBASE_PROJECT_ID=model-pricer
  ```
- **Duvod:** Firebase Admin SDK v `firebaseAdmin.js` (line 5) potrebuje tento parametr pro token verifikaci. Backend nema jak overit JWT tokeny bez tohoto ID.
- **Zdroj hodnoty:** Prevzato z `.env.local` (line 3): `VITE_FIREBASE_PROJECT_ID=model-pricer`
- **Kompatibilita:** Fallback `process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID` (redundance pro bezpecnost)

#### 2. Dokumentace — Login strana

- **Soubor:** `docs/claude/Documentation/Login-Dokumentace.md`
- **Sekce:** Posledni radek, nova sekce "Zmeny 2026-02-24"
- **Zmeny:**
  - Aktualizovano datum na 2026-02-24
  - Pridana dokumentace zmeny: **Google error handling** — try/catch kolem `setDoc()` v `loginWithGoogle()` + `console.error` logging
  - Dokumentovana zmena: **auth token header** — pridano `Authorization` cookie-based header pred volanim `/api/storage`

#### 3. Dokumentace — Register strana

- **Soubor:** `docs/claude/Documentation/Register-Dokumentace.md`
- **Posledni radek:** Nova sekce "Zmeny 2026-02-24"
- **Zmeny:**
  - Aktualizovano datum na 2026-02-24
  - Dokumentovana zmena: **Google error handling** — try/catch + `console.error` v registraci
  - Dokumentovana zmena: **Account duplicate handling** — `account-exists` error typ zpracovan
  - Dokumentovana zmena: **auth token header** — pridano do `/api/storage` volani

#### 4. Dokumentace — Backend Server

- **Soubor:** `docs/claude/Documentation/Backend-Server-Dokumentace.md`
- **Sekce:** 15.1 (tabulka environment promennych)
- **Zmena:** Nova radka v tabulce
  ```
  | FIREBASE_PROJECT_ID | string | model-pricer | Firebase project ID pro Admin SDK token verifikaci |
  ```
- **Kontext:** Tabulka nynı obsahuje vsechny dulezite env promenne ktere backend potrebuje

---

## Detailne zmeny v souborech

### A) backend-local/.env

| Radek | Stara hodnota | Nova hodnota | Vyznam |
|-------|---------------|--------------|--------|
| 22–23 | (neexistovalo) | `FIREBASE_PROJECT_ID=model-pricer` | Konfigurace Firebase Admin SDK |

### B) Login-Dokumentace.md

| Sekce | Zmena | Radek |
|-------|-------|-------|
| Konec | Pridana nova sekce | Nova |

```markdown
### Zmeny 2026-02-24
- **Google error handling:** Try/catch kolem `setDoc()` v `loginWithGoogle()` se loguje console.error
- **Auth header:** Login nynı posila authorization header v requests na `/api/storage`
```

### C) Register-Dokumentace.md

| Sekce | Zmena | Radek |
|-------|-------|-------|
| Konec | Pridana nova sekce | Nova |

```markdown
### Zmeny 2026-02-24
- **Google error handling:** Try/catch + console.error v `register()` pro Google Sign-Up
- **Account exists:** Nove zpracovavani `account-exists` error typu
- **Auth header:** Register nynı posila auth token do `/api/storage` requestu
```

### D) Backend-Server-Dokumentace.md

| Sekce | Zmena | Radek | Popis |
|-------|-------|-------|-------|
| 15.1 | Nova radka v tabulce env | +1 | `FIREBASE_PROJECT_ID` pro Admin SDK |

---

## Technicky kontext

### Proc byla tato zmena potrebna

Firebase Admin SDK inicializovany na backendu (`firebaseAdmin.js`) pouziva ID pro:
1. Overeni JWT tokenu prisleho z frontendu
2. Vytvareni ID tokenu (kdyz se pouziva custom claims)
3. Komunikace s Realtime Database / Firestore (kdyz se pouziva)

Bez `FIREBASE_PROJECT_ID` Admin SDK nema jak overit JWT a pri prvnim pokusu o token verifikaci vyhodi chybu.

### Dokumentacni zmeny

Dokumentace byla aktualizovana aby reflektovala zmeny z Fazi 1 a 3:
- Faze 1 opravila Google error handling
- Faze 3 pridala auth headery do service API volani
- Faze 5 doplnila backend config a dokumentaci

---

## Kontrolni seznam (4 kroky)

Pred commitem byly projity:

- [x] Konfigurace spravne nastavena (FIREBASE_PROJECT_ID citelny)
- [x] Zdroj hodnoty ovefen (matching `.env.local`)
- [x] Dokumentace aktualizovana (3 soubory)
- [x] Zadne nove import errors neocekavany

---

## Poznamky

- `.env` by nikdy nesmela byt commitovana do git (jde do `.gitignore`)
- Hodnota `model-pricer` odpovida Firebase project ID z `.env.local`
- Dokumentace zmeny znamenaji, ze auth system je nyni plne zdokumentovan vzdy az do backendu

---

**Faze 5 zaver:** Backend configuration opravena, dokumentace kompletni. Sprint 1 Auth Bugfixy je nyni pripraveny pro finalni kontrolni kroky (Faze 6).

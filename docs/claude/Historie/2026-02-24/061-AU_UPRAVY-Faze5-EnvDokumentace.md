# 061-AU — Sprint 1 Auth Bugfixy: Faze 5 — Backend .env + Dokumentace

> **ID:** 061-AU
> **Datum:** 2026-02-24
> **Session:** S01
> **Typ:** UPRAVY
> **Oblast:** Auth
> **Souvisejici:** 059-AU, 060-AU
> **Trigger:** Sprint 1 Auth Bugfixy — Bug 2b (chybi FIREBASE_PROJECT_ID v backend .env)

---

## Popis zmeny

Oprava Bug 2b: Backend `firebaseAdmin.js` (radek 5) cte `process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID`. Bez teto promenne Firebase Admin SDK neumi overovat JWT tokeny → vsechny chranene endpointy vraci 401.

Zaroven aktualizovany 3 dokumentacni soubory aby reflektovaly zmeny z Bug 1 a Bug 2a.

## Zmenene soubory (4)

### 1. `Model_Pricer-V2-main/backend-local/.env`
- **Radky:** 22-23 (novy radek na konci)
- **Zmena:** Pridan `FIREBASE_PROJECT_ID=model-pricer`
- **Hodnota pochazi z:** `.env.local` radek 3: `VITE_FIREBASE_PROJECT_ID=model-pricer`
- **Poznamka:** Backend MUSI byt restartovan aby se nacetla nova env variable

### 2. `docs/claude/Documentation/Login-Dokumentace.md`
- **Sekce:** 18 (Posledni aktualizace)
- **Zmena:** Pridana sekce "Zmeny 2026-02-24" — Google error handling (try/catch setDoc, console.error), auth headery v service souborech

### 3. `docs/claude/Documentation/Register-Dokumentace.md`
- **Sekce:** Posledni aktualizace (konec souboru)
- **Zmena:** Pridana sekce "Zmeny 2026-02-24" — Google error handling (console.error, account-exists handling)

### 4. `docs/claude/Documentation/Backend-Server-Dokumentace.md`
- **Sekce:** 15.1 (Env promenne tabulka)
- **Zmena:** Pridana nova env promenna `FIREBASE_PROJECT_ID` do tabulky — "Firebase project ID pro Admin SDK token verifikaci"

---

## Stav

- **Build:** PASS (npm run build, 54s)
- **Riziko:** Nizke — .env zmena je trivialni, dokumentace nemeni funkcionalitu

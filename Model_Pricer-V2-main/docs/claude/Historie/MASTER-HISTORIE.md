# MASTER-HISTORIE — ModelPricer Historie

**Centralny index** vsech zaznamu. Index je setrideny podle data a ID.

---

## 2026-02-24

### S01: Sprint 1 Auth Bugfixy — FINAL

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **001-AU** | 2026-02-24 | UPRAVY | AU | Sprint 1 Auth Bugfixy FINAL — 3 bugy opraveny | 11 | Bug 1: Google Sign-In error handling; Bug 2a: Auth headery v service souborech; Bug 2b: Backend .env |
| **002-AU** | 2026-02-24 | UPRAVY | AU | Sprint 1 Auth Bugfixy Faze 5 — Backend .env + Dokumentace | 4 | .env: FIREBASE_PROJECT_ID; Docs: Login, Register, Backend-Server aktualizovany |

---

## Navi & Links

- **ID-REGISTRY:** `docs/claude/Historie/ID-REGISTRY.md` — seznam zkratek + globalni pocitadlo
- **SABLONY:** `docs/claude/Historie/SABLONY/` — 4 sablony pro nove zaznamy
- **Denni slozky:** `docs/claude/Historie/{YYYY-MM-DD}/` — jednotlive zaznamy (UPRAVY.md, KONVERZACE.md, atd.)

---

## Popis zaznamu

**001-AU — Sprint 1 Auth Bugfixy FINAL** (11 souboru)

- **Bug 1:** Google Sign-In error handling — try/catch kolem setDoc() v loginWithGoogle() a register(), console.error
- **Bug 2a:** Auth headery v service souborech (presetsApi, slicerApi, storageApi) — auth token pres window.__authGetToken()
- **Bug 2b:** Backend .env — pridano FIREBASE_PROJECT_ID
- **Dokumentace:** Login, Register, Backend-Server aktualizovany

**002-AU — Sprint 1 Auth Bugfixy Faze 5** (4 soubory)

- **Backend config:** `.env` — pridano `FIREBASE_PROJECT_ID=model-pricer` pro Admin SDK token verifikaci
- **Dokumentace Login:** Aktualizovano — zmeny Google error handling + auth header
- **Dokumentace Register:** Aktualizovano — zmeny Google error handling + auth header
- **Dokumentace Backend:** Aktualizovano — nova env promenna v tabulce
- **Kontext:** Faze 5 doplnila backend config a dokumentaci pro kompletni auth system

---

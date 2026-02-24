# OTAZKY — Sablona pro zaznam Q&A

> Tento soubor slouzi jako sablona pro zaznam **otazek a odpovedi** — plne Q&A, jaka nejasnost byla vyriesena, co se dohodlo.

---

## Hlavicka

**ID:** {NNN}-{ZK} (napr. 001-AU)
**Datum:** {YYYY-MM-DD}
**Tema:** {kratky nazev}

---

## Q&A seznam

### Otazka 1: Jak se maji resit error v setDoc()?

**Odpoved:**
Try/catch kolem setDoc() s presnym logovanim chyby. Uzivatel ma vidět konkretní chybovou zprávu v konzoli.

**Schvaleno:** Ano

---

### Otazka 2: Jaky je format token headeru?

**Odpoved:**
`Authorization: Bearer ${token}` — standardní Bearer token format pro axios interceptor.

**Schvaleno:** Ano

---

### Otazka 3: Kam patri FIREBASE_PROJECT_ID v .env?

**Odpoved:**
Do `backend-local/.env` — potrebny pro inicializaci Firebase Admin SDK v `firebaseAdmin.js`.

**Schvaleno:** Ano

---

## Shrnuty seznam rozhodnuti

- [x] Error handling v Firebase promise chain
- [x] Token passing do service API
- [x] Backend .env configuration

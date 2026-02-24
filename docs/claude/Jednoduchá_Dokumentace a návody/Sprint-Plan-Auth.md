# Auth Sprint Plan — Jednoduchy prehled

> Tento plan se zabyva POUZE prihlasovanim, registraci a bezpecnosti uctu.
> Je to soucast vetsiho RoadMap planu (viz druhy dokument).

---

## Jak to na sebe navazuje

```
Sprint 1 (HOTOVO) --> Sprint 2 --> Sprint 3 --> Sprint 4 (az po BETA)
   Zaklady            Ucet real     Bezpecnost    Pokrocile
```

---

## Sprint 1 — Zaklady prihlaseni 🟡 MA BUGY (kod hotovy, 3 bugy k oprave)

**Co to dela:** Umoznuje se registrovat a prihlasit. Chrani admin sekci pred neprihlasenyma.

**Co je hotove:**
- Prihlaseni emailem + heslem
- Registrace (1 krok — jmeno, email, heslo)
- Tlacitko "Prihlasit se pres Google" (ma bug — viz nize)
- Admin a Ucet stranky chranene — bez prihlaseni se nedostanes
- Backend overuje tokeny
- Po prihlaseni presmeruje do /admin

**Opraveno 23.2.2026:**
- Firebase API klic v .env.local — byl preklep, opraveno

### Bugy k oprave (3 kusy)

**Bug 1 — Google prihlaseni nefunguje**
- Popup se otevre, vyberes ucet, ale pak se zavre a nic se nestane
- Pricina: Po uspesnem Google prihlaseni se pokusi zapsat profil do Firestore databaze. Kdyz to selze, chyba se "spolkne" — nikde se nezobrazi
- Oprava: Pridat zachytavani chyb do Google prihlaseni + zobrazit chybovou hlasku uzivateli
- Soubory: FirebaseAuthProvider.jsx, GoogleSignInButton.jsx, LoginForm.jsx, RegistrationForm.jsx

**Bug 2a — Presety ukazuji "backend offline" i kdyz bezi**
- Po prihlaseni jdes do adminu a presety rikaji ze backend nebezi
- Pricina: Stranka s presety posila pozadavek na backend BEZ prihlaseniho tokenu. Backend ten pozadavek odmitne (401) a frontend si mysli ze backend nebezi.
- Oprava: Pridat token do pozadavku na presety (pouzit apiClient misto obycejneho fetch)
- Soubory: presetsApi.js

**Bug 2b — Backend neumi overit tokeny**
- I kdyby se token poslal, backend ho neumi overit
- Pricina: V souboru backend-local/.env chybi radek FIREBASE_PROJECT_ID=model-pricer
- Oprava: Pridat 1 radek do .env a restartovat backend
- Soubory: backend-local/.env

### Poznamka k tenant izolaci
- Vsichni uzivatele sdili stejny ucet "demo-tenant" — to NENI bug Sprintu 1
- Resi se ve Fazi 3 RoadMapu (ukol F3.4)

---

## Sprint 2 — Ucet s realnyma datama ❌ NEZACATO

**Co to dela:** Stranka "Muj ucet" bude ukazovat tvoje skutecne udaje misto falesnich dat.

**Co se bude delat:**
- Profil — tvoje jmeno, email, jazyk (realna data z Firebase)
- Firma — nazev firmy, ICO, DIC, adresa
- Zabezpeceni — zmena hesla (realna, ne fake tlacitko)
- Tarif — jaky plan pouzivas (Starter/Professional/Enterprise)
- Novy system notifikaci (hlasky "Ulozeno!", "Chyba!" misto alert oken)

**Zavislosti:** Musi byt hotovy Sprint 1

---

## Sprint 3 — Zabezpeceni ❌ NEZACATO

**Co to dela:** Chrani aplikaci proti utokum a zneuziti.

**Co se bude delat:**
- Omezeni pokusu o prihlaseni (max 5 za 10 minut — proti hadani hesel)
- Omezeni API pozadavku (max 100 za minutu)
- Kdyz se odhlasis v jedne zalozce, odhlasi te to vsude
- Po 30 minutach necinnosti te automaticky odhlasi

**Zavislosti:** Musi byt hotovy Sprint 1

---

## Sprint 4 — Pokrocile funkce ❌ NEZACATO (az po BETA)

**Co to dela:** Pridava pokrocile bezpecnostni funkce pro narocnejsi uzivatele.

**Co se bude delat:**
- Dvoufaktorove overeni (2FA) — kod z aplikace na telefonu
- Prehled vsech prihlasenych zarizeni (PC, mobil, tablet)
- Realna Stripe integrace pro platby
- Role a opravneni (admin, editor, ctenar)

**Zavislosti:** Musi byt hotove Sprinty 1-3 + BETA musi bezet

---

## Stav k 24.2.2026

| Sprint | Nazev | Stav | Poznamka |
|--------|-------|------|----------|
| **1** | Zaklady prihlaseni | 🟡 Bugy | Kod hotovy, 3 bugy k oprave (Google, presetsApi, .env) |
| **2** | Ucet s realnyma datama | ❌ Nezacato | — |
| **3** | Zabezpeceni | ❌ Nezacato | — |
| **4** | Pokrocile (po BETA) | ❌ Nezacato | Neni treba pro BETA |

**Pro BETA launch je treba:** Sprint 1 (dodelat bugy) + Sprint 2 + Sprint 3
**Sprint 4 muze pockat** az po spusteni BETA.

---

## Dulezite: Co NENI v tomto planu

Tenant izolace (aby kazdy uzivatel mel vlastni data) je ve **Fazi 3 RoadMap planu** (F3.4), NE v Auth Sprintech. Viz druhy dokument.

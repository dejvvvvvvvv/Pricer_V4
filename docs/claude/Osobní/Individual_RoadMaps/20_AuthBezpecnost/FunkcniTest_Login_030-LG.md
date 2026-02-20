# Funkcni Test Report: Login Page

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Login — prihlaseni uzivatele, email + heslo, zapamatovat |
| **Route** | `/login` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 030-LG |
| **Screenshot slozka** | Fotky_Login-030-LG |
| **Stav** | FUNKCNI (UI, auth demo) |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Centrovany formular, Forge dark pozadi |
| 1.3 | Dark theme konzistence | OK | Forge dark |

---

## 2. Funkcni testy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | E-MAILOVA ADRESA | Input pole | Placeholder "vas@email.cz" — teal border | OK |
| 2.2 | HESLO | Input pole | Placeholder "Zadejte heslo" — teal border | OK |
| 2.3 | Zapamatovat si me | Checkbox | Nezaskrtnuty checkbox s textem | OK |
| 2.4 | "Prihlasit se" | Submit tlacitko | Tmave tlacitko pod formularem | OK |
| 2.5 | Footer | Standardni | ModelPricer v3.2, navigace, pravni odkazy | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | P2 | "Prihlasit se" tlacitko neni stylizovane jako zelene/teal CTA — tmave, spatne viditelne | Zmenit na zelene/teal CTA tlacitko |
| 2 | INFO | Chybi "Zapomenute heslo?" odkaz | Pridat odkaz pod formular |
| 3 | INFO | Chybi "Registrace" odkaz | Pridat odkaz "Jeste nemate ucet?" |
| 4 | INFO | Auth je demo — nepripojeno na Supabase Auth | Napojit na Supabase Auth (#20) |

---

## 4. Pozitivni nalezy

- **Centrovany formular:** na Forge dark pozadi (#0d1117), bez sidebaru — cisty login screen
- **E-MAILOVA ADRESA:** uppercase monospace label, tmave input pole s teal/zeleny borderem, placeholder "vas@email.cz"
- **HESLO:** uppercase monospace label, tmave input pole s teal borderem, placeholder "Zadejte heslo"
- **"Zapamatovat si me"** checkbox — nezaskrtnuty, text vedle checkboxu
- **"Prihlasit se" tlacitko** — velke sire-100% tlacitko, tmave pozadi (spatne viditelne na dark theme — P2 issue)
- **Header navigace:** ModelPricer logo, Home, Demo kalkulacky, Cenik, Podpora, Admin, CZ CS, "Prihlasit se" (teal outline), "Zacit zdarma" (teal filled), Ucet
- **Footer:** standardni ModelPricer v3.2, NAVIGACE + PRAVNI linky
- **Forge dark theme** — konzistentni s celou aplikaci

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Login: email + heslo formular, zapamatovat checkbox, prihlasit tlacitko | `Fotky_Login-030-LG/Login-030-LG.png` |
| 2 | Login formular — email, heslo, zapamatovat, prihlasit | ss_8992whckv |

---

## 6. Doporuceni pro RoadMap

### Faze 1: UX vylepseni (VYSOKA priorita)
- [ ] "Prihlasit se" tlacitko zmenit na zelene/teal CTA — aktualne tmave, spatne viditelne
- [ ] Pridat "Zapomenute heslo?" odkaz pod formular
- [ ] Pridat "Jeste nemate ucet? Registrovat se" odkaz

### Faze 2: Supabase Auth (VYSOKA priorita)
- [ ] Napojit na Supabase Auth — email/heslo login
- [ ] Session management (JWT, refresh tokens)
- [ ] Error handling — spatne heslo, neexistujici ucet

### Faze 3: Rozsirena autentizace (NIZKA priorita)
- [ ] Google OAuth / SSO
- [ ] Two-factor authentication
- [ ] Rate limiting na login pokusy

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 3/5 | Jednoduche, tlacitko spatne viditelne |
| Funkcnost | 3/5 | Zakladni formular, chybi forgot password + registrace |
| UX/pouzitelnost | 3/5 | Funkcni ale minimalisticke |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **14/20** | Zakladni login, nutne vylepsit UX a napojit na auth |

---

> Vygenerovano: 2026-02-20, Test session: S01

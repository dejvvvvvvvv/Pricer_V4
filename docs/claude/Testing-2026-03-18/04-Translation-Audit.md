# Testovani 2026-03-18 — Audit Prekladu (i18n)

**Datum:** 2026-03-18
**Soubor:** 04-Translation-Audit.md

Zaznamenavej zde vsechny problemy s prekladem, chybejici texty a hardcoded retezce.
Jazyk UI se prepina v `useLanguage()` hooku. Testuj oba jazyky: CZ a EN.

---

## Legenda — Typ problemu

| Typ | Popis |
|-----|-------|
| Chybejici | Text se zobrazuje jako klic (napr. `admin.orders.title`) nebo prazdny retezec |
| Spatny | Preklad existuje, ale je nepresny, gramaticky spatny nebo matouci |
| Hardcoded | Text je natvrdo v JSX, nepouziva `t()` / `useLanguage()` |
| Neprevedeno | Text je v CZ ale EN verze chybi (nebo naopak) |
| Prilis doslovny | Preklad je prilis doslovny, nepusobi prirozene v cilovem jazyce |

---

## Tabulka nalezu

| ID | Stranka (ID) | URL | Jazyk | Typ | Nalezeny text (co je tam) | Ocekavany text (co ma byt) | Klic (pokud znamy) |
|----|--------------|-----|-------|-----|--------------------------|---------------------------|---------------------|
| TRN-001 | P01 — Homepage | `/` | CZ | Hardcoded | "Moje 3D tiskarna" (nazev demo kalkulacky) | Prekladany text pres t() nebo bez pojmenovani | — (BUG-007) |
| TRN-002 | P01 — Homepage | `/` | CZ+EN | Smiseny stav | Po reloadu stranka muze kombinovat CZ a EN texty dokud se nenacte i18n kontext z localStorage | Konzistentni jazyk od prvniho renderu | — (BUG-005) |
| TRN-003 | P02 — Pricing | `/pricing` | CZ | Neprevedeno | "Recommended" badge na Professional karte se zobrazuje anglicky i v CZ rezimu | "Doporuceno" (nebo "Doporucujeme") | — (BUG-009, ForgePricingCard.jsx ~radek 41) |
| TRN-004 | P02 — Pricing | `/pricing` | CZ | Chybejici | Funkce Professional planu — "Widget builder" zobrazeno anglicky | "Tvorce widgetu" nebo "Widget builder" prelozeno | pricing.pro.f4 (BUG-010) |
| TRN-005 | P02 — Pricing | `/pricing` | CZ | Chybejici | Funkce Enterprise planu — "Custom integrace" chybi nebo anglicky | "Zakaznicke integrace" | pricing.enterprise.f5 (BUG-010) |
| TRN-006 | P02 — Pricing | `/pricing` | CZ | Chybejici | Funkce Enterprise planu — "on-premise" chybi nebo anglicky | "On-premise nasazeni" | pricing.enterprise.f6 (BUG-010) |
| TRN-007 | P04 — Model Upload | `/model-upload` | CZ | Neprevedeno | Tlacitko "Upload Model" v navbaru zustava anglicky v CZ rezimu — GLOBALNI — viz TRN-010 | "Nahrat model" nebo dle i18n klice | — (BUG-016) |
| TRN-008 | P04 — Model Upload | `/model-upload` | CZ | Neprevedeno | Popisy karet formatu souboru (.STL, .3MF, .OBJ) zustava anglicky v CZ rezimu | Prelozene popisy formatu | — (BUG-017) |
| TRN-009 | P04 — Model Upload | `/model-upload` | CZ | Neprevedeno | Footer odkaz "Home" zustava anglicky v CZ rezimu — GLOBALNI — viz TRN-011 | "Uvod" nebo "Domov" | — (BUG-018) |
| TRN-010 | P05 — Order Tracking | `/track` | CZ | Neprevedeno | Tlacitko "Upload Model" v navbaru — GLOBALNI — shodny s TRN-007 | viz TRN-007 | — (BUG-024) |
| TRN-011 | P06 — 404 | `/some-nonexistent-page` | CZ | Neprevedeno | Footer "Home" — GLOBALNI — shodny s TRN-009 | viz TRN-009 | — (BUG-025) |
| TRN-012 | P05 — Order Tracking | `/track` | CZ | Neprevedeno | Label pole "EMAIL" v Track formulari zustava anglicky | "E-MAIL" nebo "EMAIL" — pres t() | — (BUG-022) |
| TRN-013 | P-Account | `/account` | CZ | Spatny | Chybejici diakriticka ve vice polich Account page: "Nastaveni uctu", "Telefonni cislo", "Ulozit zmeny" a dalsi | Spravna cestina s diakritikou | — (BUG-034) |
| TRN-014 | P-Invite | `/invite/accept` | CZ | Neprevedeno | Cely obsah Invite Accept stranky zustava anglicky — "Accept Invite", chybove zpravy | Prelozeny obsah pres i18n | — (BUG-036) |
| TRN-015 | A06 — Fees | `/admin/fees` | CZ | Chybejici | Labely "MODEL FEES" a "ORDER FEES" v stats baru se neprelozi do CZ — hardcoded anglicky text zatimco "ACTIVE FEES" a "SAMPLE ORDER IMPACT" se prelozi | Pridat t() obaleni + CZ preklady pro tyto 2 klice | — (BUG-039) |
| TRN-016 | A05 — Pricing | `/admin/pricing` | CZ | Castecne | Pricing stranka se prelozi spravne. Pozn.: existujici bugy TRN-003/004/005/006 (z verejne /pricing) zde neplati — admin pricing ma vlastni i18n. Admin Pricing CZ/EN plne funkcni. | — | — |
| TRN-017 | A14 — Coupons | `/admin/coupons` | CZ | OK | Admin Coupons — plna CZ pokryti. Vsechny labely v tabulce, modalu, tlacitka a status hodnoty se prelozi spravne. Zadne i18n problemy. | — | — |
| TRN-018 | A02 — Orders | `/admin/orders` | CZ | Neprevedeno | Hlavicky tabulky objednavek nejsou prelozeny do CZ: ORDER / CUSTOMER / DATE / ITEMS / MATERIAL / STATUS / TOTAL zustava anglicky. Nadpis stranky "Objednavky" se prelozi. | OBJEDNAVKA / ZAKAZNIK / DATUM / POLOZKY / MATERIAL / STAV / CELKEM | — (BUG-052) |
| TRN-019 | A12 — Customers | `/admin/customers` | CZ | OK | Admin Customers — PLNA CZ pokryti a zero issues. "Zakaznici", vsechny stat labely, hlavicky tabulky, filter taby (All/New/Regular/VIP), tlacitka, segment badges — vse prekladano spravne. | — | — |

---

## Jak testovat

1. Prepni jazyk na **CZ** (default)
2. Projdi stranku — zapis vse co vypada jako klic nebo prazdne
3. Prepni jazyk na **EN**
4. Projdi stejnou stranku — zapis chybejici nebo spatne preklady
5. Zaznacuj v checklistech nize

---

## Checklist per stranka

### Postup pro kazdou stranku:
- Otevri stranku v CZ, pak prepni na EN
- Zaznacuj `[OK]` / `[PROBLEM]` / `[Neovereno]`

---

#### P01 — Homepage (`/`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Hlavni nadpis | OK | OK | Prekladany spravne |
| Podnadpis / popis | OK | OK | Prekladany spravne |
| Hero CTA tlacitka ("Try for Free", "View Demo") | OK | OK | Text se prelozi, ale tlacitka vizualne nefunguji (BUG-001) |
| Navigace header | OK | OK | Vsechny polozky prekladany |
| FAQ otazky a odpovedi | OK | OK | 3 otazky, expand/collapse v obou jazycich |
| FAQ "View All Questions →" odkaz | OK | OK | |
| Demo kalkulacka nazev "Moje 3D tiskarna" | PROBLEM | N/A | Hardcoded CZ bez i18n (TRN-001 / BUG-007) |
| Feature bar texty | OK | OK | Prekladany |
| Stats sekce | OK | OK | Prekladany |
| Footer navigacni odkazy | OK | OK | Prekladany |
| Stav jazyka po reloadu | PROBLEM | PROBLEM | Kratky smiseny stav nez se nacte i18n z localStorage (TRN-002 / BUG-005) |

---

#### P02 — Pricing page (`/pricing`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpisy planu (Starter, Professional, Enterprise) | OK | OK | Prekladany spravne |
| Ceny planu | OK | OK | Spravne zobrazeni v obou jazycich |
| Enterprise cena/perioda | PROBLEM | PROBLEM | "Custom Custom" / "Na miru Na miru" — duplicita (BUG-008) |
| "Recommended" badge | PROBLEM | OK | Badge neni prekladen do CZ (TRN-003 / BUG-009) |
| Funkce Starter planu | OK | OK | Vsechny polozky prekladany |
| Funkce Professional planu | PROBLEM | OK | "Widget builder" bez CZ prekladu (TRN-004 / BUG-010) |
| Funkce Enterprise planu | PROBLEM | OK | "Custom integrace", "on-premise" bez CZ prekladu (TRN-005, TRN-006 / BUG-010) |
| CTA tlacitka | OK | OK | Prekladana spravne |
| FAQ — 4 kategorie, vsechny otazky | OK | OK | Testovano v obou jazycich, expand/collapse funguje |
| Footer texty | OK | OK | Prekladany |

---

#### P03 — Support page (`/support`)

> Stav: Castecne otestovano — i18n detailne neovereno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpisy sekci | Neovereno | Neovereno | |
| FAQ otazky a odpovedi | Neovereno | Neovereno | |
| Navody (step-by-step) | Neovereno | Neovereno | |
| Kontaktni formular | Neovereno | Neovereno | |
| Sidebar navigace | Neovereno | Neovereno | |

---

#### P04 — Model Upload (`/model-upload`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Heading "UPLOAD 3D MODEL" | OK | OK | Prelozi se spravne |
| Podnadpis / popis | OK | OK | Prelozi se spravne |
| "Upload Model" navbar tlacitko | PROBLEM | OK | Hardcoded — neprelozi se do CZ (TRN-007 / BUG-016) |
| Dropzone instrukce "DRAG & DROP..." | OK | OK | Prelozi se |
| "browse from your device" odkaz | OK | OK | Prelozi se |
| Format karty (.STL, .3MF, .OBJ, .STEP) — popisky | PROBLEM | OK | Popisky karet neprelozene do CZ (TRN-008 / BUG-017) |
| Footer navigacni odkazy | OK | OK | Krome "Home" (TRN-009 / BUG-018) |
| Footer "Home" | PROBLEM | OK | Neprelozeno do CZ (TRN-009 / BUG-018) |

---

#### P05 — Order Tracking (`/track`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Heading "ORDER TRACKING" | OK | OK | Prelozi se spravne |
| Podnadpis | OK | OK | Prelozi se spravne |
| "Upload Model" navbar tlacitko | PROBLEM | OK | Globalni problem — TRN-010 / BUG-024 |
| Label "ORDER ID" | OK | OK | Prelozi se |
| Label "EMAIL" | PROBLEM | OK | Neprelozeno do CZ (TRN-012 / BUG-022) |
| "TRACK ORDER" tlacitko | OK | OK | Prelozi se |
| Validacni zpravy (prazdne pole) | OK | OK | Prelozi se spravne |
| Chybova zprava "Order not found" | OK | OK | Prelozi se spravne |

---

#### P06 — 404 stranka

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| "Page Not Found" heading | OK | OK | "Stranka nenalezena" v CZ |
| "Go Home" tlacitko | OK | OK | "Zpet na uvod" v CZ |
| "Go Back" tlacitko | OK | OK | Prelozi se |
| Shortcut stranky (Calculator, Pricing, Support) | OK | OK | Prelozi se |
| Footer "Home" | PROBLEM | OK | Globalni problem — TRN-011 / BUG-025 |

---

#### P-Account — Account (`/account`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpis "Nastaveni uctu" | PROBLEM | OK | Chybejici diakriticka — TRN-013 / BUG-034 |
| Tab nazvy (Profile, Company, Security, Billing) | OK | OK | Prelozi se spravne |
| Label "Telefonni cislo" | PROBLEM | OK | Chybejici diakriticka — TRN-013 / BUG-034 |
| "Ulozit zmeny" tlacitko | PROBLEM | OK | Chybejici diakriticka — TRN-013 / BUG-034 |
| Security tab — Password strength | OK | OK | Prelozi se |
| Billing tab — Plan info | OK | OK | Prelozi se |
| Toast notifikace (success save) | OK | OK | Toast text prelozeny |

---

#### P-Invite — Invite Accept (`/invite/accept`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpis "Accept Invite" | PROBLEM | OK | Neprelozeno do CZ (TRN-014 / BUG-036) |
| Podnazev "MODELPRICER TEAM" | Neovereno | OK | |
| Chybova zprava "Missing invite token" | PROBLEM | OK | Neprelozeno do CZ (TRN-014 / BUG-036) |
| Chybova zprava "Invalid or expired invite" | PROBLEM | OK | Neprelozeno do CZ (TRN-014 / BUG-036) |

---

#### P09 — Test Kalkulacka (`/test-kalkulacka`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nazvy kroku (stepper) | Neovereno | Neovereno | |
| Upload instrukce | Neovereno | Neovereno | |
| Nazvy materialu | Neovereno | Neovereno | |
| Nazvy parametru | Neovereno | Neovereno | |
| Cenovy prehled | Neovereno | Neovereno | |
| Checkout formular — labely | Neovereno | Neovereno | |
| Checkout formular — placeholder | Neovereno | Neovereno | |
| Validacni zpravy | Neovereno | Neovereno | |
| Potvrzeni objednavky | Neovereno | Neovereno | |
| Chybove zpravy | Neovereno | Neovereno | |

---

#### P10 — Widget (`/w/:id`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nazvy kroku | Neovereno | Neovereno | |
| Tlacitka | Neovereno | Neovereno | |
| Cenovy prehled | Neovereno | Neovereno | |
| Chybove zpravy | Neovereno | Neovereno | |

---

#### A01 — Admin Dashboard (`/admin`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Stats karty (Today's Revenue, Orders, Pending, Active Prints) | OK | OK | Prekladany spravne |
| Sidebar polozky | OK | OK | Prekladany spravne |
| Recent orders sekce | OK | OK | Prekladany spravne |
| Command palette | OK | OK | 22 stranek + 7 akci — prekladany spravne |
| Theme toggle | OK | OK | |
| Notification panel | OK | OK | |

---

#### A05 — Admin Pricing (`/admin/pricing`)

> Stav: Dokonceno.

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Tab nazvy (Materials, Print Time, Pricing Rules, Discounts, Preview) | OK | OK | Prekladany spravne |
| Stats header labely | OK | OK | RATE, MARKUP, MIN ORDER, ROUND, MATERIALS — prekladany |
| Add Material dialog — labely | OK | OK | Vsechna pole prekladana |
| Save / Unsaved badges | OK | OK | Prekladany spravne |
| Toast notifikace | OK | OK | "Saved.", "Copied to clipboard.", "Settings reset to defaults." |
| Discounts tab | OK | OK | Prekladano |
| Preview sandbox | OK | OK | Prekladano |

---

#### Admin stranky (obecne)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Sidebar nazvy polozek | OK | OK | Overeno na A01 — plne prelozeno |
| Dashboard stat labely | OK | OK | Overeno na A01 — plne prelozeno |
| Tabulkove hlavicky | Neovereno | Neovereno | |
| Akce tlacitka (Ulozit / Zrusit / Smazat) | OK | OK | Overeno na A05/A06/A07 |
| Toast notifikace | OK | OK | Overeno na A05/A06/A07 |
| Confirm dialogy | OK | OK | Overeno na A07 (Global Reset) |
| Prazdne stavy | OK | OK | Overeno na A08 (Presets) |
| Chybove zpravy | Neovereno | Neovereno | |

---

#### A02 — Admin Orders (`/admin/orders`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpis stranky | Neovereno | Neovereno | |
| Status hodnoty (Pending, Processing...) | Neovereno | Neovereno | |
| Filter labely | Neovereno | Neovereno | |
| Sloupce tabulky | Neovereno | Neovereno | |
| Export tlacitko | Neovereno | Neovereno | |

---

#### A03 — Admin Order Detail (`/admin/orders/:id`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nazvy tabu | Neovereno | Neovereno | |
| Labely poli (Customer / Shipping / Items) | Neovereno | Neovereno | |
| Timeline popisky | Neovereno | Neovereno | |
| Fakturacni sekce | Neovereno | Neovereno | |

---

#### A04 — Admin Analytics (`/admin/analytics`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpisy sekcí a grafu | Neovereno | Neovereno | |
| Legenda grafu | Neovereno | Neovereno | |
| Datum filter labely | Neovereno | Neovereno | |

---

#### A05 az A22 — Ostatni Admin stranky

| Stranka | CZ ok? | EN ok? | Hardcoded? | Poznamky |
|---------|--------|--------|------------|----------|
| A01 — Dashboard | OK | OK | OK | Plne prelozeno — viz checklist vyse |
| A05 — Pricing | OK | OK | OK | Plne prelozeno — viz checklist vyse |
| A06 — Fees | 1 problem | OK | OK | 2 labely v stats baru neprelozeny do CZ: "MODEL FEES" a "ORDER FEES" — viz TRN-015 |
| A07 — Parameters | OK | OK | OK | Plne prelozeno CZ/EN — vsechny taby, filtry, akce, stavy. Zadne chybejici klice. |
| A08 — Presets | OK | OK | OK | Plne prelozeno — "Presety", "Sablony presetu", parametry VRSTVA/INFILL/RYCHLOST/TEPLOTA/POSTEL/PODPORY v CZ. Zadne chybejici klice. |
| A-Express — Express Delivery | OK | OK | OK | Plne prelozeno — "Expresni doruceni", formulare v cestine. Zadne chybejici klice. |
| A15 — Shipping | OK | OK | OK | Plne prelozeno — "Doprava", "Metody doruceni", "Bezplatne doruceni", "Prepravni zony". Zadne chybejici klice. |
| A09 — Branding | Neovereno | Neovereno | Neovereno | |
| A10 — Widget | Neovereno | Neovereno | Neovereno | |
| A11 — Team | Neovereno | Neovereno | Neovereno | |
| A12 — Customers | OK | OK | OK | PLNA CZ pokryti, zero issues. "Zakaznici", stat labely, hlavicky tabulky, filter taby, segment badges — vse prekladano. Viz TRN-019. |
| A13 — Integrations | Neovereno | Neovereno | Neovereno | |
| A14 — Coupons | OK | OK | OK | Plna CZ pokryti, zero i18n issues. Vsechny labely v tabulce, modalu, status hodnoty prekladany. Viz TRN-017. |
| A02 — Orders | 1 problem | OK | OK | Hlavicky tabulky neprelozeny do CZ (TRN-018 / BUG-052). Nadpis stranky a ostatni prvky prelozeny spravne. |
| A16 — Print Queue | Neovereno | Neovereno | Neovereno | |
| A17 — System Health | Neovereno | Neovereno | Neovereno | |
| A18 — Webhooks | Neovereno | Neovereno | Neovereno | |
| A19 — Activity Log | Neovereno | Neovereno | Neovereno | |
| A20 — Settings | Neovereno | Neovereno | Neovereno | |
| A21 — Emails | Neovereno | Neovereno | Neovereno | |
| A22 — Account | Neovereno | Neovereno | Neovereno | |

---

## Souhrn po dokonceni testovani

> Prubezny stav — otestovano P01, P02 (dokonceno), P03 (castecne), P04, P05/Track, P06/404, P-Account, P-Invite, A01/Dashboard, A02+A03/Orders, A05/Pricing, A06/Fees, A07/Parameters, A08/Presets, A12/Customers, A14/Coupons, A-Express/Express Delivery, A15/Shipping.

| Jazyk | Celkem problemu | Chybejici | Spatny | Hardcoded | Neprevedeno |
|-------|-----------------|-----------|--------|-----------|-------------|
| CZ | 14 | 4 | 1 | 1 | 8 |
| EN | 1 | 0 | 0 | 0 | 1 |

> CZ problemy: TRN-001 (hardcoded demo nazev), TRN-003 (Recommended badge), TRN-004/005/006 (chybejici 3 preklady Pricing), TRN-007/010 (Upload Model navbar — globalni), TRN-008 (format karty), TRN-009/011 (Footer Home — globalni), TRN-012 (EMAIL label), TRN-013 (diakriticka Account page), TRN-014 (Invite page), TRN-015 (MODEL FEES / ORDER FEES labely — Fees page), TRN-018 (Orders tabulka hlavicky).
> EN problemy: TRN-002 (smiseny stav po reloadu — tyka se obou jazyku).
> Globalni i18n problemy (opravit v jednom miste): Upload Model tlacitko (Header.jsx), Footer "Home" (Footer.jsx).
> Stranky s plnou CZ pokryti a zero issues: A01/Dashboard, A05/Pricing, A07/Parameters, A08/Presets, A12/Customers, A14/Coupons, A-Express, A15/Shipping.
> Admin Dashboard: PLNE prelozena stranka — zadne i18n bugy.
> Admin Pricing: PLNE prelozena stranka — zadne i18n bugy.
> Admin Parameters: PLNE prelozena stranka — zadne i18n bugy.
> Admin Presets: PLNE prelozena stranka — zadne i18n bugy.
> Admin Express Delivery: PLNE prelozena stranka — zadne i18n bugy.
> Admin Shipping: PLNE prelozena stranka — zadne i18n bugy.
> Admin Coupons: PLNE prelozena stranka — zadne i18n bugy.
> Admin Customers: PLNE prelozena stranka — zadne i18n bugy. Nejlepe pokryta stranka z testovanych.
> Admin Orders: 1 i18n bug — hlavicky tabulky neprelozeny do CZ (BUG-052). Ostatni prvky OK.

---

*Soubor vytvoren: 2026-03-18 | Aktualizovan: 2026-03-18 (davka 6 — A14/Coupons TRN-017 OK, A02/Orders TRN-018 BUG-052, A12/Customers TRN-019 OK pridany)*

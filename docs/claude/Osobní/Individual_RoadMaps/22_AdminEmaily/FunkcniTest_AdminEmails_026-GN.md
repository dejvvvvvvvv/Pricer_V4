# Funkcni Test Report: Admin Emailove notifikace

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Emails — emailove triggery, sablony, provider, log odeslanych emailu |
| **Route** | `/admin/emails` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 026-GN |
| **Screenshot slozka** | Fotky_AdminEmails-026-GN |
| **Stav** | FUNKCNI (UI hotovo, backend nepripojeno) |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | 3 taby, prehledne rozlozeni |
| 1.3 | Dark theme konzistence | OK | Forge dark |
| 1.4 | "Ulozeno" badge | OK | Zeleny badge |

---

## 2. Funkcni testy — Hlavicka

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Emailove notifikace — Nastaveni emailovych triggeru, providera a historie odeslanych emailu." | OK |
| 2.2 | 3 taby | Navigace | Sablony (aktivni), Provider, Log | OK |
| 2.3 | "Reset" | Tlacitko | Pritomne | OK |
| 2.4 | "Ulozit" | Tlacitko | Zelene tlacitko | OK |

---

## 2b. Tab 1: Sablony (Templates)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.5 | Nadpis sekce | Info | "Emailove triggery — Kazdemu eventu muzes prirazdit sablonu a zapnout/vypnout odesilani." | OK |
| 2.6 | "+ Pridat trigger" | Tlacitko | Pritomne v pravem rohu | OK |
| 2.7 | Trigger 1: Objednavka potvrzena | Event | `order_confirmed` — TEMPLATE ID: `order_confirmed`, PREDMET (SUBJECT): placeholder | OK |
| 2.8 | Trigger 2: Tisk zahajen | Event | `order_printing` — TEMPLATE ID: `order_printing`, PREDMET: placeholder | OK |
| 2.9 | Trigger 3: Objednavka odeslana | Event | `order_shipped` — TEMPLATE ID: `order_shipped`, PREDMET: placeholder | OK |
| 2.10 | Trigger 4: Objednavka dokoncena | Event | `order_completed` — TEMPLATE ID: `order_completed`, PREDMET: placeholder | OK |
| 2.11 | Checkbox u triggeru | Zapnuti/vypnuti | Vsechny 4 triggery maji checkbox (nezaskrtnuty = vypnuto) | OK |
| 2.12 | Smazat ikona | Per-trigger | Kos ikona u kazdeho triggeru | OK |

---

## 2c. Tab 2: Provider

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.13 | Nadpis sekce | Info | "Nastaveni providera — Vyber emailoveho poskytovatele a nastav prihlasovaci udaje." | OK |
| 2.14 | PROVIDER dropdown | Vyber | "Zadny (vypnuto)" — aktualni stav | OK |
| 2.15 | Moznosti providera | Dropdown options | Neni viditelne v zavrene dropdown (predpokladam SMTP, Resend, SendGrid) | INFO |

---

## 2d. Tab 3: Log

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.16 | Nadpis sekce | Info | "Historie emailu — Posledni odeslane emaily (ulozeno v localStorage)." | OK |
| 2.17 | Empty state | Prazdny seznam | "Zadne zaznamy — Zatim nebyly odeslany zadne emaily." s ikonou | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Provider je "Zadny (vypnuto)" — emaily se neodesllaji | Nakonfigurovat Resend API klic |
| 2 | INFO | Vsechny triggery maji prazdny PREDMET (SUBJECT) | Vyplnit default subject lines |
| 3 | INFO | Backend odesilani neni pripojeno | Faze 3 v roadmapu |
| 4 | INFO | Chybi email preview tab (D8 v roadmapu) | Post-Beta vylepseni |

---

## 4. Pozitivni nalezy

- **Hlavicka:** "Emailove notifikace" s podtitulem, "Ulozeno" zeleny badge, "Reset", zeleny "Ulozit" — konzistentni s admin strankami
- **3 taby s ikonami:** Sablony (obalka ikona, zeleny/teal aktivni), Provider (gear ikona), Log (dokument ikona) — zeleny underline pro aktivni tab
- **"Emailove triggery" sekce:** uppercase monospace nadpis, "Kazdemu eventu muzes prirazdit sablonu a zapnout/vypnout odesilani." popis, "+ Pridat trigger" tlacitko vpravo
- **4 emailove triggery** v kartach: kazdy s checkbox (nezaskrtnuty = vypnuto), nazev cesky + anglicky klic pod nim, TEMPLATE ID input (tmave pozadi, monospace), PREDMET (SUBJECT) input (placeholder "Predmet emailu..."), kos ikona vpravo:
  1. "Objednavka potvrzena" / order_confirmed
  2. "Tisk zahajen" / order_printing
  3. "Objednavka odeslana" / order_shipped
  4. "Objednavka dokoncena" / order_completed
- **Provider vyber (tab 2)** — "Zadny (vypnuto)" dropdown, pripraveno pro SMTP/Resend/SendGrid
- **Email log (tab 3)** — "Zadne zaznamy" empty state s ikonou
- **"+ Pridat trigger"** — moznost pridat vlastni email eventy
- **Sidebar:** Emails neni v sidebar (pristup pres URL), konzistentni tmave pozadi

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Emailove notifikace: Sablony tab, 4 triggery, sidebar | `Fotky_AdminEmails-026-GN/AdminEmails-026-GN.png` |
| 2 | Sablony tab — 4 triggery (confirmed, printing, shipped, completed) | ss_68071vo1f |
| 3 | Provider tab — "Zadny (vypnuto)" | ss_9571gz2ka |
| 4 | Log tab — prazdna historie | ss_4544aj1w4 |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Resend setup (VYSOKA priorita)
- [ ] Instalace Resend, API key konfigurace
- [ ] Default subject lines pro vsechny triggery

### Faze 2: Email sablony (VYSOKA priorita)
- [ ] HTML sablony pro 7 email typu
- [ ] Sablonovy system s promennymi ({{orderNumber}}, {{customerName}}, atd.)

### Faze 3: Backend service (VYSOKA priorita)
- [ ] `sendEmail()` funkce, trigger system, queue + retry

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Prehledne 3-tab rozlozeni |
| Funkcnost | 3/5 | UI hotovo, ale provider neni pripojen, emaily se neodesllaji |
| UX/pouzitelnost | 4/5 | Intuitivni, jasne empty states |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **17/20** | Solidni UI zaklad, hlavni TODO je backend integrace |

---

> Vygenerovano: 2026-02-20, Test session: S01

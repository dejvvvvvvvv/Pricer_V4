# Funkcni Test Report: Account (Nastaveni uctu)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Account — osobni informace, profil uzivatele, avatar |
| **Route** | `/account` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 031-GN |
| **Screenshot slozka** | Fotky_Account-031-GN |
| **Stav** | FUNKCNI (demo data) |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Avatar + osobni informace, jednosloupcovy |
| 1.3 | Dark theme konzistence | OK | Forge dark, tlumene barvy |

---

## 2. Funkcni testy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Nastaveni uctu — Spravujte informace o uctu a predvolby" | OK |
| 2.2 | Avatar | Profilovy obrazek | "JN" inicialy na gradientovem pozadi (modro-zeleny) s kamera ikonou | OK |
| 2.3 | Osobni informace sekce | Nadpis | "Osobni informace" s ikonou | OK |
| 2.4 | JMENO | Pole | "Jan" — s user ikonou | OK |
| 2.5 | PRIJMENI | Pole | "Novak" — s user ikonou | OK |
| 2.6 | EMAILOVA ADRESA | Pole | "jan.novak@example.com" — s email ikonou | OK |
| 2.7 | TELEFONNI CISLO | Pole | "+420 123 456 789" — s phone ikonou | OK |
| 2.8 | "Zrusit" tlacitko | Reset | Pritomne | OK |
| 2.9 | "Ulozit zmeny" tlacitko | Ulozeni | Zelene/teal tlacitko | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Demo data (Jan Novak) — neni napojeno na auth | Napojit na Supabase Auth profil |
| 2 | INFO | Chybi zmena hesla | Pridat sekci "Zmena hesla" |
| 3 | INFO | Chybi 2FA nastaveni | Pridat po auth integraci |
| 4 | INFO | Chybi jazyk/tema predvolby | Pridat preferences sekci |

---

## 4. Pozitivni nalezy

- **Hlavicka:** "Nastaveni uctu" s podtitulem "Spravujte informace o uctu a predvolby" — bez admin sidebaru (public page)
- **Avatar:** velky ctverec s "JN" inicialami na modro-zelenem gradientovem pozadi, mala kamera ikona v levem dolnim rohu pro upload fotky
- **4 taby s ikonami:** Profil (osoba ikona, zeleny/teal aktivni s underline), Firma (budova ikona), Zabezpeceni (stit ikona), Fakturace (slozka ikona) — outline styl pro neaktivni
- **"Osobni informace" sekce:** nadpis s osobou ikonou (teal) na tmavem pozadi s borderem
- **4 profilove pole** v gridu (3+1): JMENO ("Jan", osoba ikona), PRIJMENI ("Novak", osoba ikona), EMAILOVA ADRESA ("jan.novak@example.com", obalka ikona), TELEFONNI CISLO ("+420 123 456 789", telefon ikona) — vsechny s uppercase monospace labely, tmave input boxy s ikonami vlevo
- **"Zrusit" tlacitko** (outline, sedy) a **"Ulozit zmeny"** (zeleny/teal filled) — v pravem dolnim rohu sekce
- **Header navigace:** standardni ModelPricer header bez "Admin" zvyrazneho — public stranka
- **Footer:** ModelPricer v3.2, NAVIGACE + PRAVNI linky

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Nastaveni uctu: JN avatar, 4 taby, osobni informace, ulozit/zrusit | `Fotky_Account-031-GN/Account-031-GN.png` |
| 2 | Account — avatar, osobni informace, ulozit/zrusit | ss_5550elz1g |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Auth napojeni (VYSOKA priorita)
- [ ] Napojit profil na Supabase Auth — realna data misto demo
- [ ] Zmena hesla v Zabezpeceni tabu
- [ ] Avatar upload do Supabase Storage

### Faze 2: Dalsi taby (STREDNI priorita)
- [ ] Firma tab — IČO, DIČ, adresa firmy
- [ ] Zabezpeceni tab — zmena hesla, 2FA, prihlasovaci historie
- [ ] Fakturace tab — fakturacni udaje, plan management

### Faze 3: Preferences (NIZKA priorita)
- [ ] Jazyk/tema predvolby v profilu
- [ ] Notifikacni nastaveni (email, push)

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 4/5 | Cisty layout, avatar s inicialami |
| Funkcnost | 3/5 | Zakladni profil, chybi zmena hesla, 2FA, preferences |
| UX/pouzitelnost | 4/5 | Jednoduche, ikony u poli |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **16/20** | Zakladni profil, nutne rozsirit po auth integraci |

---

> Vygenerovano: 2026-02-20, Test session: S01

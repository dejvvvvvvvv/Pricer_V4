# Customer Portal — Komplexni Research & Feature Specifikace (Cast 1)

> **Datum:** 2026-03-22
> **Ucel:** Kompletni research a specifikace zakaznického portalu pro ModelPricer/Pricer V3
> **Scope:** Autentizace, Dashboard, Objednavky, Knihovna modelu, Ulozene presety, Profil, Komunikacni centrum
> **Zdroje:** Shapeways, Sculpteo, i.materialise, Xometry, Protolabs/Hubs, Shopify, Amazon, Baymard Institute, oborove best practices

---

## Obsah

1. [Prehled & Strategicke cile](#1-prehled--strategicke-cile)
2. [Autentizace & Registrace](#2-autentizace--registrace)
3. [Dashboard / Prehledova stranka](#3-dashboard--prehledova-stranka)
4. [Historie objednavek & Sledovani](#4-historie-objednavek--sledovani)
5. [Knihovna ulozenych modelu](#5-knihovna-ulozenych-modelu)
6. [Oblibene nastaveni / Presety](#6-oblibene-nastaveni--presety)
7. [Sprava profilu](#7-sprava-profilu)
8. [Komunikacni centrum](#8-komunikacni-centrum)
9. [Dalsi Pokrocile Funkce](#9-dalsi-pokrocile-funkce) **(NOVE)**
   - 9.1 Team / Organization Accounts
   - 9.2 API Pristup (Developer Access)
   - 9.3 Loyalty / Vernostni Program
   - 9.4 Referral Program
   - 9.5 Oblibene Polozky (Wishlist)
   - 9.6 Porovnavani Materialu a Nastaveni
10. [Prioritizace funkci (MoSCoW)](#10-prioritizace-funkci-moscow)
11. [Benchmarkove srovnani konkurence](#11-benchmarkove-srovnani-konkurence)

---

## 1. Prehled & Strategicke cile

### 1.1 Co je Customer Portal

Customer Portal (zakaznicky portal) je zabezpecena oblast webove aplikace, kde se koncovy zakaznik (osoba objednavajici 3D tisky) prihlasi a ma pristup ke vsem svym datum, objednavkam, modelum a nastavenim. Neni to admin panel — ten je pro provozovatele 3D tiskove firmy (tenant).

### 1.2 Proc je dulezity (Business Value)

| Prinos | Detail |
|--------|--------|
| **Zvyseni retence** | Zakaznik s uctem objednava 2-5x casteji nez anonymni (Baymard research). Ulozene modely a presety snizuji friction. |
| **Snizeni support zateze** | Self-service sledovani objednavek snizuje email/telefon dotazy o 30-60% (Sculpteo, Xometry data). |
| **Vyssi AOV (prumerna hodnota objednavky)** | Reorder funkce a ulozene konfigurace vedou k vetsim a castejsim objednavkam. |
| **Data pro personalizaci** | Historie zakaznika umoznuje doporuceni materialu, up-sell prislusenstvi, targeted notifikace. |
| **Konkurencni vyhoda** | Vsechny velke 3D printing servisy (Shapeways, Sculpteo, Xometry, Protolabs) maji rozsahle portaly. Bez portalu je produkt na urovni "anonymous quoting tool". |
| **Tenant stickiness** | Tenant (3D tiskova firma), ktery vi, ze jeho zakaznici maji ucty s historiemi, hure odchazi od SaaS platformy. |

### 1.3 Architekturni kontext v ModelPricer

```
[End Customer] --> [Customer Portal] --> [Supabase DB] <-- [Admin Panel] <-- [Tenant/3D firma]
                                    |
                                    +--> [Widget (embedded)] -- embeddable calculator
                                    +--> [Test Kalkulacka] -- demo/standalone calculator
```

- Customer Portal je NOVY modul v ramci existujici aplikace
- Sdili Supabase databazi s Admin panelem (tenant-scoped)
- Pouziva existujici auth system (Firebase/Supabase Auth bridge)
- Widget a test-kalkulacka mohou vytvaret "guest" objednavky, ktere se po registraci zakaznika pripoji k jeho uctu

### 1.4 Klicove rozdily oproti Admin panelu

| Aspekt | Admin Panel | Customer Portal |
|--------|-------------|-----------------|
| Uzivatel | Provozovatel 3D tiskove firmy (tenant) | Koncovy zakaznik |
| Scope dat | Vsechny objednavky vsech zakazniku | Pouze moje objednavky |
| Funkce | Konfigurace ceniku, parametru, widgetu | Prohlizeni, objednavani, sledovani |
| Autentizace | Firebase/Supabase (tenant-level) | Customer auth (oddeleny) |
| Design | Admin Forge theme (dark) | Customer theme (light, branded per tenant) |

---

## 2. Autentizace & Registrace

### 2.1 Co to je

Proces prihlaseni a registrace koncoveho zakaznika do portalu. Zahrnuje vytvoreni uctu, overeni identity, spravu session a zabezpeceni pristupu.

### 2.2 Proc je dulezity

- **Conversion gate:** Prilis slozita registrace = ztrata zakazniku (67% opusti registraci pokud je slozita — Baymard)
- **Bezpecnost:** Zakaznici uploadi proprietary 3D modely — ochrana intelektualniho vlastnictvi
- **Tenant izolace:** Kazdy zakaznik musi byt prirazeny ke spravnemu tenantu
- **Referencni bod:** Vsechny ostatni funkce portalu zavisí na identite zakaznika

### 2.3 Metody autentizace — Analyza

#### 2.3.1 Email + Heslo (Tradicni)

**Jak funguje:** Zakaznik zada email a heslo pri registraci, pouziva je pri prihlaseni.

| Aspekt | Hodnoceni |
|--------|-----------|
| UX friction | Stredni — vyzaduje vymyslet a zapamatovat heslo |
| Bezpecnost | Zavisla na sile hesla — nutne vyzadovat min. 8 znaku, mix velka/mala/cisla |
| Implementacni narocnost | Nizka — Firebase/Supabase Auth to podporuji nativne |
| Adopce u konkurence | Univerzalni — vsechny sluzby to maji |

**Best practices:**
- Zobrazit password strength indicator v realnem case
- Povolit "show password" toggle
- Nepouzivat security questions (zastarale, spatny UX)
- Implementovat rate limiting na login pokusy (max 5 za minutu)
- Posílat verifikacni email po registraci

**Priorita:** MUST-HAVE

#### 2.3.2 Social Login (Google, Apple, GitHub)

**Jak funguje:** Zakaznik se prihlasi pres existujici ucet u tretí strany (OAuth 2.0 / OIDC).

| Aspekt | Hodnoceni |
|--------|-----------|
| UX friction | Nizka — 1 klik, zadne heslo |
| Bezpecnost | Vysoka — delegovana na Google/Apple |
| Implementacni narocnost | Stredni — nutna OAuth konfigurace per tenant |
| Adopce u konkurence | Shapeways (Google), Sculpteo (Google), Xometry (Google) |

**Doporuceni provideri pro 3D printing SaaS:**
1. **Google** — MUST-HAVE (nejvyssi adopce, 65%+ uzivatelu ma Google ucet)
2. **Apple** — SHOULD-HAVE (povinne pro iOS, rostouci adopce)
3. **GitHub** — NICE-TO-HAVE (relevatni pro technicke zakazniky/inzenyry kteri designuji 3D modely)
4. **Microsoft** — COULD-HAVE (relevatni pro enterprise/B2B zakazniky)

**UX best practices:**
- Social login tlacitka NAD emailovym formularem (Baymard doporuceni)
- Jasne rozlisit "Sign in" vs "Sign up" stav — stejna tlacitka, ruzny kontext
- Po social login automaticky pre-fill profil (jmeno, email, avatar)
- Nikdy nenutit zakaznika navic zadavat heslo po social login

**Poznamka k existujicimu systemu:** ModelPricer uz ma `GoogleSignInButton.jsx` a Firebase Auth — lze rozsirit pro customer auth.

**Priorita:** MUST-HAVE (Google), SHOULD-HAVE (Apple)

#### 2.3.3 Magic Link (Passwordless)

**Jak funguje:** Zakaznik zada email, dostane jednorazovy prihlasovaci link, klikne a je prihlasen.

| Aspekt | Hodnoceni |
|--------|-----------|
| UX friction | Nizka pro prihlaseni, ale vyzaduje prepnout do emailu |
| Bezpecnost | Dobra — link je jednorazovy, casove omezeny (typicky 15 min) |
| Implementacni narocnost | Nizka — Supabase Auth to podporuje nativne |
| Adopce u konkurence | Sculpteo pouziva, Medium, Notion, Slack (guest) |

**Kdy je idealni:**
- Pro necasty prihlasovani (zakaznik objednava 1-2x mesicne)
- Pro zakazniky, kteri zapominaji hesla
- Jako "forgot password" alternativa

**Kdy NENI idealni:**
- Pro casty pristup (kazdy den) — prepínání do emailu je zdrzovaci
- Pro mobilni uzivatele (prepinani mezi appkami)

**Best practices (Supertokens/Auth0 doporuceni):**
- Link platny max 15 minut
- Single-use (po kliknuti invalidovany)
- Jasny CTA button v emailu ("Prihlasit se" ne "Click here")
- Fallback na email + heslo vzdy dostupny

**Priorita:** SHOULD-HAVE

#### 2.3.4 Dvoufaktorova autentizace (2FA)

**Jak funguje:** Po prihlaseni emailem+heslem nebo social loginem se vyzada druhy faktor — OTP kod z authenticator app, SMS, nebo biometrie.

| Aspekt | Hodnoceni |
|--------|-----------|
| UX friction | Vyssi — pridava krok |
| Bezpecnost | Velmi vysoka — chrání i pri ukradenem hesle |
| Implementacni narocnost | Stredni — Firebase/Supabase podporuji TOTP |
| Adopce u konkurence | Xometry (volitelne), Protolabs (enterprise) |

**Doporuceni:**
- 2FA by melo byt **volitelne** pro bezne zakazniky
- **Povinne** jen pro enterprise ucty (B2B zakazniky s citlivymi modely)
- Preferovat **authenticator app (TOTP)** pred SMS (SMS je zranitelne SIM swappingem)
- Nabidnout **recovery codes** pri aktivaci 2FA (8-10 jednorázových kodu)

**Priorita:** COULD-HAVE (V1), SHOULD-HAVE (V2+)

#### 2.3.5 Passkeys (WebAuthn/FIDO2) — Budoucnost

**Jak funguje:** Biometricke prihlaseni (otisk prstu, Face ID) nebo hardware klice (YubiKey). Neexistuji hesla, phishing-rezistentni.

| Aspekt | Hodnoceni |
|--------|-----------|
| UX friction | Velmi nizka — 1 dotyk/pohled |
| Bezpecnost | Nejvyssi — kryptograficka, domain-bound |
| Implementacni narocnost | Vyssi — novejsi standard, ne vsechny browsery 100% |
| Adopce u konkurence | Zatim minimalni v 3D printing, ale rychle roste (Google, Apple, Microsoft tlaci) |

**Priorita:** NICE-TO-HAVE (V2+, budouci roadmap)

### 2.4 Registracni Flow — Doporuceny design

```
[Landing/Widget/Kalkulacka]
    |
    v
[Guest Checkout] --> [Objednavka vytvorena bez uctu]
    |                          |
    v                          v
[Register prompt]    [Email s pozvankou k registraci]
    |
    v
[Registration Page]
    |-- Google Sign-In (primární CTA)
    |-- Apple Sign-In (sekundární)
    |-- "nebo se registrujte emailem"
    |       |-- Email
    |       |-- Heslo (s strength indicator)
    |       |-- Jmeno (volitelne — lze doplnit pozdeji)
    |       +-- [Registrovat se]
    |
    v
[Email verifikace] --> [Portal Dashboard]
    |
    (Guest objednavky se automaticky pripoji k uctu na zaklade emailu)
```

### 2.5 Klicove UX prvky

1. **Lazy registration** — zakaznik NEMUSI mit ucet pro prvni objednavku (guest checkout v kalkulacce/widgetu). Ucet nabidnout AZ po prvni objednavce.
2. **Post-purchase account creation** — po guest objednavce nabidnout: "Zalozit ucet jednim klikem pro sledovani objednavky"
3. **Prirazeni guest objednavek** — vsechny objednavky se stejnym emailem se automaticky pripoiji k novemu uctu
4. **Tenant-aware registrace** — zakaznik se registruje v kontextu konkretniho tenanta (3D tiskove firmy). URL nebo widget urcuje tenanta.
5. **Branded registracni stranka** — barevne schema a logo podlke tenant branding nastaveni

### 2.6 Bezpecnostni pozadavky

- Rate limiting na registraci (max 3 ucty ze stejne IP za hodinu)
- CAPTCHA/hCaptcha po 3 neuspesnych login pokusech
- CSRF ochrana na vsech formularich
- Session management — automaticky logout po 30 dnech neaktivity
- Password hashing — delegovano na Firebase/Supabase (bcrypt/argon2)
- Audit log — zapisovat login pokusy (uspesne i neuspesne) s casovym razitkem a IP

---

## 3. Dashboard / Prehledova stranka

### 3.1 Co to je

Hlavni stranka, kterou zakaznik vidi po prihlaseni. Slouzi jako rozcestnik a rychly prehled nejdulezitejsich informaci.

### 3.2 Proc je dulezity

- **Prvni dojem** — zakaznik zde pristava vzdy po prihlaseni, musi videt hodnotu okamzite
- **Orientace** — rychly pristup ke vsem sekcim portalu
- **Stav objednavek** — 91% zakazniku chce videt stav objednavek okamzite (Baymard research)
- **Re-engagement** — dashboard je prilezitost pro "quick actions" ktere snizuji friction pro novy nakup

### 3.3 Best practices z konkurence

#### 3.3.1 Xometry Dashboard
- **Personalizovany dashboard** s ruznym obsahem pro ruzne typy uzivatelu
- **Recent Orders** sekce primo na dashboardu s line-item statusy v realnem case
- **Quick actions:** "Start New Quote", "View Quote History", "Go to Parts Library"
- **Sidebar menu:** Dashboard, Quote History, Order History, Parts Library, Tool Library, Teamspace
- **Forward Quote** funkce — snadne sdileni naceneni s kolegy/managery

#### 3.3.2 Protolabs ProDesk
- **AI-powered dashboard** s real-time updaty objednavek
- **Centralized hub** pro billing, dokumentaci a quality records
- **Pristup k inzenyrskemu tymu** primo z dashboardu
- **DFM (Design for Manufacturability)** analyza pristupna pri uploadu

#### 3.3.3 Sculpteo
- **Order tracking** s detailnim vizualnim workflow (queuing → printing → post-processing → packaging → shipping)
- **Expert User Status** — gamifikace (po 5 uspesnych objednavkach odemknuti extra funkci)
- **Print it Anyway** — pokrocile funkce pro zkusene uzivatele

#### 3.3.4 Shopify Customer Accounts
- **Order history** jako primární obsah
- **Saved addresses** a **payment methods** snadno pristupne
- **Wishlist** integrace
- **Loyalty/rewards** program

### 3.4 Doporuceny layout dashboardu

```
+------------------------------------------------------------------+
| [Logo tenanta]        PORTAL ZAKAZNIKA        [Avatar] [Odhlasit] |
+------------------------------------------------------------------+
|                                                                    |
| [Vitejte, Jmeno!]                          [Rychle akce]          |
|                                             [+ Nova objednavka]   |
|                                             [Nahrat model]        |
|                                             [Moje modely]         |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| AKTIVNI OBJEDNAVKY (karty s progress barem)                       |
| +------------------+ +------------------+ +------------------+    |
| | Obj #1234        | | Obj #1235        | | Obj #1236        |    |
| | 3D Tisk          | | Postprocessing   | | Odeslano         |    |
| | [====>    ] 40%  | | [======>  ] 60%  | | [=========] 95%  |    |
| | ETA: 2 dny       | | ETA: 1 den       | | Sledovat zasilku |    |
| +------------------+ +------------------+ +------------------+    |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| POSLEDNI OBJEDNAVKY                              [Zobrazit vse >]|
| +----------------------------------------------------------------+|
| | # | Datum     | Polozky | Status      | Cena    | Akce        ||
| |---|-----------|---------|-------------|---------|-------------||
| | 1234| 15.3.2026| 3 dily  | V tisku     | 1,250 Kc| [Detail]   ||
| | 1233| 10.3.2026| 1 dil   | Doruceno    | 450 Kc  | [Reorder]  ||
| | 1232| 05.3.2026| 5 dilu  | Doruceno    | 3,200 Kc| [Reorder]  ||
| +----------------------------------------------------------------+|
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| MOJE MODELY (posledni 4)                        [Zobrazit vse >] |
| +------------+ +------------+ +------------+ +------------+      |
| | [3D thumb] | | [3D thumb] | | [3D thumb] | | [3D thumb] |      |
| | Motor.stl  | | Kryt.stl   | | Adapter.stl| | Drzak.stl  |      |
| | 15.3.2026  | | 10.3.2026  | | 05.3.2026  | | 01.3.2026  |      |
| +------------+ +------------+ +------------+ +------------+      |
|                                                                    |
+------------------------------------------------------------------+
```

### 3.5 Povinne prvky dashboardu

| Prvek | Typ | Popis | Priorita |
|-------|-----|-------|----------|
| **Pozdrav s jmenem** | Text | "Vitejte, [Jmeno]!" — personalizace | MUST |
| **Aktivni objednavky** | Karty | Objednavky ktere nejsou "Doruceno" — s progress barem a ETA | MUST |
| **Posledni objednavky** | Tabulka | Poslednich 5-10 objednavek se statusem | MUST |
| **Quick actions** | Tlacitka | Nova objednavka, Nahrat model, Moje modely | MUST |
| **Nedavne modely** | Grid/karty | Posledni 4 nahrane modely s thumbnaily | SHOULD |
| **Notifikace badge** | Ikonka | Pocet neprectenych zprav/notifikaci | SHOULD |
| **Statistiky** | Cisla | Celkem objednavek, celkem modelu, celkem utraceno | COULD |
| **Oblibene presety** | Chipsy | Rychly pristup k ulozenym konfiguracim | COULD |
| **Banner akce** | Banner | Tenant muze zobrazit akci/slevu/novinku | NICE-TO-HAVE |

### 3.6 UX principy

1. **Above the fold:** Aktivni objednavky a quick actions musi byt viditelne bez scrollovani
2. **Progresivni disclosure:** Zakladni info primo, detaily na klik
3. **Real-time updaty:** Status objednavek by mel pouzivat Supabase Realtime subscriptions
4. **Empty states:** Novy zakaznik bez objednavek vi motivacni CTA ("Nahrajte svuj prvni model!")
5. **Responsive:** Dashboard musi fungovat na mobilu — karty se stacked vertikalne
6. **Tenant branding:** Barvy, logo a texty customizovatelne tenantem pres admin panel

---

## 4. Historie objednavek & Sledovani

### 4.1 Co to je

Kompletni prehled vsech objednavek zakaznika s moznosti filtrovat, vyhledavat, sledovat stav a objednávat znovu.

### 4.2 Proc je dulezity

- **#1 duvod proc zakaznici oteviraji portal** — 91% spotrebitelu sleduje sve objednavky, 19% vice krat denne (Baymard research)
- **Snizeni support dotazu** o 30-60% — zakaznik si sam najde info
- **Reorder funkce** primo zvysuje revenue
- **Transparentnost** buduje duveru — zakaznik vi co se deje s jeho objednavkou

### 4.3 Workflow statusy objednavky pro 3D tisk

Na zaklade analyzy Sculpteo, Shapeways, Xometry a 3DPrintForce:

```
[Nova] --> [Prijata] --> [Kontrola modelu] --> [Ve fronte] --> [Tisk] --> [Post-processing] --> [Baleni] --> [Odeslano] --> [Doruceno]
                |                                                                                              |
                +--> [Odmitnuta]                                                                               +--> [Reklamace]
                     (duvod: neprintable,                                                                           |
                      nesplnuje pozadavky)                                                                     [Vyreseno]
```

#### 4.3.1 Detailni statusy (Sculpteo-inspired)

| Status | Ikona | Barva | Popis pro zakaznika |
|--------|-------|-------|---------------------|
| **Nova** | `clock` | seda | Objednavka byla vytvorena |
| **Prijata** | `check-circle` | modra | Objednavka byla potvrzena a zaplacena |
| **Kontrola modelu** | `search` | oranzova | Kontrolujeme vas 3D model na tisknutelnost |
| **Ve fronte** | `layers` | modra | Vas model ceka na tisk |
| **Tisk** | `printer` | zelena-pulzujici | Vas model se prave tiskne! |
| **Post-processing** | `tool` | fialova | Povrchova uprava, cisteni, barveni |
| **Baleni** | `package` | tyrkysova | Pripravujeme zasilku |
| **Odeslano** | `truck` | zelena | Zasilka je na ceste — sledovaci cislo: XXX |
| **Doruceno** | `check-double` | zelena-tmava | Doruceno — dekujeme za objednavku! |
| **Odmitnuta** | `x-circle` | cervena | Model nelze vytisknout — kontaktujte nas |
| **Reklamace** | `alert-triangle` | oranzova | Resime vas problem |

### 4.4 Order History List — Doporuceny design

#### 4.4.1 Filtry a vyhledavani

| Filtr | Typ | Moznosti |
|-------|-----|----------|
| **Fulltext search** | Text input | Hledani v cislu objednavky, nazvu modelu, poznamce |
| **Status** | Multi-select chips | Vsechny statusy (viz tabulka vyse) |
| **Casovy rozsah** | Date range picker | Posledni tyden / mesic / rok / custom range |
| **Razeni** | Dropdown | Nejnovejsi, Nejstarsi, Cena vzestupne, Cena sestupne |
| **Material** | Multi-select | PLA, ABS, PETG, Resin... (dle tenant konfigurace) |

#### 4.4.2 Layout objednavek

```
+------------------------------------------------------------------+
| MOJE OBJEDNAVKY                                                   |
+------------------------------------------------------------------+
| [Hledat...          ] [Status: Vsechny v] [Datum: Posledni mesic]|
+------------------------------------------------------------------+
|                                                                    |
| OBJEDNAVKA #1234 | 15. brezen 2026 | V tisku                      |
| +----------------------------------------------------------------+|
| | [3D thumb] Motor.stl                                           ||
| |            PLA, Cerna, 20% infill, 0.2mm                       ||
| |            1 ks                                     450,00 Kc  ||
| +----------------------------------------------------------------+|
| | [3D thumb] Kryt.stl                                            ||
| |            PETG, Bila, 30% infill, 0.15mm                     ||
| |            2 ks                                     800,00 Kc  ||
| +----------------------------------------------------------------+|
| | Celkem: 1 250,00 Kc  |  [Sledovat] [Reorder] [Stahnout fakturu]||
| +----------------------------------------------------------------+|
|                                                                    |
| OBJEDNAVKA #1233 | 10. brezen 2026 | Doruceno                     |
| +----------------------------------------------------------------+|
| | [3D thumb] Adapter.stl                                         ||
| |            ABS, Seda, 40% infill, 0.1mm                       ||
| |            3 ks                                     450,00 Kc  ||
| +----------------------------------------------------------------+|
| | Celkem: 450,00 Kc    |  [Hodnotit] [Reorder] [Stahnout fakturu]||
| +----------------------------------------------------------------+|
```

### 4.5 Detail objednavky — Doporuceny design

```
+------------------------------------------------------------------+
| < Zpet na objednavky    OBJEDNAVKA #1234                          |
+------------------------------------------------------------------+
|                                                                    |
| PROGRESS BAR                                                       |
| [Nova] -> [Prijata] -> [Kontrola] -> [Fronta] -> [*TISK*] -> ... |
|                                                  ^^^^^^^^          |
|                                                  Aktualni         |
|                                                                    |
| Odhadovane doruceni: 18. brezen 2026                               |
| Sledovaci cislo: CZ1234567890 (PPL)          [Sledovat zasilku]   |
|                                                                    |
+------------------------------------------------------------------+
| POLOZKY                                                            |
| +----------------------------------------------------------------+|
| | [3D viewer] | Motor.stl                                       ||
| |             | Material: PLA                                    ||
| |             | Barva: Cerna                                     ||
| |             | Infill: 20%                                      ||
| |             | Vrstva: 0.2mm                                    ||
| |             | Pocet: 1 ks                                      ||
| |             | Cena: 450,00 Kc                                  ||
| |             | [Stahnout model] [Objednat znovu s temito param] ||
| +----------------------------------------------------------------+|
|                                                                    |
| FAKTURACNI UDAJE                                                   |
| Jmeno: Jan Novak                                                   |
| Adresa: Prazska 123, 110 00 Praha                                 |
| Email: jan@example.com                                             |
|                                                                    |
| PLATBA                                                             |
| Zpusob: Visa ****4242                                              |
| Status: Zaplaceno                                                  |
| Datum platby: 15.3.2026 14:23                                     |
|                                                                    |
| CASOVA OSA (Timeline)                                              |
| 15.3.2026 14:23  Objednavka vytvorena                             |
| 15.3.2026 14:25  Platba prijata                                   |
| 15.3.2026 16:00  Model schvalen                                   |
| 16.3.2026 08:00  Zarazeno do fronty                               |
| 16.3.2026 14:30  Zahajeni tisku                                   |
| ...                                                                |
+------------------------------------------------------------------+
```

### 4.6 Reorder funkce

**Co to je:** Moznost objednat stejny model se stejnymi nebo upravenymi parametry jednim klikem.

**Jak to funguje (Xometry pattern):**
1. Zakaznik klikne "Objednat znovu" u libovolne dokoncene objednavky
2. System otevre kalkulacku s predvyplnenymi parametry (model, material, barva, infill, pocet)
3. Zakaznik muze upravit cokoliv (zejmena pocet kusu)
4. Cena se prepocita v realnem case
5. Zakaznik potvrdí a objedna

**Business value:** Reordery tvori 25-40% obratu u zavedených 3D printing servisu (Xometry data).

**Priorita:** MUST-HAVE

### 4.7 Exporty a dokumenty

| Dokument | Format | Dostupnost |
|----------|--------|------------|
| **Faktura** | PDF | Po zaplaceni objednavky |
| **Dodaci list** | PDF | Po odeslani |
| **Export objednavek** | CSV | Vsechny objednavky — pro ucetni ucely |
| **3D model** | STL/OBJ/3MF | Kdykoliv — zakaznik stahne svuj puvodni soubor |

**Priorita:** Faktura MUST-HAVE, ostatni SHOULD-HAVE

### 4.8 UX principy pro objednavky

1. **Progress bar** je dulezitejsi nez textovy status — vizualni indikator snizuje anxietu
2. **ETA (odhadovane doruceni)** musi byt vzdy viditelne u aktivnich objednavek
3. **Sledovaci cislo** musi byt klikatelny link primo na web prepreavce (PPL, DPD, Ceska posta)
4. **Timeline/casova osa** ukazuje historii vsech zmen statusu s casovymi razitky
5. **Email notifikace** pri kazde zmene statusu (opt-out mozny)
6. **Empty state** pro noveho zakaznika: "Zatim zadne objednavky. [Vytvorit prvni objednavku]"

---

## 5. Knihovna ulozenych modelu

### 5.1 Co to je

Osobni knihovna vsech 3D modelu, ktere zakaznik kdy nahral. Umoznuje prohlizeni, spravu, organizaci a opetovne pouziti modelu pro nove objednavky.

### 5.2 Proc je dulezity

- **Snizeni friction** — zakaznik nemusi znovu nahravat model ktery uz jednou pouzil
- **Xometry Parts Library** automaticky sbira modely z nabidek a objednavek — zakaznici to ocenuji jako top feature
- **Ochrana investice** — zakaznik vi, ze jeho modely jsou bezpecne ulozeny
- **Cross-selling** — tenant muze nabidnout tisk ulozeneho modelu v jinem materialu
- **Shapeways "My 3D Models"** — jedná z primarnich navigacnich polozek

### 5.3 Inspirace z konkurence

#### 5.3.1 Xometry Parts Library
- **Automaticky sber** modelu z nabidek a objednavek
- **Hledani a filtrovani** modelu
- **Reorder** primo z knihovny
- **Revize** — moznost nahrat novou verzi modelu a propojit s predchozi
- **Technicke vykresy** ulozeny vedle 3D modelu

#### 5.3.2 Shapeways My 3D Models
- **Drag & drop upload** do knihovny
- **Automaticka analyza** modelu (tisknutelnost, rozmery, objem)
- **Material compatibility** — ktere materialy jsou kompatibilni s danym modelem
- **Public/Private** toggle — moznost zverejnit model na marketplace

#### 5.3.3 Sculpteo
- **Automaticky repair** modelu pri uploadu
- **Online 3D viewer** primo v prohlizeci
- **Orientace modelu** — pokrocili uzivatele mohou nastavit orientaci tisku

### 5.4 Doporuceny design knihovny

```
+------------------------------------------------------------------+
| MOJE MODELY                                          [+ Nahrat]   |
+------------------------------------------------------------------+
| [Hledat...     ] [Razeni: Nejnovejsi v] [Zobrazeni: Grid | List] |
| [Slozka: Vsechny v] [Tag: Vsechny v] [Material: Vsechny v]      |
+------------------------------------------------------------------+
|                                                                    |
| +------------------+ +------------------+ +------------------+    |
| | [3D Preview]     | | [3D Preview]     | | [3D Preview]     |    |
| |                  | |                  | |                  |    |
| | Motor_v3.stl     | | Kryt_final.stl   | | Adapter_B.3mf    |    |
| | 15.3.2026        | | 10.3.2026        | | 05.3.2026        |    |
| | 45x30x20 mm      | | 80x60x15 mm      | | 25x25x10 mm      |    |
| | 12.5 ml           | | 34.2 ml           | | 3.8 ml           |    |
| | Tags: motor, v3  | | Tags: kryt        | | Slozka: Adaptery |    |
| | [Objednat] [...] | | [Objednat] [...] | | [Objednat] [...] |    |
| +------------------+ +------------------+ +------------------+    |
|                                                                    |
| +------------------+ +------------------+ +------------------+    |
| | [3D Preview]     | | [3D Preview]     | | [3D Preview]     |    |
| |                  | |                  | |                  |    |
| | Drzak_v1.stl     | | Kolecko.obj      | | Panel.stl        |    |
| | ...              | | ...              | | ...              |    |
| +------------------+ +------------------+ +------------------+    |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.5 Metadata modelu

Kazdy ulozeny model by mel mit:

| Pole | Typ | Automaticky/Manual | Popis |
|------|-----|-------------------|-------|
| **Nazev souboru** | Text | Auto | Puvodni nazev souboru |
| **Vlastni nazev** | Text | Manual | Zakaznik muze prejmenovat |
| **Format** | Text | Auto | STL, OBJ, 3MF, STEP |
| **Velikost souboru** | Number | Auto | V MB |
| **Rozmery (BBox)** | 3x Number | Auto | Sirka x Vyska x Hloubka v mm |
| **Objem** | Number | Auto | V ml (pro kalkulaci materialu) |
| **Pocet trojuhelniku** | Number | Auto | Mesh komplexita |
| **Datum nahrani** | DateTime | Auto | Timestamp |
| **Posledni pouziti** | DateTime | Auto | Kdy byl naposledy objednan |
| **Pocet objednavek** | Number | Auto | Kolikrat byl tento model objednan |
| **Thumbnail** | Image | Auto | Generovany 3D preview (server-side rendering nebo three.js) |
| **Tagy** | Array<String> | Manual | Uzivatelske stitky pro organizaci |
| **Slozka** | String | Manual | Virtualni slozka |
| **Poznamka** | Text | Manual | Vlastni poznamky zakaznika |
| **Tisknutelnost** | Enum | Auto | OK / Varovani / Netisknutelny (z analyzatoru) |
| **Kompatibilni materialy** | Array | Auto | Ktere materialy zvladnou tento model |

### 5.6 3D Preview / Viewer

**Implementacni moznosti:**

| Reseni | Pros | Cons |
|--------|------|------|
| **Three.js (client-side)** | Interaktivní, otoceni, zoom | Vykon zavisi na klientovi |
| **Server-side rendering** | Konzistentni thumbnaily | Potreba backendu (headless GL) |
| **Kombinace** | Thumbnaily server-side, detail viewer client-side | Komplexnejsi implementace |

**Doporuceni:** Kombinace — generovat staticke PNG thumbnaily na serveru pri uploadu + interaktivni Three.js viewer pri otevreni detailu modelu. ModelPricer uz ma `3D Viewer` komponentu — lze znovupouzit.

### 5.7 Organizace modelu

#### 5.7.1 Slozky (Folders)
- Zakaznik si muze vytvorit vlastni slozky: "Projekt A", "Prototypy", "Dily na auto"
- Defaultni slozka: "Vsechny modely"
- Drag & drop presunuti modelu mezi slozkami
- Limit: max 50 slozek (prevence zneuziti)

#### 5.7.2 Tagy (Tags)
- Zakaznik muze pridat libovolne tagy ke kazdemu modelu
- Autocomplete z existujicich tagu
- Filtrovani a vyhledavani podle tagu
- Limit: max 10 tagu na model, max 100 unikátních tagu celkem

#### 5.7.3 Hledani
- Fulltext search v nazvech, tagech, poznamkach
- Filtrovani podle: formatu, data nahrani, rozmeru (min/max), tisknutelnosti

### 5.8 Akce s modelem

| Akce | Popis | Priorita |
|------|-------|----------|
| **Objednat** | Otevre kalkulacku s predvyplnenym modelem | MUST |
| **Stahnout** | Stahne puvodni soubor modelu | MUST |
| **Prejmenovat** | Zmeni vlastni nazev modelu | MUST |
| **Presunout** | Presune do jine slozky | SHOULD |
| **Tagovat** | Prida/odebere tagy | SHOULD |
| **Nahrat novou verzi** | Revize — nahradi model novejsi verzi | SHOULD |
| **Smazat** | Permanentni smazani (s confirm dialogem) | MUST |
| **Sdílet** | Generuje jednorazovy link ke stazeni | COULD |
| **Duplikovat** | Vytvori kopii modelu | COULD |
| **Porovnat verze** | Side-by-side porovnani dvou verzi modelu | NICE-TO-HAVE |

### 5.9 Limity a Storage

- **Max velikost souboru:** 100 MB per model (konfigurovatelne tenantem)
- **Max pocet modelu:** 500 per zakaznik (konfigurovatelne tenantem)
- **Celkovy storage limit:** 5 GB per zakaznik (zavisi na tenant planu)
- **Podporovane formaty:** STL, OBJ, 3MF, STEP, IGES (minimalne STL+3MF)
- **Storage backend:** Cloudflare R2 (uz implementovano v ModelPricer)
- **Retention:** Modely se nemazu automaticky (zakaznik ridi lifecycle)

### 5.10 UX principy

1. **Drag & drop upload** s progress barem a animaci
2. **Hromadne akce** — select vice modelu → smazat, presunout, tagovat
3. **Grid vs List toggle** — grid pro vizualni prohlizeni, list pro tabulkovy prehled
4. **Lazy loading** — nacitat thumbnaily postupne pri scrollovani (virtualizace)
5. **Empty state** — "Zatim zadne modely. [Nahrat prvni model]" s ilustraci
6. **Drag-to-upload overlay** — pri pretazeni souboru nad stranku zobrazit drop zone

---

## 6. Oblibene nastaveni / Presety

### 6.1 Co to je

Moznost zakaznika ulozit kombinaci parametru tisku (material, barva, infill, vyska vrstvy atd.) pro opetovne pouziti. Misto zadavani 5-8 parametru pri kazde objednavce staci zvolit ulozeny preset.

### 6.2 Proc je dulezity

- **Snizeni friction** — zakaznik ktery objednava PLA Cerna 20% Infill 0.2mm kazdý tyden nechce toto zvolit 52x rocne
- **Konzistence** — zakaznik ma jistotu, ze objedna se stejnymi parametry jako minule
- **Rychlost** — od uploadu modelu k objednavce za 30 sekund misto 3 minut
- **Diferenciator** — vetsina konkurentu toto NEMA (Xometry, Sculpteo, Shapeways — nemaji customer-side presety)

### 6.3 Typy presetu

#### 6.3.1 Customer Presets (zakaznicke)
- Vytvari zakaznik sam
- Priklad: "Muj standard PLA", "Presne dily PETG", "Prototyp rychly"
- Ulozeny v kontextu zakaznika + tenanta

#### 6.3.2 Tenant Presets (doporucene)
- Vytvari tenant (3D tiskova firma) v admin panelu
- Priklad: "Doporucene pro funkcni dily", "Ekonomicky tisk", "Premium kvalita"
- Zobrazeny vsem zakaznikum daneho tenanta
- Zakaznik je muze pouzit, ale nemuze je editovat

#### 6.3.3 Automaticke presety
- System automaticky navrhne preset na zaklade historii objednavek
- "Pouzivate casto PLA Cernou s 20% infill — [Ulozit jako preset?]"

### 6.4 Struktura presetu

| Pole | Typ | Povinne | Popis |
|------|-----|---------|-------|
| **Nazev** | String | Ano | "Muj standard PLA" |
| **Material** | Enum | Ano | PLA, ABS, PETG, Resin... |
| **Barva** | Enum | Ano | Cerna, Bila, Cervena... |
| **Infill** | Number (%) | Ano | 0-100% |
| **Vyska vrstvy** | Number (mm) | Ano | 0.05-0.4mm |
| **Pocet stenových linii** | Number | Ne | 2-8 |
| **Podpora** | Boolean | Ne | Ano/Ne |
| **Orientace** | Enum | Ne | Auto, X-Up, Y-Up, Z-Up |
| **Postprocessing** | Array<Enum> | Ne | Bruseni, Lakovani, Barveni... |
| **Poznamka** | String | Ne | Vlastni poznamka |
| **Ikona/Barva** | Color | Ne | Pro vizualni rozliseni v seznamu |

### 6.5 Doporuceny design

```
+------------------------------------------------------------------+
| MOJE PRESETY                                    [+ Novy preset]   |
+------------------------------------------------------------------+
|                                                                    |
| ULOZENE PRESETY                                                    |
| +---------------------------+ +---------------------------+       |
| | [PLA icon] Muj standard  | | [PETG icon] Presne dily   |       |
| | PLA, Cerna, 20%, 0.2mm   | | PETG, Bila, 40%, 0.15mm  |       |
| | Pouzit: 12x              | | Pouzit: 5x               |       |
| | [Pouzit] [Upravit] [x]   | | [Pouzit] [Upravit] [x]   |       |
| +---------------------------+ +---------------------------+       |
|                                                                    |
| DOPORUCENE PRESETY (od [Tenant Name])                              |
| +---------------------------+ +---------------------------+       |
| | [star] Ekonomicky tisk    | | [star] Premium kvalita   |       |
| | PLA, Ruzne, 15%, 0.3mm   | | PETG, Ruzne, 50%, 0.1mm |       |
| | Doporuceno pro prototypy  | | Pro funkcni dily         |       |
| | [Pouzit] [Ulozit kopii]  | | [Pouzit] [Ulozit kopii]  |       |
| +---------------------------+ +---------------------------+       |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.6 Integrace s kalkulackou

Pri otevreni kalkulacky (widget nebo test-kalkulacka) prihlaseny zakaznik vidi:

```
+------------------------------------------------------------------+
| VYBERTE PARAMETRY TISKU                                           |
+------------------------------------------------------------------+
| [Rychle nastaveni: v Muj standard PLA v]  <-- dropdown s presety |
|                                                                    |
| Material:  [PLA v]        (predvyplneno z presetu)                |
| Barva:     [Cerna v]      (predvyplneno z presetu)                |
| Infill:    [20% v]        (predvyplneno z presetu)                |
| Vrstva:    [0.2mm v]      (predvyplneno z presetu)                |
|                                                                    |
| [Ulozit toto nastaveni jako novy preset]                          |
+------------------------------------------------------------------+
```

### 6.7 Limity

- Max 20 customer presetu na zakaznika
- Max 10 tenant presetu (admin konfigurace)
- Preset NEOBSAHUJE model — jen parametry tisku

### 6.8 UX principy

1. **One-click apply** — zvolit preset a vsechny parametry se predvyplni
2. **Vizualni rozliseni** — kazdy preset ma barvu/ikonu pro rychle rozpoznani
3. **Pocet pouziti** — zakaznik vidi kolikrat preset pouzil (motivace k pouzivani)
4. **Inline editing** — editace presetu bez opusteni stranky (modal nebo slide-in panel)
5. **Potvrzení smazani** — confirm dialog pri mazani presetu

**Priorita:** SHOULD-HAVE (V1), ale velky diferenciator oproti konkurenci

---

## 7. Sprava profilu

### 7.1 Co to je

Sekce kde zakaznik spravuje sve osobni udaje, adresy, platebni metody a notifikacni preference.

### 7.2 Proc je dulezity

- **Nutnost pro doruceni** — zakaznik musi zadat dodaci adresu
- **Pohodli** — ulozene adresy a platebni metody urychlují checkout
- **GDPR compliance** — zakaznik musi mit moznost videt, upravit a smazat sve udaje
- **Notifikacni preference** — prevence "email spamu", zvyseni spokojenosti

### 7.3 Struktura profilu — Taby/Sekce

#### 7.3.1 Osobni udaje (Personal Info)

| Pole | Typ | Povinne | Poznamky |
|------|-----|---------|----------|
| **Email** | Email | Ano | Nelze menit (identifikator uctu). Zobrazit s moznosti "Zmenit email" workflow |
| **Jmeno** | String | Ano | Krestni jmeno |
| **Prijmeni** | String | Ano | |
| **Telefon** | Phone | Ne | S predvolbou statu (+420) |
| **Firma** | String | Ne | Nazev firmy (pro B2B) |
| **ICO** | String | Ne | Pro fakturaci v CR (8 cislic, validace) |
| **DIC** | String | Ne | Pro fakturaci v CR (CZ + ICO, validace) |
| **Avatar** | Image | Ne | Nahrani nebo pouziti Gravatar/social avatar |
| **Jazyk** | Enum | Ne | CS, EN, DE... (dle tenant jazyku) |
| **Casova zona** | Enum | Ne | Pro spravne zobrazeni casu |

**UX best practices:**
- Inline editing (kliknout na pole → editace → ulozit) misto celeho formulare
- Auto-save s debounce (500ms) + toast notifikace "Ulozeno"
- Jasne oznacit povinna pole
- Validace v realnem case (ICO, DIC, telefon)

**Priorita:** MUST-HAVE

#### 7.3.2 Adresy (Addresses)

| Funkce | Popis | Priorita |
|--------|-------|----------|
| **Dodaci adresy** | Vice dodacich adres (prace, domov, sklad) | MUST |
| **Fakturacni adresa** | Muze byt stejna jako dodaci | MUST |
| **Vychozi adresa** | Oznaceni jedne adresy jako vychozi | MUST |
| **Address autocomplete** | Google Places API pro automaticke doplnovani | SHOULD |
| **PSC validace** | Validace postovniho smerovacího cisla pro CR/SK | SHOULD |
| **Max adresy** | Limit na 10 adres per zakaznik | SHOULD |

**Datova struktura adresy:**
```
{
  id: "uuid",
  label: "Domov" | "Prace" | custom,
  firstName: "Jan",
  lastName: "Novak",
  company: "Firma s.r.o.",      // volitelne
  street: "Prazska 123",
  city: "Praha",
  postalCode: "11000",
  country: "CZ",
  phone: "+420123456789",       // volitelne
  isDefault: true,
  isShipping: true,
  isBilling: true
}
```

**UX best practices (Shopify/Amazon pattern):**
- Karta pro kazdou adresu s akcemi [Upravit] [Smazat] [Nastavit jako vychozi]
- "Stejna jako dodaci" checkbox u fakturacni adresy
- Predvyplneni zeme podle tenant lokace
- Moznost rychle duplikovat adresu a upravit

#### 7.3.3 Platebni metody (Payment Methods)

| Funkce | Popis | Priorita |
|--------|-------|----------|
| **Ulozene karty** | Visa/MC/Amex — zobrazeni poslednich 4 cislic | MUST |
| **Vychozi platba** | Oznaceni jedne metody jako vychozi | MUST |
| **Pridat kartu** | Stripe Elements formular | MUST |
| **Smazat kartu** | S potvrzenim | MUST |
| **Fakturacni adresa** | Propojeni s adresou | SHOULD |
| **PayPal** | Propojeni PayPal uctu | COULD |
| **Prevod na ucet** | Pro B2B (faktura se splatnosti) | COULD |

**Bezpecnost:**
- NIKDY neukladat plne cislo karty — pouzit Stripe tokenizaci
- Zobrazovat pouze: typ karty + posledni 4 cislice + expirace
- PCI DSS compliance zajistena Stripe Elements (hosted fields)
- Smazani karty = revokace tokenu ve Stripe

**UX best practices:**
- Ikona typu karty (Visa/MC/Amex logo) vedle poslednich 4 cislic
- Expirace zobrazena — upozorneni kdyz brzy vyprsi
- "Pouzit tuto kartu" jako primari akce

**Priorita:** MUST-HAVE (zakladni), SHOULD-HAVE (pokrocile — PayPal, B2B)

#### 7.3.4 Notifikacni preference (Notification Preferences)

**Kategorie notifikaci:**

| Kategorie | Popis | Vychozi | Kanaly |
|-----------|-------|---------|--------|
| **Zmena statusu objednavky** | Prijata, Tisk, Odeslano, Doruceno | ON | Email, In-App |
| **Odeslani zasilky** | Sledovaci cislo k dispozici | ON | Email, SMS (opt-in) |
| **Platba** | Platba prijata, faktura k dispozici | ON | Email |
| **Model schvalen/odmitnut** | Vysledek kontroly tisknutelnosti | ON | Email, In-App |
| **Marketingove novinky** | Akce, slevy, nove materialy | OFF | Email |
| **Newsletter** | Pravidelny newsletter od tenanta | OFF | Email |
| **Systemove oznámení** | Udrzba, zmeny podminek | ON (nelze vypnout) | Email |

**Doporuceny design:**

```
+------------------------------------------------------------------+
| NOTIFIKACNI PREFERENCE                                            |
+------------------------------------------------------------------+
|                                                                    |
| Kategorie                    | Email | In-App | SMS              |
| -----------------------------|-------|--------|-------            |
| Zmena statusu objednavky    | [x]   | [x]    | [ ]              |
| Odeslani zasilky             | [x]   | [x]    | [x]              |
| Platba a fakturace           | [x]   | [ ]    | [ ]              |
| Kontrola modelu              | [x]   | [x]    | [ ]              |
| Marketingove novinky         | [ ]   | [ ]    | [ ]              |
| Newsletter                   | [ ]   | [ ]    | [ ]              |
| Systemova oznameni           | [x]*  | [x]*   | [ ]              |
|                                                                    |
| * Systemova oznameni nelze vypnout                                 |
|                                                                    |
| [Ulozit preference]                                               |
+------------------------------------------------------------------+
```

**UX best practices (OneSignal/Courier doporuceni):**
- Matice kanal x kategorie je nejprehlednejsi format
- Defaulty by mely byt rozumne (transakcni ON, marketing OFF)
- "Vsechno vypnout" nesmí vypnout systemova oznameni
- SMS channel vyzaduje explicitni opt-in (GDPR, TCPA)
- Ukazat posledni odeslane notifikace jako priklad ("Posledni email: 15.3.2026 — Objednavka #1234 odeslana")

**Priorita:** SHOULD-HAVE (email toggle MUST-HAVE)

#### 7.3.5 Bezpecnost uctu (Account Security)

| Funkce | Popis | Priorita |
|--------|-------|----------|
| **Zmena hesla** | Stare heslo + nove heslo + potvrzeni | MUST |
| **Propojene ucty** | Zobrazeni propojenych social loginu (Google, Apple) | MUST |
| **Odpojit social login** | Odebrani vazby na Google/Apple ucet | SHOULD |
| **2FA nastaveni** | Aktivace/deaktivace 2FA | COULD |
| **Aktivni sessions** | Seznam prihlasenych zarizeni s moznosti odhlaseni | COULD |
| **Login historie** | Posledních 10 prihlaseni s IP a casem | NICE-TO-HAVE |
| **Smazat ucet** | GDPR pravo na vymazani — s 30 denni grace period | MUST (GDPR) |

**Pozor na GDPR:**
- "Smazat ucet" MUSI byt dostupne (GDPR Article 17 — Right to Erasure)
- Implementace: soft delete → 30 dni grace period (moznost obnoveni) → hard delete
- Smazani uctu musi smazat: osobni udaje, adresy, platebni metody
- Smazani uctu NEMUSI smazat: anonymizovane objednavky (ucetni ucely, 5 let retence)
- Stazeni dat musi byt mozne (GDPR Article 20 — Right to Data Portability)

**Priorita:** Zmena hesla MUST-HAVE, GDPR funkce MUST-HAVE, ostatni SHOULD-HAVE

---

## 8. Komunikacni centrum

### 8.1 Co to je

Integrovaný system pro komunikaci mezi zakaznikem a 3D tiskovou firmou (tenantem). Zahrnuje notifikace, zpravy a podporu.

### 8.2 Proc je dulezity

- **Centralizace komunikace** — vsechno na jednom miste misto roztroustene po emailech
- **Kontext** — zpravy jsou propojene s konkretnimi objednavkami/modely
- **Snizeni response time** — tenant vidi dotazy v admin panelu a odpovida rychle
- **Audit trail** — historie komunikace pro reseni sporu

### 8.3 Komponenty komunikacniho centra

#### 8.3.1 Notifikacni centrum (Notification Center)

**Co to je:** In-app notifikace — zvonek ikonka v headeru s poctem neprectenych, rozkliknutelny panel s historii.

```
+----------------------------------+
| OZNAMENI                    [x]  |
+----------------------------------+
| [NEW] Objednavka #1234 odeslana  |
|       Vas balik je na ceste!     |
|       pred 2 hodinami            |
+----------------------------------+
| [NEW] Model Motor_v3.stl         |
|       schvalen k tisku           |
|       pred 5 hodinami            |
+----------------------------------+
|       Objednavka #1233 dorucena  |
|       Dekujeme za objednavku!    |
|       vcera                      |
+----------------------------------+
|       Platba prijata - 1250 Kc   |
|       Faktura k dispozici        |
|       pred 2 dny                 |
+----------------------------------+
| [Zobrazit vse]  [Oznacit precten]|
+----------------------------------+
```

**Funkcionalita:**
- Real-time updaty (Supabase Realtime / WebSocket)
- Badge s poctem neprectenych v headeru
- Klik na notifikaci → navigace na relevantní stranku (detail objednavky, model, faktura)
- "Oznacit vsechny jako prectene"
- Historie notifikaci (posledních 100)
- Propojeni s email notifikacemi (stejny obsah)

**Priorita:** MUST-HAVE

#### 8.3.2 Zpravy / Chat s podporou (Messaging)

**Co to je:** Jednoduchy messaging system pro komunikaci s tenant supportem.

**Scenare pouziti:**
1. Dotaz k objednavce — "Kdyz bude moje objednavka #1234 hotova?"
2. Technicka konzultace — "Je mozne vytisknout tento model v titanu?"
3. Reklamace — "Dil prisiel poskozeny, co ted?"
4. Obecny dotaz — "Jake materialy nabizite?"

**Design:**

```
+------------------------------------------------------------------+
| ZPRAVY                                         [+ Nova zprava]    |
+------------------------------------------------------------------+
|                                                                    |
| Konverzace                    | Zprava                            |
| +--------------------------+ | +--------------------------------+|
| | [NEW] Dotaz k #1234     | | | Vas dotaz k objednavce #1234   ||
| | 15.3.2026 14:30          | | |                                ||
| | "Kdyz bude hotova..."    | | | Vy (15.3. 14:30):              ||
| +--------------------------+ | | Ahoj, kdyz bude moje          ||
| | Re: Material titanu      | | | objednavka #1234 hotova?       ||
| | 14.3.2026 10:15          | | |                                ||
| | "Diky za odpoved..."     | | | Podpora (15.3. 14:45):         ||
| +--------------------------+ | | Dobry den, vase objednavka     ||
| | Reklamace #1232          | | | je aktualne ve fazi tisku,     ||
| | 10.3.2026 08:00          | | | odhadovane doruceni je          ||
| | "Resime, diky za..."     | | | 18. brezna. S pozdravem, Jan   ||
| +--------------------------+ | |                                ||
|                              | | [Priloha: screenshot.png]      ||
|                              | |                                ||
|                              | | +----------------------------+ ||
|                              | | | Napiste odpoved...         | ||
|                              | | | [Priloha] [Odeslat]        | ||
|                              | | +----------------------------+ ||
|                              | +--------------------------------+|
+------------------------------------------------------------------+
```

**Funkcionalita:**

| Funkce | Popis | Priorita |
|--------|-------|----------|
| **Vytvoreni zpravy** | Nova konverzace s predmetem | MUST |
| **Propojeni s objednavkou** | Volitelne pripojeni k cislu objednavky | MUST |
| **Prilohy** | Upload obrazku, PDF, 3D souboru (max 10 MB) | SHOULD |
| **Statusy konverzace** | Otevrena, Ceka na odpoved, Vyresena | SHOULD |
| **Notifikace o odpovedi** | Email + in-app kdyz tenant odpovi | MUST |
| **Historie** | Vsechny konverzace s fulltextovym hledanim | SHOULD |
| **Automaticke odpovedi** | "Dekujeme za vasi zpravu, odpovime do 24h" | COULD |
| **Chatbot/FAQ** | Predlozit FAQ odpovedi pred odeslaním zpravy | NICE-TO-HAVE |

**Na strane tenanta (admin panel):**
- Vsechny zpravy od zakazniku v jednom inboxu
- Filtrovani podle statusu, zakaznika, objednavky
- Interni poznamky (zakaznik nevidi)
- Sablony odpovedi pro caste dotazy
- Prirazeni zpravy clenu tymu

**Priorita:** SHOULD-HAVE (V1 — zakladni zpravy), MUST-HAVE (V2 — plnohodnotny system)

#### 8.3.3 Support Tickets (Tikety)

Pro slozitejsi pripady (reklamace, vraceni, technické problémy) strukturovany tiketovy system:

| Pole tiketu | Typ | Popis |
|-------------|-----|-------|
| **Cislo tiketu** | Auto | #T-0001 |
| **Typ** | Enum | Dotaz, Reklamace, Technicky problem, Vraceni, Jine |
| **Priorita** | Enum | Nizka, Normalni, Vysoka |
| **Propojeni** | Reference | Objednavka, Model (volitelne) |
| **Status** | Enum | Novy, Otevren, Ceka na zakaznika, Ceka na reseni, Vyresen, Zavreny |
| **Popis** | Text | Detailní popis problému |
| **Prilohy** | Files | Screenshot, foto, 3D soubor |

**Priorita:** COULD-HAVE (V2+) — v V1 staci jednoduche zpravy

### 8.4 Integrace s externimí nastroji

| Nastroj | Integrace | Priorita |
|---------|-----------|----------|
| **Email** | Zpravy se zaroven odesilaji emailem | MUST |
| **Zendesk/Freshdesk** | Pro tenaty kteri uz pouzivaji helpdesk | COULD |
| **Slack** | Notifikace pro tenant tym o novych zpravach | COULD |
| **WhatsApp** | Notifikace zakaznikovi (v nekterych regionech preferovany) | NICE-TO-HAVE |

---

## 9. Dalsi Pokrocile Funkce

Tato sekce pokryva funkce ktere nejsou soucasti zakladniho MVP, ale predstavuji vyznamne rozsireni customer portalu a konkurencni vyhody v pozdejsich fazich.

### 9.1 Team / Organization Accounts

#### 9.1.1 Co to dela

Vice uzivatelu pod jednim firemnim uctem. Sdilena objednavkova historie, modely, presety a fakturace. Role a permissions pro ruzne cleny tymu. Centralizovana sprava pristupu k firemnim prostredkum.

#### 9.1.2 Proc je to dulezite

| Aspekt | Dopad |
|--------|-------|
| **B2B poptavka** | Firmy pouzivajici 3D tisk maji typicky 3-10 lidi kteri objednavaji — kazdy potrebuje vlastni pristup |
| **Revenue** | Team ucty = vyssi CLV (vice objednavek, vetsi objemy, delsi retence) |
| **Lock-in** | Cely tym na jedne platforme = silnejsi lock-in nez jednotlivec (migrace = presunout vsechny) |
| **Sprava** | Jeden fakturacni ucet pro celou firmu = jednodussi ucetnictvi |
| **Diferenciace** | Z analyzovanych konkurentu toto dobre resi pouze Xometry (Teamspace) a castecne Protolabs (ProDesk) |

**Klasifikace:** NICE-TO-HAVE (Phase 3, ale high-value pro B2B segment)

#### 9.1.3 Role a opravneni

| Role | Objednavky | Modely | Presety | Fakturace | Team sprava | Org settings |
|------|-----------|--------|---------|-----------|-------------|-------------|
| **Owner** | CRUD | CRUD | CRUD | CRUD + platby | CRUD + invite | CRUD + delete org |
| **Admin** | CRUD | CRUD | CRUD | Read + download | CRUD + invite | Read + edit |
| **Member** | Create + read | CRUD vlastni, read team | CRUD vlastni, read team | Read vlastni | Read | Read |
| **Viewer** | Read | Read | Read | Ne | Ne | Ne |
| **Billing** | Read | Ne | Ne | CRUD + platby | Ne | Ne |

**Best practices:**
- Zacinat s 2 rolemi (Owner + Member) pro MVP — slozite role systemy maji nizkou adopci
- Owner je vzdy prave jeden (transfer ownership = explicitni akce)
- Novy clen = invite email → registrace → automaticke prirazeni k organizaci
- Odchod z organizace = zachovat osobni modely, ztratit pristup k team modelum

#### 9.1.4 Sdileni prostredku

| Prostredek | Typ sdileni | Popis |
|------------|-------------|-------|
| **Modely** | Org knihovna vs osobni | "Firemni modely" viditelne vsem clenum, "Moje modely" jen autorovi |
| **Presety** | Org presety vs osobni | Team presety = konzistentni nastaveni napric firmou |
| **Objednavky** | Dle role | Member vidi vlastni + team objednavky (dle nastaveni) |
| **Adresy** | Org adresa vs osobni | Firemni fakturacni adresa sdilena, dodaci per-uzivatel |
| **Fakturace** | Centralni | Vsechny objednavky na jeden firemni ucet |

**UX tipy:**
- Jasne vizualne odlisit "Firemni" vs "Osobni" prostredky (stitek, ikona budovy vs osoby)
- Pravo zalozit Team pridelat az Premium/Enterprise planu
- Invite flow: email → klik na odkaz → registrace (pokud nema ucet) → auto-join organizace
- "Activity log" — kdo co objednal/nahral/zmenil (audit trail pro firmu)
- Seat-based pricing: 3 mista zdarma, 10 mist = $X/mesic, neomezene = enterprise

#### 9.1.5 Jak to maji konkurenti

| Sluzba | Team funkce | Detail |
|--------|-------------|--------|
| **Xometry** | Teamspace | Sdilene projekty, team objednavky, vice uzivatelu, role (buyer, engineer, admin). Jeden z nejlepsich team systemu v odvetvi. |
| **Protolabs** | ProDesk (castecne) | Team kolaborace na projektech, sdilene nabidky, ale omezene role. |
| **Shapeways** | Zadne | Ciste single-user ucty |
| **Sculpteo** | Zadne | Single-user, zadna team funkcionalita |
| **i.materialise** | Zadne | Single-user |

**Poznamka k ModelPricer:** Admin strana uz ma `AdminTeamAccess.jsx` s team management (role, invite, seat limity). Cast teto logiky lze znovupouzit nebo mirrorovat pro customer-facing team funkce.

#### 9.1.6 Doporuceni

**Phase 3a (zakladni):**
- Owner + Member role (2 role staci pro start)
- Invite flow (email + link)
- Sdilena org knihovna modelu
- Centralni fakturace

**Phase 3b (pokrocile):**
- Admin a Viewer role
- Activity log
- Org presety
- Seat management a pricing

---

### 9.2 API Pristup (Developer Access)

#### 9.2.1 Co to dela

REST/GraphQL API pro programaticky pristup k ModelPricer. Zakaznici (developeri, firmy s vlastnim SW) mohou automatizovat objednavky, integrovat do svych ERP/MES systemu, batch processovat modely a ziskavat cenove nabidky bez pouziti weboveho rozhrani.

#### 9.2.2 Proc je to dulezite

| Aspekt | Dopad |
|--------|-------|
| **Integrace** | Developeri mohou napojit ERP (SAP, Pohoda), e-shop (WooCommerce, Shopify), workflow automation (Zapier, Make) |
| **Automatizace** | Hromadne objednavky behem vyroby (ne rucne po jednom) — kriticky pro B2B |
| **Platform efekt** | API = platforma, ne jen nastroj. Externi developeri budou nastroje kolem ModelPricer |
| **Stickiness** | API integrace = velmi silny lock-in (presun = rewrite integracniho kodu) |
| **Scalability** | Zakaznici s API typicky objednavaji 5-20x vice nez manual users |

**Klasifikace:** COULD-HAVE (Phase 2 zakladni), NICE-TO-HAVE (Phase 3 plne API)

#### 9.2.3 Navrzene API endpointy

```
# Autentizace
POST /api/v1/auth/token              -- Ziskani access tokenu (API key → JWT)

# Modely
POST   /api/v1/models/upload         -- Nahrani modelu (multipart/form-data)
GET    /api/v1/models                 -- Seznam modelu (paginovany, filtrovatelny)
GET    /api/v1/models/:id             -- Detail modelu (metadata, rozmery, thumbnail URL)
DELETE /api/v1/models/:id             -- Smazani modelu

# Cenove nabidky (Quoting)
POST   /api/v1/quotes                -- Vytvoreni cenove nabidky (model_id + parametry → cena)
GET    /api/v1/quotes/:id             -- Detail nabidky

# Objednavky
POST   /api/v1/orders                -- Vytvoreni objednavky z nabidky
GET    /api/v1/orders                 -- Seznam objednavek
GET    /api/v1/orders/:id             -- Detail objednavky (stav, tracking, timeline)
POST   /api/v1/orders/:id/reorder    -- Opakovna objednavka

# Materialy a konfigurace
GET    /api/v1/materials              -- Dostupne materialy a ceny
GET    /api/v1/materials/:id          -- Detail materialu (vlastnosti, barvy)

# Webhooky
POST   /api/v1/webhooks              -- Registrace webhooku
GET    /api/v1/webhooks               -- Seznam registrovanych webhooku
DELETE /api/v1/webhooks/:id           -- Zruseni webhooku
```

#### 9.2.4 Autentizace a bezpecnost

| Mechanismus | Popis |
|-------------|-------|
| **API klice** | Generovane v profilu zakaznika, pojmenovovateln (napr. "ERP integrace", "Test") |
| **Bearer token** | API klic → JWT token s expiraci (1 hodina), auto-refresh |
| **Rate limiting** | Free: 60 req/min, Premium: 300 req/min, Enterprise: 1000 req/min |
| **IP whitelist** | Volitelne omezeni na povolene IP adresy (enterprise) |
| **Webhook signing** | HMAC-SHA256 podpis kazdeho webhook payloadu pro overeni autenticity |
| **Scopes** | Granularni opravneni per API klic (read:models, write:orders, atd.) |

**Best practices:**
- API klice nikdy nepredat v URL (vzdy v Authorization header)
- Logovani vsech API pristupu (kdo, kdy, co, odkud)
- Revokace klice = okamzita invalidace vsech tokenu
- Test mode s prefixem `test_` (sandbox prostredi)
- Versioning od zacatku (`/v1/`) — nikdy nebreakovat existujici verzi

#### 9.2.5 Webhook notifikace

**Udalosti:**

| Event | Trigger | Payload priklad |
|-------|---------|----------------|
| `order.created` | Nova objednavka | `{order_id, status, total, items}` |
| `order.status_changed` | Zmena stavu | `{order_id, old_status, new_status, timestamp}` |
| `order.shipped` | Objednavka odeslana | `{order_id, tracking_number, carrier}` |
| `order.delivered` | Objednavka dorucena | `{order_id, delivered_at}` |
| `model.processed` | Model zpracovan | `{model_id, dimensions, volume, surface_area}` |
| `quote.ready` | Cenova nabidka hotova | `{quote_id, total_price, breakdown}` |
| `payment.received` | Platba prijata | `{order_id, amount, method}` |

**UX tipy:**
- Webhook test tlacitko ("Odeslat testovaci event")
- Delivery log: videt historii pokusu (uspech/neuspech, HTTP status, response time)
- Retry logika: 3 pokusy s exponencialnim backoff (1s, 30s, 5min)
- Secret rotation: moznost zmenit webhook secret bez downtime

#### 9.2.6 Dokumentace a developer experience

| Prvek | Implementace | Priorita |
|-------|-------------|----------|
| **OpenAPI/Swagger** | Auto-generovane ze kodu | MUST |
| **Interaktivni API explorer** | Swagger UI nebo Redoc | MUST |
| **Code samples** | curl, Python (requests), Node.js (fetch), PHP | SHOULD |
| **SDKs** | Python a Node.js klienti | COULD |
| **Postman kolekce** | Importovatelna kolekce s priklady | SHOULD |
| **Changelog** | Vsechny zmeny API s datumy | MUST |

#### 9.2.7 Jak to maji konkurenti

| Sluzba | API | Detail |
|--------|-----|--------|
| **Shapeways** | REST API | Upload, price check, order creation. API klice v profilu. Swagger docs. |
| **Sculpteo** | REST API | Upload, instant quote, materials list. Rate limited. |
| **Xometry** | Omezene | Mostly manual, ale maji integrace s ERP (SAP connector) |
| **i.materialise** | REST API | Upload Model API — jednoduchy upload + auto-pricing. Dobre zdokumentovane. |
| **Protolabs** | Partnerske API | Pro velke zakazniky (ne public). |

#### 9.2.8 Doporuceni

**Phase 2 (zakladni API):**
- Read-only endpointy: materialy, objednavky, modely
- API klice v profilu (generovani, revokace)
- Swagger dokumentace

**Phase 3 (plne API):**
- Write endpointy: upload, quote, order
- Webhooky
- SDKs (Python, Node.js)
- Rate limiting tiers

---

### 9.3 Loyalty / Vernostni Program

#### 9.3.1 Co to dela

Odmena za opakovanou aktivitu. Za kazdou objednavku zakaznik ziskava body, za body dostava slevy, bonusy, exkluzivni materialy nebo prioritni zpracovani. Program motivuje k opakovanemu nakupu a buduje dlouhodobou loajalitu.

#### 9.3.2 Proc je to dulezite

| Aspekt | Dopad |
|--------|-------|
| **Retence** | Vernostni programy zvysuji retenci o 15-25% (Bond Brand Loyalty study) |
| **CLV** | Zakaznik utraci vice aby dosahl dalsi urovne (+20-40% u engaged zakazniku) |
| **Konkurencni vyhoda** | Zatim ZADNA 3D tiskova sluzba nema robustni loyalty program — open space |
| **Data** | Body = metrika engagementu a hodnoty zakaznika, umoznuje segmentaci |
| **Word of mouth** | Spokojeni clenove loyalty programu doporucuji sluzbu 2x casteji |

**Klasifikace:** NICE-TO-HAVE (Phase 3+)

#### 9.3.3 Model vernostniho programu

**Tier system (urovne):**

| Uroven | Body k dosazeni | Benefity |
|--------|----------------|----------|
| **Bronze** | 0 (vychozi) | Zakladni ceny, standardni podpora |
| **Silver** | 500 bodu | 5% sleva na vsechny objednavky, prioritni email podpora |
| **Gold** | 2 000 bodu | 10% sleva, bezplatna express priprava, prioritni podpora |
| **Platinum** | 5 000 bodu | 15% sleva, exkluzivni materialy, dedickovany account manager |
| **Diamond** | 15 000 bodu | 20% sleva, beta pristup k novym funkcim, custom SLA |

**Jak ziskavat body:**

| Aktivita | Body | Poznamka |
|----------|------|----------|
| Utrata 1 Kc | 1 bod | Zakladni mechanismus |
| Prvni objednavka | +100 bodu | Onboarding bonus |
| Doporuceni pratele (registrace) | +200 bodu | Viz take Referral program (9.4) |
| Doporuceni pratele (prvni objednavka) | +300 bodu | Vyssi odmena za konverzi |
| Vyplneni profilu (100%) | +50 bodu | Motivace k dokonceni profilu |
| Upload 10. modelu | +50 bodu | Aktivita v knihovne |
| Recenze/hodnoceni tisku | +25 bodu | Feedback loop |
| Mesicni streak (objednavka kazdy mesic) | +50 bodu/mesic | Retencni mechanismus |

**Jak utraci body:**

| Odmena | Cena v bodech |
|--------|--------------|
| 50 Kc sleva na dalsi objednavku | 200 bodu |
| Bezplatne express zpracovani | 150 bodu |
| Exkluzivni material (limited edition barva) | 500 bodu |
| Prioritni tisk (predbehne frontu) | 300 bodu |
| Bezplatne vzorky materialu | 100 bodu |

#### 9.3.4 UX zobrazeni

**Dashboard widget:**
```
+----------------------------------------+
|  VERNOSTNI PROGRAM           Gold      |
|  =====================================  |
|  [==========>        ] 2 340 / 5 000   |
|  Jeste 2 660 bodu do Platinum!         |
|                                         |
|  Body tento mesic: +180                 |
|  Celkem utraceno: 34 560 Kc            |
|                                         |
|  [Zobrazit historii bodu]               |
+----------------------------------------+
```

**Best practices:**
- Progress bar k dalsi urovni na dashboardu (vizualni motivace)
- "Jeste X bodu do Y!" motivacni zprava
- Email notifikace pri dosazeni nove urovne ("Gratulujeme, jste Gold!")
- Expirace bodu po 12 mesicich neaktivity (motivace k navratu, ne ztrata pri aktivni pouziti)
- Zadne "negativni body" — body se nikdy neodebirani za vraceni zbozi
- Jednoduchy a srozumitelny — max 5 urovni, jasne benefity
- Transparentni pravidla na samostatne strance

#### 9.3.5 Jak to maji konkurenti

**3D printing sluzby:** Zadna z analyzovanych sluzeb (Shapeways, Sculpteo, Xometry, Protolabs, i.materialise) nema formalni loyalty program. Nektre nabizeji ad-hoc slevy pro vracejici se zakazniky.

**E-commerce reference:**
- **Sephora Beauty Insider:** 3 tiery, body za nakupy + akce, exkluzivni produkty. Zlaty standard.
- **Starbucks Rewards:** Jednoduchy (hvezdicky za nakup), intuitivni UX, mobilni appka.
- **Amazon Prime:** Ne body-based, ale subscription model s benefity. Inspirace pro "premium tier".

**Klicovy poznatek:** Absence loyalty programu v 3D tisk odvetvi = velka prilezitost pro diferenciaci.

---

### 9.4 Referral Program

#### 9.4.1 Co to dela

Zakaznik doporucuje ModelPricer pratelum a kolegum. Za kazdeho noveho zakaznika ktery uskutecni objednavku dostane odmenu (sleva, kredit, body). Oboustranne — novy zakaznik take ziskava vyhodu.

#### 9.4.2 Proc je to dulezite

| Aspekt | Dopad |
|--------|-------|
| **Akvizice** | Referral = nejlevnejsi akvizicni kanal (CAC blizici se nule) |
| **Duvera** | Doporuceni od zname osoby ma 4x vyssi konverzni pomeru nez reklama (Nielsen) |
| **Viralita** | Kazdy spokojeny zakaznik se stava potencialnim ambasadorem |
| **Kvalita leadu** | Referred zakaznici maji o 16% vyssi CLV a o 37% vyssi retenci (Wharton study) |
| **B2B relevance** | V 3D tisku je word-of-mouth silny kanal — inzenyri si doporucuji nastroje |

**Klasifikace:** NICE-TO-HAVE (Phase 3+)

#### 9.4.3 Mechanismus

**Dual-sided reward (oboustranna odmena):**

| Strana | Odmena | Podminka |
|--------|--------|----------|
| **Referrer** (doporucujici) | 200 Kc kredit (nebo 500 vernostnich bodu) | Novy zakaznik uskutecni prvni objednavku |
| **Referee** (novy zakaznik) | 10% sleva na prvni objednavku | Registrace pres referral link/kod |

**Workflow:**
1. Zakaznik jde na "Doporuci nas" stranku v portalu
2. Zkopiruje unikatni referral link nebo kod (napr. `REF-JAN42`)
3. Sdili pres email, WhatsApp, LinkedIn, nebo primo v konverzaci
4. Novy zakaznik klikne na link → registrace s 10% slevou na prvni objednavku
5. Po prvni objednavce noveho zakaznika → referrer dostane kredit
6. Notifikace obema stranam

**Anti-fraud opatreni:**
- Limit: max 20 uspesnych referrals za mesic
- Referrer a referee nemohou mit stejny email domain (zabrani self-referral)
- Minimalni objednavka pro activaci odmeny (napr. 200 Kc)
- IP/device fingerprint kontrola (zabrani duplicitnim registracim)
- Kredit se prideluje az PO doruceni objednavky (ne pri vytvoreni)

#### 9.4.4 UX zobrazeni

**Stranka "Doporucte nas":**
```
+--------------------------------------------------+
|  DOPORUCTE NAS A ZISKEJTE 200 Kc                |
|                                                    |
|  Vas unikatni kod:  REF-JAN42  [Kopirovat]       |
|                                                    |
|  Vas unikatni link:                               |
|  https://app.mp.com/ref/REF-JAN42  [Kopirovat]   |
|                                                    |
|  Sdilet:  [Email] [WhatsApp] [LinkedIn] [FB]      |
|                                                    |
|  --- Vase doporuceni ---                          |
|  Petr Novak     Objednal    +200 Kc    15.3.2026  |
|  Marie Kratka   Registrace  Ceka       12.3.2026  |
|  Pavel Svoboda  Objednal    +200 Kc    02.3.2026  |
|                                                    |
|  Celkem ziskano: 400 Kc z 3 doporuceni           |
+--------------------------------------------------+
```

**UX tipy:**
- Prominent CTA na dashboardu ("Doporuci prtele, ziskej 200 Kc")
- Jednoduchy sharing — 1 klik na "Kopirovat link" nebo "Poslat emailem"
- Progress tracking: videt stav kazdeho doporuceni (registroval se / objednal / odmena vyplacena)
- Personalizovany referral email template ("Jan Novak vas zve k ModelPricer...")
- Gamifikace: "Top referrer mesice" (v budoucnu)

---

### 9.5 Oblibene Polozky (Wishlist)

#### 9.5.1 Co to dela

Zakaznik si oznaci modely, konfigurace nebo materialy ktere chce objednat pozdeji. Funkce "Ulozit na pozdeji" bez vytvareni objednavky. Wishlist slouzi jako reminder a organizacni nastroj.

#### 9.5.2 Proc je to dulezite

| Aspekt | Dopad |
|--------|-------|
| **Konverze** | 40% polozek v wishlistu je nakonec objednano (Barilliance study) |
| **Engagement** | Uzivatele s wishlistem navstevuji portal 2x casteji |
| **Planovani** | Zakaznici casto planuji objednavky dopredu (rozpocet, projekt) |
| **Price alerts** | "Cena se snizila!" notifikace na wishlist polozky maji 8x vyssi CTR |
| **Data** | Wishlist = data o zameru zakaznika (co chce, ale jeste nekoupil) |

**Klasifikace:** NICE-TO-HAVE (Phase 2, nízka implementacni narocnost)

#### 9.5.3 Co lze pridovat do wishlistu

| Typ polozky | Ulozena data | Priklad |
|-------------|-------------|---------|
| **Model** | model_id, nazev, thumbnail | "Benchy v2" z knihovny |
| **Konfigurace** | model_id + parametry (material, infill, kvalita) + cena | "Benchy v2 v PLA bilem, 20%, 0.2mm = 186 Kc" |
| **Material** | material_id, nazev, cena/g | "PETG Carbon — 8.5 Kc/g" |
| **Nabidka (Quote)** | quote_id, datum, cena | "Nabidka z 15.3. — 3 modely, 1 850 Kc" |

#### 9.5.4 Funkcionalita

| Funkce | Popis | Priorita |
|--------|-------|----------|
| **Pridat do wishlistu** | Hvezdicka/srdce ikona na modelu, konfiguraci, materialu | MUST (v ramci wishlist feature) |
| **Odebrat z wishlistu** | Toggle — druhy klik odebere | MUST |
| **Wishlist stranka** | Kompletni seznam s filtry a razenim | MUST |
| **Objednat z wishlistu** | "Pridat do objednavky" u kazde polozky | MUST |
| **Hromadna objednavka** | "Objednat vsechno z wishlistu" | SHOULD |
| **Price tracking** | Upozorneni pri zmene ceny polozky | COULD |
| **Sdileni wishlistu** | Share link pro kolegy ("Podivej se co chci objednat") | COULD |
| **Wishlist badge** | Pocet polozek v navigaci (vedle ikony srdce) | SHOULD |

#### 9.5.5 UX tipy

- Hvezdicka/srdce ikona na kazdem modelu a konfiguraci — viditelna, klikatelna, s hover efektem
- Quick toggle (klik = pridat/odebrat, zadny modal nebo potvrzeni)
- Wishlist pocet v headeru navigace (badge na ikone srdce)
- Prazdny stav: "Vas wishlist je prazdny. Prozkoumejte materialy a ulozte si oblibene."
- Upozorneni pri zmene ceny: "Cena PLA se snizila o 10%! Objednejte nyni ze svych oblibených."
- Wishlist expiracia: NE — wishlist je permanentni (na rozdil od kosiku)
- Max 50 polozek v wishlistu (zabrani zneuziti jako "nekonecny kosik")

#### 9.5.6 Jak to maji konkurenti

| Sluzba | Wishlist | Detail |
|--------|---------|--------|
| **Shapeways** | Ne | Zadna wishlist funkce |
| **Sculpteo** | Ne | Zadna wishlist funkce |
| **Xometry** | Castecne | "Saved quotes" funguje jako wishlist pro cenove nabidky |
| **Amazon** | Ano | Zlaty standard — vice wishlistu, sdileni, price tracking, "Buy now from list" |
| **Shopify** | Ano | Zakladni wishlist s heart ikonou, integrace s kosíkem |

**Klicovy poznatek:** V 3D printing svete wishlist chybi. Ale zakaznici planují projekty dopredu a potrebuji misto pro "co chci objednat pozdeji". Jednoduchý wishlist je low-effort, high-value feature.

---

### 9.6 Porovnavani Materialu a Nastaveni

#### 9.6.1 Co to dela

Side-by-side porovnani ruznych materialu nebo konfigurac pro jeden model (nebo obecne). Zakaznik vidi cenu, cas tisku, mechanicke a termalni vlastnosti vedle sebe a rozhodne se informovane. Edukativni nastroj ktery snizuje nerozhodnost a support dotazy.

#### 9.6.2 Proc je to dulezite

| Aspekt | Dopad |
|--------|-------|
| **Konverze** | Informovany zakaznik objedna rychleji (mene "musim se jeste rozhodnout") |
| **Upsell** | Porovnani ukazuje vyhody drazsiho materialu — motivuje k upsell |
| **Edukace** | Zakaznik pochopi co ovlivnuje cenu a vlastnosti — mene reklamaci |
| **Support** | Snizuje dotazy typu "Jaky material pouzit pro..." o 20-30% |
| **Diferenciace** | Zadny konkurent nema robustni material comparator — jedine i.materialise ma castecne porovnani vlastnosti |

**Klasifikace:** NICE-TO-HAVE (Phase 2-3)

#### 9.6.3 Typy porovnani

**A) Cenove porovnani pro konkretni model (SHOULD-HAVE):**

Pro nahray model ukaze cenu ve vsech dostupnych materialech:

```
+--------------------------------------------------------------+
|  POROVNANI MATERIALU PRO: benchy_v2.stl                      |
|  Nastaveni: infill 20%, vrstva 0.2mm, supports auto           |
+--------------------------------------------------------------+
|                  | PLA Bily | ABS Cerny | PETG Natural | ASA |
+--------------------------------------------------------------+
| Cena             | 186 Kc   | 210 Kc    | 230 Kc       | 280 |
| Cas tisku        | 45 min   | 52 min    | 48 min       | 55  |
| Material (g)     | 8.4g     | 8.6g      | 9.1g         | 8.8 |
| Nejlepsi pro     | Figurky  | Funkce    | Outdoor      | UV  |
+--------------------------------------------------------------+
| [OBJEDNAT]       |  [x]     |  [ ]      |  [ ]         | [ ] |
+--------------------------------------------------------------+
```

**B) Materialovy porovnavac (vlastnosti) (COULD-HAVE):**

Obecne porovnani materialu bez konkretniho modelu:

```
+--------------------------------------------------------------+
|  POROVNANI MATERIALU                                          |
|  Vyber materialy k porovnani: [PLA] [PETG] [+ pridat]        |
+--------------------------------------------------------------+
|                       | PLA          | PETG          |       |
+--------------------------------------------------------------+
| Cena za gram          | 5.0 Kc       | 7.2 Kc        |       |
| Pevnost v tahu        | 50 MPa       | 50 MPa        |       |
| Tepelna odolnost (HDT)| 60 C         | 80 C          |       |
| UV odolnost           | Nizka        | Vysoka         |       |
| Chemicka odolnost     | Nizka        | Stredni        |       |
| Povrchova kvalita     | Vysoka       | Stredni        |       |
| Flexibilita           | Nizka        | Stredni        |       |
| Dostupne barvy        | 12           | 8              |       |
| Vhodne pouziti        | Prototypy,   | Outdoor dily,  |       |
|                       | figurky,     | mechanicke     |       |
|                       | prezentacni  | komponenty     |       |
+--------------------------------------------------------------+
| Na zaklade vasich pozadavku doporucujeme: PETG               |
| (Outdoor pouziti, vysoka UV a chemicka odolnost)             |
+--------------------------------------------------------------+
```

**C) Porovnani nastaveni pro jeden material (NICE-TO-HAVE):**

```
+--------------------------------------------------------------+
|  POROVNANI NASTAVENI PRO: benchy_v2.stl (PLA Bily)          |
+--------------------------------------------------------------+
|                  | Ekonom     | Standard   | Kvalita    |    |
|                  | (0.3mm/10%)| (0.2mm/20%)| (0.1mm/30%)|    |
+--------------------------------------------------------------+
| Cena             | 120 Kc     | 186 Kc     | 340 Kc     |    |
| Cas tisku        | 28 min     | 45 min     | 92 min     |    |
| Detail povrchu   | Nizky      | Stredni    | Vysoky     |    |
| Pevnost          | Nizka      | Stredni    | Vysoka     |    |
+--------------------------------------------------------------+
```

#### 9.6.4 "Smart doporuceni" funkce

Na zaklade parametru ktere zakaznik zada (ucel, prostredi, namahani):

```
Proc tisknete? [ ] Prototyp  [ ] Funkcni dil  [x] Venkovni pouziti  [ ] Prezentace
Mechanicke namahani: [===|======] Stredni
Rozpocet: [ ] Neomezeny  [x] Stredni  [ ] Minimalni

→ DOPORUCENI: PETG nebo ASA
  - PETG: Nejlepsi pomer cena/odolnost pro venkovni pouziti
  - ASA: Nejvyssi UV odolnost, ale o 20% drazsi
```

**UX tipy:**
- Max 3-4 materialy/nastaveni vedle sebe (vic = neprehledne, zvlast na mobilu)
- Zvyraznit nejlepsi hodnotu v kazdem radku (tucne, zelena barva, hvezdicka)
- "Doporucujeme" badge u idealni volby (na zaklade ucelu/rozpoctu zakaznika)
- Moznost pridat/odebrat material z porovnani (checkboxy nebo drag & drop)
- "Ulozit porovnani" do wishlistu nebo jako PDF
- Deep link z kalkulacky: "Porovnat s jinymi materialy" tlacitko vedle material dropdown
- Kontextove doporuceni v kalkulacce: tooltip "Pro venkovni pouziti zkuste PETG"
- Barvy: vizualni swatch (ne jen text "Bily")

#### 9.6.5 Datovy model

Material comparison vyzaduje strukturovane data o materialech:

```javascript
{
  id: "PLA",
  name: "PLA",
  price_per_gram: 5.0,
  properties: {
    tensile_strength_mpa: 50,
    heat_deflection_c: 60,
    uv_resistance: "low",        // low | medium | high
    chemical_resistance: "low",
    surface_quality: "high",
    flexibility: "low",
    layer_adhesion: "high",
    printability: "easy"         // easy | medium | hard
  },
  recommended_for: ["prototypy", "figurky", "prezentacni modely"],
  not_recommended_for: ["venkovni pouziti", "vysoke teploty"],
  available_colors: ["Bily", "Cerny", "Cerveny", "Modry", ...],
  description: "Nejpouzivanejsi material pro 3D tisk. Biologicky odbouratelny...",
  image_url: "/materials/pla-swatch.jpg"
}
```

**Poznamka:** Tato data musi spravovat admin (tenant) — kazda tiskarna nabizi jine materialy s jinymi cenami. Admin uz nastavuje materialy v `AdminPricing.jsx` — je treba rozsirit o properties pole.

#### 9.6.6 Jak to maji konkurenti

| Sluzba | Porovnani | Detail |
|--------|-----------|--------|
| **Shapeways** | Ne | Zadne porovnani — zakaznik musi klikat po jednom |
| **Sculpteo** | Castecne | Filtr materialu s vlastnostmi, ale ne side-by-side |
| **Xometry** | Ne | Material selection bez porovnani |
| **i.materialise** | Castecne | Material explorer s vlastnostmi, castecne side-by-side |
| **Protolabs** | Ne | Material datasheet PDF, ale ne interaktivni porovnani |
| **MatterHackers** | Ano (e-shop) | Filament comparison tool — best practice z retail sveta |

**Klicovy poznatek:** Interaktivni material comparator neexistuje v zadne vyznamne 3D printing sluzbe. Je to edukativni nastroj ktery pomaha zakaznikovi a zaroven zvysuje konverze a upsell — silna prilezitost k diferenciaci.

#### 9.6.7 Doporuceni

**Phase 2 (zakladni):**
- Cenove porovnani pro konkretni model (cena ve vsech materialech) — "Podivejte se na cenu v jinych materialech"
- Jednoduchý material picker s ikonami a kratkym popisem

**Phase 3 (pokrocile):**
- Full side-by-side porovnavac vlastnosti
- "Smart doporuceni" na zaklade ucelu
- Porovnani nastaveni (infill/kvalita varianty)
- Material datasheet PDF export

---

## 10. Prioritizace funkci (MoSCoW)

### 10.1 MUST-HAVE (V1 — MVP)

Bez techto funkci nelze spustit customer portal:

| # | Funkce | Sekce | Oduvodneni |
|---|--------|-------|------------|
| M1 | Email + heslo registrace/login | 2 | Zakladni pristup |
| M2 | Google Social Login | 2 | 65%+ uzivatelu, nizka friction |
| M3 | Dashboard s aktivnimi objednavkami | 3 | Primarni use case portalu |
| M4 | Seznam objednavek s filtry | 4 | #1 duvod proc zakaznik portal otevre |
| M5 | Detail objednavky s progress barem | 4 | Transparentnost statusu |
| M6 | Reorder funkce | 4 | Primy revenue impact |
| M7 | Stazeni faktury | 4 | Ucetní nutnost |
| M8 | Seznam modelu (zakladni) | 5 | Sprava ulozenych souboru |
| M9 | Upload modelu do knihovny | 5 | Zakladní funcionalita |
| M10 | 3D preview thumbnail | 5 | Vizualni identifikace modelu |
| M11 | Osobni udaje — editace | 7 | Sprava uctu |
| M12 | Dodaci/fakturacni adresy | 7 | Nutne pro objednavky |
| M13 | Platebni metody (Stripe) | 7 | Nutne pro platbu |
| M14 | In-app notifikace | 8 | Informovanost o stavech |
| M15 | GDPR — smazani uctu | 7 | Pravni povinnost |

### 10.2 SHOULD-HAVE (V1.5)

Vyznamne zvysuji hodnotu portalu:

| # | Funkce | Sekce | Oduvodneni |
|---|--------|-------|------------|
| S1 | Apple Social Login | 2 | iOS zakaznici |
| S2 | Magic Link login | 2 | Snadne prihlaseni pro obcasne zakazniky |
| S3 | Email notifikace pri zmene statusu | 4/8 | Proaktivni komunikace |
| S4 | Slozky a tagy pro modely | 5 | Organizace u zakazniku s mnoha modely |
| S5 | Interaktivni 3D viewer (Three.js) | 5 | Kvalitni UX pro 3D printing sluzbu |
| S6 | Customer presety (oblibene nastaveni) | 6 | Diferenciator, snizeni friction |
| S7 | Tenant presety (doporucene) | 6 | Cross-sell, konzistence |
| S8 | Notifikacni preference | 7 | Uzivatelska kontrola nad emaily |
| S9 | Messaging se supportem | 8 | Centralizovana komunikace |
| S10 | Casova osa objednavky (timeline) | 4 | Transparentnost procesu |
| S11 | Revize modelu (nahrani nove verze) | 5 | Profesionalni workflow |
| S12 | Tenant branding na portalu | 3 | White-label experience |

### 10.3 COULD-HAVE (V2)

Pridavaji hodnotu, ale nejsou kriticke pro spusteni:

| # | Funkce | Sekce | Oduvodneni |
|---|--------|-------|------------|
| C1 | 2FA (dvoufaktorova auth) | 2 | Enterprise bezpecnost |
| C2 | Statistiky na dashboardu | 3 | Data pro zakaznika |
| C3 | Export objednavek do CSV | 4 | Ucetni ucely |
| C4 | Sdileni modelu jednorazovym linkem | 5 | Kolaborace |
| C5 | Automaticke presety z historie | 6 | AI-driven UX |
| C6 | Aktivni sessions management | 7 | Pokrocila bezpecnost |
| C7 | Support tikety (strukturovane) | 8 | Enterprise zakaznici |
| C8 | Hromadne akce s modely | 5 | Power users |
| C9 | Address autocomplete (Google Places) | 7 | Convenience |
| C10 | PayPal platba | 7 | Alternativni platba |
| C11 | API pristup — read-only endpointy | 9.2 | Developer integrace, B2B automatizace |
| C12 | Wishlist (oblibene polozky) | 9.5 | Planovani objednavek, engagement |
| C13 | Cenove porovnani materialu (zakladni) | 9.6 | Edukace zakaznika, upsell |

### 10.4 NICE-TO-HAVE (V3+)

Budouci roadmap — pokrocile funkce detailne popsane v sekci 9:

| # | Funkce | Sekce | Poznamka |
|---|--------|-------|----------|
| N1 | Passkeys (WebAuthn) | 2 | Budouci standard autentizace |
| N2 | Expert User Status (gamifikace) | 3 | Insprirovano Sculpteo |
| N3 | Porovnani verzi modelu | 5 | Pro power users |
| N4 | Chatbot/FAQ pred zpravou | 8 | AI-driven self-service |
| N5 | WhatsApp notifikace | 8 | Regionalne preferovane |
| N6 | Automaticke doporuceni materialu | 6 | AI-driven personalizace |
| N7 | Socialni sdileni tisku | 5 | Community building |
| N8 | **Loyalty/vernostni program** | **9.3** | **Detailne: 5 urovni, body za aktivity, odmeny. Zadny konkurent nema.** |
| N9 | **Team/Organization accounts** | **9.1** | **Detailne: 5 roli, sdilene prostredky, centralni fakturace. High-value B2B.** |
| N10 | SMS notifikace | 7 | Pro kriticke udalosti |
| N11 | **Referral program** | **9.4** | **Detailne: dual-sided odmeny, anti-fraud, tracking. Nejlevnejsi akvizice.** |
| N12 | **API pristup — plne (write + webhooky)** | **9.2** | **Detailne: 15+ endpointu, webhooky, SDKs. Platform efekt.** |
| N13 | **Material comparator (pokrocily)** | **9.6** | **Detailne: side-by-side vlastnosti, smart doporuceni. Unikatni diferenciace.** |

---

## 11. Benchmarkove srovnani konkurence

### 11.1 Feature matice — 3D Printing Servisy

| Funkce | Shapeways | Sculpteo | Xometry | Protolabs/Hubs | i.materialise | ModelPricer (plan) |
|--------|-----------|----------|---------|----------------|---------------|-------------------|
| Email + heslo login | Ano | Ano | Ano | Ano | Ano | MUST (V1) |
| Google social login | Ano | Ano | Ano | Ne | Ne | MUST (V1) |
| Apple social login | Ne | Ne | Ne | Ne | Ne | SHOULD (V1.5) |
| Magic link | Ne | Ano | Ne | Ne | Ne | SHOULD (V1.5) |
| 2FA | Ne | Ne | Ano (enterprise) | Ano (enterprise) | Ne | COULD (V2) |
| Dashboard | Zakladni | Stredni | Pokrocily | Pokrocily (ProDesk) | Zakladni | MUST (V1) |
| Order tracking | Zakladni | Detailni (real-time) | Detailni (line-item) | Detailni (real-time) | Zakladni | MUST (V1) |
| Progress bar/vizualizace | Ne | Ano (pipeline stages) | Ano | Ano | Ne | MUST (V1) |
| Reorder | Ne | Ne | Ano | Ano | Ne | MUST (V1) |
| Parts/Model library | "My 3D Models" | Ano | "Parts Library" (auto-sber) | Ano | Ano | MUST (V1) |
| 3D Preview | Ano (basic) | Ano (pokrocily) | Ne (jen CAD thumbnail) | Ano | Ano | SHOULD (V1.5) |
| Slozky/Tagy modelu | Ne | Ne | Ne | Ne | Ne | SHOULD (V1.5) |
| Customer presety | Ne | Ne | Ne | Ne | Ne | SHOULD (V1.5) |
| Tenant/doporucene presety | N/A | "Expert" mode | N/A | N/A | N/A | SHOULD (V1.5) |
| Vichenasobne adresy | Ano | Ano | Ano | Ano | Ano | MUST (V1) |
| Ulozene platebni metody | Ano | Ano | Ano | Ano | Ano | MUST (V1) |
| Notifikacni preference | Zakladni | Zakladni | Pokrocile | Stredni | Zakladni | SHOULD (V1.5) |
| In-app notifikace | Ne | Ne | Ano | Ano (ProDesk) | Ne | MUST (V1) |
| Messaging/support | Email only | Email only | Ano (in-platform) | Ano (ProDesk) | Email only | SHOULD (V1.5) |
| Tikety | Ne | Ne | Ne | Ano | Ne | COULD (V2) |
| Forward/share quote | Ne | Ne | Ano | Ano | Ne | COULD (V2) |
| Teamspace/kolaborace | Ne | Ne | Ano | Ne | Ne | NICE-TO-HAVE (9.1) |
| Expert/gamifikace | Ne | Ano (po 5 obj) | Ne | Ne | Ne | NICE-TO-HAVE |
| API pro zakazniky | Ano | Ano | Ano | Ano | Ano | COULD (V2) / NICE-TO-HAVE (9.2) |
| Loyalty/rewards program | Ne | Ne | Ne | Ne | Ne | NICE-TO-HAVE (9.3) |
| Referral program | Ne | Ne | Ne | Ne | Ne | NICE-TO-HAVE (9.4) |
| Wishlist | Ne | Ne | Castecne (saved quotes) | Ne | Ne | COULD (V2) (9.5) |
| Material comparator | Ne | Castecne (filtr) | Ne | Ne | Castecne | COULD/NICE-TO-HAVE (9.6) |

### 11.2 Konkurencni vyhody ModelPricer

Na zaklade analyzy (sekce 1-9) existuje jasna prilezitost pro diferenciaci v techto oblastech:

1. **Customer Presety** — ZADNY z konkurentu nenabizi customer-side presety pro ulozeni oblibenych parametru tisku. To je velka prilezitost.

2. **Organizace modelu (slozky + tagy)** — Konkurence nabizi plochy seznam modelu. Slozky a tagy by byly unikatni feature.

3. **Tenant branding** — Jako SaaS platforma muze ModelPricer nabidnout plne brandovany customer portal pro kazdeho tenanta — neco co single-service provideri (Shapeways, Sculpteo) neresi.

4. **Integrovan messaging** — Vetsina konkurentu spoleha na email. In-app messaging propojeny s objednavkami je pokrocila feature, kterou maji jen Xometry a Protolabs.

5. **Lazy registration + guest checkout** — Sculpteo a Xometry vyzaduji ucet pred objednavkou. Moznost objednat jako guest a nasledne prepojit na ucet je lepsi UX.

6. **Loyalty program** (sekce 9.3) — ZADNA z analyzovanych 3D printing sluzeb nema formalni vernostni program. Absolutne volny prostor pro diferenciaci a budovani retence.

7. **Material comparator** (sekce 9.6) — Interaktivni side-by-side porovnavac materialu neexistuje u zadneho konkurenta. Edukativni nastroj ktery zaroven zvysuje konverze a upsell.

8. **Referral program** (sekce 9.4) — Zadna z konkurencnich sluzeb nema referral mechanismus. V B2B segmentu kde word-of-mouth je silny kanal je to nevyuzita prilezitost.

### 11.3 Inspirace z ne-3D-printing sveta

#### Shopify Customer Accounts (ecommerce reference)
- **Co delaji dobre:** Jednoduchy, cistý design. Order history jako primarni obsah. Saved addresses a payment methods snadno pristupne. One-click reorder.
- **Co vzít:** Jednoduchost a prehlednost. Minimalni pocet kroku k cili.

#### Amazon Buyer Dashboard (ecommerce reference)
- **Co delaji dobre:** "Your Orders" jako top-level navigace. Sofistikovane filtrovani. "Buy Again" funkce. Detailni tracking s mapou.
- **Co vzit:** "Buy Again" = Reorder. Detailni tracking. Personalizovane doporuceni.

#### Protolabs ProDesk (manufacturing reference)
- **Co delaji dobre:** AI-powered DFM analyza. Real-time quoting. Team collaboration. Centralni support hub.
- **Co vzit:** DFM analyza pri uploadu modelu. Forward/share quote pro B2B zakazniky. Centralizovany support.

### 11.4 Klicove poznatky z researchu

1. **Order tracking je #1** — 91% zakazniku aktivne sleduje objednavky. Toto musi byt dokonale.

2. **Vizualni progress bar > textovy status** — Sculpteo ukazuje pipeline stages (queuing → printing → post-processing → packaging → shipping) a je to jeden z nejlepe hodnocenych aspektu jejich UX.

3. **Reorder = revenue** — Xometry reportuje, ze "Parts Library" s reorder funkci je jednou z jejich most-used features. Zakaznici se vraci pro opakované objednavky.

4. **Lazy registration wins** — Nutit registraci pred prvni objednavkou snizuje konverzi o 23-35% (Baymard). Guest checkout + post-purchase account creation je best practice.

5. **Self-service = -60% support** — Sculpteo po spusteni detailniho order trackingu zaznamenal vyrazny pokles support dotazu.

6. **Presety jsou neobsazeny trh** — Zadny z analyzovanych konkurentu nenabizi customer-side presety. To je prilezitost.

7. **Tenant branding je SaaS vyhoda** — Jako platforma slouzici vice firmam ma ModelPricer unikatní moznost nabidnout plne brandovany portal pro kazdeho tenanta.

8. **GDPR je must** — Pravo na smazani uctu a stazeni dat je pravni povinnost pro EU trh. Nutne implementovat od V1.

9. **In-app notifikace > email only** — Moderni portaly (Xometry, Protolabs ProDesk) pouzivaji real-time in-app notifikace. Email je fallback, ne primarni kanal.

10. **3D preview je ocekavany** — Pro 3D printing sluzbu je interaktivni 3D viewer ocekavany standard. Shapeways, Sculpteo i Hubs to maji.

---

## Appendix A: Technicke poznamky pro implementaci

### A.1 Existujici komponenty k znovupouziti

| Komponenta | Cesta | Vyuziti v portalu |
|------------|-------|-------------------|
| Firebase Auth | `src/providers/SupabaseAuthProvider.jsx` | Rozsiret pro customer auth |
| Google Sign-In | `src/components/ui/GoogleSignInButton.jsx` | Primo pouzitelne |
| 3D Viewer | Existujici v projektu | Pro model preview |
| Stripe Client | `src/lib/stripe/stripeClient.js` | Pro platebni metody |
| Admin Orders | `src/pages/admin/AdminOrders.jsx` | Inspirace pro customer order list |
| Storage R2 | `backend-local/src/storage/providers/r2Provider.js` | Pro model storage |
| Forge Design System | `src/forge-tokens.css` | Zaklad pro customer theme |
| Language Context | `src/contexts/LanguageContext.jsx` | i18n pro customer portal |
| Toast System | `NotificationContext` | Pro feedback v portalu |

### A.2 Navrhove datove tabulky (Supabase)

```sql
-- Zakaznicke ucty (customer_profiles)
-- Dodaci adresy (customer_addresses)
-- Platebni metody (customer_payment_methods) -- Stripe token reference
-- Ulozene modely (customer_models)
-- Presety (customer_presets)
-- Notifikacni preference (customer_notification_preferences)
-- Zpravy (customer_messages)
-- Notifikace (customer_notifications)
```

Vsechny tabulky MUSI mit `tenant_id` column a RLS politiky pro tenant izolaci.

### A.3 Routovani (navrh)

```
/portal                          -- Dashboard
/portal/orders                   -- Seznam objednavek
/portal/orders/:id               -- Detail objednavky
/portal/models                   -- Knihovna modelu
/portal/models/:id               -- Detail modelu
/portal/presets                  -- Oblibene nastaveni
/portal/profile                  -- Profil (osobni udaje)
/portal/profile/addresses        -- Adresy
/portal/profile/payment          -- Platebni metody
/portal/profile/notifications    -- Notifikacni preference
/portal/profile/security         -- Bezpecnost uctu
/portal/messages                 -- Zpravy
/portal/messages/:id             -- Detail konverzace
```

### A.4 Odhadovany rozsah implementace

| Faze | Funkce | Odhad (story pointy) |
|------|--------|---------------------|
| V1 (MVP) | 15 MUST-HAVE funkci | 80-100 SP |
| V1.5 | 12 SHOULD-HAVE funkci | 60-80 SP |
| V2 | 10 COULD-HAVE funkci | 50-70 SP |
| V3+ | 10 NICE-TO-HAVE funkci | 40-60 SP |

---

## Appendix B: Zdroje a reference

1. **Shapeways** — shapeways.com — "My 3D Models", Order Status Page, Self-Service Upload
2. **Sculpteo** — sculpteo.com — Real-time order tracking, Expert User status, API services
3. **Xometry** — xometry.com — Personalized Dashboard, Parts Library, Quote/Order History, Teamspace
4. **Protolabs ProDesk** — protolabs.com — AI-powered DFM, Real-time quoting, Support center, Collaboration
5. **Hubs (Protolabs Network)** — hubs.com — Quote Builder, instant pricing, multi-technology support
6. **i.materialise** — i.materialise.com — Upload Model API, 100+ materials, Help Center
7. **Shopify Customer Accounts** — shopify.dev — Order history, saved addresses, payment methods, wishlist
8. **Baymard Institute** — baymard.com — Accounts & Self-Service UX research, Order Tracking & Returns UX Benchmark 2024
9. **Auth0/Supertokens** — Magic link best practices, passwordless authentication
10. **OneSignal/Courier** — Notification preference centers, multi-channel notification strategy
11. **3DPrintForce** — 3dprintforce.com — 3D printing workflow (New → Printing → Printed → Shipped)
12. **Modelist** — modelist.app — 3D model library management, duplicate detection, tagging

---

> **Poznamka:** Tento dokument je CAST 1 — pokryva features a specifikace.
> Dalsí casti mohou pokryt: UI mockupy, datovy model, API specifikace, implementacni plan.

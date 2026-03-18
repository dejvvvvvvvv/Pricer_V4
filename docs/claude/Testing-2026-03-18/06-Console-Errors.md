# Testovani 2026-03-18 — Chyby v Browser Konzoli

**Datum:** 2026-03-18
**Soubor:** 06-Console-Errors.md

Zaznamenavej zde vsechny chyby a varovani z browser konzole (F12 → Console).
Testuj kazdou stranku zvlast — otevreni stranky, pockej na nacteni, zapas co je v konzoli.

---

## Legenda — Typ zaznamu

| Typ | Popis |
|-----|-------|
| ERROR | Cervena chyba — typicky JS exception, failed request |
| WARN | Zluta varovani — zastarale API, chybejici key, nevyuzita promenna |
| INFO | Informacni vypis (logovat jen pokud podezrely) |
| NETWORK | Chybny HTTP request (404, 500, CORS, atd.) |

### Zavaznost konzolove chyby

| Uroven | Popis |
|--------|-------|
| P0 | Chyba zpusobuje crash nebo bila obrazovka |
| P1 | Chyba zpusobuje nefunkci dulezite casti |
| P2 | Varovani, nezpusobuje viditelny problem |
| P3 | Informacni varovani, kosmetika |

---

## Jak zaznamenavat

1. Otevri Chrome DevTools (F12)
2. Prejdi na zalozku **Console**
3. Nastav filtr: **All** (nebo **Errors + Warnings** pro usoru)
4. Otevri stranku (hard reload: Ctrl+Shift+R)
5. Zaznamenej vsechny zpravy (ne jen po nacteni — taky pri interakci)
6. Pridej radek do tabulky nize

---

## Tabulka konzolnich chyb

| ID | Stranka (ID) | URL | Typ | Zavaznost | Zprava (zkracena) | Plna zprava / Stack | Kdy se objevi |
|----|--------------|-----|-----|-----------|-------------------|---------------------|---------------|
| — | P01 — Homepage | `/` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky |
| — | P02 — Pricing | `/pricing` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky |
| — | P03 — Support | `/support` | — | — | Neovereno (castecny test) | — | — |
| — | P04 — Model Upload | `/model-upload` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky |
| — | P05 — Order Tracking | `/track` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky + pri zadani chybnych dat |
| — | P06 — 404 stranka | `/some-nonexistent-page` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky |
| — | P07 — Login | `/login` | — | — | Zadne chyby ani varovani detekovany (redirect na /admin) | — | Po nacteni + presmerovani |
| — | P08 — Register | `/register` | — | — | Zadne chyby ani varovani detekovany (redirect na /admin) | — | Po nacteni + presmerovani |
| — | P-Account | `/account` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky + interakce se taby |
| — | P-Invite | `/invite/accept` | — | — | Zadne chyby ani varovani detekovany | — | Po nacteni stranky + submit s neplatnym tokenem |

---

## Zaznamy per stranka

### P01 — Homepage (`/`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Konzole je cista — zadne JS exceptions, zadne failed requesty, zadne React warnings.
```

Nalezene chyby: zadne

---

### P02 — Pricing page (`/pricing`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Konzole je cista — zadne JS exceptions, zadne failed requesty, zadne React warnings.
```

Nalezene chyby: zadne

---

### P03 — Support page (`/support`)

**Stav:** Castecne otestovano — konzole nebyla detailne overena.

```
Console output:
(castecny test — konzole nebyla ctelne zaznamenana pri tomto testovani)
```

Nalezene chyby: —

---

### P04 — Model Upload (`/model-upload`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Konzole je cista — zadne JS exceptions, zadne failed requesty, zadne React warnings.
```

Nalezene chyby: zadne

---

### P05 — Order Tracking (`/track`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, zadani prazdnych poli, zadani neplatne objednavky.
Konzole je cista.
```

Nalezene chyby: zadne

---

### P06 — 404 stranka (`/some-nonexistent-page`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Konzole je cista.
```

Nalezene chyby: zadne

---

### P07 — Login (`/login`)

**Stav:** Dokonceno (redirect only) — konzole cista.

```
Console output:
Zadne chyby ani varovani pri presmerovani prihlaseneho uzivatele na /admin.
Formular nebyl testovan (uzivatel byl prihlasen).
```

Nalezene chyby: zadne

---

### P08 — Register (`/register`)

**Stav:** Dokonceno (redirect only) — konzole cista.

```
Console output:
Zadne chyby ani varovani pri presmerovani prihlaseneho uzivatele na /admin.
Formular nebyl testovan (uzivatel byl prihlasen).
```

Nalezene chyby: zadne

---

### P-Account — Account (`/account`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, prepinani tabu, editace Profile, editace Company, prepinani jazyka.
Konzole je cista.
```

Nalezene chyby: zadne

---

### P-Invite — Invite Accept (`/invite/accept`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni bez tokenu, nacteni s neplatnym tokenem.
Konzole je cista.
```

Nalezene chyby: zadne

---

### P09 — Forgot Password (`/forgot-password`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P09 — Test Kalkulacka (`/test-kalkulacka`)

**Stav:** Neovereno

Testovat konzoli v techto momentech:
- Po nacteni stranky
- Po uploadu souboru
- Po zmene materialu / parametru
- Po vypoctu ceny (slicing)
- Pri vyplnovani checkout formulare
- Po odeslani objednavky

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P10 — Widget (`/w/:id`)

**Stav:** Neovereno

Testovat konzoli v techto momentech:
- Po nacteni stranky (widget init)
- postMessage komunikace
- Po uploadu souboru ve widgetu
- Po vypoctu ceny

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### A01 — Admin Dashboard (`/admin`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, otevreni sidebaru, prepinani theme, language switch,
otevreni Command palette (Ctrl+K), klik na notifications, navigace quick actions.
Konzole je cista.
```

Nalezene chyby: zadne (BUG-044 a BUG-045 jsou funkcni/routing problemy, ne konzolove chyby)

---

### A08 — Admin Presets (`/admin/presets`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, rozbaleni sablon, klik na Create preset ze sablony,
expand/collapse preset karet, search bar, prepinani jazyka CZ/EN.
Konzole je cista.
```

Nalezene chyby: zadne (BUG-049 a BUG-050 jsou funkcni problemy, ne JS konzolove chyby)

---

### A-Express — Admin Express Delivery (`/admin/express`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, vybrani tier, uprava hodnot editoru (surcharge type, dni, popis),
ulozeni, zahozeni zmen (confirm dialog), pridani noveho tier, smazani tier, prepinani jazyka CZ/EN.
Konzole je cista.
```

Nalezene chyby: zadne

---

### A15 — Admin Shipping (`/admin/shipping`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, vybrani metody, prepinani tabu Basic/Zones, zmena typu na "Osobni odber"
(skryva pole), aktivace EU zony (prida do Zones tabu), ulozeni, pridani/smazani metody, prepinani jazyka CZ/EN.
Konzole je cista.
```

Nalezene chyby: zadne

---

### A02 — Admin Orders (`/admin/orders`)

**Stav:** Neovereno

Testovat konzoli pri:
- Nacteni stranky
- Filtrovani objednavek
- Otevreni Order Detail modalu
- Exportu

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### A03 — Admin Order Detail (`/admin/orders/:id`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### A04 — Admin Analytics (`/admin/analytics`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### A05 — Admin Pricing (`/admin/pricing`)

**Stav:** Dokonceno — konzole cista.

```
Console output po nacteni stranky + interakci:
Zadne chyby (ERROR) ani varovani (WARN) detekovany.
Testovano: nacteni stranky, prepinani tabu, add material dialog, sort buttons,
save/reset, export JSON, preview sandbox, discounts tab.
Konzole je cista.
```

Nalezene chyby: zadne (BUG-046/047/048 jsou funkcni problemy v UI logice, ne JS exceptions)

---

### A06 az A22 — Ostatni Admin stranky

| Stranka | Konzole cista? | Chyby (ID) | Poznamky |
|---------|---------------|------------|----------|
| A06 — Fees | Neovereno | — | |
| A07 — Parameters | Neovereno | — | |
| A08 — Presets | Neovereno | — | |
| A09 — Branding | Neovereno | — | |
| A10 — Widget | Neovereno | — | |
| A11 — Team | Neovereno | — | |
| A12 — Customers | Ano — ciste | 0 | Zadne chyby ani varovani. Testovano: nacteni, vyhledavani, filter taby, expand radku, kopirovat kontakt, pridani poznamky, razeni. |
| A13 — Integrations | Neovereno | — | |
| A14 — Coupons | Ano — ciste | 0 | Zadne chyby ani varovani. Testovano: nacteni, add kupon, edit, delete, vyhledavani, status toggle. |
| A15 — Shipping | Neovereno | — | |
| A16 — Print Queue | Neovereno | — | |
| A17 — System Health | Neovereno | — | |
| A18 — Webhooks | Neovereno | — | |
| A19 — Activity Log | Neovereno | — | |
| A20 — Settings | Neovereno | — | |
| A21 — Emails | Neovereno | — | |
| A22 — Account | Neovereno | — | |

---

## Souhrn konzolnich chyb

> Prubezny stav — dokonceno: P01 (ciste), P02 (ciste), P04 (ciste), P05/Track (ciste), P06/404 (ciste), P07/Login (ciste), P08/Register (ciste), P-Account (ciste), P-Invite (ciste), A01/Dashboard (ciste), A02/Orders (ciste), A03/Order Detail (ciste), A05/Pricing (ciste), A06/Fees (1 WARN — Supabase RLS), A07/Parameters (2 ERROR — nested button P3), A08/Presets (ciste), A12/Customers (ciste), A14/Coupons (ciste), A-Express/Express Delivery (ciste), A15/Shipping (ciste). Castecne: P03 (konzole neoverena).

| Typ | Pocet | P0 | P1 | P2 | P3 |
|-----|-------|----|----|----|----|
| ERROR | 0 | 0 | 0 | 0 | 0 |
| WARN | 0 | 0 | 0 | 0 | 0 |
| NETWORK | 0 | 0 | 0 | 0 | 0 |
| **Celkem** | 0 | 0 | 0 | 0 | 0 |

> Poznamka: Celkovy pocet chyb v konzoli = 3 (1x Supabase WARN z A06/Fees, 2x React nested button ERROR z A07/Parameters). Vsechny ostatni otestovane stranky (17 stranek) maji cistu konzoli. A02/Orders, A03/Order Detail, A12/Customers a A14/Coupons jsou v teto davce vsechny ciste.

---

## Caste priciny konzolnich chyb (reference)

| Chyba | Pricina | Jak opravit |
|-------|---------|-------------|
| `Cannot read properties of undefined` | Null/undefined reference, chybejici optional chain | Pridat `?.` nebo null check |
| `Warning: Each child in a list should have a unique "key" prop` | Chybejici key v .map() | Pridat unikatni key prop |
| `Warning: Can't perform a React state update on an unmounted component` | useEffect cleanup chybi | Pridat cleanup funkci do useEffect |
| `Failed to fetch` | Backend neni spusten nebo CORS | Zkontroluj `npm run dev` + backend |
| `404 Not Found` | Neexistujici API endpoint nebo soubor | Zkontroluj route v backend |
| `Warning: validateDOMNesting` | Nespravne vnoreni HTML prvku (napr. p > div) | Opravit HTML strukturu |
| `Warning: React Hook useEffect has a missing dependency` | Chybejici dependence v useEffect | Pridat chybejici dep nebo `// eslint-disable` |
| `Uncaught Error: useXxx must be used within a Provider` | Hook pouzit mimo Provider | Zkontroluj wrapper v Routes.jsx |

---

---

## Admin stranky — konzole

| Stranka (ID) | URL | Chyby | Detaily |
|--------------|-----|-------|---------|
| A01 — Admin Dashboard | `/admin` | 0 | Ciste — zadne chyby ani varovani |
| A05 — Admin Pricing | `/admin/pricing` | 0 | Ciste — zadne chyby ani varovani |
| A06 — Admin Fees | `/admin/fees` | 1 WARN | `[storageAdapter] Supabase write error (fees): new row violates row-level security policy for table "fees"` — viz BUG-038. Fakticky chyba (Supabase write fail), UI ale zobrazi zeleny "Saved" (false positive). |
| A07 — Admin Parameters Library | `/admin/parameters/library` | 2 ERROR | React hydration: `In HTML, <button> cannot be a descendant of <button>. This will cause a hydration error.` v CollapsibleSection — viz CON-001. Nefunkcionalni dopady, ale HTML je nevalidni. |
| A07 — Admin Parameters (ostatni taby) | `/admin/parameters/*` | 0 | Ciste |
| A08 — Admin Presets | `/admin/presets` | 0 | Ciste — zadne chyby ani varovani. Nacteni, sablony, preset karty, upload zone, search, pagination — vsechny interakce bez konzolnich chyb. |
| A-Express — Admin Express Delivery | `/admin/express` | 0 | Ciste — zadne chyby ani varovani. Testovano: nacteni, pridani/upraveni/smazani tier, prepinani surcharge type, dirty state, discard confirm. |
| A15 — Admin Shipping | `/admin/shipping` | 0 | Ciste — zadne chyby ani varovani. Testovano: nacteni, editor metody, zony tab, pridani/smazani metody, typ "Osobni odber" skryva pole, dirty state. |
| A12 — Admin Customers | `/admin/customers` | 0 | Ciste — zadne chyby ani varovani. Testovano: nacteni, vyhledavani, filter taby, expand/collapse radku, kopirovat kontakt, pridani poznamky, razeni sloupcu. |
| A14 — Admin Coupons | `/admin/coupons` | 0 | Ciste — zadne chyby ani varovani. Testovano: nacteni, add kupon (modal), edit kupon, smazani kuponu, vyhledavani, prepinani Active/Inactive stavu. |
| A02 — Admin Orders | `/admin/orders` | 0 | Ciste — zadne chyby ani varovani. Testovano: nacteni tabulky, kanban pohled, filtry, vyhledavani, sort, checkbox vyber, bulk akce, navigace na detail. |
| A03 — Admin Order Detail | `/admin/orders/:id` | 0 | Ciste — zadne chyby ani varovani. Testovano: nacteni, prepinani tabu, status update, export CSV. |

> Souhrn admin: Celkem 3 konzolove problemy nalezeny (1x WARN z A06/Fees — Supabase RLS P1, 2x ERROR z A07/Parameters — nested button P3). Vsechny ostatni otestovane admin stranky maji cistou konzoli. V teto davce: A02, A03, A12, A14 — vsechny ciste.

---

*Soubor vytvoren: 2026-03-18 | Aktualizovan: 2026-03-18 (davka 6 — A02/Orders, A03/Order Detail, A12/Customers, A14/Coupons: vsechny ciste)*

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
| CON-001 | — | — | — | — | — | — | — |

---

## Zaznamy per stranka

### P01 — Homepage (`/`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P02 — Pricing page (`/pricing`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P03 — Support page (`/support`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P04 — Model Upload (`/model-upload`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P05 — 404 stranka (`/neexistujici-route`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P06 — Login (`/login`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P07 — Register (`/register`)

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

---

### P08 — Forgot Password (`/forgot-password`)

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

**Stav:** Neovereno

```
Console output:
(prazdne — doplnit pri testovani)
```

Nalezene chyby: —

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

### A05 az A22 — Ostatni Admin stranky

| Stranka | Konzole cista? | Chyby (ID) | Poznamky |
|---------|---------------|------------|----------|
| A05 — Pricing | Neovereno | — | |
| A06 — Fees | Neovereno | — | |
| A07 — Parameters | Neovereno | — | |
| A08 — Presets | Neovereno | — | |
| A09 — Branding | Neovereno | — | |
| A10 — Widget | Neovereno | — | |
| A11 — Team | Neovereno | — | |
| A12 — Customers | Neovereno | — | |
| A13 — Integrations | Neovereno | — | |
| A14 — Coupons | Neovereno | — | |
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

| Typ | Pocet | P0 | P1 | P2 | P3 |
|-----|-------|----|----|----|----|
| ERROR | — | — | — | — | — |
| WARN | — | — | — | — | — |
| NETWORK | — | — | — | — | — |
| **Celkem** | — | — | — | — | — |

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

*Soubor vytvoren: 2026-03-18*

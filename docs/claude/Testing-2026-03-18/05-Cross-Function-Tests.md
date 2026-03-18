# Testovani 2026-03-18 — Crossfunkcni Testy

**Datum:** 2026-03-18
**Soubor:** 05-Cross-Function-Tests.md

Zaznamenavej zde testy propojeni mezi admin nastavenimi a jejich projevem jinde v aplikaci.
Tyto testy overuji, ze zmena v adminu se skutecne projevi tam kde ma.

---

## Legenda

| Vysledek | Vyznam |
|----------|--------|
| OK | Zmena se spravne projevila |
| FAIL | Zmena se neprojevila nebo je spatna |
| CASTECNE | Projevila se, ale s odchylkou |
| Neovereno | Test nebyl proveden |

---

## 1. Pricing → Kalkulacka

**Scenario:** Zmenim cenu materialu v Admin/Pricing. Cena se musi projevit v Test Kalkulacce.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/pricing` | Zaznamenej aktualnu cenu materialu (napr. PLA — cena za gram) | Neovereno | |
| 2 | `/admin/pricing` | Zmen cenu materialu o +10 a uloz | Neovereno | |
| 3 | `/test-kalkulacka` | Nahraj soubor, vyberes stejny material, zkontroluj vypoctenou cenu | Neovereno | |
| 4 | Overeni | Cena odpovida novemu nastaveni? | Neovereno | |
| 5 | `/admin/pricing` | Vrat puvodni cenu | Neovereno | |

---

## 2. Fees → Kalkulacka

**Scenario:** Zmenim poplatek (napr. poplatek za baleni) v Admin/Fees. Musi se projevit v cenove rekapitulaci kalkulacky.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/fees` | Zaznamenej aktualni hodnotu poplatku za baleni | Neovereno | |
| 2 | `/admin/fees` | Zmen hodnotu a uloz | Neovereno | |
| 3 | `/test-kalkulacka` | Projdi az do cenoveho prehledu | Neovereno | |
| 4 | Overeni | Poplatek v rekapitulaci odpovida novemu nastaveni? | Neovereno | |
| 5 | `/admin/fees` | Vrat puvodni hodnotu | Neovereno | |

---

## 3. Parameters → Kalkulacka (viditelnost moznosti)

**Scenario:** Schovam material nebo parametr v Admin/Parameters. Nesmis ho videt v kalkulacce.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/parameters` | Zaznamenej seznam aktivnich materialu | Neovereno | |
| 2 | `/admin/parameters` | Deaktivuj jeden material (napr. ASA) | Neovereno | |
| 3 | `/test-kalkulacka` | Krok volby materialu — je ASA stale zobrazeno? | Neovereno | |
| 4 | Overeni | Deaktivovany material neni videt — OK / FAIL | Neovereno | |
| 5 | `/admin/parameters` | Znovu aktivuj material | Neovereno | |

---

## 4. Branding → Kalkulacka / Widget (logo, barvy)

**Scenario:** Zmenim logo nebo barvu v Admin/Branding. Musi se projevit v kalkulacce a widgetu.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/branding` | Zaznamenej aktualni logo a primary color | Neovereno | |
| 2 | `/admin/branding` | Zmen primary color (napr. jiny odstin) a uloz | Neovereno | |
| 3 | `/test-kalkulacka` | Je nova barva viditelna? | Neovereno | |
| 4 | `/w/:id` | Je nova barva viditelna ve widgetu? | Neovereno | |
| 5 | `/admin/branding` | Vrat puvodni nastaveni | Neovereno | |

---

## 5. Presets → Kalkulacka (predvolby)

**Scenario:** Vytvorim preset v Admin/Presets. Preset musi byt dostupny v kalkulacce.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/presets` | Vytvor novy preset s nazvem "Test Preset 2026" | Neovereno | |
| 2 | `/test-kalkulacka` | V sekci volby parametru — je preset videt? | Neovereno | |
| 3 | `/test-kalkulacka` | Vyberes preset — nastaveni se aplikuje spravne? | Neovereno | |
| 4 | `/admin/presets` | Smaz testovaci preset | Neovereno | |

---

## 6. Coupons → Kalkulacka (slevove kody)

**Scenario:** Vytvorim kupon v Admin/Coupons. Kupon funguje v checkout kroku kalkulacky.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/coupons` | Vytvor kupon "TEST10" se slevou 10 % | Neovereno | |
| 2 | `/test-kalkulacka` | Projdi az do checkout kroku | Neovereno | |
| 3 | `/test-kalkulacka` | Zadej kupon "TEST10" | Neovereno | |
| 4 | Overeni | Sleva 10 % se spravne odecetla od ceny? | Neovereno | |
| 5 | `/admin/coupons` | Smaz testovaci kupon | Neovereno | |

---

## 7. Shipping → Kalkulacka (dopravni moznosti)

**Scenario:** Nastavim dopravni moznosti v Admin/Shipping. Musi byt dostupne v checkout kroku.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/shipping` | Zaznamenej aktivni dopravni metody | Neovereno | |
| 2 | `/test-kalkulacka` | V checkout kroku — jsou vsechny aktivni metody dostupne? | Neovereno | |
| 3 | `/admin/shipping` | Deaktivuj jednu metodu | Neovereno | |
| 4 | `/test-kalkulacka` | Overeni — deaktivovana metoda neni viditelna? | Neovereno | |
| 5 | `/admin/shipping` | Znovu aktivuj metodu | Neovereno | |

---

## 8. Orders → Admin Analytics (data konzistentnost)

**Scenario:** Objednavky v Admin/Orders se musi promitat do grafu v Admin/Analytics.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/orders` | Zaznamenej pocet objednavek dnes | Neovereno | |
| 2 | `/admin/analytics` | Pocet objednavek v dennim grafu odpovida? | Neovereno | |
| 3 | `/admin/orders` | Zaznamenej celkovou hodnotu objednavek | Neovereno | |
| 4 | `/admin/analytics` | Revenue cislo v analytice odpovida? | Neovereno | |

---

## 9. Widget settings → Embed Widget (konfigurace)

**Scenario:** Zmenim nastaveni widgetu v Admin/Widget. Zmena se musi projevit ve verejnem widgetu.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | `/admin/widget` | Zaznamenej aktualni nastaveni (nadpis, barva) | Neovereno | |
| 2 | `/admin/widget` | Zmen nadpis widgetu a uloz | Neovereno | |
| 3 | `/w/:id` | Je novy nadpis videt? | Neovereno | |
| 4 | `/admin/widget` | Vrat puvodni nastaveni | Neovereno | |

---

## 10. Auth — PrivateRoute ochrana

**Scenario:** Neprihlaseny uzivatel nesmi vejit do admin sekcí.

| Krok | Kde | Co udelat / co overit | Vysledek | Poznamky |
|------|-----|----------------------|----------|----------|
| 1 | Odhlasit se | Odhlasit se z aplikace | Neovereno | |
| 2 | `/admin` | Pokus o pristup na admin dashboard | Neovereno | |
| 3 | Overeni | Redirect na `/login`? (ne bila obrazovka) | Neovereno | |
| 4 | `/admin/orders` | Pokus o pristup na orders | Neovereno | |
| 5 | Overeni | Redirect na `/login`? | Neovereno | |
| 6 | Prihlasit se zpet | Prihlasit se a overit ze admin funguje | Neovereno | |

---

## Souhrn crossfunkcnich testu

| Test | Scenario | Vysledek | Poznamky |
|------|----------|----------|----------|
| 1 | Pricing → Kalkulacka | Neovereno | |
| 2 | Fees → Kalkulacka | Neovereno | |
| 3 | Parameters → Kalkulacka | Neovereno | |
| 4 | Branding → Kalkulacka / Widget | Neovereno | |
| 5 | Presets → Kalkulacka | Neovereno | |
| 6 | Coupons → Kalkulacka | Neovereno | |
| 7 | Shipping → Kalkulacka | Neovereno | |
| 8 | Orders → Analytics | Neovereno | |
| 9 | Widget settings → Widget | Neovereno | |
| 10 | Auth — PrivateRoute | Neovereno | |

**Celkem OK:** —  |  **Celkem FAIL:** —  |  **Celkem CASTECNE:** —

---

*Soubor vytvoren: 2026-03-18*

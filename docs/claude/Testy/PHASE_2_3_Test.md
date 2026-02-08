# PHASE 2+3 — Manualni testovaci checklist

> **Datum:** 2026-02-08
> **Scope:** S06 Post-Processing, S09 Express, S04 Shipping, S14 Kanban, S07 Email, S10 Coupons
> **Jak spustit:** `npm run dev` v `Model_Pricer-V2-main/`, otevrit `http://localhost:4028`

---

## 0) Predpoklady pred testovanim

- [ ] `npm run dev` bezi bez chyb v konzoli
- [ ] `npm run build` projde bez erroru
- [ ] V prohlizeci neni cervena chyba v DevTools Console po nacteni hlavni stranky
- [ ] Admin panel (`/admin`) se nacte a sidebar zobrazuje vsechny polozky

---

## 1) Admin Sidebar — nove polozky

**Kde:** `/admin` → levy sidebar

| # | Test | Ocekavani |
|---|------|-----------|
| 1.1 | Sidebar obsahuje polozku **Express** s ikonou blesku (Zap) | Viditelna, klikatelna |
| 1.2 | Sidebar obsahuje polozku **Shipping** s ikonou kamionu (Truck) | Viditelna, klikatelna |
| 1.3 | Sidebar obsahuje polozku **Coupons** s ikonou stitku (Tag) | Viditelna, klikatelna |
| 1.4 | Sidebar obsahuje polozku **Emails** s ikonou obalky (Mail) | Viditelna, klikatelna |
| 1.5 | Kliknuti na kazdou polozku zobrazi spravnou stranku (ne bily screen) | Stranka se renderuje |
| 1.6 | Aktivni polozka v sidebaru je zvyraznena modre | Aktivni stav odpovida URL |

---

## 2) S09: Admin Express (`/admin/express`)

**Kde:** `/admin/express`
**Storage:** `modelpricer:{tenantId}:express:v1` v localStorage
**Co to dela:** Sprava dorucovaciho rezimu (Standard / Express / Rush) s prirazky

| # | Test | Ocekavani |
|---|------|-----------|
| 2.1 | Stranka se nacte bez erroru | Zobrazi se 2-sloupcovy layout (seznam tieru + editor) |
| 2.2 | Defaultne existuji 3 tiery: Standard (0%), Express (+25%), Rush (+50%) | Vsechny tri viditelne v seznamu |
| 2.3 | Kliknuti na tier v seznamu ho vybere a zobrazi v editoru | Editor ukazuje spravne hodnoty |
| 2.4 | Zmena nazvu tieru → pill ukazuje "Unsaved changes" (oranzova) | Dirty state funguje |
| 2.5 | Klik "Save" → pill se zmeni na "Saved" (zelena) | Data ulozena do localStorage |
| 2.6 | Klik "Reset" → vrati se puvodni data | Zmeny zahozeny |
| 2.7 | Zmena surcharge_type z percent na fixed a zpet | Editor prepne pole spravne |
| 2.8 | Zmena delivery_days na 1 → ulozit → reload stranky → hodnota zustava 1 | Persistence funguje |
| 2.9 | Toggle "Express delivery enabled" vypne/zapne celou sekci | Toggle viditelny v headeru |
| 2.10 | Pridani noveho tieru (+) | Novy tier se objevi v seznamu |
| 2.11 | Smazani tieru | Tier zmizi ze seznamu po potvrzeni |
| 2.12 | Upsell sekce: zapnuti toggle + zmena zpravy | Upsell message se ulozi |

---

## 3) S04: Admin Shipping (`/admin/shipping`)

**Kde:** `/admin/shipping`
**Storage:** `modelpricer:{tenantId}:shipping:v1`
**Co to dela:** Sprava zpusobu dopravy (pevna cena, podle vahy, osobni odber)

| # | Test | Ocekavani |
|---|------|-----------|
| 3.1 | Stranka se nacte bez erroru | 2-sloupcovy layout (metody + editor) |
| 3.2 | Defaultne 2 metody: Standard Shipping (FIXED, 99 Kc) + Personal Pickup (PICKUP, 0) | Obe viditelne |
| 3.3 | Vyber metody kliknutim → editor se naplni | Spravne hodnoty |
| 3.4 | Zmena typu na WEIGHT_BASED → objevi se tabulka vahovych tieru | Tabulka se zobrazi |
| 3.5 | Pridani/odebrani vahoveho tieru | Radek se prida/odebere |
| 3.6 | Zmena delivery_days_min a delivery_days_max | Hodnoty se ulozi |
| 3.7 | Free shipping threshold: zapnout toggle + nastavit castku (napr. 1000 Kc) | Ulozi se |
| 3.8 | Save → reload → data zustava | Persistence funguje |
| 3.9 | Pridani nove metody | Metoda se objevi v seznamu |
| 3.10 | Smazani metody | Zmizi po potvrzeni |

---

## 4) S07: Admin Emails (`/admin/emails`)

**Kde:** `/admin/emails`
**Storage:** `modelpricer:{tenantId}:email:v1`
**Co to dela:** 3 taby — Sablony (triggery), Provider, Log

| # | Test | Ocekavani |
|---|------|-----------|
| 4.1 | Stranka se nacte, 3 taby viditelne (Sablony/Provider/Log) | Defaultne aktivni tab Sablony |
| 4.2 | Tab Sablony: defaultne 4 triggery (order_confirmed atd.) | Vsechny zobrazeny |
| 4.3 | Zapnuti triggeru checkboxem | Checkbox reaguje |
| 4.4 | Zmena Subject line u triggeru | Text se ulozi po Save |
| 4.5 | Pridani noveho triggeru (+) | Novy trigger se objevi |
| 4.6 | Smazani triggeru (kosik) | Trigger zmizi |
| 4.7 | Tab Provider: zmena na SMTP → zobrazi se Host/Port/Username pole | SMTP formular se objevi |
| 4.8 | Tab Provider: zmena na Resend → zobrazi se API key name pole | API formular se objevi |
| 4.9 | Tab Provider: zmena na None → skryji se konfiguracni pole | Jen selector zustane |
| 4.10 | Bezpecnostni poznamka u hesla (SMTP) — "Heslo se nastavuje v .env" | Varovani viditelne |
| 4.11 | Sender name + email pole (viditelne pro non-none provider) | Pole se zobrazi/skryji |
| 4.12 | Tab Log: prazdny stav → "Zatim nebyly odeslany zadne emaily" | Empty state zobrazen |
| 4.13 | Save/Reset funguje spravne pres vsechny taby | Dirty state globalni |

---

## 5) S10: Admin Coupons (`/admin/coupons`)

**Kde:** `/admin/coupons`
**Storage:** `modelpricer:{tenantId}:coupons:v1`
**Co to dela:** 3 taby — Kupony, Promakce, Nastaveni

| # | Test | Ocekavani |
|---|------|-----------|
| 5.1 | Stranka se nacte, 3 taby viditelne | Defaultne aktivni tab Kupony |
| 5.2 | Tab Kupony: prazdny stav → empty state s ikonou | Zobrazeno |
| 5.3 | Pridani noveho kuponu (+) | Novy kupon se objevi s defaultnimi hodnotami |
| 5.4 | Zmena kodu kuponu (napr. "SLEVA20") | Kod se prevede na velka pismena |
| 5.5 | Zmena typu: percent / fixed / free_shipping | Selector funguje |
| 5.6 | Nastaveni hodnoty (napr. 20 pro 20%) | Hodnota se ulozi |
| 5.7 | Nastaveni min_order_total (minimalni objednavka) | Hodnota se ulozi |
| 5.8 | Nastaveni max_uses a overeni ze used_count je readonly | Funguje |
| 5.9 | Nastaveni datumu platnosti (starts_at, expires_at) | Datumova pole funguje |
| 5.10 | Toggle active zapne/vypne kupon | Toggle reaguje |
| 5.11 | Smazani kuponu | Kupon zmizi po potvrzeni |
| 5.12 | Tab Promakce: pridani promakce | Nova promakce s defaulty |
| 5.13 | Zmena banner_text a banner_color | Nahled barvy se aktualizuje |
| 5.14 | Auto-apply toggle | Checkbox reaguje |
| 5.15 | Tab Nastaveni: allow_stacking toggle | Toggle funguje |
| 5.16 | Tab Nastaveni: max_discount_percent (0-100) | Cislo se ulozi |
| 5.17 | Global toggle "Coupons enabled" | Zapne/vypne cely system |
| 5.18 | Save → reload → vsechna data zustava | Persistence |

---

## 6) S14: Kanban Board (`/admin/orders`)

**Kde:** `/admin/orders`
**Storage:** `modelpricer:{tenantId}:kanban:v1` (view preference)
**Co to dela:** Prepinani mezi tabulkovym a kanban zobrazenim objednavek

| # | Test | Ocekavani |
|---|------|-----------|
| 6.1 | V headeru Orders stranky jsou dve tlacitkla (List + Columns ikony) | Toggle viditelny |
| 6.2 | Defaultne aktivni tabulkovy rezim (List) | Tabulka zobrazena |
| 6.3 | Klik na Columns → prepne na Kanban | Kanban board se zobrazi |
| 6.4 | Kanban ukazuje sloupce podle statusu (New, Confirmed, Printing...) | Min. 3-4 sloupce viditelne |
| 6.5 | Pokud existuji objednavky, zobrazuji se jako karty ve spravnych sloupcich | Karty odpovidaji statusu |
| 6.6 | Drag & drop karty z jednoho sloupce do druheho | Karta se presune |
| 6.7 | Po presunuti karty se status objednavky zmeni | Novy status ulozen |
| 6.8 | Neplatny prechod (napr. z Done zpet na New) je zablokovany | Karta se nevlozi |
| 6.9 | Klik na kartu otevre detail objednavky | Navigace na detail |
| 6.10 | Prepnuti zpet na List → tabulka se zobrazi | Toggle funguje obousmerne |
| 6.11 | Reload stranky → zachova posledni vybraný rezim | Preference ulozena |
| 6.12 | Filtry (search, status, datum) funguji i v kanban rezimu | Karty se filtrují |

**Pozn.:** Pro test drag&drop je potreba mit nejake objednavky. Vytvorte testovaci objednavku pres `/test-kalkulacka` → nahrat model → spocitat → checkout.

---

## 7) S06: Post-Processing v AdminFees (`/admin/fees`)

**Kde:** `/admin/fees` — rozsireni existujici stranky
**Co to dela:** Fees s `category: 'POST_PROCESSING'` maji nove pole (icon, processing_days, customer_description, image_url)

| # | Test | Ocekavani |
|---|------|-----------|
| 7.1 | Existujici fees se nacitaji spravne (zadna regrese) | Puvodni fees neovlivneny |
| 7.2 | Pridani noveho fee → moznost vybrat kategorii POST_PROCESSING | Kategorie v editoru |
| 7.3 | Pole processing_days, customer_description, icon, image_url jsou dostupne | Pole se zobrazi |
| 7.4 | Ulozeni fee s POST_PROCESSING kategorii → reload → data zustava | Persistence |

**Pozn.:** Pokud AdminFees jeste nema category dropdown v UI, tyto pole se ukladaji pres storage ale nejsou v UI. To je v poradku — S06 rozsirilo schema, ne nutne UI.

---

## 8) Test-Kalkulacka integrace (`/test-kalkulacka`)

**Kde:** `/test-kalkulacka`
**Co to dela:** Hlavni 5-krokovy wizard s integrovanymi novymi komponentami

| # | Test | Ocekavani |
|---|------|-----------|
| 8.1 | Stranka se nacte bez erroru | Zadna cervena chyba v Console |
| 8.2 | Upload STL souboru funguje | Model se zobrazi v seznamu |
| 8.3 | Klik "Spocitat cenu" → slicer probehne → cena se zobrazi | Cenovy breakdown v prave casti |
| 8.4 | Cenovy breakdown ukazuje zakladni radky (material, cas, poplatky) | Minimalne base price viditelna |
| 8.5 | Pokud je express nakonfigurovany a enabled → surcharge se prida do ceny | Express se projevi v breakdown |
| 8.6 | Pokud je kupon zadan a validni → sleva se zobrazi | Coupon discount v breakdown |
| 8.7 | Shipping se prida k celkove cene (grandTotal) | Shipping viditelny |
| 8.8 | Krok 4 (Checkout) → formular se zobrazi | Formular funguje |
| 8.9 | Odeslani objednavky → krok 5 potvrzeni | Objednavka ulozena |
| 8.10 | Nova objednavka se objevi v `/admin/orders` | Objednavka v seznamu |

**Pozn.:** Express/Coupon/Shipping komponenty (ExpressTierSelector, CouponInput, ShippingSelector atd.) jsou vytvoreny ale NEMUSI byt jeste vizualne integrovany do wizard UI — to zavisi na tom, zda jsou importovany v `PrintConfiguration.jsx` nebo `PricingCalculator.jsx`. Engine je presto pocita.

---

## 9) Widget-Kalkulacka (`/w/:id` nebo widget builder)

**Kde:** `/admin/widget` → builder, nebo primo `/w/test-widget-1`
**Co to dela:** Widget verze kalkulacky s CSS custom properties

| # | Test | Ocekavani |
|---|------|-----------|
| 9.1 | Widget builder se nacte (`/admin/widget`) | Zadna bila obrazovka |
| 9.2 | Widget public page se nacte (`/w/test-widget-1` pokud existuje) | Stranka se zobrazi |
| 9.3 | Zadna cervena chyba v Console | Vsechny importy funguji |

**Pozn.:** Widget komponenty (PostProcessingSelector, ExpressTierSelector atd.) jsou vytvoreny s CSS vars (`var(--mp-*)`) ale jeste NEMUSI byt integrovany do widget orchestratoru. To je plan pro dalsi fazi.

---

## 10) Pricing Engine — pipeline overeni

**Kde:** Neni primo testovatelne v UI — overi se neprimo pres kalkulacku
**Pipeline:** `calcBase → MODEL fees → percent → min → round → EXPRESS → COUPON → volume → ORDER fees → markup → order min → final round → SHIPPING`

| # | Test | Ocekavani |
|---|------|-----------|
| 10.1 | Zakladni cena bez express/coupon/shipping | Stejna jako pred Phase 2+3 |
| 10.2 | Express surcharge se prida ke kazdemu modelu | grandTotal > totalBezExpress |
| 10.3 | Coupon sleva se odecte pred volume discountem | Spravne poradi |
| 10.4 | Shipping se pricte az po final round | grandTotal = finalRounded + shipping |
| 10.5 | Free shipping threshold: pokud orderTotal >= threshold → shipping = 0 | Funguje |
| 10.6 | Coupon free_shipping → shipping = 0 | Funguje |

---

## 11) Cross-cutting kontroly

| # | Test | Ocekavani |
|---|------|-----------|
| 11.1 | Prepnuti jazyka CS/EN → nove polozky maji preklady | Admin sidebar + stranky prekladaji |
| 11.2 | Zadna `undefined` nebo `[object Object]` v UI textech | Vsechny t() klice existuji |
| 11.3 | localStorage inspector: 5 novych namespace klicu existuje po prvni navsteve admin stranek | `express:v1`, `shipping:v1`, `kanban:v1`, `email:v1`, `coupons:v1` |
| 11.4 | Refresh (F5) na kazde admin strance → stranka se nacte spravne | Zadny white screen |
| 11.5 | Navigace zpet (browser back) funguje | Routy spravne |
| 11.6 | Konzole (F12) nema cervene errory pri normalnim pouzivani | Zadne unhandled errors |

---

## 12) Backend Email (volitelne — vyzaduje backend server)

**Kde:** `backend-local/` — spustit pres `npm run dev` v tom adresari
**Endpointy:** `/api/email/templates`, `/api/email/preview`, `/api/email/send`, `/api/email/log`

| # | Test | Ocekavani |
|---|------|-----------|
| 12.1 | GET `/api/email/templates` → vrati seznam template ID | JSON pole |
| 12.2 | POST `/api/email/preview` s `{ templateId: "order_confirmed", data: {...} }` → HTML | Renderovany email |
| 12.3 | POST `/api/email/send` → demo rezim → log zaznam | Status 200, logged |
| 12.4 | GET `/api/email/log` → vrati posledni zaznamy | JSON pole |

**Pozn.:** Backend endpointy je treba namontovat v `backend-local/src/index.js`:
```js
import emailRoutes from './routes/emailRoutes.js';
app.use('/api/email', emailRoutes);
```

---

## Souhrnna tabulka

| Sekce | Pocet testu | Priorita |
|-------|-------------|----------|
| Admin Sidebar | 6 | P0 |
| S09 Express | 12 | P0 |
| S04 Shipping | 10 | P0 |
| S07 Emails | 13 | P1 |
| S10 Coupons | 18 | P0 |
| S14 Kanban | 12 | P1 |
| S06 Post-Processing | 4 | P2 |
| Test-Kalkulacka | 10 | P0 |
| Widget | 3 | P2 |
| Pricing Engine | 6 | P0 |
| Cross-cutting | 6 | P0 |
| Backend Email | 4 | P2 |
| **Celkem** | **104** | |

**Doporucene poradi testovani:** Sidebar → Express → Shipping → Coupons → Kalkulacka → Kanban → Emails → Cross-cutting → Zbytek

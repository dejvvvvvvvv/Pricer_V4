# KONVERZACE — Bug analyza a opravy po Supabase Auth migraci

---

## Hlavicka

**ID:** 201-BU
**Datum:** 2026-03-15
**Session:** S04
**Tema:** Bug analyza a opravy po Supabase Auth migraci — 5 bugu (3x P0, 2x P1)

---

## Plna konverzace

### Uzivatel (zprava 1)

> Uzivatel hlasil 4 problemy:
> 1. AdminOrderDetail crashuje ("Rendered more hooks than during the previous render")
> 2. Kalkulacka ukazuje 0 Kc pro vsechny modely
> 3. Objednavky nemaji data (ceny 0, chybi soubory)
> 4. Fakturacni a firemni data se nezobrazuji v admin objednavce

### Claude (odpoved 1)

> Klicove body:
> - Spusteny 3 agenti paralelne pro analyzu vsech hlasenych problemu
> - Nalezeno 5 root causes (vic nez 4 hlasene — 2 problemy maji spolecny root cause v backend response envelope)
> - BUG 1 [P0] OPRAVENY: AdminOrderDetail hooks crash — `filteredNotes` useMemo volany PO early return, presunut PRED early return s optional chaining
> - BUG 2 [P0] NALEZENY: slicerApi.js response envelope mismatch — backend vraci `{ ok, data: { metrics, modelInfo } }`, frontend cte `file.result.metrics` (bez `data` wrapperu), ovlivnuje 12+ souboru
> - BUG 3 [P0] NALEZENY: `/api/slice` vyzaduje requireAuth, ale test-kalkulacka je verejna — zmena na `optionalAuth`
> - BUG 4 [P1] NALEZENY: AdminOrderDetail nema rendering pro billing_address a company_info fieldy (data JSOU v order objektu)
> - BUG 5 [P1] NALEZENY: totals_snapshot neuplny — CheckoutForm uklada jen `total` bez shipping_total, min_order_delta, rounding_delta
> - Navrzen postup oprav: nejdriv P0 (hooks fix hotovy, envelope fix v slicerApi, auth fix v backend), pak P1

---

## Klicove rozhodovani

- **Rozhodnuti 1:** BUG 2 oprava — zvolena oprava na urovni `slicerApi.js` (`return json?.data ?? json`) misto opravy vsech 12+ consumer souboru. Duvod: jedna zmena na jednom miste misto 12+ zmen rozesetych po celém kodu.
- **Rozhodnuti 2:** BUG 3 oprava — zmena `requireAuth` na `optionalAuth` pro `/api/slice` endpoint. Duvod: test-kalkulacka je verejna stranka, nema auth kontext, ale autentifikovany uzivatele by meli dostat tenant-scoped odpoved.
- **Rozhodnuti 3:** BUG 1 oprava — hooks presunuty PRED early return s optional chaining `order?.notes`. React hooks nemohou byt volany podmínene (Rules of Hooks).

---

## Vyvody

Session S04 identifikovala 5 bugu (3x P0, 2x P1) po Supabase Auth migraci. Hlavni root cause je response envelope mismatch v slicerApi.js ktery zpusobuje ze pricing engine a vsechny soubory zavisle na slicer vysledcich dostavaji undefined metriky. Jeden P0 bug (hooks crash) je opraveny, zbyvajici 2x P0 a 2x P1 cekaji na implementaci. Dalsi krok je oprava BUG 2 (envelope fix) a BUG 3 (auth fix), nasledovana P1 opravami v AdminOrderDetail a CheckoutForm.

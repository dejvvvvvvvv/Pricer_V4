# SafeNum Input Bug Audit — Mista kde nelze smazat hodnotu v numerickych inputech

## Popis chyby

Numericky input se chova tak, ze pri smazani obsahu (uzivatel oznaci vse a smaze) se okamzite zobrazuje `0` (nebo jina defaultni hodnota). Uzivatel nema sanci zadat napr. `1.5` — jakmile smaze `1`, input zobrazuje `0`, a nemuze pokracovat psanim `.5`.

**Pricina:** `onChange` handler okamzite prevadi prazdny string na cislo:
- `safeNum("", 0)` → `Number("") === 0` → vraci `0`
- `Number("") || fallback` → `0 || fallback` → vraci `fallback`
- `parseFloat("") || fallback` → `NaN || fallback` → vraci `fallback`
- `parseInt("") || fallback` → `NaN || fallback` → vraci `fallback`

---

## Opraveny vzor (reference)

Spravne reseni je drzet hodnotu jako string behem editace a prevest ji na cislo pouze pri `onBlur` (ztrata fokusu) nebo pri ulozeni. Priklad:

```jsx
// Lokalni string state pro editaci
const [rawValue, setRawValue] = useState(String(numericValue));

<input
  type="number"
  value={rawValue}
  onChange={(e) => setRawValue(e.target.value)}          // drz jako string
  onBlur={(e) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      setter(parsed);                                      // uloz cislo az pri blur
      setRawValue(String(parsed));
    } else {
      setRawValue(String(numericValue));                   // obnov posledni platnou hodnotu
    }
  }}
/>
```

Alternativa pro jednoduche pripady kde "prazdne pole = 0 je v poradku" — pouzit `onBlur` misto `onChange` pro samotnou konverzi, ale `onChange` nechat pouze aktualizovat local string state.

---

## Nalezena mista

### 1. AdminPricing.jsx — StepInput komponenta (sdilena, pouzita pro vsechny cenove inputy)

- **Soubor:** `src/pages/admin/AdminPricing.jsx`
- **Radek:** 109
- **Pole:** Vsechny cenove inputy v AdminPricing pouzivajici `<StepInput>` komponentu — cena za gram, cena za cm3, cena za sekundu, minimalni cena, marze, atd.
- **Kontext:** `StepInput` je lokalni komponenta v AdminPricing.jsx pouzivana pro vsechny numericky vstup v pricing editoru. Obsahuje tlacitka +/− pro krokove zmeny.
- **Typ cisla:** decimal (ceny za gram, cm3, sekundy) i integer (zaokrouhlovaci krok)
- **Kod:** `onChange={(e) => onChange(safeNum(e.target.value, 0))}`
- **Opraveno:** [ ]

### 2. AdminPricing.jsx — rounding_step (select)

- **Soubor:** `src/pages/admin/AdminPricing.jsx`
- **Radek:** 2258
- **Pole:** Zaokrouhlovaci krok (rounding_step)
- **Kontext:** Select pro zaokrouhlovani finalni ceny (hodnoty 1/5/10/50). Pouziva `<select>`, tedy technicky bug nenastane (select nikdy nevrati prazdny string), ale pattern je stejny.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => setRule('rounding_step', safeNum(e.target.value, 5))}`
- **Opraveno:** [ ] (nizka priorita — jde o select, ne text input)

### 3. AdminPricing.jsx — setPreviewFromMaterial (select)

- **Soubor:** `src/pages/admin/AdminPricing.jsx`
- **Radek:** 2605
- **Pole:** Vyber materialu pro nahled ceny
- **Kontext:** Select pro rychle nastaveni ceny za gram z existujiciho materialu. Pouziva `<select>`, bug nenastane, ale pattern je stejny.
- **Typ cisla:** integer (index materialu, -1 = zadny)
- **Kod:** `onChange={(e) => setPreviewFromMaterial(safeNum(e.target.value, -1))}`
- **Opraveno:** [ ] (nizka priorita — jde o select)

### 4. AdminFees.jsx — feeDraft.value (fee hodnota)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1057
- **Pole:** `value` — hodnota fee (castka nebo procento)
- **Kontext:** Hlavni hodnota fee — bud fixni castka v CZK nebo procento. Muze byt zaporna (= sleva). Admin MUSI moci zadat napr. `-12.5` — bez opravy smazani vede k `0`.
- **Typ cisla:** decimal
- **Kod:** `onChange={e => updateFeeDraft({ value: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 5. AdminFees.jsx — condition value (numericky operator v podminkach)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1145
- **Pole:** `value` — hodnota podminek fee (napr. minimalni hmotnost g, minimalni objem cm3)
- **Kontext:** Editace podminek pro fee — napr. "aplikovat fee kdyz hmotnost >= X g". Hodnoty jsou decimalni (gramy, cm3, procenta).
- **Typ cisla:** decimal
- **Kod:** `onChange={e => updateDraftCondition(idx, { value: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 6. AdminFees.jsx — sim.infill_percent (simulator)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1167
- **Pole:** `infill_percent` — procento vypln v simulatoru
- **Kontext:** Preview/simulator sekce v AdminFees — uzivatel zadava testovaci hodnoty pro nahled kalkulace fee. Neni kriticke (simulator, ne ulozena data), ale UX je rozbite.
- **Typ cisla:** integer (0–100)
- **Kod:** `onChange={e => setSim(p => ({ ...p, infill_percent: safeNum(e.target.value, 0) }))}`
- **Opraveno:** [ ]

### 7. AdminFees.jsx — sim.filamentGrams (simulator)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1168
- **Pole:** `filamentGrams` — hmotnost filamentu v g v simulatoru
- **Kontext:** Preview/simulator — testovaci vstup pro kalkulaci fee.
- **Typ cisla:** decimal
- **Kod:** `onChange={e => setSim(p => ({ ...p, filamentGrams: safeNum(e.target.value, 0) }))}`
- **Opraveno:** [ ]

### 8. AdminFees.jsx — sim.estimatedTimeSeconds (simulator)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1169
- **Pole:** `estimatedTimeSeconds` — cas tisku v sekundach v simulatoru
- **Kontext:** Preview/simulator — testovaci vstup pro kalkulaci fee.
- **Typ cisla:** integer
- **Kod:** `onChange={e => setSim(p => ({ ...p, estimatedTimeSeconds: safeNum(e.target.value, 0) }))}`
- **Opraveno:** [ ]

### 9. AdminFees.jsx — sim.volumeCm3 (simulator)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1170
- **Pole:** `volumeCm3` — objem modelu v cm3 v simulatoru
- **Kontext:** Preview/simulator — testovaci vstup pro kalkulaci fee.
- **Typ cisla:** decimal
- **Kod:** `onChange={e => setSim(p => ({ ...p, volumeCm3: safeNum(e.target.value, 0) }))}`
- **Opraveno:** [ ]

### 10. AdminFees.jsx — sim.surfaceCm2 (simulator)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1171
- **Pole:** `surfaceCm2` — povrch modelu v cm2 v simulatoru
- **Kontext:** Preview/simulator — testovaci vstup pro kalkulaci fee.
- **Typ cisla:** decimal
- **Kod:** `onChange={e => setSim(p => ({ ...p, surfaceCm2: safeNum(e.target.value, 0) }))}`
- **Opraveno:** [ ]

### 11. AdminFees.jsx — sim.percentBase (simulator)

- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Radek:** 1173
- **Pole:** `percentBase` — zakladna pro procentualni vypocet v simulatoru
- **Kontext:** Preview/simulator — base castka ze ktere se pocitaji procenta.
- **Typ cisla:** decimal
- **Kod:** `onChange={e => setSim(p => ({ ...p, percentBase: safeNum(e.target.value, 0) }))}`
- **Opraveno:** [ ]

### 12. AdminCoupons.jsx — bulkCount (pocet kuponu pri bulk generovani)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 560
- **Pole:** `bulkCount` — pocet kuponu k vygenerovani (bulk generate)
- **Kontext:** Pole pro zadani kolik kuponu vygenerovat najednou (1–100).
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => setBulkCount(safeNum(e.target.value, 5))}`
- **Opraveno:** [ ]

### 13. AdminCoupons.jsx — bulkValue (hodnota bulk kuponu)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 587
- **Pole:** `bulkValue` — hodnota (sleva v % nebo CZK) pro bulk generovani kuponu
- **Kontext:** Hodnota slevy pro hromadne generovane kupony.
- **Typ cisla:** decimal (muze byt 12.5 pro procenta)
- **Kod:** `onChange={(e) => setBulkValue(safeNum(e.target.value, 0))}`
- **Opraveno:** [ ]

### 14. AdminCoupons.jsx — combined_percent / value (procento kombinovaneho kuponu)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 786
- **Pole:** `combined_percent` + `value` — procento slevy u "combined" typu kuponu (% + doprava zdarma)
- **Kontext:** Edit kupon: procento slevy pro typ "combined" (sleva v % plus doprava zdarma).
- **Typ cisla:** integer (0–100)
- **Kod:** `onChange={(e) => updateCoupon(idx, { combined_percent: safeNum(e.target.value, 0), value: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 15. AdminCoupons.jsx — coupon.value (hodnota percent/fixed kuponu)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 769–771
- **Pole:** `value` — hodnota slevy pro percent nebo fixed kupon
- **Kontext:** Edit kupon: sleva v % (0–100) nebo fixni castka v CZK.
- **Typ cisla:** decimal pro fixed (napr. 249.50 CZK), integer pro percent
- **Kod:** `let v = safeNum(e.target.value, 0); ... updateCoupon(idx, { value: v })`
- **Opraveno:** [ ]

### 16. AdminCoupons.jsx — min_order_total (minimalni hodnota objednavky)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 803
- **Pole:** `min_order_total` — minimalni hodnota objednavky pro platnost kuponu
- **Kontext:** Kupon je platny jen pro objednavky nad touto castkou (0 = bez omezeni).
- **Typ cisla:** integer (CZK, typicky nasobky 100)
- **Kod:** `onChange={(e) => updateCoupon(idx, { min_order_total: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 17. AdminCoupons.jsx — max_uses (maximalni pocet pouziti)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 815
- **Pole:** `max_uses` — maximalni celkovy pocet pouziti kuponu
- **Kontext:** 0 = neomezeno. Admin chce zadat treba `500`.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateCoupon(idx, { max_uses: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 18. AdminCoupons.jsx — max_uses_per_customer (max pouziti na zakaznika)

- **Soubor:** `src/pages/admin/AdminCoupons.jsx`
- **Radek:** 827
- **Pole:** `max_uses_per_customer` — maximalni pocet pouziti jednim zakaznikem
- **Kontext:** 0 = neomezeno. Admin chce zadat treba `1`.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateCoupon(idx, { max_uses_per_customer: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 19. AdminExpress.jsx — delivery_days (doba doruceni)

- **Soubor:** `src/pages/admin/AdminExpress.jsx`
- **Radek:** 401
- **Pole:** `delivery_days` — pocet dni doruceni pro express uroven
- **Kontext:** Express pricing tier — za kolik dni je objednavka dorucena.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateTier(selectedTier.id, { delivery_days: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 20. AdminExpress.jsx — surcharge_value (hodnota express prirazky)

- **Soubor:** `src/pages/admin/AdminExpress.jsx`
- **Radek:** 426
- **Pole:** `surcharge_value` — hodnota prirazky za express (procento nebo fixni castka)
- **Kontext:** Express tier pricing — kolik se prida k cene za expresni doruceni.
- **Typ cisla:** decimal (napr. 15.5% nebo 299.00 CZK)
- **Kod:** `onChange={(e) => updateTier(selectedTier.id, { surcharge_value: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 21. AdminExpress.jsx — min_order_value (minimalni hodnota objednavky pro express)

- **Soubor:** `src/pages/admin/AdminExpress.jsx`
- **Radek:** 468
- **Pole:** `min_order_value` — minimalni hodnota objednavky pro dostupnost express urovne
- **Kontext:** Express tier podminka — uplatni se jen pokud objednavka presahuje tuto castku.
- **Typ cisla:** integer (CZK)
- **Kod:** `onChange={(e) => updateTier(selectedTier.id, { min_order_value: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 22. AdminEmails.jsx — smtp_port (SMTP port)

- **Soubor:** `src/pages/admin/AdminEmails.jsx`
- **Radek:** 651
- **Pole:** `smtp_port` — cislo SMTP portu (standardne 587 nebo 465)
- **Kontext:** SMTP nastaveni pro odesilani emailu. Admin chce zadat port primo.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateConfig({ smtp_port: Number(e.target.value) || 587 })}`
- **Opraveno:** [ ]

### 23. AdminPayments.jsx — variable symbol next_value

- **Soubor:** `src/pages/admin/AdminPayments.jsx`
- **Radek:** 304
- **Pole:** `next_value` — dalsi cislo variabilniho symbolu faktury
- **Kontext:** Nastaveni automatickeho variabilniho symbolu — odtud zacina sekvence cisel na fakturach.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateVariableSymbol({ next_value: Math.max(1, Number(e.target.value) || 1) })}`
- **Poznamka:** `Number("") || 1` vraci 1 (fallback), ale uzivatel nema sanci smazat a zadat jine cislo.
- **Opraveno:** [ ]

### 24. AdminPayments.jsx — due_days (splatnost faktury)

- **Soubor:** `src/pages/admin/AdminPayments.jsx`
- **Radek:** 244
- **Pole:** `due_days` — pocet dni splatnosti faktury
- **Kontext:** Select pro splatnost faktury pri bankovnim prevodu. Pouziva `<select>`, bug nenastane — vsechny hodnoty jsou z presne definovaneho seznamu.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateBankTransfer({ due_days: Number(e.target.value) })}`
- **Opraveno:** [ ] (nizka priorita — jde o select)

### 25. AdminSettings.jsx — orderAutoArchiveDays (auto-archivace po X dnech)

- **Soubor:** `src/pages/admin/AdminSettings.jsx`
- **Radek:** 404
- **Pole:** `orderAutoArchiveDays` — po kolika dnech se objednavka auto-archivuje
- **Kontext:** Nastaveni systemu — automaticka archivace starych objednavek.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => update('orderAutoArchiveDays', parseInt(e.target.value, 10) || 0)}`
- **Opraveno:** [ ]

### 26. AdminSettings.jsx — itemsPerPage (polozek na stranku)

- **Soubor:** `src/pages/admin/AdminSettings.jsx`
- **Radek:** 483
- **Pole:** `itemsPerPage` — pocet radku v tabulkach
- **Kontext:** Zobrazovaci nastaveni tabulek v admin panelu. Pouziva `<select>`, bug nenastane — vsechny hodnoty jsou z presne definovaneho seznamu.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => update('itemsPerPage', parseInt(e.target.value, 10))}`
- **Opraveno:** [ ] (nizka priorita — jde o select)

### 27. AdminShipping.jsx — free_shipping_threshold (minimalni castka pro doprava zdarma)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 469
- **Pole:** `free_shipping_threshold` — minimalni hodnota objednavky pro dopravu zdarma
- **Kontext:** Shipping config — od jake castky je doprava zdarma.
- **Typ cisla:** integer (CZK)
- **Kod:** `onChange={(e) => updateConfig({ free_shipping_threshold: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 28. AdminShipping.jsx — method.price (cena dopravy)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 643
- **Pole:** `price` — zakladni cena dopravni metody v CZK
- **Kontext:** Edit dopravni metody — zakladni cena.
- **Typ cisla:** decimal (napr. 99.00 CZK)
- **Kod:** `onChange={(e) => updateMethod(selectedMethod.id, { price: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 29. AdminShipping.jsx — method.price_per_kg (cena za kilogram)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 654
- **Pole:** `price_per_kg` — cena za kazdy kilogram hmotnosti zasilky
- **Kontext:** Edit dopravni metody — variabilni slozka podle hmotnosti.
- **Typ cisla:** decimal
- **Kod:** `onChange={(e) => updateMethod(selectedMethod.id, { price_per_kg: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 30. AdminShipping.jsx — method.delivery_days_min (minimalni doba doruceni)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 669
- **Pole:** `delivery_days_min` — minimalni pocet dni doruceni
- **Kontext:** Edit dopravni metody — rozsah doby doruceni (napr. 2–4 dny).
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateMethod(selectedMethod.id, { delivery_days_min: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 31. AdminShipping.jsx — method.delivery_days_max (maximalni doba doruceni)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 679
- **Pole:** `delivery_days_max` — maximalni pocet dni doruceni
- **Kontext:** Edit dopravni metody — rozsah doby doruceni.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => updateMethod(selectedMethod.id, { delivery_days_max: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 32. AdminShipping.jsx — weight tier max_weight_g (maximalni hmotnost pro tier)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 779
- **Pole:** `max_weight_g` — maximalni hmotnost pro hmotnostni tier v gramech
- **Kontext:** Hmotnostni tabulka cen dopravy — kazdy tier ma max hmotnost a cenu.
- **Typ cisla:** integer (gramy)
- **Kod:** `onChange={(e) => updateWeightTier(idx, { max_weight_g: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 33. AdminShipping.jsx — weight tier price (cena hmotnostniho tieru)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 787
- **Pole:** `price` — cena dopravy pro hmotnostni tier
- **Kontext:** Hmotnostni tabulka cen dopravy — cena pro dany hmotnostni rozsah.
- **Typ cisla:** decimal (CZK)
- **Kod:** `onChange={(e) => updateWeightTier(idx, { price: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 34. AdminShipping.jsx — method.price_per_kg (druhy vyskyt — variabilni cena)

- **Soubor:** `src/pages/admin/AdminShipping.jsx`
- **Radek:** 807
- **Pole:** `price_per_kg` — cena za kg pro variabilni cenovani bez tieru
- **Kontext:** Alternativni sekce shipping editoru pro jednoduche variabilni cenovani.
- **Typ cisla:** decimal
- **Kod:** `onChange={(e) => updateMethod(selectedMethod.id, { price_per_kg: safeNum(e.target.value, 0) })}`
- **Opraveno:** [ ]

### 35. AdminPresets.jsx — uploadOrder (poradi presetu pri nahravani)

- **Soubor:** `src/pages/admin/AdminPresets.jsx`
- **Radek:** 991
- **Pole:** `uploadOrder` — poradi (razeni) presetu v seznamu
- **Kontext:** Upload formular pro novy preset — cislo pro razeni v seznamu.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => setUploadOrder(Number(e.target.value))}`
- **Poznamka:** `Number("")` = `0`, neni tam fallback ale primy prevod — stejny problem.
- **Opraveno:** [ ]

### 36. AdminPresets.jsx — presetDraft.order (poradi presetu v editoru)

- **Soubor:** `src/pages/admin/AdminPresets.jsx`
- **Radek:** 1117
- **Pole:** `order` — poradi presetu v editacnim dialogu
- **Kontext:** Edit dialog presetu — cislo pro razeni.
- **Typ cisla:** integer
- **Kod:** `onChange={e => updatePresetDraft('order', Number(e.target.value))}`
- **Opraveno:** [ ]

### 37. components/PresetInlineEditor.jsx — order (poradi presetu)

- **Soubor:** `src/pages/admin/components/PresetInlineEditor.jsx`
- **Radek:** 204
- **Pole:** `order` — poradi presetu (inline editor v tabulce)
- **Kontext:** Inline editace presetu primo v tabulce bez otevreni dialogu.
- **Typ cisla:** integer
- **Kod:** `onChange={e => updateField('order', Number(e.target.value))}`
- **Opraveno:** [ ]

### 38. components/WidgetEmbedTab.jsx — widthPx (sirka widgetu)

- **Soubor:** `src/pages/admin/components/WidgetEmbedTab.jsx`
- **Radek:** 476
- **Pole:** `widthPx` — sirka iframe widgetu v pixelech
- **Kontext:** Nastaveni embedu widgetu — sirka iframe. Pouziva se pri generovani embed kodu.
- **Typ cisla:** integer (px)
- **Kod:** `onChange={(e) => updateConfig('widthPx', Number(e.target.value) || 800)}`
- **Opraveno:** [ ]

### 39. components/WidgetEmbedTab.jsx — heightPx (vyska widgetu)

- **Soubor:** `src/pages/admin/components/WidgetEmbedTab.jsx`
- **Radek:** 502
- **Pole:** `heightPx` — vyska iframe widgetu v pixelech (pevna vyska)
- **Kontext:** Nastaveni embedu widgetu — pevna vyska iframe.
- **Typ cisla:** integer (px)
- **Kod:** `onChange={(e) => updateConfig('heightPx', Number(e.target.value) || 700)}`
- **Opraveno:** [ ]

### 40. components/WidgetEmbedTab.jsx — minHeight (minimalni vyska widgetu)

- **Soubor:** `src/pages/admin/components/WidgetEmbedTab.jsx`
- **Radek:** 514
- **Pole:** `minHeight` — minimalni vyska iframe widgetu v pixelech (auto-vyska rezim)
- **Kontext:** Nastaveni embedu widgetu — minimalni vyska pri auto-resize rezimu.
- **Typ cisla:** integer (px)
- **Kod:** `onChange={(e) => updateConfig('minHeight', Number(e.target.value) || 600)}`
- **Opraveno:** [ ]

### 41. components/WidgetConfigTab.jsx — borderRadius (zaobleni rohu widgetu)

- **Soubor:** `src/pages/admin/components/WidgetConfigTab.jsx`
- **Radek:** 131
- **Pole:** `borderRadius` — zaobleni rohu widgetu v px (0–32)
- **Kontext:** Widget builder — vizualni nastaveni zaobleni rohu.
- **Typ cisla:** integer (px)
- **Kod:** `const clamped = Math.max(0, Math.min(32, Number(e.target.value) || 0));`
- **Opraveno:** [ ]

### 42. builder/components/editors/NumberPropertyEditor.jsx — slider input (widget builder)

- **Soubor:** `src/pages/admin/builder/components/editors/NumberPropertyEditor.jsx`
- **Radek:** 20 (slider), 24–28 (number input)
- **Pole:** Libovolna numericka vlastnost v widget builderu (sirka, vyska, padding, font-size, atd.)
- **Kontext:** Sdilena komponenta widget builderu — pouziva se pro vsechny numericky nastavitelne vlastnosti widgetu. Slider ma `onChange(Number(e.target.value))` — slider nikdy nevrati prazdny string takze problem nenastane. Number input ma `if (!isNaN(parsed))` v `onChange` — NEAKTUALIZUJE state pokud je hodnota prazdna. Chybejici aktualizace zpusobi ze zobrazovana hodnota "zamrzne" a uzivatel nemuze editovat.
- **Typ cisla:** integer nebo decimal podle property
- **Kod slider:** `onChange(Number(e.target.value))` (slider — bezpecne)
- **Kod number input:** `if (!isNaN(parsed)) { onChange(clamped); }` — pri prazdnem stringu se nic nestane, zobrazena hodnota zamrzne
- **Opraveno:** [ ]

### 43. builder/components/tabs/GlobalTab.jsx — slider (widget builder global settings)

- **Soubor:** `src/pages/admin/builder/components/tabs/GlobalTab.jsx`
- **Radek:** 66
- **Pole:** Globalni nastaveni widgetu (border-radius, padding, atd.)
- **Kontext:** Global tab ve widget builderu — slider pro globalni numericky vlastnosti. Pouziva `<input type="range">`, slider nikdy nevrati prazdny string, bug nenastane.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => onChange(parseInt(e.target.value, 10))}`
- **Opraveno:** [ ] (nizka priorita — jde o slider range, ne text input)

### 44. test-kalkulacka/components/PrintConfiguration.jsx — infill (vypln tisku)

- **Soubor:** `src/pages/test-kalkulacka/components/PrintConfiguration.jsx`
- **Radek:** 1125
- **Pole:** `infill` — procento vypln tisku (10–100)
- **Kontext:** Kalkulacka — slider pro nastaveni vypne tisku. Pouziva `<input type="range">`, slider nikdy nevrati prazdny string, bug nenastane.
- **Typ cisla:** integer (%)
- **Kod:** `onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}`
- **Opraveno:** [ ] (nizka priorita — jde o slider range)

### 45. test-kalkulacka-white/components/PrintConfiguration.jsx — infill (slider)

- **Soubor:** `src/pages/test-kalkulacka-white/components/PrintConfiguration.jsx`
- **Radek:** 460
- **Pole:** `infill` — procento vypln tisku
- **Kontext:** Alternativni bily skin kalkulacky — slider. Viz polozka 44.
- **Typ cisla:** integer (%)
- **Kod:** `onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}`
- **Opraveno:** [ ] (nizka priorita — jde o slider range)

### 46. test-kalkulacka-white/components/PrintConfiguration.jsx — quantity (pocet kusu)

- **Soubor:** `src/pages/test-kalkulacka-white/components/PrintConfiguration.jsx`
- **Radek:** 493
- **Pole:** `quantity` — pocet kusu k tisku
- **Kontext:** Kalkulacka (bily skin) — zadani poctu kusu. Toto je text/number input, bug nastane — uzivatel nema sanci zadat napr. `25` (jakmile smaze `2`, zobrazuje `1`).
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => handleConfigChange('quantity', parseInt(e?.target?.value) || 1)}`
- **Opraveno:** [ ]

### 47. widget-kalkulacka/components/PrintConfiguration.jsx — infill (slider)

- **Soubor:** `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx`
- **Radek:** 487
- **Pole:** `infill` — procento vypln tisku
- **Kontext:** Widget verze kalkulacky — slider. Viz polozka 44.
- **Typ cisla:** integer (%)
- **Kod:** `onChange={(e) => handleConfigChange('infill', parseInt(e?.target?.value))}`
- **Opraveno:** [ ] (nizka priorita — jde o slider range)

### 48. widget-kalkulacka/components/PrintConfiguration.jsx — quantity (pocet kusu)

- **Soubor:** `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx`
- **Radek:** 530
- **Pole:** `quantity` — pocet kusu k tisku
- **Kontext:** Widget verze kalkulacky — zadani poctu kusu. Text/number input, bug nastane stejne jako u polozky 46.
- **Typ cisla:** integer
- **Kod:** `onChange={(e) => handleConfigChange('quantity', parseInt(e?.target?.value) || 1)}`
- **Opraveno:** [ ]

---

## Souhrnna tabulka podle priority

| # | Soubor | Pole | Typ | Priorita | Duvod priority |
|---|--------|------|-----|----------|----------------|
| 1 | AdminPricing.jsx (StepInput) | vsechny cenove inputy | decimal | **P0** | Kazdy cenovy input v pricing editoru — jadro produktu |
| 4 | AdminFees.jsx | fee value | decimal | **P0** | Hlavni hodnota fee, muze byt zaporna |
| 5 | AdminFees.jsx | condition value | decimal | **P0** | Podminka fee — klicova pro business logiku |
| 19 | AdminExpress.jsx | delivery_days | integer | **P1** | Express tier nastaveni |
| 20 | AdminExpress.jsx | surcharge_value | decimal | **P1** | Express prirazka — cenova data |
| 21 | AdminExpress.jsx | min_order_value | integer | **P1** | Express podminka |
| 27–34 | AdminShipping.jsx | vsechna pole | decimal/integer | **P1** | Ceny a casove udaje dopravy |
| 12–18 | AdminCoupons.jsx | vsechna pole | integer/decimal | **P1** | Kuponove nastaveni |
| 22 | AdminEmails.jsx | smtp_port | integer | **P1** | SMTP konfigurace |
| 23 | AdminPayments.jsx | next_value | integer | **P1** | Cislovani faktur |
| 25 | AdminSettings.jsx | orderAutoArchiveDays | integer | **P1** | Systemove nastaveni |
| 38–40 | WidgetEmbedTab.jsx | widthPx/heightPx/minHeight | integer | **P1** | Widget embed rozmery |
| 41 | WidgetConfigTab.jsx | borderRadius | integer | **P2** | Widget vizualni nastaveni |
| 35–36 | AdminPresets.jsx | order | integer | **P2** | Poradi presetu |
| 37 | PresetInlineEditor.jsx | order | integer | **P2** | Poradi presetu |
| 42 | NumberPropertyEditor.jsx | number input | integer/decimal | **P2** | Widget builder — number input zamrzne |
| 46 | test-kalkulacka-white | quantity | integer | **P2** | Kalkulacka — pocet kusu |
| 48 | widget-kalkulacka | quantity | integer | **P2** | Widget — pocet kusu |
| 6–11 | AdminFees.jsx (simulator) | sim.* pole | decimal/integer | **P3** | Simulator — neni kriticke, pouze UX |
| 2, 3 | AdminPricing.jsx | select pole | integer | **P3** | Select, bug nenastane |
| 13 | AdminPayments.jsx | due_days select | integer | **P3** | Select, bug nenastane |
| 26 | AdminSettings.jsx | itemsPerPage select | integer | **P3** | Select, bug nenastane |
| 43–45, 47 | slidery range | infill slidery | integer | **P3** | Range slider, bug nenastane |

---

## Poznamky k implementaci opravy

**Nejucinnejsi reseni** pro admin inputy: vytvorit sdilenou `useNumericInput(initialValue, onChange, options)` hook ktera:
1. Drzi lokalni string state
2. V `onChange` jen aktualizuje string state
3. V `onBlur` konvertuje na cislo a vola externi `onChange`
4. Pri neplatnem vstupu obnovi posledni platnou hodnotu

**Alternativa pro jednoduche pripady** (integer bez desetinnych mist): pouzit `type="number"` s `onBlur` handlerem misto `onChange`.

**Vyjimky kde bug nenastane** (lze opravit nizkou prioritou nebo vynechat):
- `<select>` elementy — select vzdy vraci hodnotu ze seznamu, nikdy prazdny string
- `<input type="range">` (slidery) — range slider vzdy vraci cislo v rozsahu min/max

---

*Audit vytvoreno: 2026-03-18*
*Celkem nalezenych mist: 48 (z toho ~35 skutecnych bugu, ~13 false positives — select/slider)*

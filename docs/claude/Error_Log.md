# Error Log — ModelPricer / Pricer V3

> Dokumentace chyb, erroru, pasti a oprav. Kazdy zaznam obsahuje co se stalo,
> proc, jak se to opravilo a co si z toho vzit do budoucna.

---

## Format zaznamu

```
### [DATUM] [KATEGORIE] Kratky popis
- **Kde:** soubor:radek
- **Symptom:** Co se deje spatne
- **Pricina:** Proc se to deje
- **Oprava:** Co jsem udelal
- **Pouceni:** Co si z toho vzit
```

**Kategorie:** `[BUG]` `[REGRESSION]` `[CSS]` `[STATE]` `[ERROR-HANDLING]` `[PERFORMANCE]` `[BUILD]` `[CONFIG]`

---

## Zaznamy

### [2026-02-07] [CSS] Rozlozeni ceny preteka mimo kontejner — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/components/PricingCalculator.jsx:188-215`
- **Symptom:** Cenovy breakdown (Material, Cas tisku, Sluzby...) je polovicne mimo okno karty
- **Pricina:** Flex layout `flex items-start justify-between gap-4` s `min-w-[200px]` na pravem sloupci. V uzke karte (pravy sloupec 3-col gridu) nebylo dost mista a obsah pretekal.
- **Oprava:** Zmeneno na vertikalni layout `flex flex-col gap-3`. Odstranen `min-w-[200px]`. Celkem nahore, breakdown dole — vejde se do libovolne sirky karty.
- **Pouceni:** V pravem panelu (lg:col-span-1) nepouzivat `min-w` na deti — sirka je omezena. Preferovat vertikalni stacking.

### [2026-02-07] [STATE] Data modelu se resetuji pri prepnuti mezi modely — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx:163-170` (`handleConfigChange`)
- **Symptom:** Po "Spocitat vse" se data slicnou, ale pri prepnuti na druhy model se resetuji a musi se znovu individualne pocitat.
- **Pricina:** `PrintConfiguration` ma `key={selectedFile.id}` prop → pri prepnuti modelu se REMOUNTUJE. Uvnitr PrintConfiguration bezi useEffect (radek 106-140) ktery validuje material/color. Pokud je `config.color` null, nastavi `changed = true` a vola `onConfigChange(next)`. Parent `handleConfigChange` VZDY resetoval `status: 'pending', result: null, error: null` — i kdyz se config ve skutecnosti nezmenil.
- **Oprava:** V `handleConfigChange` pridam porovnani novych a starych meaningful keys (material, quality, infill, supports). Reset slice results se provede JEN kdyz se tyto klice skutecne zmenily. Zmena barvy nebo quantity neresetuje slice.
- **Pouceni:** Kdyz pouzivam `key` prop pro remount, musim pocitat s tim ze vsechny useEffecty v child komponente se znovu spusti. `onConfigChange` by mel porovnavat pred resetem. **Vzor: config change handler = compare-before-reset.**

### [2026-02-07] [ERROR-HANDLING] Chybejici error handling pro neplatne 3D modely — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx` (handleSliceSelected, runBatchSlice)
- **Symptom:** AI-generovane modely a modely s chybami (malo sten, non-manifold, spatna orientace) padaji s technickou hlaskou typu "Backend error (500): PrusaSlicer returned non-zero exit code."
- **Pricina:** Frontend jen propagoval raw error string bez parsovani. Backend vraci `stderr` z PrusaSliceru, ktery obsahuje uzitecne info ale neni user-friendly.
- **Oprava:** Vytvoreno `src/utils/slicerErrorClassifier.js` s 12 error pattern kategorii (MESH_NON_MANIFOLD, MESH_ZERO_VOLUME, MESH_TOO_SMALL, MESH_TOO_LARGE, MESH_SELF_INTERSECTING, MESH_INVERTED_NORMALS, FILE_CORRUPT, FILE_UNSUPPORTED, CONFIG_MISSING, SLICER_NOT_FOUND, TIMEOUT, NETWORK_ERROR). Kazda kategorie ma severity (error/warning) a user-friendly CZ+EN hlasku. Integrovano do handleSliceSelected a runBatchSlice. Error se uklada s `errorCategory`, `errorSeverity`, `errorRaw` fieldy.
- **Pouceni:** Vzdy parsovat backend error zpravy na FE a mapovat na user-friendly hlasky. Raw error zachovat pro debugging.

### [2026-02-07] [UX] Cena se nezobrazuje prubezne per-model — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/components/PricingCalculator.jsx:84-101`
- **Symptom:** Cena se zobrazi az po spocteni VSECH modelu, ne prubezne per-model.
- **Pricina:** Radek 87: `if (incompleteModels.length > 0) return { quote: null, error: null }` — blokoval celou kalkulaci dokud nebyly vsechny modely hotove.
- **Oprava:** Zmeneno na pocitani ceny z `readyModels` (pouze completed). Pokud existuji incomplete modely, zobrazi se "Prubezna cena (X z Y)" s sedy text a info o zbyvajicich modelech. Quote state ma novy `isPartial` flag.
- **Pouceni:** Pro multi-model scenare vzdy ukazovat prubezny stav, ne cekat na vsechno. Zakaznik potrebuje vidiet cenu IHNED.

### [2026-02-07] [UX] Tlacitka pro vypocet na spatnem miste a spatny styl — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx:586-624` (puvodni umisteni)
- **Symptom:** Tlacitka "Spocitat cenu / Spocitat vse / Reslice failed" byla velka, na boku stranky (v pravem sloupci nad 3D viewerem), mimo stepper.
- **Pricina:** Design rozhodnuti z drive — tyhle CTA tlacitka nemely stepper-level umisteni.
- **Oprava:** Presunuto do stepper radku (vedle progress baru Nahrani souboru -> Konfigurace -> Kontrola a cena). Zmenseno na `size="compact"` (~35% mensi). Pridan progress bar pro batch slicing (vizualni bar s X/Y countem). U modelu v seznamu pridan per-model progress indikator (pulzujici bar + "Vypocitavam..." text) a cas v minutach pro hotove modely.
- **Pouceni:** CTA tlacitka patri vizualne k workflow stepperu, ne oddelene na strane. Kompaktnejsi tlacitka = cistejsi UI.
# Error Log — FORGE Redesign (2026-02-09)

## Issues Found & Fixed

### 1. Garbled text on Home page feature cards
- **Location:** `src/pages/home/index.jsx` lines 244, 260, 275
- **Problem:** Feature card descriptions contained nonsensical AI-generated text:
  - Card 01: "Volume-based calculations to aviation 3D-printing and volume its own hanovation..."
  - Card 02: "Printing require models to upload models invvasanute eatoms in 3D-printing carriers."
  - Card 03: "Spool 3D-printing themed SVG filament enquires 3D-printing filament."
- **Fix:** Replaced with proper CZ/EN translated text via LanguageContext keys `home.forge.feature1/2/3`

### 2. Placeholder pricing plan features
- **Location:** `src/pages/home/index.jsx` lines 27-62
- **Problem:** All plan features showed "IBM Plex Sans 14px" (font spec used as placeholder)
- **Fix:** Replaced with real features via translation keys (1 widget, 100 calcs/mo, etc.)

### 3. Footer links were plain text, not navigable
- **Location:** `src/pages/home/index.jsx` lines 470-483
- **Problem:** Footer items ['UPPERCASE', 'PRICING', 'SUPPORT'] were `<span>` elements with no routing
- **Fix:** Changed to `<Link>` components with proper routes (/, /pricing, /support)

### 4. Design system inconsistency (3 themes across 3 pages)
- **Problem:**
  - Home: Forge dark theme (correct)
  - Pricing: shadcn/ui light theme (Container, Button, TooltipProvider, PricingPlanCard, etc.)
  - Support: Custom purple gradient with inline `<style>` CSS
- **Fix:** Rewrote both Pricing and Support pages to use Forge dark theme with shared components

### 5. Support page used inline CSS block
- **Location:** `src/pages/support/index.jsx` lines 239-442
- **Problem:** ~200 lines of `<style>{...}</style>` inline CSS with purple gradient (#667eea, #764ba2)
- **Fix:** Removed all inline CSS, using Forge CSS variables and Tailwind classes

## Build Status
- `npm run build` — PASS (0 errors)
- Chunk size warning (pre-existing) — index-*.js > 4MB


---

## Caste chyby (vzory)

### Windows cesty s diakritikou
- **Popis:** Cesty s `Kuňákovi` mohou zpusobit problemy v nekterych nastrojich
- **Reseni:** Pouzivat forward slashes, escapovat spravne

### Background agenti a acceptEdits mod
- **Popis:** Background Task agenti nemohou psat soubory v acceptEdits modu
- **Reseni:** Psat primo pomoci Write/Edit toolu, ne delegovat na background agenty

### React key prop zpusobuje reset stavu child komponent
- **Popis:** Pouziti `key={dynamicId}` na komponente zpusobi plny remount pri zmene klice. Vsechny useEffecty v child se znovu spusti a mohou triggerovat callbacks (napr. onConfigChange) ktere neocekavane resetuji parent state.
- **Reseni:** V parent callback handlerech porovnavat stary a novy stav pred destruktivni akci (napr. reset slice results).

### min-w v responsivnich grid kontejnerech
- **Popis:** `min-w-[Xpx]` na child elementu v uzkem grid sloupci (lg:col-span-1) zpusobi overflow.
- **Reseni:** Nepouzivat `min-w` v pravem panelu. Pouzit vertikalni stacking nebo `w-full`.

---

## Statistiky

| Kategorie | Pocet | Opraveno |
|-----------|-------|----------|
| CSS | 1 | 1 |
| STATE | 1 | 1 |
| ERROR-HANDLING | 1 | 1 |
| UX | 2 | 2 |
| BUILD | 0 | 0 |
| REGRESSION | 0 | 0 |

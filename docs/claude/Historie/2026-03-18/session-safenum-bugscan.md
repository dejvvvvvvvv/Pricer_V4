# Session 2026-03-18 — SafeNum Bug Fix + Project Bug Scans

## Prehled
Oprava safeNum input bugu (nelze smazat hodnotu v numerickych polich) + 6 pruzkumu projektu (183 nalezu), ~50 opraveno.

---

## SafeNum Bug Fix
- **Pricina:** `safeNum("", 0)` vraci 0 protoze `Number("") === 0`
- **Reseni:** Nove helpery `parseDecimal`, `finalizeDecimal`, `parseIntInput` v `src/utils/formatters.js`
- **Vzor:** `type="text" inputMode="decimal"` + onChange=parseDecimal + onBlur=finalizeDecimal
- **Opraveno v AdminPricing.jsx:** price_per_gram, density, teploty, rychlosti, barvy

### Batch 1 oprav (4 soubory):
- AdminFees.jsx — fee value, podminky, sim inputs
- AdminShipping.jsx — ceny, doby doruceni, weight tiery
- AdminCoupons.jsx — hodnoty, min objednavka, max pouziti + createId fallback
- AdminEmails.jsx — smtp_port

### Batch 2 oprav (8 souboru):
- AdminPayments.jsx — next_value
- AdminSettings.jsx — orderAutoArchiveDays
- AdminPresets.jsx + PresetInlineEditor.jsx — order
- WidgetEmbedTab.jsx — widthPx, heightPx, minHeight
- NumberPropertyEditor.jsx — number input
- AdminExpress.jsx — delivery_days, surcharge, min_order
- widget-kalkulacka PrintConfiguration.jsx — quantity

### DRY refaktoring:
- parseDecimal/finalizeDecimal/parseIntInput extrahovany do `src/utils/formatters.js`
- Odstraneny lokalni kopie z 12 souboru (AdminFees, AdminExpress, AdminEmails, AdminCoupons, AdminShipping, AdminSettings, AdminPresets, AdminPayments, WidgetEmbedTab, PresetInlineEditor, PrintConfiguration, NumberPropertyEditor)

---

## Bug Scan #1 (12 nalezu) — VSECHNY P0+P1 OPRAVENY
- 2x P0: Broken Analytics route (zakomentovan), createId fallback
- 7x P1: Kc→Kc diakritika, widget texty, sidebar linky, loading state (ForgeSkeleton)
- 3x P2: neopraveno (nizka priorita)

## Bug Scan #2A — Admin stranky (23 nalezu) — VSECHNY P1 OPRAVENY
- 5x P1: createStableId fallback, AdminIntegrations kontrast, Analytics i18n, ModelStorage deps, Customers label
- 18x P2: neopraveno

## Bug Scan #2B — Komponenty + verejne stranky (28 nalezu) — P0+6xP1 OPRAVENY
- 3x P0: Select dark theme (Forge vars), ForgeDialog scroll lock (ref), LoginForm nested form (div)
- 6x P1 opraveno: Header i18n+navigate, Select nested button, ForgeToast timer, home marquee key, model-upload useMemo→useEffect
- 5x P1 neopraveno: ForgeInput htmlFor, ForgeDialog aria, ForgeButton disabled, mailto, PwaInstallBanner
- 14x P2: neopraveno

## Bug Scan #2C — Kalkulacky + Backend (19 nalezu) — 5xP1 OPRAVENY
- 3x P0 neopraveno: Widget auto-recalc, widget i18n, /api/slice auth (vyzaduje rozhodnuti)
- 5x P1 opraveno: orderUpload 250→100MB, PATCH orders status, analytics currency, formatCzk Kc, loadPresets deps
- 4x P1 neopraveno
- 7x P2: neopraveno

## Bug Scan #2D — Hooks/Utils/Lib (19 nalezu) — 5xP1 OPRAVENY
- 5x P1 opraveno: LanguageContext try/catch, useAdminShortcuts module-level, appendTenantLog spread, formatters.js round2, exportData appendChild
- 3x P1 neopraveno: useThemeToggle localStorage, useStorageQuery cache tenant, safeNum duplikaty
- 11x P2: neopraveno

## Bug Scan #2E — CSS/Styly (20 nalezu) — VSECHNY P0 OPRAVENY
- 3x P0 opraveno: --forge-accent-teal→primary, --forge-text-disabled→muted (6 mist), invoice close button kontrast
- 10x P1: neopraveno (light theme kontrast, duplikatni CSS, z-index, hardcoded barvy)
- 7x P2: neopraveno

## Bug Scan #2F — Routing/Config (13 nalezu) — P0+2xP1 OPRAVENY
- 2x P0 opraveno: SlicerPage zakomentovan, WidgetPublicPage placeholder vytvoren
- 2x P1 opraveno: .env.example VITE_APP_URL, vite.config port cislo, sourcemap odstranen
- 3x P1 neopraveno: react-router-dom upgrade, COEP/COOP, Supabase dual client
- 6x P2: neopraveno (nepouzivane deps)

## Bug Scan #3 — Vylepseni (16 prilezitosti)
- P1 #1 implementovano: DRY parseDecimal (12 souboru)
- Zbyvajicich 5x P1: safeNum sjednoceni, ConfirmModal→ForgeConfirmDialog, getSlicerTimeMin, createStableId, FileListPanel innerHTML
- 6x P2 + 4x P3: neopraveno

## Bug Scan #4 — Kalkulacky Deep (22 nalezu)
- 3x P0 neopraveno: Icon import nekonzistence, widget defaultPreset, widget auto-recalc
- 11x P1 neopraveno: widget i18n, fiktivni progress, dead button(opraven), status vzdy Hotovo, checkout responsive...
- 8x P2: neopraveno

## Bug Scan #5 — Security (11 nalezu)
- 1x P0 neopraveno: backend-local/.env mozna v gitu (Supabase secret key!)
- 6x P1 neopraveno: document.write XSS, presets auth, slicer 250MB, postMessage, custom sanitizer
- 4x P2: neopraveno

---

## Dalsi jednotlive opravy provedene behem session
- AdminOrderDetail hardcoded 'cs' → language z useLanguage
- AdminOrders refreshTags/refreshViews → useCallback
- FileListPanel innerHTML → DOM API (createElement misto innerHTML)
- Widget FileUploadZone dead MoreHorizontal button odstranen
- PwaInstallBanner --forge-accent-teal → --forge-accent-primary

---

## Celkove statistiky
- **183 nalezu celkem:** 17 P0, 78 P1, 88 P2
- **~50 opraveno** (vsechny bezpecne P0 + vetsina P1)
- **Build PASS** po kazde oprave
- **9 dokumentu vytvoreno** v docs/claude/Documentation/

## Dokumenty vytvorene
- `docs/claude/Documentation/SafeNum-Input-Bug-Audit.md`
- `docs/claude/Documentation/Project-Bug-Scan-1.md`
- `docs/claude/Documentation/Project-Bug-Scan-2A-Admin.md`
- `docs/claude/Documentation/Project-Bug-Scan-2B-Components.md`
- `docs/claude/Documentation/Project-Bug-Scan-2C-Kalkulacka-Backend.md`
- `docs/claude/Documentation/Project-Bug-Scan-2D-Hooks-Utils-Lib.md`
- `docs/claude/Documentation/Project-Bug-Scan-2E-CSS-Styles.md`
- `docs/claude/Documentation/Project-Bug-Scan-2F-Routing-Config.md`
- `docs/claude/Documentation/Project-Bug-Scan-4-Kalkulacka-Deep.md`
- `docs/claude/Documentation/Project-Improvements-Scan-3.md`

## Neopravene veci vyzadujici rozhodnuti
1. **P0 Security:** `backend-local/.env` — git rm --cached + revokace Supabase klice
2. **P0 Widget:** auto-recalc, defaultPreset, i18n (~15 textu)
3. **P1 Architektura:** react-router-dom 6.0.2 upgrade, DOMPurify, document.write XSS
4. **P1 DRY:** safeNum (11 kopii), ConfirmModal (3x), getSlicerTimeMin (3x)
5. **P2:** ~88 kosmetickych nalezu (viz jednotlive scan dokumenty)

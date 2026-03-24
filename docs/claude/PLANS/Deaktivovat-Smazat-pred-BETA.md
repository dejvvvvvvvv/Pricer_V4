# Deaktivovat / Smazat před BETA

**Datum vytvoření:** 2026-03-20
**Účel:** Seznam funkcí, stránek a nastavení které se musí skrýt, deaktivovat nebo smazat před spuštěním BETA verze pro firmy. Tyto věci jsou užitečné během vývoje, ale nesmí být viditelné/přístupné pro firemní zákazníky.

---

## P0 — MUSÍ se skrýt/smazat (blokuje BETA launch)

### 1. Admin Settings — Úložiště dat (Storage Mode)
- **Soubor:** `src/pages/admin/AdminSettings.jsx` (řádky ~566–762)
- **Co to dělá:** Dropdown pro přepínání localStorage / dual-write / Supabase
- **Proč skrýt:** Infrastrukturní nastavení. Firmy nesmí vědět o interní storage strategii ani ji měnit.
- **Akce:** Skrýt celou sekci "Úložiště dat" — obalit `if (isDev)` nebo feature flag

### 2. Admin Settings — Factory Reset (Tovární reset)
- **Soubor:** `src/pages/admin/AdminSettings.jsx` (řádky ~807–831)
- **Co to dělá:** Smaže VŠECHNA data tenanta — kompletní reset
- **Proč skrýt:** Katastrofální v produkci. Firma by si omylem smazala všechno.
- **Akce:** Skrýt tlačítko nebo ho dát za owner-only přístup

### 3. Admin System Health — celá stránka
- **Soubor:** `src/pages/admin/AdminSystemHealth.jsx`
- **Route:** `/admin/system`
- **Co to dělá:** API health, paměť serveru, localStorage analytics, feature flags toggles, config backup/restore
- **Proč skrýt:** Technické interní informace. Firmy nemohou opravit "backend down" ani by neměly vidět server memory.
- **Akce:** Skrýt route z navigace + přidat route guard (owner-only)

### 4. Admin System Health — Feature Flags toggles
- **Soubor:** `src/pages/admin/AdminSystemHealth.jsx` (řádky ~61–67)
- **Co to dělá:** Toggle pro `betaFeatures`, `debugMode`, `maintenanceMode`, `advancedAnalytics`
- **Proč skrýt:** Interní řízení. Debug mode by mohl vystavit citlivé informace.
- **Akce:** Skrýt sekci feature flags

### 5. Admin Migration — celá stránka
- **Soubor:** `src/pages/admin/AdminMigration.jsx`
- **Route:** `/admin/migration`
- **Co to dělá:** Migrace dat localStorage → Supabase, dry-run, backup, rollback
- **Proč skrýt:** Developer workflow. Firmy nemají co migrovat.
- **Akce:** Odstranit route z navigace + Routes.jsx

### 6. Demo Tenant hardcoded email
- **Soubor:** `src/providers/FirebaseAuthProvider.jsx`
- **Co to dělá:** Mapuje `david-kunak@seznam.cz` → `demo-tenant`
- **Proč smazat:** Bezpečnostní riziko. Osobní email v produkčním kódu.
- **Akce:** Smazat `DEMO_TENANT_EMAILS` konstantu, nahradit dynamickým tenant lookup

### 7. Admin Dashboard — Setup Progress widget
- **Soubor:** `src/pages/admin/AdminDashboard.jsx` (řádky ~112–201)
- **Co to dělá:** Ukazuje stav konfigurace služeb (Storage, DB, Email, Stripe, Sentry)
- **Proč skrýt:** Ukazuje firmy nekonfigurované interní služby. Firma nepotřebuje vědět o Sentry.
- **Akce:** Skrýt nebo nahradit zjednodušeným onboarding checklist pro firmy

### 8. Widget Builder — vizualni editor ✅ PROVEDENO 2026-03-21
- **Stav:** DEAKTIVOVANO + SMAZANO (zalohovano uzivatelem pred smazanim)
- **Co to delalo:** VvvebJs-inspired vizualni drag-and-drop editor pro kastomizaci widgetu kalkulacky
- **Proc smazano:** Pouze ~20% funkci fungovalo spravne. Prilis brzy pro BETA. Bude se dodelavat separatne.
- **DULEZITE:** AdminWidget.jsx (sprava widgetu, embed kody, domeny) ZUSTAVA plne funkcni!

#### Co bylo SMAZANO (uzivatel ma zalohu):
  ```
  src/pages/admin/AdminWidgetBuilder.jsx        (smazano — router wrapper)
  src/pages/admin/builder/                       (smazano — cela slozka, 69 souboru)
  ```

#### Co bylo ZAKOMENTOVANO (hledej `WIDGET_BUILDER_DEACTIVATED` v kodu):

  **1. `src/Routes.jsx` — radek 42 (lazy import)**
  ```javascript
  /* WIDGET_BUILDER_DEACTIVATED: vizualni builder deaktivovan pro BETA, zalohovano 2026-03-21
  const AdminWidgetBuilder = React.lazy(() => import('./pages/admin/AdminWidgetBuilder'));
  */
  ```

  **2. `src/Routes.jsx` — radky 105-114 (route definice)**
  ```javascript
  {/* WIDGET_BUILDER_DEACTIVATED: vizualni builder deaktivovan pro BETA, zalohovano 2026-03-21
  <Route element={<PrivateRoute />}>
    <Route path="/admin/widget/builder/:id" element={...} />
  </Route>
  */}
  ```

  **3. `src/pages/admin/AdminWidget.jsx` — radky ~644-655 (Builder ikona v widget karte)**
  ```javascript
  {/* WIDGET_BUILDER_DEACTIVATED: ... <button title="Open Builder" onClick={...}>
    <Palette size={16} /> </button> */}
  ```

  **4. `src/pages/admin/AdminWidget.jsx` — radek ~819 (onNavigateBuilder prop)**
  ```javascript
  /* WIDGET_BUILDER_DEACTIVATED: onNavigateBuilder={(id) => navigate(`/admin/widget/builder/${id}`)} */
  ```

  **5. `src/pages/admin/components/WidgetSettingsTab.jsx` — radky 16-23 (prop destrukce)**
  ```javascript
  /* WIDGET_BUILDER_DEACTIVATED: onNavigateBuilder, */
  ```

  **6. `src/pages/admin/components/WidgetSettingsTab.jsx` — radky 64-81 (Builder CTA sekce)**
  ```javascript
  {/* WIDGET_BUILDER_DEACTIVATED: ... Vizualni editor sekce s tlacitkem "Otevrit Builder" */}
  ```

#### Co ZUSTALO nezmeneno (neskodne, builderMode props se nepouzivaji):
  - `src/pages/widget-kalkulacka/index.jsx` — `builderMode` prop (default false)
  - `src/pages/widget-kalkulacka/components/WidgetHeader.jsx` — `builderMode` prop
  - `src/pages/widget-kalkulacka/components/WidgetFooter.jsx` — `builderMode` prop
  - `src/pages/widget-kalkulacka/components/WidgetStepper.jsx` — `builderMode` prop
  - `src/pages/widget-kalkulacka/components/ModelViewer.jsx` — `builderMode` prop
  - `src/contexts/LanguageContext.jsx` — ~100 i18n klicu (neskodne, nepouzivane)

#### Jak reaktivovat v budoucnu:
  1. Obnovit `src/pages/admin/builder/` ze zalohy
  2. Obnovit `src/pages/admin/AdminWidgetBuilder.jsx` ze zalohy
  3. Odkomentovat vsechna mista oznacena `WIDGET_BUILDER_DEACTIVATED` (6 mist, viz vyse)
  4. `npm run build` — overit
  5. Hledani v kodu: `grep -r "WIDGET_BUILDER_DEACTIVATED" src/`

#### Dokumentace (zachovana, informativni):
  ```
  docs/claude/Documentation/Widget-Builder-Dokumentace.md
  docs/claude/Documentation/Widget-Builder-Audit-Funkci.md
  ```

#### Build overeni: `npm run build` — PASS (0 errors) po deaktivaci

---

## P1 — Mělo by se skrýt (důležité ale neblokuje launch)

### 9. Admin Settings — Clear Orders (Smazat objednávky)
- **Soubor:** `src/pages/admin/AdminSettings.jsx` (řádky ~772–787)
- **Co to dělá:** Smaže všechny objednávky bez archivu
- **Proč skrýt:** Destruktivní akce bez undo. V produkci by mělo být jen archivování.
- **Akce:** Skrýt nebo přidat extra potvrzení + audit log

### 10. Admin Settings — Reset Pricing (Reset ceníku)
- **Soubor:** `src/pages/admin/AdminSettings.jsx` (řádky ~790–804)
- **Co to dělá:** Resetuje všechny ceny na výchozí hodnoty
- **Proč skrýt:** Firma by si omylem resetovala ceník.
- **Akce:** Skrýt nebo dát za potvrzovací dialog s heslem

### 11. Admin Activity Log — celá stránka
- **Soubor:** `src/pages/admin/AdminActivityLog.jsx`
- **Route:** `/admin/activity`
- **Co to dělá:** Kompletní log všech akcí, export CSV/JSON
- **Proč skrýt:** Obsahuje interní operační data. Mohlo by být užitečné ale potřebuje filtrování.
- **Akce:** Skrýt z navigace NEBO filtrovat jen relevantní akce pro firmu

### 12. Admin Webhooks — celá stránka
- **Soubor:** `src/pages/admin/AdminWebhooks.jsx`
- **Route:** `/admin/webhooks`
- **Co to dělá:** Webhook konfigurace a testování
- **Proč skrýt:** Není připravené pro produkci. Obsahuje example kód.
- **Akce:** Skrýt route dokud není feature hotová

### 13. DEV badge v headeru
- **Soubor:** `src/pages/admin/AdminLayout.jsx` (řádky ~185–186)
- **Co to dělá:** Zobrazuje "DEV" nebo "PROD" badge v admin headeru
- **Proč skrýt:** Firmy nemusí vědět v jakém prostředí běží.
- **Akce:** Skrýt badge — `if (isDev)` podmínka

### 14. Admin Dashboard — Data Import Wizard
- **Soubor:** `src/pages/admin/AdminDashboard.jsx`
- **Co to dělá:** Bulk import testovacích/demo dat (objednávky, ceník, presety)
- **Proč skrýt:** Mohl by poškodit produkční data. Určeno jen pro interní testování.
- **Akce:** Skrýt komponentu v BETA

### 15. Admin System Health — localStorage analytics
- **Soubor:** `src/pages/admin/AdminSystemHealth.jsx` (řádky ~40–58)
- **Co to dělá:** Inspekce raw localStorage namespaces
- **Proč skrýt:** Debug nástroj. Firmy nemusí vidět interní storage strukturu.
- **Akce:** Skrýt sekci

---

## P2 — Zvážit (nice to have ale ne kritické)

### 16. Config Backup/Restore
- **Soubor:** `AdminSystemHealth.jsx`
- **Co to dělá:** Export/import celé konfigurace
- **Proč zvážit:** Užitečné pro firmy (záloha nastavení) ale rizikovné (restore špatné konfigurace).
- **Akce:** Ponechat jen Export, skrýt Import/Restore

### 17. Command Palette (Ctrl+K)
- **Soubor:** `src/pages/admin/components/CommandPalette.jsx`
- **Co to dělá:** Globální vyhledávání a navigace
- **Proč zvážit:** Užitečné ale mohlo by zobrazovat dev-only stránky v výsledcích.
- **Akce:** Filtrovat výsledky — nezobrazovat skryté stránky (System Health, Migration, atd.)

### 18. Keyboard Shortcuts overlay
- **Soubor:** `src/hooks/useAdminShortcuts.js`
- **Co to dělá:** Klávesové zkratky pro navigaci
- **Proč zvážit:** Užitečné, ale shortcuty nesmí navigovat na skryté stránky.
- **Akce:** Aktualizovat shortcuty aby odpovídaly viditelným stránkám

### 19. Onboarding Wizard
- **Soubor:** `AdminDashboard.jsx`
- **Co to dělá:** Průvodce prvním nastavením
- **Proč zvážit:** Dobrý pro UX, ale kroky musí odpovídat BETA funkčnosti (ne dev kroky).
- **Akce:** Aktualizovat kroky pro BETA kontext

---

## Jak implementovat skrývání

### Doporučený přístup — Feature flag / env var:

```jsx
// Způsob 1: isDev check (produkční build automaticky skryje)
const isDev = import.meta.env.DEV;

{isDev && <StorageModeSection />}
{isDev && <FactoryResetButton />}

// Způsob 2: BETA mode env var (explicitní kontrola)
const isBeta = import.meta.env.VITE_BETA_MODE === 'true';

{!isBeta && <SystemHealthLink />}

// Způsob 3: Role-based (owner vs tenant admin)
const { user } = useAuth();
const isOwner = user?.role === 'owner';

{isOwner && <FactoryResetButton />}
```

### Doporučení:
- **P0 položky:** Implementovat jako `isDev` check — v production buildu se vůbec nevyrenderují
- **P1 položky:** Implementovat jako `VITE_BETA_MODE` — můžeme je postupně zapínat
- **P2 položky:** Řešit po BETA launchi

---

## Poznámky

- Tento seznam se bude průběžně aktualizovat
- Před každým BETA deployem zkontrolovat všechny P0 položky
- Po BETA fázi některé funkce odemknout (Activity Log, Webhooks, Config Backup)

---

*Poslední aktualizace: 2026-03-21 — polozka #8 Widget Builder PROVEDENA (deaktivovano + smazano, zakomentovano 6 mist, build PASS)*

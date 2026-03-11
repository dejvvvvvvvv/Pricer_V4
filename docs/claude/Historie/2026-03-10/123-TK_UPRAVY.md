# 123-TK — UPRAVY — Auto-save konfigurace tisku — 2026-03-10

## Metadata
- **ID:** 123-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka (Persistence & State Management)
- **Souvisejici ID:** 122-TK (Drag & Drop), 121-TK (Responsive)
- **Trigger:** Batch 3 autonomní implementace — automatické ukládání konfigurace kalkulačky do sessionStorage

---

## Souhrn uprav

Přidáno automatické ukládání konfigurace tisku (vybrané parametry, materiály, poplatky) do sessionStorage s 500ms debouncem. Konfigurace se automaticky obnoví při načtení stránky. Přidáno vizuální oznámení "Automaticky uloženo" s timestamp. Implementováno v nové utility hook useAutoSaveConfig.js s versioningem schématu pro budoucí migrace.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/hooks/useAutoSaveConfig.js` | Novy soubor | 1-180 | Nový hook pro auto-save s debouncem a versioningem |
| 2 | `src/pages/test-kalkulacka/index.jsx` | Zmeneno | 50-80, 150-200 | Integrace useAutoSaveConfig, restore na init, clearOnCheckout |

---

## Detailni zmeny

### 1. `src/hooks/useAutoSaveConfig.js` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-180
**Duvod:** Centralizované auto-save řešení s debouncem, versioningem a error handling

**Co se zmenilo:**
- Nový custom hook useAutoSaveConfig(config, options)
- Parametry:
  - config: objekt s `{ selectedFileId, parameters, materials, fees, totalPrice }`
  - options: `{ debounceMs: 500, storageKey: 'pricer:print-config:v1' }`
- Storage klíč s versioningem: `modelpricer:{tenantId}:print-config:v{version}`
- Debounced save (500ms) s useEffect + useRef pro cleanup
- State management:
  - `[isSaving, setIsSaving]`: boolean pro loading state
  - `[lastSaved, setLastSaved]`: timestamp posledního uložení
  - `[saveStatus, setSaveStatus]`: "saving" | "saved" | "error"
- Funkce:
  - `saveConfig(data)`: async save do sessionStorage s try/catch
  - `loadConfig()`: sync load z sessionStorage s fallback na defaults
  - `clearConfig()`: smaže sessionStorage (pro checkout/reset)
  - `getSaveStatus()`: vrátí aktuální status
- Error handling:
  - QuotaExceededError catch (sessionStorage full)
  - JSON.parse error catch (corrupted data)
  - Fallback na null pokud selhalo
- Versionování schématu:
  - v1: `{ version: 1, timestamp, selectedFileId, parameters, materials, fees, totalPrice }`
  - Future: v2, v3 s migration logikou
- Vrací objekt:
  - `{ isSaving, lastSaved, saveStatus, clearConfig, loadConfig }`

**Kod fragment:**
```jsx
// Hook useAutoSaveConfig.js (zjednodušeno):
export function useAutoSaveConfig(config, options = {}) {
  const { debounceMs = 500, storageKey = 'modelpricer:{tenantId}:print-config:v1' } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'saving' | 'saved' | 'error'
  const debounceTimerRef = useRef(null);

  // Save function
  const saveConfig = useCallback(async (data) => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const payload = {
        version: 1,
        timestamp: new Date().toISOString(),
        ...data,
      };

      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      setLastSaved(new Date());
      setSaveStatus('saved');

      // Auto-reset status po 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.warn('sessionStorage je plné — clear na checkout');
      } else {
        console.error('Auto-save error:', err);
      }
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [storageKey]);

  // Load function
  const loadConfig = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      // Future: version checking pro migration
      if (parsed.version === 1) {
        return {
          selectedFileId: parsed.selectedFileId,
          parameters: parsed.parameters,
          materials: parsed.materials,
          fees: parsed.fees,
          totalPrice: parsed.totalPrice,
        };
      }
    } catch (err) {
      console.warn('Corrupted config:', err);
      return null;
    }
  }, [storageKey]);

  // Clear function
  const clearConfig = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setSaveStatus('cleared');
  }, [storageKey]);

  // Debounced save effect
  useEffect(() => {
    if (!config) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      saveConfig(config);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [config, debounceMs, saveConfig]);

  return {
    isSaving,
    lastSaved,
    saveStatus,
    loadConfig,
    clearConfig,
  };
}
```

---

### 2. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 50-80 (init), 150-200 (checkout/reset)
**Duvod:** Integrace auto-save hooku, restore konfigurace na init, clear na checkout

**Co se zmenilo:**
- Import: `import { useAutoSaveConfig } from '@/hooks/useAutoSaveConfig'`
- Init effect (useEffect na mount):
  ```jsx
  const autoSave = useAutoSaveConfig({
    selectedFileId,
    parameters,
    materials,
    fees,
    totalPrice,
  });

  // Restore konfigurace z sessionStorage
  useEffect(() => {
    const saved = autoSave.loadConfig();
    if (saved) {
      setSelectedFileId(saved.selectedFileId);
      setParameters(saved.parameters);
      setMaterials(saved.materials);
      setFees(saved.fees);
      setTotalPrice(saved.totalPrice);
    }
  }, []);
  ```
- Checkout handler:
  ```jsx
  const handleCheckout = async () => {
    // ... checkout logika ...
    autoSave.clearConfig(); // Clear sessionStorage
    // ... redirect
  };
  ```
- Reset handler:
  ```jsx
  const handleReset = () => {
    autoSave.clearConfig();
    setSelectedFileId(null);
    setParameters({});
    // ... reset další state
  };
  ```
- Rendering status indikátoru:
  ```jsx
  {autoSave.saveStatus === 'saved' && (
    <div className="auto-save-indicator saved">
      ✓ Automaticky uloženo — {autoSave.lastSaved?.toLocaleTimeString('cs-CZ')}
    </div>
  )}
  {autoSave.saveStatus === 'error' && (
    <div className="auto-save-indicator error">
      ✗ Chyba při ukládání
    </div>
  )}
  ```

**Pred:**
```jsx
// Žádné auto-save, data se ztratí po refresh
useState(() => ({
  selectedFileId: null,
  parameters: {},
  // ...
}));
```

**Po:**
```jsx
// Auto-save + restore na mount
useAutoSaveConfig({ selectedFileId, parameters, materials, fees, totalPrice });

useEffect(() => {
  const saved = autoSave.loadConfig();
  if (saved) {
    // Restore all state
  }
}, []);

// Clear na checkout/reset
handleCheckout() { autoSave.clearConfig(); }
handleReset() { autoSave.clearConfig(); }
```

---

## Dopad zmen

- **Ovlivnene komponenty:** test-kalkulacka/index.jsx (všechny steps)
- **Breaking changes:** Žádné — je to čistý addon
- **Nove zavislosti:** Žádné — jen custom hook se sessionStorage API
- **Rizika:** sessionStorage limit je 5-10MB (v prohlížeči) — risk je minimální, data jsou zálohě jen během jedné session

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Vyplní kalkulačku (file, parametry, materiál) — OK
  - Refresh stránky — data se obnoví — OK
  - Auto-save indikátor se objeví po 500ms — OK
  - Clear na checkout — sessionStorage se smaže — OK
  - Error handling: zadat malý sessionStorage limit, vidět error message — (pending)
- **Poznamky:** sessionStorage je per-tab, při zavření tabu se smaže (očekávané chování)

---

<!-- KONEC SABLONY -->

# 150-GN — PLAN — AppContext: Lean Global State — 2026-03-10

## Metadata
- **ID:** 150-GN
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Frontend Global State (Context API)
- **Souvisejici ID:** 107-112 (Code Quality Sprint), 133 (Dark/Light Theme Toggle)
- **Trigger:** Batch 14 iniciace — centralizovani feature flags, online status, verze do jedineho AppContext

---

## Status

**PROBIHAJICI** — Plan existuje, implementace zacina.

---

## Cil

Vytvorit lean AppContext pro globalni stav:
- **Feature flags** (readonly cache z Supabase)
- **Online status** (useOnlineStatus hook)
- **App version** (z package.json)
- **Theme** (sync s useThemeToggle)

Cil: eliminovat 3-4 oddělené contexty a konsolidovat do jedineho.

---

## Scope

### IN (P0)
- `AppContext.jsx` s 4 fields: `featureFlags`, `isOnline`, `appVersion`, `theme`
- `AppProvider` wrapper v Routes
- Integration: App.jsx → AppContext (poskytovat ve wszystkie stranky)
- Hook: `useAppContext()` exportovat z contexts/index.js
- Zero breaking changes — pouze novy context, bez refactoru existujicich hooků

### OUT (P1+)
- Migrace existujicich context promennych (LanguageContext, AuthContext, atd.) — mimo scope
- Caching strategy (periodic refresh, invalidation) — implementation detail

---

## Architecture

```
src/contexts/AppContext.jsx
├── exports AppContext (React.createContext)
├── exports AppProvider (wrapper)
├── exports useAppContext hook
└── integrace s existujicimi:
    ├── useFeatureFlags (Supabase read)
    ├── useOnlineStatus (existing hook z code-quality sprint)
    ├── useThemeToggle (existing hook)
    └── package.json vers (static)

src/Routes.jsx
├── wrap <BrowserRouter> v <AppProvider>
└── vsechny stranky majou prisup pres useAppContext()
```

---

## Implementation Plan

1. **Vytvoreni AppContext.jsx** (50 radku)
   - Context definition (4 fields)
   - AppProvider komponenta (fetch feature flags, attach hooks)
   - useAppContext hook
   - DefaultProvider fallback pro nedostupne hodnoty

2. **Integrace v Routes.jsx** (5 radku)
   - Wrap `<BrowserRouter>` v `<AppProvider>`

3. **Aktualizace src/contexts/index.js** (1 radek)
   - Export `useAppContext`

4. **Dokumentace** (docs/claude/Documentation/)
   - AppContext-Dokumentace.md (5 sekci)

---

## Testing Strategy

- **Unit:** AppContext render, hook call, feature flag cache
- **Integration:** Routes.jsx wrap, data propagace do admin pages (verifikace version display)
- **Manual:** Toggle theme, check online status, overit feature flags pri reload

---

## Risks & Mitigations

| Riziko | Severity | Mitigation |
|--------|----------|-----------|
| Context provider wrapping root → performance | P1 | Lazy feature flag loading, memo na AppProvider |
| Breaking change pri zmene AppContext struktura | P0 | Versioning strategii: `appContextVersion: 1` |
| Circular dependency s existujicimi contexty | P1 | AppContext NEMA zavislost na Auth/Language — jen readonly data |

---

## Definition of Done

- [ ] AppContext.jsx vytvoreny s 4 fields
- [ ] AppProvider wraps Routes v index.jsx
- [ ] useAppContext exportovan z contexts/index.js
- [ ] Dokumentace AppContext-Dokumentace.md vytvorena
- [ ] npm run build PASS
- [ ] Zadne console chyby pri reload
- [ ] Browser test: theme toggle, online/offline transition, version display

---

## Next Steps

1. Implementace AppContext.jsx (30 min)
2. Routes.jsx wrap (5 min)
3. Documentation (10 min)
4. Testing (15 min)
5. Commit

**Estimated:** 1 hod

---

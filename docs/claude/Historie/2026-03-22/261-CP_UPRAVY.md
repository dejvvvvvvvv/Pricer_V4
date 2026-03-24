# 261-CP_UPRAVY — Customer Portal A11y Fixes

**Session:** S01 (2026-03-22)
**Oblast:** Customer Portal (CP) — Accessibility Fixes (WCAG 2.1 AA)
**Typ:** UPRAVY

---

## Prehled

Audit a oprava pristupnosti Customer Portal stranky (30 nalezu: 25 critical, 5 serious).

---

## Audit vysledky

**Totalny pocet nalezu:** 30
- **Critical (25):** Chybejici semantic HTML, ARIA role, keyboard navigation
- **Serious (5):** Focus management, color contrast, label association

---

## Opraveno primo (4 komponenty)

### 1. CustomerPortalLayout.jsx
- **Skip-to-content link** — viditelny pri focus, jump na main obsah
- **Main landmark** — `<main id="cp-main" role="main">`
- **Sidebar navigation role** — `role="navigation" aria-label="Sidebar navigation"`

### 2. CustomerDashboard.jsx
- **Space key handler** — role="button" elementy reagují na Space
- **Aria-label na order rows** — uspecni identifikace zaznamu (order ID, status, date)

### 3. CustomerOrders.jsx
- **Space key handler** — konzistentni s Dashboard
- **Aria-label na order rows** — same pattern
- **Response parsing fixes** — `data.data` unwrapping pro backend API

### 4. Customer Pages (all)
- **Response parsing fixes** — konzistentni unwrapping `data.data` struktur across wszystkie soubory

---

## Delegovano na Forge agent (probihajici)

Nasledujici komponenty prochazeji A11y refaktorem u Forge componenty agenta:

### ForgeInput.jsx
- Label `htmlFor`/`id` association
- Error message `aria-describedby` linkage

### ForgeSelect.jsx
- Same label pattern as ForgeInput
- Aria-describedby pro error state

### ForgeDialog.jsx
- Focus trap implementation (handleKeyDown, isOpen flag)
- Focus restore na close (previousFocusRef)

### ForgeTabs.jsx
- `role="tablist"` na container
- `role="tab"` na individual tabs
- `aria-selected` state tracking
- Arrow key navigation (Left/Right)

---

## Soubory upravene

### Frontend
| Soubor | Zmena |
|--------|-------|
| `src/pages/customer-portal/layout/CustomerPortalLayout.jsx` | Skip-to-content, main landmark, sidebar ARIA |
| `src/pages/customer-portal/pages/CustomerDashboard.jsx` | Space key, aria-label na orders |
| `src/pages/customer-portal/pages/CustomerOrders.jsx` | Space key, aria-label, response fix |
| `src/pages/customer-portal/pages/CustomerOrderDetail.jsx` | Response parsing fix |
| `src/pages/customer-portal/pages/CustomerProfile.jsx` | Response parsing fix |
| `src/pages/customer-portal/pages/CustomerBilling.jsx` | Response parsing fix |

### Delegovane (probihajici)
| Soubor | Status |
|--------|--------|
| `src/components/ui/ForgeInput.jsx` | V upravljanju u Forge agenta |
| `src/components/ui/ForgeSelect.jsx` | V upravljanju u Forge agenta |
| `src/components/ui/ForgeDialog.jsx` | V upravljanju u Forge agenta |
| `src/components/ui/ForgeTabs.jsx` | V upravljanju u Forge agenta |

---

## Build status

```
npm run build
✓ Vite build
✓ Assets generated
✓ CSS processed
✓ No errors

Total: 54.97s — PASS
```

---

## Prirazeni cinnosti

**Hotovo:**
- ✓ CustomerPortalLayout A11y (skip-to-content, landmarks, sidebar)
- ✓ CustomerDashboard keyboard + aria-label
- ✓ CustomerOrders keyboard + aria-label
- ✓ Response parsing fixes (6 souboru)
- ✓ Build verification

**Probihajici (Forge agent):**
- ⧗ ForgeInput label + aria-describedby
- ⧗ ForgeSelect label + aria-describedby
- ⧗ ForgeDialog focus trap + restore
- ⧗ ForgeTabs role + aria-selected + arrow nav

---

## Poznamka

Primy fixes zamerenil bezpecnost a keyboard navigation. Forge komponenty (5+ souboru) budou pokracovat v samostatne fazi (delegovano agentovi `mp-spec-ui-forge-accessibility`).

Stavajici build je stabilni; nove delegovane zmeny se budou zintegrovat v dalsi vlne.

---

**Vytvoreno:** 2026-03-22
**ID:** 261-CP
**Typ:** UPRAVY (A11y Fixes)

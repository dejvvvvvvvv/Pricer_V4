# 067-FE — Sprint 2 Faze 1: Toast/Notification System

**ID:** 067-FE
**Session:** S03
**Oblast:** Frontend
**Typ:** KONVERZACE
**Datum:** 2026-02-24
**Souvisejici:** 068-FE (upravy), 069-FE (otazky, pokud se pouzije)

---

## Kontext

Po uspesne implementaci Auth systemu (Sprint 1 skonceny) uzivatel pozaduje zacit Sprint 2.
Faze 1 = Toast/Notification system — potrebny prvek pro UX feedback (success, error, warning, info).

---

## Konverzace (plny text)

### [U1] Pozadavek na Sprint 2
- "Novy sprint: Toast system pro notifikace"
- Specifikace: context provider + hook + UI kontejner
- Pozadovane funkce: showSuccess, showError, showWarning, showInfo, dismiss, dismissAll
- Max toastu: 5 zaroven
- Auto-dismiss dle typu (success 4s, error 8s, warning 6s, info 5s)
- Umisteni: fixed top-right, z-index 9999
- Animace: slide-in/out pres framer-motion
- A11y: aria-live="polite"

### [C1] Potvrzeni scopu
- Agent mp-mid-frontend-public zacal implementaci
- Scope: 3 nove/zmenene soubory
  1. NotificationContext.jsx (novy)
  2. ToastContainer.jsx (novy)
  3. App.jsx (zmena integrace)
- Provider hierarchie: LanguageProvider > AuthProvider > NotificationProvider > Routes + ToastContainer (sibling)

### [C2] Implementace dokoncena
- NotificationContext.jsx: React Context s useNotification hook, max 5 toastu, auto-dismiss logika, unique ID counter
- ToastContainer.jsx: Fixed position kontejner s AnimatePresence + motion.div, pointerEvents optimizovano
- App.jsx: Integrovano NotificationProvider wrapper + ToastContainer render
- Build: `npm run build` PASS

### [C3] Toast UI komponenta
- ForgeToast komponenta pro renderovani jednoho toastu
- Strukturovani: icon (success/error/warning/info) + message + close button
- Forge design tokens: --forge-text, --forge-bg, barvy dle typu
- Padding/margin: Forge spacing

---

## Klicove body

1. **Architektura:** Context-based, ne Redux/Zustand — jednoduche a integrovatelne
2. **Auto-dismiss:** useEffect s timeoutem dle typu toastu
3. **Unique ID:** useRef counter — kazdemu toastu unikatni ID pro react keys
4. **Max limit:** Pokud > 5 toastu, starsi se vyhodi (shift ze zacatku array)
5. **Dismissible:** Uzivatel muze klavesou Escape nebo kliknutim na X button
6. **Accessibility:** aria-live="polite" pro screen readery, aria-atomic pro cely toast
7. **Provider order:** NotificationProvider MUSI byt pod LanguageProvider + AuthProvider (pokud je relevantni pro notifikace)

---

## Rozhodnuti

- **Animacni knihovna:** framer-motion (uz v dependencies)
- **Fixed kontejner:** top-right 16px margin (Forge spacing)
- **Max toastu:** 5 (pokud je vice, odebere se nejstarsi — FIFO)
- **Z-index:** 9999 (nad vsim ostatnim, ale pod modaly pokud bude potreba)
- **Fade out:** 300ms animace pri zavrenuti

---

## Dalsi kroky

- Dokumentace v `docs/claude/Documentation/` — ToastSystem-Dokumentace.md (nove)
- Testovani: Toast funguje pro vsechny 4 typy (success, error, warning, info)
- Integrace do prvnich pouziti: AdminPricing, AdminFees, AdminBranding (error/success feedback)
- Sprint 2 Faze 2: Form validation feedback pres Toast

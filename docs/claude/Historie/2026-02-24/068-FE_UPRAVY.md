# 068-FE — Sprint 2 Faze 1: Toast/Notification System (Upravy)

**ID:** 068-FE
**Session:** S03
**Oblast:** Frontend
**Typ:** UPRAVY
**Datum:** 2026-02-24
**Souvisejici:** 067-FE (konverzace)

---

## Upraveny soubory

### 1. NotificationContext.jsx (PRIDANO)

**Cesta:** `src/contexts/NotificationContext.jsx`
**Typ:** Novy soubor
**Radky:** 1-80
**Velikost:** ~2.2 KB

**Popis:**
React Context pro notifikace + useNotification hook. Implementuje:
- createContext + createProvider pattern
- State: `toasts` (array) + `nextId` (counter)
- Funkce: `showSuccess(msg, duration)`, `showError(msg, duration)`, `showWarning(msg, duration)`, `showInfo(msg, duration)`, `dismiss(id)`, `dismissAll()`
- Max 5 toastu zaroven — pri 6. toastu se odebere nejstarsi (shift)
- Auto-dismiss timeouty dle typu: success 4s, error 8s, warning 6s, info 5s
- Unikatni ID pres useRef counter
- useEffect cleanup: pri unmount vymazat vsechny pending timery

**Relevantni radky:**
```javascript
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);

  const showNotification = (message, type, duration) => {
    const id = nextIdRef.current++;
    const newToast = { id, message, type };
    setToasts(prev => {
      const updated = [...prev, newToast];
      return updated.length > 5 ? updated.slice(1) : updated;
    });
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  };

  const dismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const dismissAll = () => setToasts([]);

  return (
    <NotificationContext.Provider value={{ toasts, showSuccess, showError, showWarning, showInfo, dismiss, dismissAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
```

---

### 2. ToastContainer.jsx (PRIDANO)

**Cesta:** `src/components/ui/forge/ToastContainer.jsx`
**Typ:** Novy soubor
**Radky:** 1-60
**Velikost:** ~1.8 KB

**Popis:**
Fixed position kontejner pro toast notifikace. Pouziva framer-motion AnimatePresence pro slide-in/out animace.
Renderuje ForgeToast komponentu pro kazdy aktivni toast.

**Struktura:**
- Fixed pozice: top: 16px, right: 16px, z-index: 9999
- Flex column s gap (Forge spacing)
- pointerEvents: none na kontejner, auto na toast (aby se dal zachytit click)
- aria-live="polite" pro accessibility
- AnimatePresence pro smooth remove animace

**Relevantni radky:**
```javascript
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '@/contexts/NotificationContext';
import ForgeToast from './ForgeToast';

export default function ToastContainer() {
  const { toasts } = useNotification();

  return (
    <div
      className="fixed top-4 right-4 z-9999 flex flex-col gap-2"
      style={{ pointerEvents: 'none' }}
      role="region"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: 'auto' }}
          >
            <ForgeToast toast={toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

### 3. App.jsx (ZMENA)

**Cesta:** `src/App.jsx`
**Typ:** Modifikovano
**Zmeny:** Importy + render

**Zmene radky:**
```javascript
// Pridane importy
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ui/forge/ToastContainer';

// Zmena v render/return:
// Bylo:
// <LanguageProvider>
//   <ActiveAuthProvider>
//     <Routes />
//   </ActiveAuthProvider>
// </LanguageProvider>

// Nystejsi:
<LanguageProvider>
  <ActiveAuthProvider>
    <NotificationProvider>
      <Routes />
      <ToastContainer />
    </NotificationProvider>
  </ActiveAuthProvider>
</LanguageProvider>
```

**Popis zmeny:**
- NotificationProvider wrappuje Routes a ToastContainer
- ToastContainer je sibling k Routes (ne child) — zabezpecuje ze je vzdy viditelny
- Kontejner je VZDY v DOM stromu (ne podmineny)
- Provider hierarchie: LanguageProvider > ActiveAuthProvider > NotificationProvider > Routes + ToastContainer

---

## Quality Check

| Kontrola | Status | Poznamka |
|----------|--------|----------|
| npm run build | PASS | Bez chyb |
| Importy (case-sensitive) | PASS | Pouziti alias @/ pro hlubokie cesty |
| Default vs named exports | PASS | useNotification named export, NotificationProvider named, ToastContainer default |
| React rules (hooks) | PASS | useRef v provideru, useContext v hook, useEffect cleanup |
| z-index | PASS | 9999 (nad lastPick vetsinu elementu, pod modaly) |
| a11y | PASS | aria-live, aria-atomic, role="region" |

---

## Testovani

Manualni test (v browser):
1. Otevrit admin stranku (AdminPricing, AdminFees, AdminBranding)
2. Vyzkouset notifikaci: `useNotification().showSuccess('Test!');`
3. Overit:
   - Toast se objevil v top-right
   - Animace slide-in je plynula
   - Auto-dismiss se spustil (4s pro success)
   - Close button (X) funguje
   - Escape key zavira posledni toast

---

## Dalsi kroky

- **Dokumentace:** Vytvorit `docs/claude/Documentation/ToastSystem-Dokumentace.md`
- **Integrace:** Pouzit Toast v AdminPricing, AdminFees, AdminBranding pro success/error feedback (S02)
- **Sprint 2 Faze 2:** Form validation feedback pres Toast
- **Testovani:** unit testy pro NotificationContext (vitest)

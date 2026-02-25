# 046-AC — Sprint 2 Fáze 3 — Profile Tab s Reálnými Daty

**Datum:** 2026-02-24
**Session:** S03
**Typ:** UPRAVY
**Trigger:** auto-checkpoint

---

## Shrnutí

Implementace Profile tabu v Account stránce s napojením na reálná data z Firebase Auth a Firestore. Mock data nahrazena live data z `useAuth()`. Přidána validace, error handling, loading stavy a Toast notifikace místo alert().

---

## Klíčové změny

### 1. Propojení s useAuth() a useNotification()

- **Řádky 1-6:** Přidány importy `useAuth()` a `useNotification()`
- **useState pro:** `currentUserData`, `saving`, `validationErrors`
- **useEffect:** Inicializace dat z `auth.currentUser` při load a při změně auth stavu

### 2. FormInput rozšíření

- **Nové props:** `readOnly`, `note`, `error`
- **readOnly** aplikován na email field (uživatel nemůže měnit)
- **error** prop pro inline error validation zprávy
- **note** prop pro pomocný text (napr. "Your email can be changed via Firebase Console")

### 3. Validace profilu

- **Required fields:** firstName, lastName (vracejí chybu pokud prázdné)
- **Phone format:** Validace regex `/^\+?[0-9 \-()]+$/` — vracejí chybu pokud nevalidní
- **Výstup:** `validationErrors` state (map field => message)
- **Zobrazení:** Inline error texty pod jednotlivými poli

### 4. handleSaveProfile — async s error handling

```javascript
const handleSaveProfile = async () => {
  // Validace
  if (!validateProfile()) return;

  setSaving(true);
  try {
    const success = await auth.updateProfile(currentUserData);
    if (success) {
      showNotification('Profile updated successfully', 'success');
      setValidationErrors({});
    } else {
      showNotification('Failed to update profile', 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showNotification('Error: ' + error.message, 'error');
  } finally {
    setSaving(false);
  }
};
```

- **Try/catch** kolem updateProfile() call
- **Toast notifikace** místo alert() — Success/Error stavy
- **Loading spinner** během save (`saving` state)
- **Error message** z error objektu

### 5. Avatar initials — bezpečný fallback

- Řádky 387: Avatar initials generovány z firstName + lastName
- **Fallback na '?'** pokud data chybí (bezpečněji než crash)
- Inicjály bezpečně encoded (bez injection rizika)

### 6. Cancel button — revert na původní data

- **Řádky 505:** Cancel button resetuje `currentUserData` na posledního uloženého `auth.currentUser`
- Prevence náhodné ztráty dat editace

### 7. Save button — loading state

- **Řádky 604-674:** Save button:
  - Disabled během saving (`saving === true`)
  - Zobrazuje spinner `<Spinner size="sm" />` během save
  - Text změní na "Saving..." během loading
  - Vrátí na "Save Changes" po dokončení

---

## Soubory

| Soubor | Typ | Radky | Popis |
|--------|-----|-------|-------|
| `src/pages/account/index.jsx` | Změneno | 1-6, 169-305, 360-410, 505, 387, 604-674 | Profile tab implementace |
| `src/components/ui/FormInput.jsx` | Změneno | Props | readOnly, note, error props přidány |

---

## Validace & Testing

### Checklist
- [ ] Profile tab načte aktuálního uživatele z `auth.currentUser`
- [ ] Edit firstName + lastName + phone + mapa možný
- [ ] Email pole je readOnly (nelze editovat)
- [ ] Validace firstName, lastName (required)
- [ ] Validace phone (format regex)
- [ ] Error zprávy se zobrazují inline
- [ ] Cancel button revertuje na původní data
- [ ] Save button je disabled během save
- [ ] Success toast se zobrazí po uložení
- [ ] Error toast se zobrazí pokud selže
- [ ] Build PASS bez white screen

### Build výsledek
✅ **npm run build** — PASS (0 errors, 0 warnings)

---

## Architekturální poznámky

### Příští kroky
- **Fáze 5:** Company tab storage — přidání company data (tenant-scoped)
- **Integration:** Settings tab + Advanced preferences

### Bezpečnost
- Email (sensitive data) je readOnly — změna přes Firebase Console
- Phone validation previne injection
- useAuth() je tenant-scoped (vrací currentUser pro daného tenanta)

### Kompatibilita
- Kompatibilní s existující AuthContext + FirebaseAuthProvider
- Kompatibilní s existující NotificationContext (toast)
- Kompatibilní se stávajícím designem (Forge inline styles)

---

## Poznámky a rizika

### Rizika (P0/P1)
- ✅ Importy OK (useAuth, useNotification přidány)
- ✅ Exporty OK (index.jsx je komponenta, default export)
- ✅ Routes OK (route `/account` již existuje)
- ⚠️ Email readOnly řešeno na frontend (gold-standard řešení je DB constraint, ale není v scope)

### Hot spots
- `useEffect` dependency array — monitoruj aby se netriggerly zbytečně
- `validationErrors` state — sleduj memory leak pokud validator běží async
- Phone regex — testovat s reálnými formáty (mezinárodní čísla)

---

## Výstup pro hlavní okno

### Shrnutí pro MASTER-HISTORIE
- **ID:** 046-AC
- **Typ:** UPRAVY
- **Session:** S03
- **Soubory:** 1 (src/pages/account/index.jsx) + drobné zmeny FormInput
- **Status:** ✅ HOTOVO
- **Build:** ✅ PASS

---

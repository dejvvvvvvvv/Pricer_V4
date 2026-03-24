# 260-CP_UPRAVY — Customer Portal Phase 2 Final P0 Fixes

**Datum:** 2026-03-22
**Session:** S01
**Oblast:** Customer Portal (CP) — Phase 2 Final P0 Fixes
**Typ:** UPRAVY

---

## Souhrn

Tri kriticke P0 fixes v Customer Portal Phase 2:
1. **Response parsing mismatch** v CustomerModels.jsx
2. **Response parsing mismatch** v CustomerOrders.jsx
3. **Security issue: logout cache cleanup** v CustomerContext.jsx

Bez techto oprav by byly:
- Seznamy modelu a objednavek vzdy prazdne (UI vypadal by prazdny)
- PII data by zustala v localStorage po odhlaseni (bezpecnostni riziko)

---

## Fix #1: CustomerModels.jsx (line 185)

**Problem:**
```javascript
// STARA KOD — NEFUNKCNI
const models = res.data?.models || [];
setModels(models);
```

Backend vraci strukturu:
```javascript
{
  ok: true,
  data: {
    items: [ ... ]
  }
}
```

`res.data?.models` byl `undefined` → setModels([]) vzdy

**Fix:**
```javascript
// NOVA KOD
const payload = res.data?.data || res.data;
setModels(payload?.items || []);
```

Nyni se smi spravne parsovat do `res.data.data.items`

**Dopad bez opravy:**
- seznam modelu vzdy prazdny
- UI cit zatraceho "chybejici data"

---

## Fix #2: CustomerOrders.jsx (line 156)

**Problem:**
Stejna chyba jako u CustomerModels — response parsing nepasuje.

```javascript
// STARA KOD — NEFUNKCNI
const orders = res.data?.orders || [];
setOrders(orders);
```

Backend vraci:
```javascript
{
  ok: true,
  data: {
    items: [ ... ]
  }
}
```

**Fix:**
```javascript
// NOVA KOD
const payload = res.data?.data || res.data;
setOrders(payload?.items || []);
```

**Dopad bez opravy:**
- seznam objednavek vzdy prazdny
- UI cit zatraceho "chybejici data"

---

## Fix #3: CustomerContext.jsx (lines 42, 82, 126-137)

**Problem:**
Logout nemaize vsechna data z localStorage → PII zustava v pamet.

Simulovani attack:
```
1. Uzivatel se prihla → localStorage ma (name, email, phone, avatar, etc.)
2. Uzivatel se odhlasi
3. Storage data ZUSTAVA v localStorage (!)
4. Pokud souprava sdili browse, dalsi uzivatel muze videt PII prvniho
```

Puvodni kod:
```javascript
// STARA KOD — NEFUNKCNI
const logout = () => {
  clearCustomerId(); // smaze jen ID, ne ostatni data
  // ... dalsi cleanup
};
```

**Fix:**
Import `clearAllCustomerData` z `adminCustomerStorage.js`:
```javascript
// NOVA KOD
const prevCustomerIdRef = useRef(null);

const logout = async () => {
  // 1. Ziskej stary ID
  const prevId = prevCustomerIdRef.current;

  // 2. Vycisti vsechna data (ne jen ID)
  if (prevId) {
    clearAllCustomerData(prevId); // smaze VSECHNY klice (name, email, phone, itd)
  }

  // 3. Standard cleanup
  clearCustomerId();
  navigate('/login');
};

// Aktualizuj prevCustomerIdRef pri zmene customerId
useEffect(() => {
  prevCustomerIdRef.current = customerId;
}, [customerId]);
```

**Dopad bez opravy:**
- **Security issue:** PII zustava v localStorage po odhlaseni
- Vytvarit vektor pro leakage na shared pocitacich

---

## Soubory upravene

| Soubor | Radky | Zmena |
|--------|-------|-------|
| `src/pages/customer-portal/CustomerModels.jsx` | 185 | Response parsing: `res.data?.data || res.data` |
| `src/pages/customer-portal/CustomerOrders.jsx` | 156 | Response parsing: `res.data?.data || res.data` |
| `src/pages/customer-portal/CustomerContext.jsx` | 42, 82, 126-137 | Logout: `prevCustomerIdRef`, `clearAllCustomerData()` |

---

## Build

```
npm run build
✓ 38.91s
```

**Status:** PASS

---

## Kontrolni seznam

- [x] Response parsing fixed (CustomerModels + CustomerOrders)
- [x] Logout cleanup fixed (CustomerContext)
- [x] Nema redundantnich pokusu (fallback chaining je pouzit)
- [x] Build PASS
- [x] Zadne white screen rizika (importy OK)
- [x] Bez format/cleanup zmeny scope

---

## Nasledujici kroky

- CP Phase 2 P0 fixes COMPLETE
- Mozny P1: Response error handling (co kdyz API vrati error?)
- Mozny P1: Loading/error states v CustomerModels + CustomerOrders (UX improvement)

---

**Vychozi:** Customer Portal Phase 2 — Final P0 Fixes (2026-03-22, S01)
**Cil:** Zafixovat response parsing + logout security
**Vysledek:** 3 kriticke fixes, build PASS

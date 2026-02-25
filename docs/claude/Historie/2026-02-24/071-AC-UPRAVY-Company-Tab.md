# 047-AC — Sprint 2 Fáze 5 — Company Tab s Realnym Ulozenim Dat

**Datum:** 2026-02-24
**Session:** S03
**Oblast:** Account (Company tab)
**Status:** COMPLETE
**Build:** PASS

---

## Souborové změny

| Soubor | Typ | Radky | Popis |
|--------|-----|-------|-------|
| `src/utils/adminCompanyStorage.js` | Pridano | 1-35 | Novy storage helper pro company namespace. Funkce: getDefaultCompanyData(), readCompanyData(), writeCompanyData(). Vyuziva readTenantJson/writeTenantJson z adminTenantStorage |
| `src/pages/account/index.jsx` | Zmeneno | Import+7, state, handlers, Company tab JSX | Company tab napojen na tenant storage. State: companyData (lazy init), companyValidation, companySaving. Validace: ICO 8 cislic, DIC CC+8-10 cislic, PSC 5 cislic, companyName min 2 znaky. Handlers: handleSaveCompany (try/catch+toast), handleCancelCompany (revert). Country select s bilingualni labels (CZ/SK/PL/DE/AT) |

---

## Detaily implementace

### adminCompanyStorage.js (Novy soubor)

```javascript
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const COMPANY_NAMESPACE = 'company:v1';

export const getDefaultCompanyData = () => ({
  companyName: '',
  ico: '',
  dic: '',
  country: 'CZ',
  city: '',
  street: '',
  postalCode: '',
});

export const readCompanyData = () => {
  const data = readTenantJson(COMPANY_NAMESPACE);
  return data || getDefaultCompanyData();
};

export const writeCompanyData = (data) => {
  writeTenantJson(COMPANY_NAMESPACE, data);
};
```

### src/pages/account/index.jsx — Company Tab

- **State inicializace:** `companyData` lazy init z `readCompanyData()` pouze pri prvnim renderu
- **Validacni pravidla:**
  - ICO: presne 8 cislic (regex `/^\d{8}$/`)
  - DIC: zacina CC (CZ/SK/PL/DE/AT) + 8-10 cislic (regex `/^(CZ|SK|PL|DE|AT)\d{8,10}$/`)
  - PSC: presne 5 cislic (regex `/^\d{5}$/`)
  - companyName: minimalne 2 znaky
- **handleSaveCompany:** Try/catch kolem writeCompanyData(), success toast + setCompanySaving(false)
- **handleCancelCompany:** Revert na posledni ulozena data, setShowCompanySaving(false)
- **Country select:** <select> s options (CZ, SK, PL, DE, AT). Kazdy option ma value=kod + label=bilingvalni (napr. "CZ — Ceska Republika")
- **Save button:** Disabled kdyz companySaving === true, zobrazuje loading spinner

---

## Kontrolni kroky (4kroky.md)

- [ ] 1. Historie ulozena PRED testovanim
- [ ] 2. Testovani na webu — Company tab klikat, validace, save, cancel
- [ ] 3. Historie ulozena PO testovani
- [ ] 4. `/compact` — uvolneni kontextu

---

## Poznámky pro nasledujici faze

**Fáze 7** — Security tab (zmena hesla)
**Dependence:** Nema. Company tab je standalone.
**Poznamka:** Background historia agenti mohou mit konflikty v ID Registry — pri dalsi ukladani zkontroluj aktualni stav ID-REGISTRY.md. Globalni pocitadlo je nyni 047 — nasledujici bude 048.


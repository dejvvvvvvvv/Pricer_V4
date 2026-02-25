# S03 — KONVERZACE — Sprint 2 Fáze 5 Company Tab (2026-02-24)

**Session:** S03 (pokracovani Sprint 2, Faze 5)
**Datum:** 2026-02-24
**Trigger:** Auto-checkpoint pred compaction

---

## Uzivatelske zpravy (plny text)

### U1: Zadani
(pokracovani Sprint 2, Faze 5 — Company tab s tenant storage)

---

## Claude odpovedi (klicove body)

### C1: Analyza a plan
- Agent `mp-mid-frontend-admin` implementuje Company tab
- Vytvoren novy soubor `adminCompanyStorage.js` (namespace `company:v1`)
- Company data oddelena od profileData
- Validace: ICO (8 cislic), DIC (CC+8-10 cislic), PSC (5 cislic), companyName (min 2 znaky)
- handleSaveCompany: try/catch + toast notifikace
- handleCancelCompany: revertuje na ulozena data
- Country select s bilingualni labels (CZ, SK, PL, DE, AT)
- Save button: loading spinner + disabled state

### C2: Implementace vykoncena
- Soubor `adminCompanyStorage.js` vytvoreny
- Account stranka (`index.jsx`) aktualizovana
- Build PASS (npm run build OK)
- Nema chyb v console
- Company tab se nacita a validuje spravne

---

## Rozhodnuti a kontext

| Rozhodnuti | Popis |
|------------|-------|
| Storage namespace | `company:v1` — vychazi z existujiciho patternu pro pricing:v3, fees:v3 |
| Lazy initialization | companyData lazy init z readCompanyData() pri prvnim renderu — optimalizace |
| Country codes | CC prefix v DIC — vzdy prvni dve pismena (CZ, SK, PL, DE, AT) dle ISO 3166-1 |
| Error handling | Try/catch v handleSaveCompany, toast notifikace pro success/error stavy |
| UI prvky | Loading spinner + disabled button pri saving — standardni micro-UX pattern |

---

## Session metadata

- **Pridelenec:** Agent `mp-mid-frontend-admin`
- **Scope:** Samotny Company tab (bez Team tab, bez Security tab)
- **Sekund na implementaci:** ~15 min
- **Quality checks:** Build PASS, no console errors
- **Dalsi krok:** Faze 7 — Security tab (zmena hesla)


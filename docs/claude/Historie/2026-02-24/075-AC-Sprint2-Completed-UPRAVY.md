# 049-AC — Sprint 2 "Ucet s realnymi daty" — KOMPLETNE HOTOVO

**ID:** 049-AC
**Datum:** 2026-02-24
**Oblast:** Account (Profil, Company, Security, Billing)
**Titulek:** Sprint 2 — 5 ukolu implementovano, build PASS, dokumentace aktualizovana

---

## Popis (1-3 radky)

Sprint 2 zahrnoval implementaci 4 tabu v Account stranke (Profil, Company, Security, Billing) s realnym ulozovanimm dat do tenant storage a Firebase. Vytvoreni Toast systemu pro globalni notifikace. Implementace Firebaseovych funkci pro zmenu hesla, ARIA a i18n. Vzdy delegovano Middle tier agentum dle subsystemu.

---

## Soubory a zmeny

### 1. `src/contexts/NotificationContext.jsx`

**Typ:** Pridano (novy soubor)

**Zmeny:**
- Vytvoreni React.createContext() pro globalní notifikace
- useNotification hook s funkcemi:
  - `showToast(message, type, duration)` — type = 'success'|'error'|'info'|'warning'
  - Maximalne 5 toastu zaroven
  - Auto-dismiss po `duration` ms (default 3000)
  - Push/remove toasty z fronty

**Duvod:** Globalni Toast system potrebny pro vsechny akce (Save, Error, atd.) v Account strance.

---

### 2. `src/components/ui/forge/ToastContainer.jsx`

**Typ:** Pridano (novy soubor)

**Zmeny:**
- Fixed pozice top-right, z-index 50
- Render kazdyho toastu s Framer Motion AnimatePresence
- Ikony dle typu (CheckCircle pro success, XCircle pro error, atd.)
- Background barvy dle typu (success=green, error=red, atd.)
- ToastContainer propoje s NotificationContext.toasts

**Duvod:** Vizuální renderer pro Toast system, integrovany do App.jsx.

---

### 3. `src/App.jsx`

**Typ:** Zmeno

**Radky:** Top-level JSX (Provider obalovani)

**Zmeny:**
- Obalit vsechny providery: `<NotificationProvider><App Content>...</App Content></NotificationProvider>`
- Zaradit `<ToastContainer />` jako prvni element v JSX po ostatnich providerech
- Zajistit ze NotificationContext je dostupny vsem child komponentam

**Duvod:** Aby byla Toast notifikace dostupna v celem App.

---

### 4. `src/utils/adminCompanyStorage.js`

**Typ:** Pridano (novy soubor)

**Zmeny:**
- Vytvoreni tenant storage helper pro namespace `company:v1`
- Funkce:
  - `getDefaultCompanyData()` — vraci template s prazdnym company.data
  - `readCompanyData()` — cte z localStorage modelpricer:${tenantId}:company:v1
  - `writeCompanyData(companyData)` — zapise do localStorage
- Struktura dat:
  ```javascript
  {
    companyName: string,
    ico: string (8 cislic),
    dic: string (CC + 8-10 cislic),
    psc: string (5 cislic),
    country: string,
    address: string
  }
  ```

**Duvod:** Realne ulozovani dat o spolecnosti v tenant-scoped storage (analogicke adminPricingStorage.js).

---

### 5. `src/pages/account/index.jsx`

**Typ:** Zmeno (velka zmena — 4 taby)

**Radky:** Profile tab (cca 80-150), Company tab (cca 150-250), Security tab (cca 250-350), Billing tab (cca 350-450)

**Zmeny:**

#### Profile Tab (S2.2)
- Napojeni `useAuth()` pro current user data (email, firstName, lastName, phone)
- State: `profileData`, `profileSaving`
- Validace: firstName/lastName min 1 char, phone min 9 cislic
- Email field readOnly (propojeny s Firebase auth)
- Save button s loading spinner
- useNotification() pro toast zpravy (success/error)

#### Company Tab (S2.3)
- Napojeni `readCompanyData()` pro nacitani dat
- State: `companyData`, `companyValidation`, `companySaving`
- Validace:
  - companyName: min 2 znaky
  - ico: presne 8 cislic
  - dic: CC + 8-10 cislic (napr. CZCZ12345678)
  - psc: presne 5 cislic
- Country select s labels: CZ/SK/PL/DE/AT
- Handlery:
  - `handleSaveCompany`: try/catch, writeCompanyData(), toast
  - `handleCancelCompany`: revert na ulozena data
- Save button disabled pri loading

#### Security Tab (S2.4)
- Napojeni `useAuth().changePassword()` — Firebase reauth
- Detekce: Pokud user ma jen Google Sign-In (bez hesla) → mesej "Pouzivas Google Sign-In, zmena hesla neni dostupna"
- Fields: Stare heslo, Nove heslo, Potvrzeni noveho hesla
- Validace: Stare heslo validation, nova hesla se schoduji, sila hesla >= 75%
- Error handling: Mapy Firebase errory (wrong-password, weak-password, requires-recent-login, too-many-requests)
- useNotification() pro zpravy

#### Billing Tab (S2.5)
- Napojeni `readTenantJson('subscription:v1')` pro subscriptionData
- planConfig:
  ```javascript
  {
    starter: { name: 'Starter', price: '499 Kč / $20', features: [...] },
    professional: { name: 'Professional', price: '1,999 Kč / $80', features: [...] },
    enterprise: { name: 'Enterprise', price: 'Na míru', contact: true }
  }
  ```
- Zobrazeni: Active plan badge, seznam features, Upgrade/Contact button
- Invoices/Payments: Empty state "Zatím žádné faktury" / "Zatím žádné platby"
- ARIA role: `role=tablist`, `role=tab`, `aria-selected`, `role=tabpanel`, `aria-labelledby`

**Duvod:** Vsechny 4 taby napojeny na realna data (Firebase auth, tenant storage, Supabase read).

---

### 6. `src/providers/FirebaseAuthProvider.jsx`

**Typ:** Zmeno

**Radky:** Sekce changePassword (novy kod cca 50-80 radku)

**Zmeny:**
- Pridana nová funkce `changePassword(oldPassword, newPassword)`
  ```javascript
  async changePassword(oldPassword, newPassword) {
    // Reautentikace: reauthenticateWithPopup(auth.currentUser, googleProvider)
    // updatePassword(auth.currentUser, newPassword)
    // Error handling: wrong-password, weak-password, requires-recent-login, too-many-requests
    // Toast zprava: success vs error s konkretnim textem
  }
  ```
- Export v AuthContext getter

**Duvod:** Backend pro Security tab — zmena hesla s reauth.

---

### 7. `src/pages/account/index.jsx` — React.memo extraction

**Typ:** Zmeno (refactoring pro optimalizaci)

**Zmeny:**
- Vytvoreni FormInput a Card komponent na module scope s React.memo
  ```javascript
  const FormInput = React.memo(({ label, value, onChange, ... }) => ...)
  const Card = React.memo(({ title, children }) => ...)
  ```
- Prevence zbytecnych rerenderingu pri zmene ostatnich stavu

**Duvod:** Performance optimalizace — Account page je velka (4 taby), memo preveni zbytecne rerenderovani.

---

### 8. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeno

**Radky:** Dictionary CS/EN (cca 1200-1250)

**Zmeny:**
- Nove preklady (Billing tab):
  - `billing.plan.active`: "Aktivní plán"
  - `billing.plan.custom`: "Vlastní plán"
  - `billing.payment.none`: "Zatím žádné faktury"
  - `billing.history.none`: "Zatím žádné platby"
- Nove preklady (Account obecne):
  - `account.profile.tab`: "Profil"
  - `account.company.tab`: "Společnost"
  - `account.security.tab`: "Bezpečnost"
  - `account.billing.tab`: "Fakturace"

**Duvod:** i18n pro Billing tab a ostatni labely.

---

### 9. `docs/claude/Documentation/Account-Dokumentace.md`

**Typ:** Zmeno (dulezita dokumentace)

**Zmeny:**
- Vytvorena kompletni dokumentace (16 sekci):
  1. Pregled (co je Account page)
  2. Architecture (components, contexts, storage)
  3. Profile Tab (fields, validace, Firebase)
  4. Company Tab (fields, validace, storage)
  5. Security Tab (changePassword, Firebase reauth)
  6. Billing Tab (planConfig, invoices, payments)
  7. Notifikace (Toast system integration)
  8. i18n (seznam prekladu)
  9. ARIA (accessibility checklist)
  10. Testing (manual test checklist)
  11. Error handling (Firebase error mapping)
  12. Performance (React.memo notes)
  13. Security (auth guards, input validation)
  14. API integrace (Firebase, Supabase read)
  15. Future work
  16. Pasti a problemy

**Duvod:** Kompletni dokumentace pro buduci vyvoj a maintainerism.

---

### 10. `docs/claude/PLANS/Sprint2-Account-RealData-Plan.md`

**Typ:** Pridano (novy soubor)

**Zmeny:**
- Vytvoreni implementacniho planu pro Sprint 2 (12 fazi)
- Kazda faze: Scope, Agent, Vystupy, Build status
- Strida pracovni a kontrolni faze dle 4kroky.md
- Vsechny detaily: soubory, zmeny, adepty agentu, timeline, rizika

**Duvod:** Transparentni planovani pro duplikaci budoucich sprinta.

---

### 11. `Sprint-Plan-Auth.md` (v root)

**Typ:** Zmeno

**Zmeny:**
- Update Sprint 2 status: NEZACATO → HOTOVO
- Data: 2026-02-24
- Soubory: +10
- Build: PASS

**Duvod:** Tracking progress v projektovem planu.

---

### 12. `MEMORY.md`

**Typ:** Zmeno

**Zmeny:**
- Pridana sekce "## Sprint 2 implementace (2026-02-24)"
- Obsah:
  - Architektura Toast systemu
  - Tenant storage pattern (company:v1)
  - Firebase changePassword flow
  - planConfig struktura (Starter/Professional/Enterprise)
  - Dva index.html (sync povinny)
  - ARIA checklist
  - React.memo pro Account page
  - Follow-up: Sprint 3 Team Access

**Duvod:** Auto-memory pro duplikaci vzoru v budoucnosti.

---

## Kontrolni seznam

- [x] Soubor 1: NotificationContext.jsx — vytvoreno
- [x] Soubor 2: ToastContainer.jsx — vytvoreno
- [x] Soubor 3: adminCompanyStorage.js — vytvoreno
- [x] Soubor 4: App.jsx — napojeno
- [x] Soubor 5: FirebaseAuthProvider.jsx — changePassword
- [x] Soubor 6: account/index.jsx — 4 taby
- [x] Soubor 7: LanguageContext.jsx — nove preklady
- [x] Soubor 8: Documentation — aktualizovana
- [x] Soubor 9: Sprint plan — aktualizovan
- [x] Soubor 10: MEMORY.md — aktualizovano
- [x] Build: PASS (finalni 43s)
- [x] Historia: Ulozena (5x pri jednotlivych krocich)

---

## Poznamky a Follow-up

- **Kompletne hotovo:** Vsech 5 ukolu Sprint 2 (S2.1-S2.5) je implementovano a otestovano
- **Kvalita:** Build PASS, Chrome manual test PASS, dokumentace kompletni, MEMORY aktualizovano
- **Agenti:** 3 Middle + 1 Specific (effectivne a specializovane prace)
- **Historicky zaznam:** Vytvoreno v 2026-02-24/049-* s plnym kontextem
- **Nasledujici:** Připravit Sprint 3 (Team Access — S3.1-S3.4) nebo jiny prioritizovany feature

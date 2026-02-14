# AdminTeamAccess — Dokumentace

> Admin stranka pro spravu tymu v ramci tenanta. Obsahuje 3 zalozky (Users, Roles & Permissions, Audit Log) s invite flow, role managementem, seat limity a auditnim logem. Forge dark theme s inline styly + Tailwind utility tridy.

---

## 1. Prehled (URL /admin/team)

AdminTeamAccess stranka je dostupna na route `/admin/team` v ramci admin layoutu. Slouzi ke sprave uzivatelu a pristupu v ramci jednoho tenanta.

Stranka poskytuje:

- **Users** — seznam uzivatelu a pozvanek, seat limit counter, role management, enable/disable/remove akce
- **Roles & Permissions** — read-only prehled definovanych roli (Admin, Operator) a jejich opravneni
- **Audit Log** — prohledavatelny log vsech tymovych akci s filtry a detailnim nahlizecem

Souvisejici stranka: **InviteAccept** (`/invite/accept?token=...`) — verejna stranka pro prijeti pozvanky.

Stranka pouziva **demo localStorage data** pres `adminTeamAccessStorage.js` a `adminAuditLogStorage.js`. Neni napojena na realni auth system.

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 (JSX) |
| Bundler | Vite |
| Styling | Inline styles (Forge CSS custom properties) + Tailwind utility tridy |
| Ikony | lucide-react pres `AppIcon` wrapper (ikonovy wrapper `Icon`) |
| Preklady | `useLanguage()` z LanguageContext (pouze pro titulek `admin.teamAccess`) |
| Routing | React Router v6 (`/admin/team`, vnorena route v admin layoutu) |
| Storage | `adminTeamAccessStorage.js` + `adminAuditLogStorage.js` (tenant-scoped localStorage) |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminTeamAccess.jsx                     -- Hlavni stranka (839 radku)

src/pages/
  InviteAccept.jsx                        -- Verejna stranka pro prijeti pozvanky (225 radku)

src/utils/
  adminTeamAccessStorage.js               -- CRUD pro uzivatele a pozvanky (438 radku)
  adminAuditLogStorage.js                 -- Audit log storage a filtr (157 radku)
```

### Zarazeni v Routes.jsx

```jsx
// Routes.jsx radek 107
<Route path="team" element={<AdminTeamAccess />} />

// Routes.jsx radek 91 (verejna route mimo admin)
<Route path="/invite/accept" element={<InviteAccept />} />
```

---

## 4. Import graf

### AdminTeamAccess.jsx

```
AdminTeamAccess.jsx
  +-- React, useEffect, useMemo, useRef, useState    (react)
  +-- useLanguage                                      (../../contexts/LanguageContext)
  +-- Icon                                             (../../components/AppIcon)
  +-- adminTeamAccessStorage:
  |     acceptInviteToken, changeUserRole, createInvite,
  |     deleteInvite, deleteUser, disableUser, enableUser,
  |     getSeatLimit, getTeamInvites, getTeamSummary, getTeamUsers,
  |     resendInvite
  +-- adminAuditLogStorage:
        getAuditEntries, searchAuditEntries
```

### InviteAccept.jsx

```
InviteAccept.jsx
  +-- React, useMemo, useState                        (react)
  +-- useLocation, useNavigate                         (react-router-dom)
  +-- Icon                                             (../components/AppIcon)
  +-- ForgeButton                                      (../components/ui/forge/ForgeButton)
  +-- acceptInviteToken, getInviteByToken              (../utils/adminTeamAccessStorage)
```

---

## 5. Design a vizual

### Theme

Stranka pouziva **Forge dark theme** kombinaci inline stylu a Tailwind utility trid. Narozdil od jinych admin stranek, pouziva hybridni pristup (ne ciste inline, ne ciste Tailwind).

### Forge tokeny pouzite na strance

| Token | Ucel |
|-------|------|
| `--forge-bg-void` | Pozadi stranky |
| `--forge-bg-surface` | Pozadi karet, tabulek, filtroveho panelu |
| `--forge-bg-elevated` | Pozadi hlavicek tabulek, inputu, selectu, badge |
| `--forge-text-primary` | Hlavni text, jmena uzivatelu |
| `--forge-text-secondary` | Podtitulky, popisy, datumy |
| `--forge-text-muted` | Labels (uppercase tech), popisky, prazdne stavy |
| `--forge-accent-primary` | Seat limit badge, invite button, aktivni tab, enable button |
| `--forge-error` | Remove button, revoke button, error zpravy |
| `--forge-success` | Enable button, simulate accept button |
| `--forge-border-default` | Ohraniceni karet, tabulek, inputu, badge |
| `--forge-font-tech` | Uppercase labels (11-12px), seat limit, permission tagy |

### Layout

- Min-height: 100vh, pozadi `--forge-bg-void`
- Padding: `1.5rem (24px)`
- Header: titulek + popis vlevo, seat limit box + invite button vpravo
- Tab bar: 3 tlacitka s border-based zvyraznenim aktivniho tabu
- Summary karty: 3-sloupcovy grid (Active users, Pending invites, Disabled users)
- Tabulka: plna sirka, zaoblene rohy, alternujici radky (surface/void)

### Barvy badge podle statusu

| Status | Barva pozadi | Barva textu | Border |
|--------|-------------|-------------|--------|
| `active` | green-600/20 | green-200 | green-500/30 |
| `disabled` | gray-600/20 | gray-200 | gray-500/30 |
| `invited` / `pending` | yellow-600/20 | yellow-200 | yellow-500/30 |
| `revoked` | red-600/20 | red-200 | red-500/30 |
| default | gray-600/20 | gray-200 | gray-500/30 |

---

## 8. UI komponenty

### 8.1 Helper funkce (definovane mimo komponentu)

| Funkce | Popis |
|--------|-------|
| `badgeClass(status)` | Vraci Tailwind tridy pro status badge podle stavu (active, disabled, pending, revoked) |
| `formatDate(ts)` | Formatuje ISO timestamp na `toLocaleString()`, vraci `'—'` pro prazdne/invalidni hodnoty |
| `copyToClipboard(text)` | Kopiruje text do schranky pres `navigator.clipboard.writeText()`, silent fail |

### 8.2 Tab navigace

3 zalozky definovane v konstantach `TABS`:

| ID | Label | Obsah |
|----|-------|-------|
| `users` | Users | Tabulka uzivatelu a pozvanek + summary karty |
| `roles` | Roles & Permissions | Grid karet s definicemi roli |
| `audit` | Audit Log | Filtrovaci panel + tabulka audit zaznamu |

Aktivni tab: `--forge-bg-elevated` pozadi, `--forge-accent-primary` border a text.

### 8.3 Tab Users

**Summary karty** (grid 3 sloupce):
- Active users — cislo v accent barve
- Pending invites — cislo v primary textu
- Disabled users — cislo v primary textu

**Tabulka Users & Invites** — zaoblena, se zahlavi:
| Sloupec | Obsah |
|---------|-------|
| User | Jmeno + email (nebo email + expiry pro pozvanky) |
| Role | Select (admin/operator) s confirm dialogem pro zmenu |
| Status | Barevny badge (active, disabled, pending, revoked, expired) |
| Last login | Formatovany datum, `'—'` pro pozvanky |
| Actions | Kontextualni tlacitka (viz 8.4) |

### 8.4 Akce pro uzivatele a pozvanky

**Uzivatel (active):**
- Disable — confirm dialog, vola `disableUser(id)`
- Remove — confirm dialog, vola `deleteUser(id)`

**Uzivatel (disabled):**
- Enable — confirm dialog, vola `enableUser(id)`
- Remove — confirm dialog, vola `deleteUser(id)`

**Pozvanka (pending):**
- Copy link — kopiruje invite URL do schranky
- Resend — confirm dialog, generuje novy token, vola `resendInvite(id)`
- Revoke — confirm dialog, vola `deleteInvite(id)` (alias `revokeInvite`)
- Simulate accept — demo-only, vola `acceptInviteToken(token, { name })`

**Pozvanka (jiny status):**
- "No actions" text

### 8.5 Tab Roles & Permissions

Grid 2 sloupce, kazda role jako karta:

**Admin:**
- Popis: "Plny pristup + sprava tymu + audit log"
- 18 opravneni: `dashboard.read`, `pricing.read/write`, `fees.read/write`, `parameters.read/write`, `presets.read/write`, `orders.read/write_status/export`, `branding.read/write`, `widget.read/write`, `team.read/write`, `audit.read`

**Operator:**
- Popis: "Prace s objednavkami + read-only konfigurace"
- 10 opravneni: `dashboard.read`, `orders.read/write_status/export`, `pricing.read`, `fees.read`, `parameters.read`, `presets.read`, `branding.read`, `widget.read`

Kazda role ma badge "MVP" v pravem hornim rohu.

### 8.6 Tab Audit Log

**Filtrovaci panel** (grid 6 sloupcu):
| Filtr | Typ | Popis |
|-------|-----|-------|
| Search | text input (2 col span) | Fulltext hledani v email, action, entity |
| Actor | select | Vyber z unikatnich actor emailu |
| Entity | select | team, orders, pricing, fees, parameters, presets, branding, widget |
| Action | text input | Presny nazev akce (napr. TEAM_INVITE_SENT) |
| Date from | date input | Od data |
| Date to | date input | Do data |

**Reset filters** tlacitko vynuluje vsechny filtry.

**Tabulka audit zaznamu:**
| Sloupec | Obsah |
|---------|-------|
| Time | Formatovany timestamp |
| Actor | Email aktora nebo "System" |
| Action | Nazev akce v tech stylu badge |
| Entity | Typ entity + ID |
| Summary | Kratky popis akce |
| ... | View tlacitko pro detail |

### 8.7 Invite modal

Modal (overlay) se zaviracim tlacitkem a formularem:

| Pole | Typ | Validace |
|------|-----|----------|
| Email | text input | Validace na strane storage (isValidEmail) |
| Role | select | operator (default) / admin |
| Message | textarea (volitelne) | Zadna |

Po odeslani se zobrazi **invite link** s tlacitky "Copy link" a "Open accept page".

Seat limit indikator: "Seats used: X/Y".

Modal blokuje scroll na body (`overflow: hidden`) a zachytava wheel eventy.

### 8.8 Audit detail modal

Modal pro zobrazeni detailu audit zaznamu:

- **Meta sekce**: Time, Actor, Action, Entity, IP, User agent
- **Metadata sekce**: JSON.stringify metadat (formatovane)
- **Diff sekce**: JSON.stringify diffu (before/after)

Audit detail modal ma custom smooth scroll (exponential ease-out, faktor 0.18) implementovany pres `requestAnimationFrame`.

---

## 9. State management a data flow

### State

| State | Typ | Ucel |
|-------|-----|------|
| `tab` | string | Aktivni zalozka (TABS.users / roles / audit) |
| `refreshKey` | number | Trigger pro re-read dat po mutaci |
| `inviteOpen` | boolean | Viditelnost invite modalu |
| `inviteEmail` | string | Email v invite formulari |
| `inviteRole` | string | Role v invite formulari (default 'operator') |
| `inviteMessage` | string | Volitelna zprava v invite formulari |
| `inviteError` | string | Chybova zprava invite procesu |
| `lastInviteLink` | string | Posledni vygenerovany invite link |
| `auditQ` | string | Fulltext filtr pro audit log |
| `auditActor` | string | Filtr aktora |
| `auditEntity` | string | Filtr entity |
| `auditAction` | string | Filtr akce |
| `auditDateFrom` | string | Filtr datum od |
| `auditDateTo` | string | Filtr datum do |
| `auditDetail` | object/null | Vybrany audit zaznam pro detail modal |

### Computed data (useMemo, zavisle na refreshKey)

| Data | Zdroj | Popis |
|------|-------|-------|
| `users` | `getTeamUsers()` | Seznam uzivatelu tenanta |
| `invites` | `getTeamInvites()` | Seznam pozvanek |
| `summary` | `getTeamSummary()` | Pocty (active, disabled, pending, seatLimit) |
| `seatLimit` | `getSeatLimit()` | Maximalni pocet mist |
| `actors` | `getAuditEntries()` | Unikatni actor emaily pro filtr select |
| `auditEntries` | `searchAuditEntries(...)` | Filtrovane audit zaznamy |
| `roleDefinition` | staticky | Definice roli a opravneni |
| `seatUsed` | `summary.activeUsers + summary.pendingInvites` | Pouzita mista |

### Data flow

```
localStorage (tenant-scoped)
    |
    v (read pres storage helpery)
useMemo(getTeamUsers/Invites/Summary, [refreshKey])
    |
    v
Render tabulky a summary karet
    |
    v (user action)
confirmAnd('message', () => storageAction(...))
    |
    v
setRefreshKey(k => k+1) --> useMemo re-evaluace --> re-render
```

### Invite flow

```
1. Klik "Invite user" --> setInviteOpen(true)
2. Vyplneni email, role, message
3. Klik "Send invite" --> handleInviteSend()
4. createInvite({ email, role, message }) --> storage zapise pozvanku
5. Generovani invite linku: /invite/accept?token=<token>
6. setLastInviteLink(link) --> zobrazeni v modalu
7. setRefreshKey(k+1) --> refresh tabulky
```

### Invite acceptance flow (InviteAccept.jsx)

```
1. Uzivatel navstivi /invite/accept?token=<token>
2. getInviteByToken(token) --> nacte pozvanku z localStorage
3. Uzivatel vyplni jmeno (volitelne)
4. Klik "Accept Invite" --> acceptInviteToken({ token, name })
5. Pozavanka se oznaci jako 'accepted', novy user se prida do localStorage
6. setTimeout(600ms) --> navigate('/admin/team')
```

---

## 11. Preklady (i18n)

### Mechanismus

Preklady jsou minimalni. Komponenta importuje `useLanguage()` ale pouziva `t()` pouze pro titulek stranky (`admin.teamAccess`). **Vsechny ostatni texty jsou hardcoded v anglictine** (s vyjimkou popisu roli, ktere jsou v cestine).

### Pokryti

| Oblast | Jazyk | Stav |
|--------|-------|------|
| Titulek stranky (h1) | CS/EN pres t() | OK |
| Popis stranky | CS (hardcoded) | **BUG** — neprelozeno |
| Tab labels | EN (hardcoded) | **BUG** — neprelozeno |
| Summary labels | EN (hardcoded) | **BUG** — neprelozeno |
| Tabulkove hlavicky | EN (hardcoded) | **BUG** — neprelozeno |
| Action buttony | EN (hardcoded) | **BUG** — neprelozeno |
| Invite modal | EN (hardcoded) | **BUG** — neprelozeno |
| Audit filtry | EN (hardcoded) | **BUG** — neprelozeno |
| Role popisy | CS (hardcoded) | **BUG** — neprelozeno do EN |
| Permission tagy | EN (technicke nazvy) | OK (technicke identifikatory) |
| Seat limit label | EN (hardcoded) | **BUG** — neprelozeno |
| InviteAccept stranka | EN (hardcoded) | **BUG** — kompletne neprelozeno |

### LanguageContext integrace

V centralnim `LanguageContext.jsx` existuje relevantni klic:
- `admin.teamAccess`: "Tym a pristup" (CS) / "Team & Access" (EN)

Vsechny ostatni texty jsou primo v JSX bez prekladu.

---

## 14. Bezpecnost

### Soucasny stav

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Autentizace | **Chybi** | Zadna overeni identity; kdokoli muze pristupovat /admin/team |
| Autorizace | **Chybi** | Role jsou definovane ale **nevynucovane** — neni opravneni gate |
| Invite token | **Slaby** | `Math.random()` neni kryptograficky bezpecny; predikovatelny token |
| Invite expirace | **Implementovana** | 7 dni, automaticka expirace pri cteni |
| Seat limit | **Implementovan** | Kontroluje se pri vytvareni pozvanky |
| Confirm dialogy | **Zakladni** | `window.confirm()` pro destruktivni akce |
| XSS | **Nizke riziko** | React escapuje JSX; zadne `dangerouslySetInnerHTML` |
| CSRF | **N/A** | Vse je localStorage, zadne HTTP pozadavky |
| Audit log | **Demo-only** | Client-side, manipulovatelny; max 2000 zaznamu |

### Doporuceni

1. **Implementovat skutecny auth system** pred produkci — prihlaseni, session tokeny
2. **Pridat permission gate** — operator nesmi pristupovat /admin/team (team.read/write opravneni)
3. **Nahradit Math.random()** kryptograficky bezpecnym generatorem (`crypto.randomUUID()` nebo `crypto.getRandomValues()`)
4. **Presunout audit log na server** — client-side audit log je trivialne manipulovatelny
5. **Pridat rate limiting** na invite operace
6. **Pridat CAPTCHA** na invite accept stranku

---

## 16. Souvisejici dokumenty

| Dokument | Cesta / odkaz |
|----------|---------------|
| AdminTeamAccess.jsx | `Model_Pricer-V2-main/src/pages/admin/AdminTeamAccess.jsx` |
| InviteAccept.jsx | `Model_Pricer-V2-main/src/pages/InviteAccept.jsx` |
| adminTeamAccessStorage.js | `Model_Pricer-V2-main/src/utils/adminTeamAccessStorage.js` |
| adminAuditLogStorage.js | `Model_Pricer-V2-main/src/utils/adminAuditLogStorage.js` |
| Routes.jsx | `Model_Pricer-V2-main/src/Routes.jsx` (radky 91, 107) |
| LanguageContext | `Model_Pricer-V2-main/src/contexts/LanguageContext.jsx` |
| Forge tokens | `Model_Pricer-V2-main/src/styles/forge-tokens.css` |
| AppIcon | `Model_Pricer-V2-main/src/components/AppIcon.jsx` |
| Design Error Log | `docs/claude/Design-Error_LOG.md` |

---

## 17. Zname omezeni

### Kriticke (P0)

1. **searchAuditEntries volani je nefunkcni.** UI vola `searchAuditEntries({ q, actor_email, entity_type, ... })` jako jediny argument, ale storage funkce `filterAuditEntries(entries, { q, actor, entity, ... })` ocekava pole audit zaznamu jako prvni argument a filtr objekt jako druhy. Navic nazvy properties se lisi: UI posila `actor_email`/`entity_type`/`date_from`/`date_to`, storage ocekava `actor`/`entity`/`dateFrom`/`dateTo`. **Dusledek:** Audit log filtrovani nefunguje — vzdy zobrazi vsechny zaznamy bez ohledu na filtry.

2. **createInvite (handleInviteSend) error handling je nefunkcni.** UI pouziva try/catch kolem `createInvite()`, ale storage funkce `inviteUser()` nikdy nevyhazuje vyjimku — vraci `{ ok: false, error: 'REASON' }`. Business chyby (INVALID_EMAIL, ALREADY_MEMBER, SEAT_LIMIT_REACHED) se nikdy nezobrazi uzivateli. **Dusledek:** Uzivatel nedostane feedback pri chybe.

3. **acceptInviteToken (Simulate accept) predava argumenty spatne.** UI (radek 453) vola `acceptInviteToken(inv.token, { name })` kde prvni argument je string token. Storage funkce `acceptInviteToken({ token, name }, ctx)` ocekava objekt `{ token, name }` jako prvni argument. **Dusledek:** Simulate accept tlacitko nefunguje — token se nepredava spravne.

4. **Zadna autentizace ani autorizace.** Stranka je pristupna bez prihlaseni. Role jsou definovane ale nevynucovane. Operator muze delat vse co admin.

### Vysoke (P1)

5. **Kompletni absence i18n.** Krome titulku stranky jsou vsechny texty hardcoded v anglictine (nebo role popisy v cestine). Stranka je jazykove nekonzistentni.

6. **Invite token generovany pres Math.random().** Neni kryptograficky bezpecny, predikovatelny. Brute-force utok na token je trivialni.

7. **Audit log je client-side.** Vsechna data v localStorage — manipulovatelna pres DevTools. Zadna integrita zaznamu.

8. **changeUserRole (select) meni roli pri kazde zmene selectu.** Select `onChange` okamzite vola `confirmAnd()` s confirm dialogem. Pokud uzivatel zrusi confirm, select vizualne zustava na nove hodnote ale data se nezmeni — nesynchronizovany stav.

### Stredni (P2)

9. **Tab navigace nema ARIA roles.** Chybi `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` na tab buttonech. Chybi `role="tabpanel"` na obsahu.

10. **Tabulky nejsou sortovatelne ani filtrovatelne.** Users & Invites tabulka nema zadne razeni ani filtrovani (na rozdil od Audit Log tabu).

11. **Scroll containment pres wheel event blocking.** Invite modal kompletne blokuje wheel eventy (i kdyz neni co scrollovat). Audit detail modal ma custom smooth scroll implementaci misto nativniho CSS (`overflow-y: auto`).

12. **Seat limit zavisi na getPlanFeatures.** Defaultni seat limit je 1 (Starter plan). Pro testovani vice uzivatelu je nutne nastavit plan features v localStorage.

13. **Role popisy jsou v cestine v anglickem kontextu.** "Plny pristup + sprava tymu + audit log" a "Prace s objednavkami + read-only konfigurace" — nesoulad s anglickymi UI texty.

14. **Invite link je zobrazeny v modalu ale neni odeslany.** Neni implementovano emailove odeslani — uzivatel musi rucne zkopirovat a sdelet link. Pro demo to je OK ale v produkci to neni pouzitelne.

15. **InviteAccept stranka nema tenant routing.** Invite token se hleda v aktualnim tenantu (`getTenantId()`). Pokud uzivatel nema nastaveny spravny tenant, pozvanku nenajde.

---

## Nalezene chyby — souhrn

| # | Typ | Priorita | Popis | Kde |
|---|-----|----------|-------|-----|
| T1 | logic | P0 | searchAuditEntries volani s nespravnou signaturou — filtry nefunguji | AdminTeamAccess.jsx:150-158 |
| T2 | logic | P0 | createInvite error handling pres try/catch ale funkce vraci { ok: false } | AdminTeamAccess.jsx:210-222 |
| T3 | logic | P0 | acceptInviteToken predava token jako string misto objektu | AdminTeamAccess.jsx:453 |
| T4 | security | P0 | Zadna autentizace/autorizace na admin team strance | AdminTeamAccess.jsx (cele) |
| T5 | i18n | P1 | Vsechny texty krome titulku hardcoded v anglictine | AdminTeamAccess.jsx (cele) |
| T6 | security | P1 | Math.random() pro invite tokeny — ne kryptograficky bezpecny | adminTeamAccessStorage.js:27-29 |
| T7 | ux | P1 | Select role onChange nesynchronizuje vizualni stav po Cancel | AdminTeamAccess.jsx:351-353 |
| T8 | a11y | P2 | Tab navigace bez ARIA roles (tablist, tab, tabpanel) | AdminTeamAccess.jsx:261-295 |
| T9 | a11y | P2 | Tabulka bez sortovani/filtrovani | AdminTeamAccess.jsx:330-480 |
| T10 | i18n | P2 | Role popisy v cestine v jinak anglickem kontextu | AdminTeamAccess.jsx:166, 192 |
| T11 | i18n | P2 | InviteAccept stranka kompletne v anglictine | InviteAccept.jsx (cele) |
| T12 | ux | P2 | Seat limit default 1 — neni mozne testovat multi-user scenare | adminTeamAccessStorage.js:110 |

---

## Storage helper — adminTeamAccessStorage.js

### localStorage klice

| Klic | Format | Popis |
|------|--------|-------|
| `modelpricer:${tenantId}:team_users` | JSON array | Seznam uzivatelu tenanta |
| `modelpricer:${tenantId}:team_invites` | JSON array | Seznam pozvanek tenanta |

### Exportovane funkce

| Funkce | Signatura | Popis |
|--------|-----------|-------|
| `getTenantForTeam()` | `() => string` | Alias pro getTenantId() |
| `getSeatLimit(tenantId?)` | `(string?) => number` | Vraci max_users z plan features (default 1) |
| `getTeamUsers(tenantId?)` | `(string?) => User[]` | Vraci seznam uzivatelu (seeduje demo admina pokud prazdne) |
| `getTeamInvites(tenantId?)` | `(string?) => Invite[]` | Vraci seznam pozvanek (auto-expiruje) |
| `getTeamSummary(tenantId?)` | `(string?) => Summary` | Vraci pocty (activeUsers, disabledUsers, pendingInvites, seatLimit) |
| `inviteUser(data, ctx?)` | `({email, role, message, expiryDays}, ctx?) => Result` | Vytvori pozvanku |
| `resendInvite(inviteId, ctx?)` | `(string, ctx?) => Result` | Pregeneruje token pozvanky |
| `revokeInvite(inviteId, ctx?)` | `(string, ctx?) => Result` | Zrusi pozvanku (status: 'revoked') |
| `acceptInviteByToken(token, ctx?)` | `(string, ctx?) => Result` | Prijme pozvanku, vytvori uzivatele |
| `updateUserRole(userId, role, ctx?)` | `(string, string, ctx?) => Result` | Zmeni roli uzivatele |
| `setUserEnabled(userId, enabled, ctx?)` | `(string, boolean, ctx?) => Result` | Zapne/vypne uzivatele |
| `removeUser(userId, ctx?)` | `(string, ctx?) => Result` | Odebere uzivatele z tenanta |

### UI aliasy (kompatibilni nazvy)

| Alias | Skutecna funkce |
|-------|----------------|
| `createInvite` | `inviteUser` |
| `deleteInvite` | `revokeInvite` |
| `changeUserRole` | `updateUserRole` |
| `disableUser(id, ctx)` | `setUserEnabled(id, false, ctx)` |
| `enableUser(id, ctx)` | `setUserEnabled(id, true, ctx)` |
| `deleteUser` | `removeUser` |
| `getInviteByToken(token, ctx?)` | Vyhledani pozvanky podle tokenu (sanitizovany objekt) |
| `acceptInviteToken({token, name}, ctx?)` | Prijme pozvanku pres token |

### Supabase dual-write

Funkce `writeUsers` a `writeInvites` podporuji fire-and-forget dual-write do Supabase (`team_members` tabulka) pokud je storage mode `supabase` nebo `dual-write`. Tento rezim se kontroluje pres `getStorageMode('team_users')` a `isSupabaseAvailable()`.

### Audit integrace

Vsechny mutacni operace (invite, resend, revoke, accept, role change, enable/disable, remove) automaticky zapiuji zaznam do audit logu pres `appendAuditEntry()`. Audit akce:

| Akce | Popis |
|------|-------|
| `TEAM_INVITE_SENT` | Nova pozvanka |
| `TEAM_INVITE_RESENT` | Opakovana pozvanka (novy token) |
| `TEAM_INVITE_REVOKED` | Zrusena pozvanka |
| `TEAM_INVITE_ACCEPTED` | Prijata pozvanka |
| `TEAM_ROLE_CHANGED` | Zmena role uzivatele |
| `TEAM_USER_ENABLED` | Uzivatel aktivovan |
| `TEAM_USER_DISABLED` | Uzivatel deaktivovan |
| `TEAM_USER_REMOVED` | Uzivatel odebran |

### Seed data

Pokud neexistuji zadni uzivatele, automaticky se vytvori demo admin:
```javascript
{
  id: 'u_admin_demo',
  name: 'Admin',
  email: 'admin@modelpricer.demo',
  role: 'admin',
  status: 'active',
  lastLoginAt: '<current timestamp>',
  createdAt: '<current timestamp>',
}
```

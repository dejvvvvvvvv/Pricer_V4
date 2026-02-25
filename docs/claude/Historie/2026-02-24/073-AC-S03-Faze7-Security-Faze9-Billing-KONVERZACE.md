# KONVERZACE — Sprint 2 Fáze 7+9 (Security & Billing)

**ID:** 048-AC
**Datum:** 2026-02-24
**Session:** S03
**Téma:** Sprint 2 finalizace — Security tab (changePassword) + Billing tab (subscription + i18n + a11y)

---

## Plná konverzace

### Claude (Inicializace Fáze 7 — Security Tab)

> **Fáze 7 — Security Tab:** Implementace changePassword funkce v FirebaseAuthProvider s Google-only detekcí.
>
> Klíčové body:
> - Nová funkce `changePassword(currentPassword, newPassword)` v FirebaseAuthProvider
> - Reautentikace EmailAuthProvider (Firebase bezpečnostní politika)
> - Security tab formulář s per-field validací
> - Google-only detekce: `authProvider === 'google'` → informační karta (bez inputu)
> - Firebase error mapping: auth/wrong-password, auth/invalid-credential, auth/weak-password, auth/requires-recent-login, auth/too-many-requests
> - Per-field validace: currentPassword required, newPassword sila >= 75%, confirmPassword match
> - Toast feedback pro success/error

### Claude (Inicialisace Fáze 9 — Billing Tab)

> **Fáze 9 — Billing Tab + i18n + a11y:**
>
> Klíčové body:
> - Billing tab napojený na readTenantJson('subscription:v1')
> - planConfig: Starter 499Kč/$20, Professional 1999Kč/$80, Enterprise custom
> - Fake invoices a payment methods → empty states se zprávami
> - ARIA opravy: role=tablist, role=tab, aria-selected, role=tabpanel, aria-labelledby
> - FormInput a Card extrahované na module scope s React.memo
> - Nové překlady: billing.plan.active, billing.plan.custom, billing.payment.none, billing.history.none
> - Build PASS (43s)

---

## Klíčové rozhodování

- **changePassword funkce:** EmailAuthProvider vyžaduje reauthentikaci (Firebase bezpečnostní politika) — implementován v FirebaseAuthProvider, ne v komponentě (separation of concerns)
- **Google-only detekce:** Díky `firebaseAuthProvider` z LanguageContext — pokud je 'google', nenabídneme email/heslo formulář, pouze info karta
- **Password sila:** >=75% z zxcvbn score — volba je škálovatelná (pokud potřeba vyšší, zvýšit threshold)
- **Billing storage:** subscription:v1 zatím dummy data (null), ale připraveno na Supabase migraci
- **ARIA:** Plná role specifikace (tablist, tab, tabpanel) — WCAG AA
- **React.memo:** FormInput a Card na module scope — eliminace zbytečných re-renderů

---

## Vývody

Sprint 2 implementace je **prakticky kompletní**:
- S2.1: Toast system — DONE
- S2.2: Profile tab — DONE
- S2.3: Company tab — DONE
- S2.4: Security tab — DONE
- S2.5: Billing+i18n+a11y — DONE

**Zbývá:**
1. Finální `npm run build` a ověření
2. Aktualizace AccountPage-Dokumentace.md
3. Git commit
4. Základ pro Sprint 3 (Dashboard, Supabase integrace)

---

## Session metadata

- **Trvání:** Single session (S03)
- **Scope:** Sprint 2 finalizace — 2 fáze na jednou (Fáze 7 + Fáze 9)
- **Build status:** PASS ✓
- **Dokumentace:** Na stavu

# 23. Admin — Team Access — Detailni RoadMap Plan

> **Stav:** 🟡 35% hotovo | **Priorita:** NIZKA
> **Zavislosti na jine sekce:** Auth (#20) pro Firebase Auth, Emaily (#22) pro invite, RBAC (#20.4)
> **Kdo na nem zavisi:** Nikdo primo

---

## Prehled

Admin stranka pro spravu tymu — pozivani clenu, prirazovani roli, audit log. UI je hotove, ale vse je jen demo v localStorage bez realneho auth propojeni.

**Hlavni soubor:** `src/pages/admin/AdminTeam.jsx`

---

## Co je HOTOVO (✅)

### UI (70%)
- [x] 3 taby: Users, Roles, Audit
- [x] Seznam clenu tymu
- [x] Role system (admin, editor, viewer)
- [x] Invite workflow — generovani invite linku

---

## Co CHYBI / je potreba dodelat

### Faze 1: Napojeni na Firebase Auth (Priorita: STREDNI)

#### Ukol 1.1: Realne invite
- **Co udelat:**
  - [ ] Generovani invite tokenu
  - [ ] Invite email pres Resend (#22)
  - [ ] Invite stranka — novy uzivatel se registruje a je prirazen k tenantu
  - [ ] Expirace invite linku (napr. 7 dni)
  - [ ] Ulozeni invite do Supabase (tabulka `team_invites`)

#### Ukol 1.2: Team clenstvi
- **Co udelat:**
  - [ ] Tabulka `team_members` v Supabase: tenant_id, user_id, role, invited_by, joined_at
  - [ ] Po registraci pres invite: automaticky prirazeni k tenantu
  - [ ] Firebase custom claims: `{ tenantId: 'xxx', role: 'editor' }`

### Faze 2: Realna autorizace (Priorita: STREDNI)

#### Ukol 2.1: Role-based pristup
- **Co udelat:**
  - [ ] Propojit s RBAC systemem (#20.4)
  - [ ] Viewer nevidi team sekci
  - [ ] Editor nemuze menit role
  - [ ] Jen owner muze mazat cleny a menit role

### Faze 3: Pokrocile (post-Beta)

#### Ukol 3.1: Audit log
- **Co udelat:**
  - [ ] Logovani vsech team akci do Supabase
  - [ ] Kdo co zmenil a kdy

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti |
|---|------|--------|------------|
| 1 | Faze 1: Firebase invite | 4-6h | Auth (#20), Emaily (#22) |
| 2 | Faze 2: RBAC | 3-4h | Auth RBAC (#20.4) |
| 3 | Faze 3: Audit | post-Beta | Supabase (#27) |

**Celkem pro Beta:** ~7-10 hodin (ale nizka priorita — muze byt po beta)

---

## Poznamky

- Pro Beta staci jeden uzivatel (owner) — team access muze byt post-Beta
- Demo UI je dobre pro prezentaci potencialnim zakaznikum
- **? OTAZKA:** Je team access nutny pro Beta? Pravdepodobne ne — vetsina 3D tiskovych firem ma 1-3 lidi

---

## Kriticke doplnky (z review)

### Invite flow — detailni sekvence
1. Owner klikne "Pozvat clena" v AdminTeam
2. Vyplni email a vybere roli (editor/viewer)
3. Backend vytvori invite zaznam v Supabase: `{ token, email, role, tenant_id, expires_at, invited_by }`
4. Backend odesle invite email pres Resend (#22) s odkazem: `https://modelpricer.com/invite/{token}`
5. Novy uzivatel klikne na odkaz → zobrazi se registracni formular
6. Po registraci: backend overi token → nastavi Firebase custom claims `{ tenantId, role }` → smaze invite
7. Uzivatel je automaticky prirazen k tenantu a vidi admin panel

### Role matice
| Akce | Owner | Editor | Viewer |
|------|-------|--------|--------|
| Pricing/Materials | rw | rw | r |
| Fees/Presets | rw | rw | r |
| Orders | rw | rw | r |
| Branding | rw | rw | r |
| Team management | rw | - | - |
| Billing/Stripe | rw | - | - |
| Widget Builder | rw | rw | - |
| Analytics | r | r | r |
| Danger actions (delete) | rw | - | - |

### Bezpecnost invite systemu
- [ ] Token: kryptograficky nahodny, 64 znaku hex
- [ ] Expirace: 7 dnu (konfigurovatelne)
- [ ] Jednorazove pouziti — po registraci se token invaliduje
- [ ] Rate limiting: max 10 pozvanek za hodinu per-tenant
- [ ] Notifikace ownera pri prihlaseni noveho clena

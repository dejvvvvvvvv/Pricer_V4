# UPRAVY — Sablona pro zaznam zmen

> Tento soubor slouzi jako sablona pro zaznam **zmen v souborech** — seznam zmen, jakou linu se zmeny tykaji, jaky byl duvod.

---

## Hlavicka

**ID:** {NNN}-{ZK} (napr. 001-AU)
**Datum:** {YYYY-MM-DD}
**Oblast:** {oblast} (Auth, Pricing, Storage, atd.)
**Titulek:** {kratky nazev}

---

## Popis (1-3 radky)

Kratke vysvtleni CO se delalo a PROC.

---

## Soubory a zmeny

### 1. `src/providers/FirebaseAuthProvider.jsx`

**Radky:** 45-60, 120-140
**Zmeny:**
- Pridano try/catch kolem `setDoc()` v `loginWithGoogle()`
- Pridano try/catch kolem `setDoc()` v `register()`
- Presna chybova hlaska se loguje v console.error

**Duvod:** Chybejici error handling pri synchronizaci dat do Firestore.

---

## Shrnuty seznam

- [ ] Soubor 1 — zmeny
- [ ] Soubor 2 — zmeny
- [ ] Soubor 3 — zmeny
- [ ] Dokumentace aktualizovana

---

## Poznamky

Jakekoli dodatecne poznamky, edge cases, rizika, follow-up ukoly.

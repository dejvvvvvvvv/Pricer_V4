# 078-ST — OTAZKY A ODPOVEDI — Storage + Tenant Izolace — 2026-02-25

## Metadata
- **ID:** 078-ST
- **Session:** S01
- **Datum:** 2026-02-25
- **Oblast:** Storage + Tenant System
- **Souvisejici ID:** 076-ST (KONVERZACE), 077-ST (UPRAVY)

---

## Kontext

Implementace planu per-user tenant izolace, kde se každý přihlášený uživatel automaticky binduje do vlastního tenant prostoru pomocí Firebase UID. Řešily se kritické designové otázky ohledně modelu dat, migrace starých účtů a chování v různých scénářích.

---

## Otazky a odpovedi

### Q1: 1 uživatel = 1 účet nebo může mít více tenantů?

- **Ptal se:** Claude
- **Otazka:** Má mít jeden uživatel přístup k více tenantu (multi-tenant pro jednoho uživatele) nebo je 1:1 relace (1 uživatel = 1 tenant)?
- **Odpověď:** 1 uživatel = 1 účet, vlastní data. Bez multi-tenant pro jednoho uživatele.
- **Rozhodnutí:** tenantId = user.uid pro nové účty. Prostý a bezpečný model.
- **Dopad:** Zjednodušuje izolaci dat, snižuje komplexitu. Každý login = přístup do jednoho tenant prostoru.

---

### Q2: Co se stane s novým účtem v admin panelu?

- **Ptal se:** Claude
- **Otazka:** Bude nový uživatel vidět demo data v admin panelu, nebo bude mít prázdný admin panel?
- **Odpověď:** Prázdný admin panel (bez demo dat).
- **Rozhodnutí:** Nový uživatel je prázdná tabule — má prázdné pricing, fees, orders, analytics.
- **Dopad:** Správné chování (clean slate). Uživatelé si musí sami nastavit svou konfiguraci.

---

### Q3: Jak se bude chovat david-kunak@seznam.cz po migraci?

- **Ptal se:** Claude
- **Otazka:** Starý testovací účet (david-kunak@seznam.cz) nemá tenantId v Firestore. Co se mu přiřadí?
- **Odpověď:** Migrace starých účtů bez tenantId na tenantId = 'demo-tenant', nové účty dostanou user.uid.
- **Rozhodnutí:** onAuthStateChanged detekuje chybějící tenantId a nastaví 'demo-tenant' pro zachování přístupu k demo datům.
- **Dopad:** Zpětná kompatibilita. Starý účet vidí demo data, nové účty vidí prázdno.

---

### Q4: Má test-kalkulacka vždy ukazovat demo data?

- **Ptal se:** Claude
- **Otazka:** Test-kalkulacka se má vždy renderovat s demo/hardcoded daty, nebo čte data aktuálního tenanta?
- **Odpověď:** Implementace override parametru není v tomto scope.
- **Rozhodnutí:** Test-kalkulacka čte data aktuálního tenanta (getTenantId()). Override bude TODO na později.
- **Dopad:** Test-kalkulacka se chová jako ostré stránky — čte data přihlášeného uživatele. Dočasně neideální pro veřejný demo.

---

### Q5: Synchronizace dat mezi zařízeními?

- **Ptal se:** Claude
- **Otazka:** Jak se budou data synchronizovat, když uživatel přistoupí ze dvou různých zařízení?
- **Odpověď:** Zatím není řešeno. To bude součástí Supabase migrace v dalším chatu.
- **Rozhodnutí:** MIMO SCOPE. localStorage je lokální — bez cross-device sync.
- **Dopad:** Každé zařízení má svou kopii dat. Plné řešení přijde se Supabase.

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnutí | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Model tenantu | 1 uživatel = 1 tenant (tenantId = user.uid) | Multi-tenant na uživatele (komplikovanější) | Q1 |
| 2 | Admin panel nového uživatele | Prázdný (clean slate) | Kopie demo dat (zbytečné) | Q2 |
| 3 | Migrace starých účtů | david-kunak → 'demo-tenant' | Přinutit uživatele resetovat (horší UX) | Q3 |
| 4 | Test-kalkulacka data | Čte aktuální tenant | Vždy demo (TODO override) | Q4 |
| 5 | Cross-device sync | Zatím ne (TODO Supabase) | Implementace hned (out of scope) | Q5 |

---

## Nerozhodnuté otázky

- [ ] Override parametr v loadPricingConfigV3 pro test-kalkulacku (TODO na později)
- [ ] Cross-device synchronizace dat (TODO Supabase migration)

---

<!-- KONEC SABLONY -->

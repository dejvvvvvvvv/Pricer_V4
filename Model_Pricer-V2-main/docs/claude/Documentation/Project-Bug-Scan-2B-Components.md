# Project Bug Scan #2B — UI komponenty a veřejné stránky

**Datum:** 2026-03-18
**Průzkum:** 2. scan, Sekce B (Components + Public pages)

---

## P0 nálezy

### P0-1. Select.jsx bílé pozadí v dark theme
- **Soubor:** `src/components/ui/Select.jsx:122`
- **Popis:** bg-white text-black hardcoded — ignoruje Forge dark theme tokeny. Bílý ostrov v dark UI.
- **Oprava:** Změnit na var(--forge-bg-elevated) a var(--forge-text-primary)
- **Opraveno:** [ ]

### P0-2. ForgeDialog scroll lock neopravuje overflow
- **Soubor:** `src/components/ui/ForgeDialog.jsx:38-44`
- **Popis:** Cleanup vždy overflow='', nezachová předchozí hodnotu. Stacked dialogy rozbijí scroll.
- **Oprava:** Uložit prev overflow do ref, obnovit při cleanup
- **Opraveno:** [ ]

### P0-3. Nested form v LoginForm
- **Soubor:** `src/pages/login/components/LoginForm.jsx:204`
- **Popis:** form uvnitř form — nevalidní HTML, neprediktovatelné chování
- **Oprava:** Reset-password sekce jako div mimo hlavní form
- **Opraveno:** [ ]

---

## P1 nálezy

### P1-1. Header hardcoded 'Upload Model' text
- **Soubor:** `src/components/ui/Header.jsx:243-247`
- **Opraveno:** [ ]

### P1-2. Header window.location.href místo navigate()
- **Soubor:** `src/components/ui/Header.jsx:228-233`
- **Opraveno:** [ ]

### P1-3. ForgeInput label bez htmlFor
- **Soubor:** `src/components/ui/ForgeInput.jsx:46`
- **Opraveno:** [ ]

### P1-4. Select.jsx nested button v button
- **Soubor:** `src/components/ui/Select.jsx:142-151`
- **Opraveno:** [ ]

### P1-5. ForgeDialog aria-label místo aria-labelledby
- **Soubor:** `src/components/ui/ForgeDialog.jsx:194`
- **Opraveno:** [ ]

### P1-6. ForgeButton chybí disabled prop pro Link varianta
- **Soubor:** `src/components/ui/forge/ForgeButton.jsx:17`
- **Opraveno:** [ ]

### P1-7. Duplicitní key v home marquee
- **Soubor:** `src/pages/home/index.jsx:189,194`
- **Opraveno:** [ ]

### P1-8. Contact form false success
- **Soubor:** `src/pages/support/index.jsx:469`
- **Opraveno:** [ ]

### P1-9. PwaInstallBanner nestandardní t() helper
- **Soubor:** `src/components/ui/PwaInstallBanner.jsx:18`
- **Opraveno:** [ ]

### P1-10. ForgeToast timer restart s inline onDismiss
- **Soubor:** `src/components/ui/forge/ForgeToast.jsx:34-59`
- **Opraveno:** [ ]

### P1-11. useMemo pro side-effect mutaci geometry
- **Soubor:** `src/pages/model-upload/index.jsx:107-113`
- **Opraveno:** [ ]

---

## P2 nálezy

### P2-1. ForgeButton primary hardcoded color
### P2-2. LoginForm neexistující ForgeButton variant 'secondary'
### P2-3. Footer JS-based responsive místo CSS
### P2-4. ScrollToTopButton z-index 50
### P2-5. NotFound e.target místo e.currentTarget
### P2-6. Pricing FAQ role=tab bez tabIndex management
### P2-7. Dialog.jsx hardcoded 'Zavrit' bez i18n
### P2-8. GoogleSignInButton hardcoded EN fallbacks
### P2-9. Home hero 90vh problém na mobilech
### P2-10. ForgeSelect label bez htmlFor
### P2-11. Support sticky bez overflow guard
### P2-12. ForgeConfirmDialog loading '...' text
### P2-13. Home/Pricing duplikovaná pricing data
### P2-14. LoadingState/ErrorState nezkontrolovány

---

## Statistika
- P0: 3 nálezy
- P1: 11 nálezů
- P2: 14 nálezů

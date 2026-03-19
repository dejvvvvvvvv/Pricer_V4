# Project Bug Scan #2E — CSS, Styly, Design System

**Datum:** 2026-03-18
**Průzkum:** 2. scan, Sekce E

---

## P0 nálezy (3)

### P0-1. --forge-accent-teal neexistuje — focus ring fallback
- **Soubor:** `src/styles/index.css:43,55,63,68`
- **Popis:** focus-visible styly referencují neexistující token, browser vždy padne na fallback #14b8a6
- **Oprava:** Přejmenovat na var(--forge-accent-primary, #00D4AA)
- **Opraveno:** [ ]

### P0-2. --forge-text-disabled (#3A3F4A) použit jako čitelný text — WCAG fail
- **Soubory:** AdminTeamAccess.jsx:525,621; AdminParameters.jsx:2503,2712,3098; NotificationCenter.jsx:207
- **Popis:** Kontrast 2.3:1 na dark bg — WCAG AA minimum 4.5:1
- **Oprava:** Změnit na --forge-text-muted pro čitelné texty
- **Opraveno:** [ ]

### P0-3. Invoice preview hardcoded barvy + close button kontrast
- **Soubor:** `src/pages/admin/AdminOrderDetail.jsx:3051-3069`
- **Popis:** Close button #6b7280 na #fff = 3.9:1 kontrast — pod AA
- **Oprava:** Tmavší close button barva
- **Opraveno:** [ ]

---

## P1 nálezy (10)

### P1-1. Duplicitní [data-theme="light"] bloky
- light-theme-admin.css vs light-theme-kalkulacka.css — identické, mohou se přepsat
### P1-2. --forge-text-muted light theme #6B7280 — kontrast 4.48:1 (pod AA)
### P1-3. AdminEmails editor hardcoded barvy
### P1-4. TabShipping preview hardcoded #fff
### P1-5. NotificationCenter toggle knob #fff
### P1-6. AdminSettings #000 na accent — křehký pattern
### P1-7. BackgroundPattern hardcoded white
### P1-8. WidgetEmbedTab/DevicePreviewFrame hardcoded #ffffff
### P1-9. tailwind.css vs forge-tokens — konflikt barev a fontů
### P1-10. Z-index hierarchie bez dokumentace (50→99999)

---

## P2 nálezy (7)

### P2-1. forge-hot-glow bez will-change: filter
### P2-2. forge-focus-ring příliš slabý (0.15 opacity)
### P2-3. AdminActivityLog hardcoded barvy
### P2-4. responsive-kalkulacka font-size 9px pod WCAG
### P2-5. light-theme transitions na pseudo-elementy
### P2-6. Duplicitní .shimmer implementace
### P2-7. --forge-text-lg naming matoucí (1rem ≠ "large")

---

## Z-index mapa projektu
| Hodnota | Komponenta |
|---------|-----------|
| -1, 0 | forge-textures (bg) |
| 1-10 | sticky sloupce, drobné overlay |
| 30-40 | AdminLayout mobile sidebar |
| 50 | dropdowny, floating buttons |
| 60 | OrderTagSelector |
| 100 | NotificationCenter, sticky |
| 200 | Builder color picker |
| 999-1100 | modaly, dialogy, overlay |
| 2000 | AdminModelStorage |
| 9000-9999 | onboarding, toast, command palette |
| 10000-10002 | PwaInstall, onboarding tour |
| 99999 | confetti, ForgeTooltip |

## Statistika
- P0: 3
- P1: 10
- P2: 7

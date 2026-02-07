# Brave Search Usage Log

> Povinný log všech Brave Search dotazů používaných agenty.

---

## Pravidla Logování

1. **Každý Brave query MUSÍ být zalogován** před použitím výsledku
2. **Konkrétní důvod** — ne "general research"
3. **Stručný výsledek** — max 50 znaků

## Povolení Agenti

Pouze tito agenti mohou používat Brave Search:
- `mp-oss-scout` — OSS vyhledávání
- `mp-researcher-web` — Web research

---

## Log

| Datetime | Agent | Reason | Query | Result |
|----------|-------|--------|-------|--------|
| 2026-01-28T10:15:00Z | mp-oss-scout | Widget color picker component | react color picker library 2024 2025 MIT license small bundle size | react-colorful (MIT, 2.8KB gzipped) |
| 2026-01-28T10:15:05Z | mp-oss-scout | Widget iframe auto-resize | iframe-resizer auto height cross-origin npm | iframe-resizer v5 (GPL-3.0 - BLOCK) |
| 2026-01-28T10:15:10Z | mp-oss-scout | IndexedDB wrapper for STL storage | indexeddb wrapper library promise typescript idb npm | idb by jakearchibald (ISC license) |
| 2026-01-28T10:15:15Z | mp-oss-scout | Toast notifications for widget | react toast notification library lightweight accessible 2024 | react-hot-toast, sonner (both MIT) |
| 2026-01-28T10:15:20Z | mp-oss-scout | Modal/Dialog accessibility | react modal dialog library headless accessible focus trap | Radix/Headless UI, focus-trap-react |
| 2026-01-28T10:16:00Z | mp-oss-scout | License verification color picker | react-colorful license github stars bundle size | MIT, 3.2k stars, 2.8KB |
| 2026-01-28T10:16:05Z | mp-oss-scout | License verification iframe | iframe-resizer v5 license MIT Apache GPL | GPL-3.0 (changed from MIT) |
| 2026-01-28T10:16:10Z | mp-oss-scout | License verification IndexedDB | idb jakearchibald license ISC Apache github stars | ISC license, 6k+ stars |
| 2026-01-28T10:16:15Z | mp-oss-scout | License verification toast | react-hot-toast license MIT github stars bundle size | MIT license, 9k+ stars |
| 2026-01-28T10:16:20Z | mp-oss-scout | License verification sonner | sonner toast react license MIT bundle size Emil Kowalski | MIT license, 11.8k stars |
| 2026-01-28T10:17:00Z | mp-oss-scout | iframe-resizer MIT alternative | iframe-resizer alternative MIT license cross-origin postmessage | Need custom implementation |

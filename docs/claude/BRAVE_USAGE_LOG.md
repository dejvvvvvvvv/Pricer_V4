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
| 2026-02-26T14:00:00Z | mp-researcher-web | Offline-first web app patterns for LS-to-cloud migration | offline-first web application patterns localStorage cloud sync 2024 2025 | LogRocket guide, Ink&Switch local-first essay, OfflineQueue pattern |
| 2026-02-26T14:00:15Z | mp-researcher-web | CRDT vs LWW conflict resolution strategies | CRDT conflict resolution web apps last-write-wins merge strategies practical guide | LWW sufficient for admin config, CRDT overkill; field-level merge as middle ground |
| 2026-02-26T14:00:30Z | mp-researcher-web | Supabase Realtime + React cache invalidation patterns | Supabase realtime offline reconnect React hooks cache invalidation pattern 2025 | TanStack Query + Realtime invalidation combo; supabase-cache-helpers library |
| 2026-02-26T14:00:45Z | mp-researcher-web | Dual-write migration strategy localStorage to cloud | localStorage to Supabase migration strategy dual-write offline fallback web app 2025 | PowerSync as dedicated sync engine; dual-write validated as standard approach |
| 2026-02-26T14:30:00Z | mp-researcher-web | Supabase multi-tenant RLS patterns | Supabase multi-tenant SaaS architecture patterns shared database tenant_id RLS best practices 2024 2025 | 10 results: AntStack, Stacksync, Reddit |
| 2026-02-26T14:30:05Z | mp-researcher-web | Cross-device sync with Supabase realtime | Supabase cross-device sync realtime subscription tenant data synchronization pattern | RxDB plugin, Realtime Postgres Changes |
| 2026-02-26T14:30:10Z | mp-researcher-web | Supabase RLS tenant_id code examples | "supabase" "multi-tenant" "tenant_id" RLS policy example code shared database architecture | Logto, Arda Beyazoglu, Ryan O'Neill blogs |
| 2026-02-26T14:30:15Z | mp-researcher-web | RLS performance optimization tips | Supabase RLS performance optimization tips indexes auth.uid() function security definer | 100x improvement with indexes, SECURITY DEFINER |
| 2026-02-26T14:30:20Z | mp-researcher-web | localStorage to Supabase migration | localStorage to Supabase migration pattern dual-write feature flags gradual rollout SaaS | Supabase migration docs, DeepWiki storage |
| 2026-02-26T15:00:00Z | mp-researcher-web | Firebase+Supabase JWT RLS integration | Supabase Firebase Auth integration custom JWT RLS multi-tenant 2024 2025 | Official third-party auth guide found |
| 2026-02-26T15:00:15Z | mp-researcher-web | Supabase service_role tenant isolation | Supabase service_role key current_setting RLS tenant isolation x-tenant-id header | service_role bypasses RLS (risky) |
| 2026-02-26T15:00:30Z | mp-researcher-web | Firebase to Supabase user migration | migrate Firebase Auth to Supabase Auth user migration guide 2024 2025 | Official migration tools exist |
| 2026-02-26T15:00:45Z | mp-researcher-web | Supabase accessToken callback pattern | supabase createClient accessToken callback firebase JWT third party auth RLS | PR #1004 accessToken param in v2.x |
| 2026-03-09T10:00:00Z | mp-researcher-web | Shoptet bank transfer VS settings | Shoptet platba na ucet variabilni symbol nastaveni | VS = cislo objednavky, Shoptet Pay auto-parovani |
| 2026-03-09T10:00:15Z | mp-researcher-web | WooCommerce CZ bank transfer plugins | WooCommerce Czech bank transfer variabilni symbol plugin platba prevodem | Toret Fio, Ceske pluginy QR, Platiti FIO |
| 2026-03-09T10:00:30Z | mp-researcher-web | VS legal rules and max length | variabilni symbol maximalni delka 10 cislic pravidla CNB | Max 10 cislic, pouze cislice, zadna zavazna pravidla slozeni |
| 2026-03-09T10:00:45Z | mp-researcher-web | PrestaShop CZ bank transfer modules | PrestaShop Czech bank transfer module platba prevodem variabilni symbol | Moduly pro ciselny VS, QR kod, auto-parovani Fio/KB/CSOB |
| 2026-03-09T10:01:00Z | mp-researcher-web | Shoptet admin payment confirmation settings | Shoptet nastaveni platba prevodem potvrzeni objednavky IBAN QR splatnost | Splatnost 7/14/21 dni, QR na fakturach, IBAN+SWIFT v nastaveni men |
| 2026-03-09T10:01:15Z | mp-researcher-web | Thank-you page best practices international | e-shop bank transfer confirmation page what information display | Order summary, bank details, payment instructions |
| 2026-03-09T10:01:30Z | mp-researcher-web | CZ bank API automatic payment matching | Czech bank transfer payment automatic matching FIO API CSOB API parovani plateb | Fio API (REST, read-only token), parovani VS+castka, 1-3h interval |

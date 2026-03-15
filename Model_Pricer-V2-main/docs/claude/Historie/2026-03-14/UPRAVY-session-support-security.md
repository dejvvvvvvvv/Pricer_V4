# UPRAVY-session-support-security — Session 2026-03-14

> Historia zaznamu pro Security Sprint a Support redesign

---

## Vlna 3 — createPortal opravy vyskakovacích oken (2026-03-15)

### Problém
CSS `transform` na parent elementech (z animations.css page transitions) rozbíjel `position: fixed` u modálů/overlayů — zobrazovaly se uprostřed stránky místo viewportu.

### Řešení
Přidán `createPortal(jsx, document.body)` do všech fixed-position modálů, overlayů, dialogů, toastů a bannerů v celém projektu.

### Upravené soubory (24 souborů, ~45 prvků)

#### Reusable UI komponenty
- `src/components/ui/forge/ForgeDialog.jsx` — reusable modal (používá 12+ admin stránek)
- `src/components/ui/forge/ToastContainer.jsx` — globální toast kontejner
- `src/components/ui/Header.jsx` — mobile navigační drawer
- `src/components/ui/PwaInstallBanner.jsx` — PWA install banner
- `src/components/ui/OfflineBanner.jsx` — offline/online banner

#### Admin panel
- `src/pages/admin/AdminLayout.jsx` — mobile sidebar overlay
- `src/pages/admin/AdminOrderDetail.jsx` — 6 modálů (confirm, status, fullscreen 3D, email, invoice, toast)
- `src/pages/admin/AdminOrders.jsx` — confirm dialog
- `src/pages/admin/AdminWebhooks.jsx` — payload modal
- `src/pages/admin/AdminActivityLog.jsx` — clear dialog + backdrop
- `src/pages/admin/AdminSettings.jsx` — success/error toasty
- `src/pages/admin/AdminModelStorage.jsx` — context menu
- `src/pages/admin/components/CommandPalette.jsx` — command palette overlay
- `src/pages/admin/components/KeyboardShortcutsHelp.jsx` — shortcuts help overlay
- `src/pages/admin/components/orders/OrderDetailModal.jsx` — order detail modal
- `src/pages/admin/components/OrderExportActions.jsx` — confirm + progress overlay
- `src/pages/admin/builder/components/OnboardingOverlay.jsx` — builder onboarding

#### Kalkulačky
- `src/pages/test-kalkulacka/components/ModelViewer.jsx` — fullscreen 3D viewer (první fix)
- `src/pages/test-kalkulacka/components/KeyboardShortcutsHelp.jsx` — shortcuts overlay
- `src/pages/test-kalkulacka/components/ShareConfigButton.jsx` — toast + QR modal
- `src/pages/test-kalkulacka/components/PricingShareMenu.jsx` — toast
- `src/pages/test-kalkulacka/components/OnboardingTour.jsx` — tour overlay (4 vrstvy)
- `src/pages/widget-kalkulacka/components/ModelViewer.jsx` — fullscreen viewer
- `src/pages/test-kalkulacka-white/components/ModelViewer.jsx` — fullscreen viewer

### Build
- `npm run build` — PASS

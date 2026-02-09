mp-spec-research-web      │ Hleda na webu (Context7, Brave)             │ sonnet │ Jen vyhledavani, zadny kod           │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-research-oss      │ Hleda OSS knihovny, kontroluje licence      │ sonnet │ Jen vyhledavani + hodnoceni          │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-i18n-dates        │ Formatovani datumu pres Intl.DateTimeFormat │ haiku  │ 1 helper, par radku                  │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-i18n-currency     │ Formatovani men pres Intl.NumberFormat      │ haiku  │ 1 helper, par radku                  │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-i18n-translations │ Doplnuje chybejici CZ/EN klice              │ haiku  │ Mechanicka prace - vloz klic/hodnotu │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-storage-tenant-id │ Kontroluje getTenantId() pouziti            │ haiku  │ Jen grep + review jednoho patternu   │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-storage-branding  │ Branding persistence (logo, barvy)          │ sonnet  │ Jeden storage helper                 │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-security-api-keys │ Kontroluje .env a .gitignore                │ haiku  │ Jen sken souboru, zadny kod          │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-design-icons      │ Ikony, SVG, empty states                    │ sonnet  │ Vizualni prvky, maly scope           │
  ├───────────────────────────┼─────────────────────────────────────────────┼────────┼──────────────────────────────────────┤
  │ mp-spec-test-browser      │ Pise manualni testovaci plany (.md)         │ haiku  │ Jen text, zadny kod                  │
  └───────────────────────────┴─────────────────────────────────────────────┴────────┴──────────────────────────────────────┘
  Tier 2 — Jednoduche (uzky scope, malo logiky)
  ┌──────────────────────────────┬─────────────────────────────────────┬────────┬────────────────────────────────┐
  │            Agent             │               Co dela               │ Model  │       Proc je jednoduchy       │
  ├──────────────────────────────┼─────────────────────────────────────┼────────┼────────────────────────────────┤
  │ mp-spec-fe-animations        │ CSS transitions, skeleton screens   │ sonnet  │ Jen CSS, zadna business logika │
  ├──────────────────────────────┼─────────────────────────────────────┼────────┼────────────────────────────────┤
  │ mp-spec-fe-notifications     │ Toast messages, alert bannery       │ haiku  │ Jeden UI pattern               │
  ├──────────────────────────────┼─────────────────────────────────────┼────────┼────────────────────────────────┤
  │ mp-spec-design-user-friendly │ UX review - "je to intuitivni?"     │ haiku  │ Jen read-only review           │
  ├──────────────────────────────┼─────────────────────────────────────┼────────┼────────────────────────────────┤
  │ mp-spec-plan-ux              │ Kresli user flows, interakce        │ sonnet │ Jen planovani, nepise kod      │
  ├──────────────────────────────┼─────────────────────────────────────┼────────┼────────────────────────────────┤
  │ mp-spec-plan-critic          │ Kritizuje plany z pohledu zakaznika │ opus   │ Jen cte a komentuje            │
  ├──────────────────────────────┼─────────────────────────────────────┼────────┼────────────────────────────────┤
  │ mp-spec-docs-dev             │ Udrzuje CLAUDE.md, AGENT_MAP        │ sonnet │ Jen markdown editace           │
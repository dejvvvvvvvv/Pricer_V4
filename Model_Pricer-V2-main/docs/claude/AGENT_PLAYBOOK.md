# Agent Playbook — ModelPricer / Pricer V3

## Praktické zásady z praxe
- **Subagenti jsou nejlepší na research/review/test**, implementace je nejstabilnější přes 1–2 hlavní implementery.
- Každý agent má mít **úzký scope** a jasný výstup.
- Před merge: **lint + build + smoke**.

## Paralelizace
- Branch-per-agent (nejčistší) nebo `git worktree` (skutečná paralelní editace bez konfliktů).

## Doporučený main loop
1) mp-product-spec → acceptance
2) mp-architect → tech plan (jen když velké)
3) mp-frontend-react / mp-backend-node / mp-pricing-engine → implementace
4) mp-code-reviewer + mp-security-reviewer → review
5) mp-test-runner + mp-e2e-playwright → gates

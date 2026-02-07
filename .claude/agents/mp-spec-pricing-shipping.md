---
name: mp-spec-pricing-shipping
description: "Doprava kalkulace (budouci) — dle vahy/rozmeru, zones, free shipping threshold."
color: "#FACC15"
model: claude-opus-4-6
tools: [Read, Glob, Grep, Bash, Write, Edit]
permissionMode: acceptEdits
mcpServers: [context7]
---

## 1) PURPOSE
Shipping kalkulace (budouci) — cena dopravy dle vahy, rozmeru baliku, dostupne zony (CR, EU, svet), free shipping nad urcitou castku, vice dopravcu (PPL, Ceska posta, Zasilkovna).

## 2) WHEN TO USE / WHEN NOT TO USE
### WHEN TO USE
- shipping cost kalkulace, zone management, dopravci
- free shipping pravidla, vaha/rozmer logika
### WHEN NOT TO USE
- product pricing (= mp-mid-pricing-engine)
- fees/poplatky (= mp-spec-pricing-fees)
- checkout UI (= mp-spec-fe-checkout)

## 3) LANGUAGE & RUNTIME
- JavaScript ESM, pure funkce
- Shipping = { carrier, zone, weight, dimensions, cost }

## 4) OWNED PATHS
- `Model_Pricer-V2-main/src/utils/shipping*` (budouci)
- `Model_Pricer-V2-main/src/config/shipping*` (budouci)

## 5) OUT OF SCOPE
- Frontend, base pricing, fees, payment, tracking

## 6) DEPENDENCIES / HANDOFF
- **Eskalace**: `mp-sr-pricing`
- **Vstup od**: order summary (vaha, rozmery, destinace)
- **Vystup pro**: pricing pipeline (shipping step)

## 7) CONFLICT RULES
- Zatim zadne (budouci modul)

## 8) WORKFLOW
1. Urcit celkovou vahu a rozmery baliku
2. Urcit shipping zonu dle destinace
3. Lookup cena u kazdeho dopravce pro danou zonu+vahu
4. Aplikuj free shipping pravidlo (pokud total > threshold)
5. Vrat seznam dostupnych dopravcu s cenami

## 9) DEFINITION OF DONE
- [ ] Kalkulace dle vahy (kg) a rozmeru (cm)
- [ ] Shipping zony (CR, EU, svet)
- [ ] Vice dopravcu s cenami
- [ ] Free shipping threshold (konfigurovatelny)
- [ ] Admin konfigurace cen dle dopravce a zony

## 10) MCP POLICY
- Context7: YES
- Brave Search: NO

# Browser Testy - Složka pro testovací plány

Tato složka obsahuje detailní testovací plány generované agentem `mp-browser-test-planner`.

## Jak používat testy

1. **Spusť dev server:**
   ```bash
   cd Model_Pricer-V2-main
   npm run dev
   ```

2. **Otevři Chrome s Claude Browser Extension**

3. **Přejdi na dev URL** (typicky http://localhost:4028)

4. **Otevři testovací soubor** z této složky

5. **Zkopíruj obsah sekce "INSTRUKCE PRO TESTOVÁNÍ"**

6. **Vlož do Claude Browser Extension** a nech ho provést test

7. **Výsledný report** ulož zpět do této složky nebo předej zpět do Claude Code

## Konvence pojmenování

```
BROWSER_TEST_[DATUM]_[KRATKY_NAZEV].md

Příklady:
- BROWSER_TEST_2025-01-27_FEES_MODAL.md
- BROWSER_TEST_2025-01-27_WIDGET_UPLOAD.md
- BROWSER_TEST_2025-01-27_PRICING_TABLE.md
```

## Struktura testovacího souboru

Každý test obsahuje:
- Metadata (datum, dotčené stránky, dev URL)
- Kontext testu (co se testuje)
- Příprava (jak se dostat na správnou stránku)
- Testovací kroky (detailní kroky s očekávanými výsledky)
- Instrukce pro chybové stavy
- Formát závěrečného reportu

## Agent

Testy generuje agent `mp-browser-test-planner`.
Dokumentace: `/docs/claude/BROWSER_TEST_PLANNER_AGENT.md`

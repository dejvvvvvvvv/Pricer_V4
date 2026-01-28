/**
 * FAQ content grouped by category.
 *
 * Shape:
 *  [{ id, label, items: [{ id, title, content }] }]
 */

export function getFaqCategories(language = "cs") {
  const isCs = language === "cs";

  return [
    {
      id: "getting-started",
      label: isCs ? "Začínáme" : "Getting started",
      items: isCs
        ? [
            {
              id: "getting-started-1",
              title: "Co je ModelPricer a pro koho je?",
              content:
                "ModelPricer je SaaS pro firmy, které tisknou na zakázku. Zákazník nahraje model, nastaví parametry a hned vidí cenu. Ty místo e‑mailů získáš hotovou objednávku.",
            },
            {
              id: "getting-started-2",
              title: "Jak rychle dokážu začít?",
              content:
                "Po registraci si v adminu nastavíš materiály, sazbu za čas a poplatky. Pak vložíš widget na svůj web a můžeš hned přijímat kalkulace.",
            },
            {
              id: "getting-started-3",
              title: "Jak vložím kalkulačku na svůj web?",
              content:
                "V adminu získáš embed kód (iframe / snippet). Můžeš nastavit branding (logo, barvy, font) i whitelist domén. Potom jen vložíš kód do stránky a je hotovo.",
            },
          ]
        : [
            {
              id: "getting-started-1",
              title: "What is ModelPricer and who is it for?",
              content:
                "ModelPricer is a SaaS for print-on-demand 3D print shops. Customers upload a model, pick options, and instantly get a price — you get fewer emails and more ready-to-print orders.",
            },
            {
              id: "getting-started-2",
              title: "How fast can I get started?",
              content:
                "After registration, configure materials, time rate, and fees in the admin. Embed the widget on your website and you’re ready to accept quotes.",
            },
            {
              id: "getting-started-3",
              title: "How do I embed the calculator on my website?",
              content:
                "You’ll get an embed snippet (iframe / script) in the admin. Configure branding and allowed domains, paste the code into your site, and you’re live.",
            },
          ],
    },
    {
      id: "pricing",
      label: isCs ? "Ceny" : "Pricing",
      items: isCs
        ? [
            {
              id: "pricing-1",
              title: "Je k dispozici zkušební verze?",
              content:
                "Ano – registrace je zdarma a můžeš si to vyzkoušet hned. Pokud potřebuješ delší pilot pro firmu, napiš nám a domluvíme individuálně.",
            },
            {
              id: "pricing-2",
              title: "Co přesně je v plánu a co jsou limity?",
              content:
                "Plány se liší hlavně počtem kalkulací, úrovní brandingu, limity úložiště a pokročilými pravidly. Můžeš začít na menším plánu a později přejít výš.",
            },
            {
              id: "pricing-3",
              title: "Nabízíte roční platbu nebo slevu?",
              content:
                "Ano – u roční platby typicky vychází nižší měsíční cena. Pokud řešíš firmu s více weby nebo integrací, ozvi se pro individuální nabídku.",
            },
          ]
        : [
            {
              id: "pricing-1",
              title: "Do you offer a free trial?",
              content:
                "Yes — you can start right away after registration. If you need a longer pilot for a company rollout, contact us and we’ll arrange it.",
            },
            {
              id: "pricing-2",
              title: "What’s included and what are the limits?",
              content:
                "Plans differ mainly in monthly calculation limits, branding level, storage limits, and advanced pricing rules. You can start small and upgrade anytime.",
            },
            {
              id: "pricing-3",
              title: "Do you offer annual billing or discounts?",
              content:
                "Yes — annual billing typically comes with a lower effective monthly price. For multi-site rollouts or integrations, contact us for a tailored plan.",
            },
          ],
    },
    {
      id: "technical",
      label: isCs ? "Technické" : "Technical",
      items: isCs
        ? [
            {
              id: "technical-1",
              title: "Je to skutečně přesné? Jak počítáte čas a materiál?",
              content:
                "Ano. Model se odešle na backend, kde proběhne [[slicing]] (PrusaSlicer). PrusaSlicer se na serveru spouští přes [[cli]] (automatizace bez grafiky). Získáme čas tisku a spotřebu materiálu a z toho se spočítá cena podle tvých pravidel (materiál, čas, poplatky).",
            },
            {
              id: "technical-2",
              title: "Můžu si nastavit vlastní poplatky a pravidla nacenění?",
              content:
                "Ano. V adminu nastavíš ceny materiálu (Kč/g), sazbu času (Kč/h) a libovolné poplatky – fixní, podle hmotnosti, podle času nebo procentem. Umíme i minima, mark‑up a zaokrouhlování. Pro rychlé nastavení kvality se hodí [[presets]].",
            },
            {
              id: "technical-3",
              title: "Půjde to napojit na košík (Shoptet / Woo / Shopify)?",
              content:
                "Ano, cílem je „add to cart“ integrace. Začínáme univerzálním API + integračním návodem, postupně přidáme hotové konektory pro nejčastější platformy.",
            },
          ]
        : [
            {
              id: "technical-1",
              title: "Is it accurate? How do you calculate time and material?",
              content:
                "Yes. We slice the model on the backend where [[slicing]] happens (PrusaSlicer). PrusaSlicer runs on the server via [[cli]] (automation, no GUI). We get print time and material usage and calculate the final price from your rules (material, time, fees).",
            },
            {
              id: "technical-2",
              title: "Can I set custom fees and pricing rules?",
              content:
                "Yes. Set material price, machine time rate, and any number of fees (flat, per‑gram, per‑minute, percent). We also support minima, markup, and rounding rules. For quick quality setup, use [[presets]].",
            },
            {
              id: "technical-3",
              title: "Can it integrate with carts (Shopify / Woo / etc.)?",
              content:
                "Yes. Our direction is “add to cart” integration. We start with a universal API + guide, and we’ll add ready‑made connectors for popular platforms.",
            },
          ],
    },
    {
      id: "account",
      label: isCs ? "Účet" : "Account",
      items: isCs
        ? [
            {
              id: "account-1",
              title: "Můžu mít více členů týmu?",
              content:
                "Ano. Vyšší plány typicky umožní více členů týmu a lepší správu přístupů. Pokud potřebuješ specifické role, napiš nám.",
            },
            {
              id: "account-2",
              title: "Můžu plán kdykoliv změnit nebo zrušit?",
              content:
                "Ano. Plán můžeš kdykoliv změnit. Po zrušení máš přístup do konce zaplaceného období.",
            },
            {
              id: "account-3",
              title: "Kde najdu podporu nebo dokumentaci?",
              content:
                "Na stránce Podpora najdeš kontakty a odkazy na dokumentaci. Když budeš chtít konzultaci k nastavení, ozvi se.",
            },
          ]
        : [
            {
              id: "account-1",
              title: "Can I add multiple team members?",
              content:
                "Yes. Higher plans typically include more team members and better access control. If you need specific roles, contact us.",
            },
            {
              id: "account-2",
              title: "Can I change or cancel my plan anytime?",
              content:
                "Yes. You can upgrade or downgrade anytime. After cancellation, you keep access until the end of the paid period.",
            },
            {
              id: "account-3",
              title: "Where can I find support or docs?",
              content:
                "Visit the Support page for contact options and documentation links. If you want a setup consult, reach out.",
            },
          ],
    },
  ];
}

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../contexts/LanguageContext";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import { TooltipProvider } from "../../components/ui/tooltip";
import MotionNumber from "../../components/marketing/MotionNumber";
import PricingPlanCard from "../../components/marketing/PricingPlanCard";
import FaqTabs from "../../components/marketing/FaqTabs";
import GlossaryTerm from "../../components/marketing/GlossaryTerm";
import SupportHoverCards from "../../components/marketing/SupportHoverCards";
import { getFaqCategories } from "../../data/faq";
import { getGlossary } from "../../data/glossary";

const Pricing = () => {
  const { t, language } = useLanguage();

  const currency = language === "cs" ? "Kč" : "$";

  const plans = [
    {
      name: t("pricing.plan.starter"),
      description:
        language === "cs"
          ? "Pro začínající tiskárny a jednotlivce"
          : "For starting print shops and individuals",
      price: "499",
      period: t("pricing.monthly"),
      features:
        language === "cs"
          ? [
              "Až 100 kalkulací měsíčně",
              "Základní branding (barvy, logo)",
              "1 widget na web",
              "Email podpora",
              "Uložení modelů 2 GB",
            ]
          : [
              "Up to 100 calculations / month",
              "Basic branding (colors, logo)",
              "1 widget on your site",
              "Email support",
              "2 GB model storage",
            ],
      ctaText: language === "cs" ? "Začít zdarma" : "Start free",
      ctaTo: "/register",
      highlighted: false,
    },
    {
      name: t("pricing.plan.professional"),
      description:
        language === "cs"
          ? "Pro aktivní tiskárny, které chtějí automatizovat nacenění"
          : "For busy shops that want automated quoting",
      price: "999",
      period: t("pricing.monthly"),
      features:
        language === "cs"
          ? [
              "Až 500 kalkulací měsíčně",
              "Plný branding + vlastní doména widgetu",
              "Neomezené widgety",
              "Pokročilé poplatky a pravidla (minima, zaokrouhlení)",
              "Prioritní podpora",
              "Uložení modelů 5 GB",
            ]
          : [
              "Up to 500 calculations / month",
              "Full branding + custom widget domain",
              "Unlimited widgets",
              "Advanced fees & rules (minima, rounding)",
              "Priority support",
              "5 GB model storage",
            ],
      ctaText: language === "cs" ? "Vyzkoušet zdarma" : "Try free",
      ctaTo: "/register",
      highlighted: true,
    },
    {
      name: t("pricing.plan.enterprise"),
      description:
        language === "cs"
          ? "Pro větší provozy a specifické integrace"
          : "For larger operations and custom integrations",
      price: null,
      period: t("pricing.custom"),
      features:
        language === "cs"
          ? [
              "Vše z Professional",
              "White‑label řešení (bez „Powered by“)",
              "SLA a dedikovaná podpora",
              "Neomezení uživatelé",
              "Custom integrace (API / e‑shop)",
              "Možnost on‑premise",
            ]
          : [
              "Everything from Professional",
              "White‑label (no “Powered by”)",
              "SLA + dedicated support",
              "Unlimited users",
              "Custom integrations (API / e‑shop)",
              "Optional on‑premise",
            ],
      ctaText: language === "cs" ? "Kontaktovat" : "Contact",
      ctaTo: "/support",
      highlighted: false,
    },
  ];

  const kpis =
    language === "cs"
      ? [
          {
            value: 8,
            suffix: "s",
            title: "k ceně",
            desc: "Průměrně během pár sekund po nahrání modelu.",
          },
          {
            value: 60,
            suffix: "%",
            title: "méně ruční práce",
            desc: "Zákazník vidí cenu hned – bez e‑mailů tam a zpět.",
          },
          {
            value: 24,
            suffix: "/7",
            title: "automatizace",
            desc: "Kalkulace běží nonstop, i když zrovna netiskneš.",
          },
        ]
      : [
          {
            value: 8,
            suffix: "s",
            title: "to a quote",
            desc: "Typically within seconds after upload.",
          },
          {
            value: 60,
            suffix: "%",
            title: "less manual quoting",
            desc: "Customers get a price instantly – no email ping‑pong.",
          },
          {
            value: 24,
            suffix: "/7",
            title: "automation",
            desc: "Quoting runs nonstop, even when you’re away.",
          },
        ];

  const glossary = getGlossary(language);
  const faqCategories = getFaqCategories(language);

  const whatYouGetRows =
    language === "cs"
      ? [
          <>
            Přesné <GlossaryTerm termKey="slicing" glossary={glossary} /> přes
            PrusaSlicer na serveru
          </>,
          <>Vlastní ceny materiálů, času a poplatků</>,
          <>
            <GlossaryTerm termKey="presets" glossary={glossary} /> kvality +
            parametry (např. <GlossaryTerm termKey="infill" glossary={glossary} />)
          </>,
          <>Embed na web + whitelisting domén</>,
        ]
      : [
          <>
            Accurate <GlossaryTerm termKey="slicing" glossary={glossary} /> with
            PrusaSlicer on our server
          </>,
          <>Custom material/time pricing + fees</>,
          <>
            <GlossaryTerm termKey="presets" glossary={glossary} /> + parameters
            (e.g. <GlossaryTerm termKey="infill" glossary={glossary} />)
          </>,
          <>Website embed + domain allowlist</>,
        ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-ring/15 blur-3xl" />
        </div>

        <Container className="py-14 sm:py-18">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground"
              >
                {t("pricing.hero.title")}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="mt-3 text-base sm:text-lg text-muted-foreground"
              >
                {t("pricing.hero.subtitle")}
              </motion.p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link to="/register">
                    {language === "cs" ? "Začít zdarma" : "Start free"}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#faq">{language === "cs" ? "FAQ" : "FAQ"}</a>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kpis.map((k, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 shadow-sm"
                  >
                    <div className="text-2xl font-semibold text-foreground">
                      <MotionNumber value={k.value} suffix={k.suffix} />
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {k.title}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {k.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {language === "cs" ? "Co získáš" : "What you get"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {language === "cs"
                        ? "Cenotvorbu + widget + admin panel."
                        : "Pricing engine + widget + admin panel."}
                    </div>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {language === "cs" ? "Bez závazků" : "No lock‑in"}
                  </span>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  {whatYouGetRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-2xl border border-border bg-background/60 px-4 py-3"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-[12px]">✓</span>
                      </span>
                      <span className="text-muted-foreground">{row}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button asChild variant="outline" fullWidth>
                    <Link to="/model-upload">
                      {language === "cs" ? "Otevřít demo kalkulačku" : "Open demo"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* PLANS */}
      <section className="py-14 sm:py-18">
        <Container>
          <div className="flex flex-col items-start gap-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {language === "cs" ? "Plány pro každou tiskárnu" : "Plans for every shop"}
            </h2>
            <p className="text-muted-foreground">
              {language === "cs"
                ? "Začni zdarma a škáluj podle počtu kalkulací, brandingu a integrací."
                : "Start free and scale by usage, branding, and integrations."}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3 items-stretch">
            {plans.map((p) => (
              <PricingPlanCard
                key={p.name}
                name={p.name}
                description={p.description}
                price={p.price}
                currency={currency}
                period={p.period}
                features={p.features}
                highlighted={p.highlighted}
                badgeText={t("pricing.popular")}
                ctaText={p.ctaText}
                ctaTo={p.ctaTo}
              />
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-border bg-muted/50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {language === "cs"
                    ? "Roční sleva + individuální pilot"
                    : "Annual discount + pilot options"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {language === "cs"
                    ? "Chceš delší test nebo plán pro firmu? Napiš nám – domluvíme se."
                    : "Need a longer test or a rollout plan? Contact us and we’ll tailor it."}
                </div>
              </div>

              <Button asChild variant="outline">
                <Link to="/support">
                  {language === "cs" ? "Kontaktovat podporu" : "Contact support"}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 sm:py-18 border-t border-border bg-background">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {language === "cs" ? "FAQ" : "FAQ"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {language === "cs"
                  ? "Krátké odpovědi na nejčastější otázky před startem."
                  : "Quick answers to the most common questions."}
              </p>

              <div className="mt-6 space-y-3">
                <Button asChild variant="gradient" size="lg" fullWidth>
                  <Link to="/register">
                    {language === "cs" ? "Začít zdarma" : "Start free"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" fullWidth>
                  <Link to="/support">
                    {language === "cs" ? "Napsat podporu" : "Contact support"}
                  </Link>
                </Button>
              </div>

              <SupportHoverCards
                language={language}
                className="mt-6"
              />
            </div>

            <div className="lg:col-span-7">
              <FaqTabs categories={faqCategories} glossary={glossary} />
            </div>
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-14 sm:py-18">
        <Container>
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 sm:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {language === "cs"
                    ? "Chceš plán na míru nebo integraci do e‑shopu?"
                    : "Need a custom plan or e‑shop integration?"}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {language === "cs"
                    ? "Napiš nám, co potřebuješ – pošleme doporučení a další kroky."
                    : "Tell us what you need and we’ll propose the best next steps."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link to="/support">
                    {language === "cs" ? "Kontaktovat" : "Contact"}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/model-upload">
                    {language === "cs" ? "Vyzkoušet demo" : "Try demo"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
      </div>
    </TooltipProvider>
  );
};

export default Pricing;

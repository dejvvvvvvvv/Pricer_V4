import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/ui/Button';

import BackgroundPattern from '../../components/ui/BackgroundPattern';
import Sparkles from '../../components/marketing/Sparkles';
import MotionNumber from '../../components/marketing/MotionNumber';
import LogoMarquee from '../../components/marketing/LogoMarquee';
import SpotlightCard from '../../components/marketing/SpotlightCard';
import ImageRipple from '../../components/marketing/ImageRipple';
import GlobalMap from '../../components/marketing/GlobalMap';
import InteractiveWorldMap from '../../components/marketing/InteractiveWorldMap';

import Accordion from '../../components/marketing/Accordion';
import Reveal from '../../components/marketing/Reveal';

const Home = () => {
  const { t } = useLanguage();

  const trustItems = [
    'PrusaSlicer CLI',
    'White‑label widget',
    'Multi‑tenant',
    'Fees & Markup',
    'Presets (.ini)',
    'Limits (X/Y/Z)',
    'WooCommerce',
    'Shopify',
    'Shoptet',
    'API ready',
  ];

  const steps = [
    {
      icon: 'Upload',
      title: t('home.how.step1.title'),
      desc: t('home.how.step1.desc'),
    },
    {
      icon: 'SlidersHorizontal',
      title: t('home.how.step2.title'),
      desc: t('home.how.step2.desc'),
    },
    {
      icon: 'Clock',
      title: t('home.how.step3.title'),
      desc: t('home.how.step3.desc'),
    },
    {
      icon: 'ShoppingCart',
      title: t('home.how.step4.title'),
      desc: t('home.how.step4.desc'),
    },
  ];

  const features = [
    { icon: 'Scissors', title: t('home.features.slicer.title'), desc: t('home.features.slicer.desc') },
    { icon: 'Calculator', title: t('home.features.pricing.title'), desc: t('home.features.pricing.desc') },
    { icon: 'BadgePercent', title: t('home.features.presets.title'), desc: t('home.features.presets.desc') },
    { icon: 'Palette', title: t('home.features.branding.title'), desc: t('home.features.branding.desc') },
    { icon: 'Ruler', title: t('home.features.limits.title'), desc: t('home.features.limits.desc') },
    { icon: 'ShoppingBag', title: t('home.features.cart.title'), desc: t('home.features.cart.desc') },
  ];

  const faqItems = [
    { q: t('home.faq.q1'), a: t('home.faq.a1') },
    { q: t('home.faq.q2'), a: t('home.faq.a2') },
    { q: t('home.faq.q3'), a: t('home.faq.a3') },
  ];

  return (
    <div className="text-foreground relative">
      <BackgroundPattern />
      {/* HERO */}
      <section className="relative overflow-hidden">

        <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <div className="relative inline-flex items-center rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {t('home.trust.main')}
                </span>
                <Sparkles className="opacity-40" count={10} />
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                {t('home.hero.title')}
              </h1>

              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t('home.hero.subtitle')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/pricing">
                    {t('home.hero.cta.primary')}
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg">
                  <Link to="/model-upload">
                    {t('home.hero.cta.secondary')}
                  </Link>
                </Button>

                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="ShieldCheck" size={18} />
                  <span>{t('home.hero.note')}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-10 grid grid-cols-3 gap-4 sm:max-w-lg">
                <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">
                    <MotionNumber value={3} /> <span className="text-base font-semibold text-muted-foreground">kroky</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">od uploadu k ceně</div>
                </div>
                <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">
                    <MotionNumber value={14} /> <span className="text-base font-semibold text-muted-foreground">dní</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">zdarma na vyzkoušení</div>
                </div>
                <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">
                    <MotionNumber value={100} /> <span className="text-base font-semibold text-muted-foreground">%</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">brandování widgetu</div>
                </div>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-6" delay={0.08}>
              <ImageRipple className="rounded-3xl">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card/50 shadow-lg backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
                  <Sparkles className="opacity-35" count={12} />

                  <div className="relative p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        ModelPricer — Live preview
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                            <Icon name="Upload" size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">STL / OBJ / 3MF</div>
                            <div className="text-xs text-muted-foreground">Nahraj model a získej cenu během chvilky</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                          <div className="text-xs text-muted-foreground">Materiál</div>
                          <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            PLA / PETG / ABS
                          </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-background/60 p-4">
                          <div className="text-xs text-muted-foreground">Kvalita</div>
                          <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                            <Icon name="Sparkles" size={16} />
                            Standard / Fine
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground">Odhad (z PrusaSlicer)</div>
                            <div className="mt-1 text-sm font-semibold">2h 14m • 46g</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Cena</div>
                            <div className="mt-1 text-2xl font-bold">299 Kč</div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <Button size="sm" className="flex-1">
                            <Icon name="ShoppingCart" size={16} className="mr-2" />
                            Add to cart
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Icon name="SlidersHorizontal" size={16} className="mr-2" />
                            Parametry
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ImageRipple>
            </Reveal>
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className="mx-auto max-w-6xl px-4 py-6">
            <Reveal>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold">
                  {t('home.trust.sub')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('home.trust.main')}
                </div>
              </div>

              <div className="mt-4">
                <LogoMarquee items={trustItems} />
              </div>
            </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">{t('home.how.title')}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{t('home.how.subtitle')}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {steps.map((s, idx) => (
            <Reveal key={s.title} delay={idx * 0.05}>
              <SpotlightCard>
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
                    <Icon name={s.icon} size={22} />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{s.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>



      {/* DEMO PREVIEW */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Reveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">{t('home.demo.title')}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{t('home.demo.subtitle')}</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/model-upload">
                <Icon name="Play" size={16} className="mr-2" />
                {t('home.demo.cta')}
              </Link>
            </Button>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* LEFT: OLD WAY - Email (muted, boring, grayscale feel) */}
          <Reveal delay={0.08} className="md:order-2">
            <div className="relative h-full overflow-hidden rounded-3xl border border-gray-300/50 bg-gradient-to-br from-gray-100 to-gray-50 p-6 sm:p-8">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.01)_10px,rgba(0,0,0,0.01)_20px)]" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-200/80 px-3 py-1 text-xs font-medium text-gray-500">
                  <Icon name="Clock" size={12} />
                  Starý způsob
                </div>
                
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100/80">
                    <Icon name="Mail" size={22} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-600">E-maily a ruční nabídky</div>
                    <div className="text-sm text-gray-400">Pomalý a náročný proces</div>
                  </div>
                </div>

                {/* Email thread mockup */}
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg bg-white/60 p-3 shadow-sm border border-gray-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-gray-300" />
                      <div className="text-xs text-gray-400">zákazník@email.cz</div>
                      <div className="ml-auto text-xs text-gray-300">před 2 dny</div>
                    </div>
                    <div className="text-xs text-gray-500 italic">„Dobrý den, mohl bych dostat cenovou nabídku na tyto 3 modely?"</div>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3 shadow-sm border border-gray-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-blue-200" />
                      <div className="text-xs text-gray-400">vy@firma.cz</div>
                      <div className="ml-auto text-xs text-gray-300">před 1 dnem</div>
                    </div>
                    <div className="text-xs text-gray-500 italic">„Dobrý den, potřebuji znát rozměry a materiál..."</div>
                  </div>
                  <div className="rounded-lg bg-white/40 p-3 border border-dashed border-gray-200">
                    <div className="text-xs text-gray-400 text-center">⏳ Čekání na odpověď...</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2 border border-red-200/50">
                    <Icon name="X" size={18} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-700">Hodiny až dny čekání</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2 border border-red-200/50">
                    <Icon name="X" size={18} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-700">Ztracené objednávky</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* RIGHT: NEW WAY - Calculator (vibrant, colorful, happy!) */}
          <Reveal delay={0.02} className="md:order-1">
            <div className="relative h-full overflow-hidden rounded-3xl p-6 sm:p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(89, 39, 226, 0.15) 0%, rgba(139, 92, 246, 0.25) 50%, rgba(168, 85, 247, 0.2) 100%)',
              }}
            >
              {/* Glow effects */}
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-400/30 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
              
              {/* Border glow */}
              <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/40 shadow-[0_0_30px_rgba(139,92,246,0.3)]" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-500/30">
                  <Icon name="Sparkles" size={14} />
                  Nový způsob
                </div>
                
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/40">
                    <Icon name="Zap" size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Automatická kalkulačka</div>
                    <div className="text-sm text-purple-700 font-medium">Okamžitá cena, bez čekání</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-green-500 shadow">
                      <Icon name="Check" size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Cena do <strong className="text-purple-700">3 sekund</strong></span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-green-500 shadow">
                      <Icon name="Check" size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Přesný výpočet z <strong className="text-purple-700">PrusaSliceru</strong></span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-green-500 shadow">
                      <Icon name="Check" size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Zákazník objedná sám <strong className="text-purple-700">24/7</strong></span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2 backdrop-blur-sm">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-green-500 shadow">
                      <Icon name="Check" size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-medium">Výrazně <strong className="text-purple-700">vyšší konverze</strong> prodeje</span>
                  </div>
                </div>

                {/* Mini widget preview */}
                <div className="mt-5 rounded-2xl bg-white/90 p-4 shadow-xl shadow-purple-500/10 backdrop-blur border border-purple-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-semibold text-gray-600">Live kalkulace</span>
                    </div>
                    <Icon name="Sparkles" size={14} className="text-purple-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <div className="text-xs text-gray-400">Čas</div>
                      <div className="text-sm font-bold text-gray-800">2h 14m</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                      <div className="text-xs text-gray-400">Hmotnost</div>
                      <div className="text-sm font-bold text-gray-800">46g</div>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 p-2 text-center shadow-lg">
                      <div className="text-xs text-purple-200">Cena</div>
                      <div className="text-sm font-bold text-white">299 Kč</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">{t('home.features.title')}</h2>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, idx) => (
              <Reveal key={f.title} delay={idx * 0.04}>
                <SpotlightCard>
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                      <Icon name={f.icon} size={20} />
                    </div>
                    <div>
                      <div className="font-semibold">{f.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div>
          <div className="rounded-3xl border border-border bg-card/50 p-8 shadow-lg backdrop-blur">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl font-bold tracking-tight">{t('home.pricing.title')}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{t('home.pricing.subtitle')}</p>
              </Reveal>
              <Reveal className="lg:col-span-5 lg:justify-self-end" delay={0.08}>
                <Button asChild size="lg">
                  <Link to="/pricing">
                    {t('home.pricing.cta')}
                  </Link>
                </Button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('home.audience.title')}</h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Reveal delay={0.02}>
            <SpotlightCard>
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                  <Icon name="Store" size={20} />
                </div>
                <div>
                  <div className="font-semibold">{t('home.audience.shops.title')}</div>
                  <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{t('home.audience.shops.desc')}</div>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>
          <Reveal delay={0.06}>
            <SpotlightCard>
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                  <Icon name="Factory" size={20} />
                </div>
                <div>
                  <div className="font-semibold">{t('home.audience.studios.title')}</div>
                  <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{t('home.audience.studios.desc')}</div>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>
          <Reveal delay={0.1}>
            <SpotlightCard>
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                  <Icon name="Printer" size={20} />
                </div>
                <div>
                  <div className="font-semibold">{t('home.audience.printers.title')}</div>
                  <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{t('home.audience.printers.desc')}</div>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* GLOBAL USAGE MAP */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold tracking-tight">Používáno tiskárnami po celém světě</h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Připojte se k rostoucí komunitě profesionálů v 3D tisku. Naše řešení pomáhá firmám od lokálních studií až po velké výrobní provozy automatizovat jejich procesy a získávat více zakázek.
              </p>
              
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-10 w-10 rounded-full border-2 border-background bg-gray-${i * 100 + 200}`} 
                         style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`, backgroundSize: 'cover' }} />
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold">
                    +500
                  </div>
                </div>
                <div className="text-sm font-medium">
                  <span className="text-foreground">Spokojených klientů</span>
                  <div className="flex text-yellow-500">
                    {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
              <GlobalMap />
            </div>
          </div>
        </Reveal>
      </section>

      {/* NEW INTERACTIVE MAP (Comparison) */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Reveal>
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-center">Interaktivní mapa (Nová verze)</h2>
            <p className="mt-3 text-center text-muted-foreground">Detailnější a interaktivnější pohled na globální pokrytí.</p>
          </div>
          <div className="w-full">
            <InteractiveWorldMap />
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div>
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{t('home.faq.more')}</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/support">
                  <Icon name="LifeBuoy" size={16} className="mr-2" />
                  Support
                </Link>
              </Button>
            </div>
          </Reveal>

          <div className="mt-10">
            <Accordion items={faqItems} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

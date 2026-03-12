/**
 * Centralized help tooltip texts for admin pages.
 * Each key returns { cs, en } for bilingual support.
 * Some entries include a learnMore link.
 */

const helpTexts = {
  // ===== AdminPricing — Time tab =====
  pricing_rate_per_hour: {
    cs: 'Zakladni sazba za hodinu tisku. Cas pochazi z PrusaSliceru. Toto je hlavni faktor ceny casu.',
    en: 'Base hourly rate for print time. Time comes from PrusaSlicer. This is the main time cost factor.',
  },
  pricing_min_billed_time: {
    cs: 'Pokud tisk trva kratsi dobu nez minimum, uctuje se tento minimalni cas. Materialova cena zustava realna.',
    en: 'If print takes less than this minimum, this minimum time is billed instead. Material cost stays real.',
  },

  // ===== AdminPricing — Rules tab =====
  pricing_min_price_per_model: {
    cs: 'Minimalni cena za jeden model. Pokud je vypoctena cena nizsi, automaticky se zvysi na tuto hodnotu.',
    en: 'Minimum price per model. If calculated price is lower, it is automatically bumped to this value.',
  },
  pricing_min_order_total: {
    cs: 'Minimalni celkova cena objednavky. Zakaznik musi objednat alespon za tuto castku.',
    en: 'Minimum total order price. Customer must order at least this amount.',
  },
  pricing_markup: {
    cs: 'Prirazka pridana k zakladni cene. Rezim "Fixni" prida pevnou castku, "Procento" prida % ze zakladni ceny, "Minimalni cena" zvysi cenu pokud je pod prahem.',
    en: 'Markup added to base price. "Flat" adds fixed amount, "Percent" adds % of base price, "Min flat" bumps price if below threshold.',
  },
  pricing_markup_flat: {
    cs: 'Pevna castka v Kc ktera se prida ke kazde polozce.',
    en: 'Fixed amount in CZK added to each item.',
  },
  pricing_markup_percent: {
    cs: 'Procentualni prirazka vypoctena ze zakladni ceny (material + cas + poplatky).',
    en: 'Percentage markup calculated from base price (material + time + fees).',
  },
  pricing_markup_min_flat: {
    cs: 'Pokud je cena modelu nizsi nez tato hodnota, zvysi se na ni. Funguje jako dalsi minimum.',
    en: 'If model price is below this value, it is bumped up to it. Acts as another minimum.',
  },
  pricing_rounding: {
    cs: 'Zaokrouhleni konecne ceny na zadany krok (napr. na 5 Kc). "Smart" zaokrouhluje jen celkovou objednavku, ne kazdy model zvlast.',
    en: 'Rounds final price to the given step (e.g. to 5 CZK). "Smart" rounds only the order total, not each model separately.',
  },
  pricing_smart_rounding: {
    cs: 'Kdyz je zapnuto, zaokrouhleni se aplikuje jen na celkovou cenu objednavky. Kdyz je vypnuto, zaokrouhluje se kazdy model zvlast.',
    en: 'When on, rounding applies only to the total order price. When off, each model is rounded separately.',
  },

  // ===== AdminPricing — Materials tab =====
  pricing_material_price_per_gram: {
    cs: 'Cena za 1 gram materialu. Vypoctete ji z ceny civky deleno hmotnosti civky.',
    en: 'Price per 1 gram of material. Calculate from spool price divided by spool weight.',
  },
  pricing_material_density: {
    cs: 'Hustota materialu v g/cm3. Pouziva se pro prepocet objemu na hmotnost. PLA ~ 1.24, PETG ~ 1.27, ABS ~ 1.04.',
    en: 'Material density in g/cm3. Used to convert volume to weight. PLA ~ 1.24, PETG ~ 1.27, ABS ~ 1.04.',
  },
  pricing_material_colors: {
    cs: 'Barvy dostupne pro tento material. Kazda barva muze mit vlastni cenu za gram.',
    en: 'Colors available for this material. Each color can have its own price per gram.',
  },

  // ===== AdminPricing — Discounts tab =====
  pricing_volume_discount: {
    cs: 'Mnozstevni sleva — automaticka sleva pri objednani vice kusu stejneho modelu.',
    en: 'Volume discount — automatic discount when ordering multiple copies of the same model.',
  },

  // ===== AdminFees =====
  fees_scope_model: {
    cs: 'Poplatek typu MODEL se aplikuje na kazdy model zvlast. Pokud zakaznik objedna 3 ruzne modely, poplatek se uctuje 3x.',
    en: 'MODEL scope fee applies to each model separately. If customer orders 3 different models, fee is charged 3 times.',
  },
  fees_scope_order: {
    cs: 'Poplatek typu ORDER se uctuje jednou za celou objednavku, bez ohledu na pocet modelu.',
    en: 'ORDER scope fee is charged once per entire order, regardless of how many models are in it.',
  },
  fees_charge_basis_per_piece: {
    cs: 'PER_PIECE — poplatek se nasobi poctem kusu (quantity). Napr. pri 5 kusech se uctuje 5x.',
    en: 'PER_PIECE — fee is multiplied by quantity. E.g. with 5 pieces, fee is charged 5 times.',
  },
  fees_charge_basis_per_file: {
    cs: 'PER_FILE — poplatek se uctuje jednou za soubor bez ohledu na quantity.',
    en: 'PER_FILE — fee is charged once per file regardless of quantity.',
  },
  fees_type_flat: {
    cs: 'Fixni castka v Kc pridana k cene.',
    en: 'Fixed amount in CZK added to the price.',
  },
  fees_type_percent: {
    cs: 'Procentualni prirazka z celkove ceny modelu.',
    en: 'Percentage surcharge based on the total model price.',
  },
  fees_type_per_gram: {
    cs: 'Poplatek za kazdy gram spotrebovaneho materialu.',
    en: 'Fee per gram of consumed material.',
  },
  fees_conditions: {
    cs: 'Podminky urcuji kdy se poplatek aplikuje. Napr. "jen pro material PLA" nebo "jen kdyz infill > 50%".',
    en: 'Conditions determine when the fee applies. E.g. "only for PLA material" or "only when infill > 50%".',
  },

  // ===== AdminShipping =====
  shipping_weight_tiers: {
    cs: 'Hmotnostni pasma urcuji cenu dopravy podle celkove hmotnosti objednavky. Kazde pasmo ma horni limit a cenu.',
    en: 'Weight tiers determine shipping cost based on total order weight. Each tier has an upper limit and price.',
  },
  shipping_free_threshold: {
    cs: 'Objednavky nad tuto castku maji dopravu zdarma. Nastav 0 pro vypnuti.',
    en: 'Orders above this amount get free shipping. Set to 0 to disable.',
  },
  shipping_zones: {
    cs: 'Dopravni zony umoznuji nastavit ruzne ceny pro ruzne regiony (CZ, SK, EU, vlastni).',
    en: 'Shipping zones allow setting different prices for different regions (CZ, SK, EU, custom).',
  },
  shipping_price_per_kg: {
    cs: 'Priplatek za kazdy kilogram nad zakladni hmotnost. Aplikuje se na celou objednavku.',
    en: 'Surcharge per kilogram above base weight. Applied to the entire order.',
  },

  // ===== AdminExpress =====
  express_surcharge_percent: {
    cs: 'Procentualni prirazka k celkove cene objednavky za expresni doruceni.',
    en: 'Percentage surcharge on total order price for express delivery.',
  },
  express_surcharge_fixed: {
    cs: 'Pevna castka v Kc pridana k cene objednavky za expresni doruceni.',
    en: 'Fixed amount in CZK added to order price for express delivery.',
  },
  express_delivery_days: {
    cs: 'Pocet pracovnich dnu pro doruceni v teto urovni. Zakaznik vidi tuto informaci v kalkulacce.',
    en: 'Number of business days for delivery at this tier. Customer sees this info in the calculator.',
  },
  express_upsell: {
    cs: 'Upsell zprava zobrazena zakaznikovi pri vyberu standardniho doruceni, nabizejici rychlejsi variantu.',
    en: 'Upsell message shown to customer when selecting standard delivery, offering a faster option.',
  },

  // ===== AdminWidget =====
  widget_embed_code: {
    cs: 'HTML kod pro vlozeni kalkulacky na vasi webovou stranku. Zkopirujte a vlozte do HTML vasich stranek.',
    en: 'HTML code to embed the calculator on your website. Copy and paste into your page HTML.',
  },
  widget_domain_whitelist: {
    cs: 'Seznam domen kde je widget povoleny. Widget nebude fungovat na domenach ktere nejsou na seznamu.',
    en: 'List of domains where the widget is allowed. Widget will not work on domains not on the list.',
    learnMore: { label: 'Docs', href: '/support' },
  },
  widget_public_id: {
    cs: 'Unikatni verejny identifikator widgetu. Pouziva se v embed kodu a URL.',
    en: 'Unique public widget identifier. Used in embed code and URL.',
  },
  widget_branding: {
    cs: 'Nastaveni vizualniho stylu widgetu — barvy, logo, zakulaceni rohu. Widget pouziva CSS promenne.',
    en: 'Widget visual styling settings — colors, logo, border radius. Widget uses CSS variables.',
  },
  widget_checkout: {
    cs: 'Widget nepodporuje checkout flow. Zakaznik je presmerovan na vasi stranku pro dokonceni objednavky.',
    en: 'Widget does not support checkout flow. Customer is redirected to your page to complete the order.',
  },
};

/**
 * Get help text for a given key and language.
 * @param {string} key — help text key
 * @param {string} lang — 'cs' or 'en'
 * @returns {string} — localized help text
 */
export function getHelpText(key, lang = 'cs') {
  const entry = helpTexts[key];
  if (!entry) return '';
  return entry[lang] || entry.en || '';
}

/**
 * Get learn more link for a given key.
 * @param {string} key — help text key
 * @returns {{ label: string, href: string } | undefined}
 */
export function getLearnMore(key) {
  return helpTexts[key]?.learnMore;
}

export default helpTexts;

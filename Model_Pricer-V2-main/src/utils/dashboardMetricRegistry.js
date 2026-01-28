/*
  Dashboard Metric Registry
  -------------------------
  Defines which KPIs can be added to Admin Dashboard cards and how to compute them.
  NOTE: Branding-related metrics are intentionally excluded from cards (moved to top tips banner).
  NOTE: Metric #83 (Max widget instances plan limit) was explicitly removed per request.
*/

export const DASHBOARD_CATEGORIES = [
  { key: 'analytics', label: { cs: 'Analytics', en: 'Analytics' } },
  { key: 'orders',    label: { cs: 'Objednávky', en: 'Orders' } },
  { key: 'team',      label: { cs: 'Tým', en: 'Team' } },
  { key: 'pricing',   label: { cs: 'Ceník', en: 'Pricing' } },
  { key: 'fees',      label: { cs: 'Poplatky', en: 'Fees' } },
  { key: 'parameters',label: { cs: 'Parametry', en: 'Parameters' } },
  { key: 'presets',   label: { cs: 'Presety', en: 'Presets' } },
  { key: 'widget',    label: { cs: 'Widget', en: 'Widget' } },
  { key: 'plan',      label: { cs: 'Plán', en: 'Plan' } },
];

function labelByLang(obj, lang) {
  return (obj && (obj[lang] || obj.cs || obj.en)) || '';
}

export function getMetricByKey(key) {
  return DASHBOARD_METRICS.find((m) => m.key === key) || null;
}

export const DASHBOARD_METRICS = [
  // -----------------------
  // Analytics (supports days)
  // -----------------------
  {
    key: 'analytics.calculations',
    category: 'analytics',
    icon: 'Calculator',
    defaultColor: '#2563EB',
    valueType: 'number',
    supportsDays: true,
    getLabel: ({ language, days }) => language === 'cs' ? `Kalkulace (${days}d)` : `Calculations (${days}d)`,
    compute: ({ analyticsByDays }, { days = 30, language }) => {
      const o = analyticsByDays?.[days];
      const calculations = o?.metrics?.calculations ?? 0;
      const orders = o?.metrics?.orders ?? 0;
      return {
        value: calculations,
        change: `${orders} ${language === 'cs' ? 'objednávek' : 'orders'}`,
      };
    },
  },
  {
    key: 'analytics.orders',
    category: 'analytics',
    icon: 'ShoppingCart',
    defaultColor: '#10B981',
    valueType: 'number',
    supportsDays: true,
    getLabel: ({ language, days }) => language === 'cs' ? `Objednávky (${days}d)` : `Orders (${days}d)`,
    compute: ({ analyticsByDays }, { days = 30 }) => {
      const o = analyticsByDays?.[days];
      return { value: o?.metrics?.orders ?? 0, change: '' };
    },
  },
  {
    key: 'analytics.conversion',
    category: 'analytics',
    icon: 'TrendingUp',
    defaultColor: '#F59E0B',
    valueType: 'percent',
    supportsDays: true,
    getLabel: ({ language, days }) => language === 'cs' ? `Konverze (${days}d)` : `Conversion (${days}d)`,
    compute: ({ analyticsByDays }, { days = 30, language }) => {
      const o = analyticsByDays?.[days];
      const rate = o?.metrics?.conversion_rate ?? 0;
      return {
        value: rate,
        change: language === 'cs' ? 'objednávky/kalkulace' : 'orders/calculations',
      };
    },
  },
  {
    key: 'analytics.avg_price',
    category: 'analytics',
    icon: 'Coins',
    defaultColor: '#6366F1',
    valueType: 'currency',
    supportsDays: true,
    getLabel: ({ language, days }) => language === 'cs' ? `Průměrná cena (${days}d)` : `Avg Price (${days}d)`,
    compute: ({ analyticsByDays }, { days = 30 }) => {
      const o = analyticsByDays?.[days];
      return { value: o?.metrics?.avg_price ?? 0, change: '' };
    },
  },
  {
    key: 'analytics.avg_time_min',
    category: 'analytics',
    icon: 'Clock',
    defaultColor: '#0EA5E9',
    valueType: 'minutes',
    supportsDays: true,
    getLabel: ({ language, days }) => language === 'cs' ? `Průměrný čas (${days}d)` : `Avg Time (${days}d)`,
    compute: ({ analyticsByDays }, { days = 30 }) => {
      const o = analyticsByDays?.[days];
      return { value: o?.metrics?.avg_time_min ?? 0, change: '' };
    },
  },
  {
    key: 'analytics.avg_weight_g',
    category: 'analytics',
    icon: 'Scale',
    defaultColor: '#22C55E',
    valueType: 'grams',
    supportsDays: true,
    getLabel: ({ language, days }) => language === 'cs' ? `Průměrná hmotnost (${days}d)` : `Avg Weight (${days}d)`,
    compute: ({ analyticsByDays }, { days = 30 }) => {
      const o = analyticsByDays?.[days];
      return { value: o?.metrics?.avg_weight_g ?? 0, change: '' };
    },
  },

  // -----------------------
  // Orders
  // -----------------------
  {
    key: 'orders.total',
    category: 'orders',
    icon: 'ShoppingCart',
    defaultColor: '#10B981',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Objednávky celkem' : 'Total Orders',
    compute: ({ ordersSummary }, { language }) => {
      const total = ordersSummary?.totalOrders ?? 0;
      const newOrders = ordersSummary?.newOrders ?? 0;
      return {
        value: total,
        change: `${newOrders} ${language === 'cs' ? 'nových' : 'new'}`,
      };
    },
  },
  {
    key: 'orders.new',
    category: 'orders',
    icon: 'Bell',
    defaultColor: '#F97316',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Nové objednávky' : 'New Orders',
    compute: ({ ordersSummary }) => ({ value: ordersSummary?.newOrders ?? 0, change: '' }),
  },

  // -----------------------
  // Team
  // -----------------------
  {
    key: 'team.active_users',
    category: 'team',
    icon: 'Users',
    defaultColor: '#8B5CF6',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Aktivní uživatelé' : 'Active Users',
    compute: ({ teamSummary, seatLimit }, { language }) => {
      const active = teamSummary?.activeUsers ?? 0;
      return {
        value: active,
        change: `${active}/${seatLimit ?? 0} ${language === 'cs' ? 'míst' : 'seats'}`,
      };
    },
  },
  {
    key: 'team.pending_invites',
    category: 'team',
    icon: 'Mail',
    defaultColor: '#64748B',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Pending pozvánek' : 'Pending Invites',
    compute: ({ teamSummary }) => ({ value: teamSummary?.pendingInvites ?? 0, change: '' }),
  },

  // -----------------------
  // Pricing
  // -----------------------
  {
    key: 'pricing.hourly_rate',
    category: 'pricing',
    icon: 'Clock',
    defaultColor: '#EF4444',
    valueType: 'currency',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Cena hodiny' : 'Hourly Rate',
    compute: ({ pricingData }, { language }) => {
      const rate = pricingData?.hourlyRate ?? 0;
      const materials = pricingData?.materialCount ?? 0;
      return {
        value: rate,
        change: `${materials} ${language === 'cs' ? 'materiálů' : 'materials'}`,
      };
    },
  },
  {
    key: 'pricing.material_count',
    category: 'pricing',
    icon: 'Package',
    defaultColor: '#EF4444',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Materiály (celkem)' : 'Materials (total)',
    compute: ({ pricingData }) => ({ value: pricingData?.materialCount ?? 0, change: '' }),
  },

  // -----------------------
  // Fees
  // -----------------------
  {
    key: 'fees.active_fees',
    category: 'fees',
    icon: 'Receipt',
    defaultColor: '#14B8A6',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Aktivní poplatky' : 'Active Fees',
    compute: ({ feesData }, { language }) => {
      const totalActive = feesData?.totalActive ?? 0;
      const breakdown = feesData?.breakdown || {};
      return {
        value: totalActive,
        change: language === 'cs' ? 'Detail v přehledu' : 'Detail below',
        subtext: totalActive > 0 ? { type: 'feeBreakdown', breakdown } : null,
      };
    },
  },

  // -----------------------
  // Parameters
  // -----------------------
  {
    key: 'parameters.active_for_slicing',
    category: 'parameters',
    icon: 'Sliders',
    defaultColor: '#7C3AED',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Aktivní parametry' : 'Active Parameters',
    compute: ({ parametersSummary }, { language }) => {
      const active = parametersSummary?.activeCount ?? 0;
      const changed = parametersSummary?.changedCount ?? 0;
      return {
        value: active,
        change: `${changed} ${language === 'cs' ? 'upravených defaultů' : 'changed defaults'}`,
      };
    },
  },

  // -----------------------
  // Presets
  // -----------------------
  {
    key: 'presets.total',
    category: 'presets',
    icon: 'List',
    defaultColor: '#0EA5E9',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Presety (celkem)' : 'Presets (total)',
    compute: ({ presetsList }) => ({ value: Array.isArray(presetsList) ? presetsList.length : 0, change: '' }),
  },
  {
    key: 'presets.visible',
    category: 'presets',
    icon: 'Eye',
    defaultColor: '#22C55E',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Aktivní presety' : 'Active Presets',
    compute: ({ presetsList }, { language }) => {
      const list = Array.isArray(presetsList) ? presetsList : [];
      const visible = list.filter(p => p?.visible_in_widget).length;
      return { value: visible, change: `${list.length} ${language === 'cs' ? 'celkem' : 'total'}` };
    },
  },

  // -----------------------
  // Widget
  // -----------------------
  {
    key: 'widget.instances',
    category: 'widget',
    icon: 'LayoutDashboard',
    defaultColor: '#2563EB',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Widgety' : 'Widgets',
    compute: ({ widgetsList }, { language }) => {
      const list = Array.isArray(widgetsList) ? widgetsList : [];
      const active = list.filter(w => (w?.status || w?.active) === 'active').length;
      return { value: list.length, change: `${active} ${language === 'cs' ? 'aktivních' : 'active'}` };
    },
  },
  {
    key: 'widget.domains',
    category: 'widget',
    icon: 'Globe',
    defaultColor: '#64748B',
    valueType: 'number',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Domény (whitelist)' : 'Domains (whitelist)',
    compute: ({ widgetDomains }) => ({ value: Array.isArray(widgetDomains) ? widgetDomains.length : 0, change: '' }),
  },

  // Plan (no metric 83 here)
  {
    key: 'plan.name',
    category: 'plan',
    icon: 'BadgeCheck',
    defaultColor: '#111827',
    valueType: 'text',
    supportsDays: false,
    getLabel: ({ language }) => language === 'cs' ? 'Plán' : 'Plan',
    compute: ({ planFeatures }) => ({ value: planFeatures?.planName || planFeatures?.plan || '—', change: '' }),
  },
];

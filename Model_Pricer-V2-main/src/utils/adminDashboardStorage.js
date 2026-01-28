import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const STORAGE_NS_V1 = 'dashboard:v1';
const STORAGE_NS_V2 = 'dashboard:v2';

function uid(prefix = 'd') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function defaultGrid() {
  // cols = "how many KPI cards per row" when each card has w=1.
  return {
    cols: 3,
    rowHeight: 128,
    // react-grid-layout margin is [x,y] in pixels
    margin: [16, 16],
  };
}

export function buildDefaultDashboardConfig() {
  // Keep defaults aligned with the current Dashboard cards, but add grid layout.
  const grid = defaultGrid();
  const cards = [
    { id: 'card_calculations_30d', metricKey: 'analytics.calculations', days: 30, color: '#2563EB', titleOverride: '' , bgColor: '', locked: false },
    { id: 'card_orders_total', metricKey: 'orders.total', color: '#10B981', titleOverride: '' , bgColor: '', locked: false },
    { id: 'card_conversion_30d', metricKey: 'analytics.conversion', days: 30, color: '#F59E0B', titleOverride: '' , bgColor: '', locked: false },
    { id: 'card_active_users', metricKey: 'team.active_users', color: '#8B5CF6', titleOverride: '' , bgColor: '', locked: false },
    { id: 'card_hourly_rate', metricKey: 'pricing.hourly_rate', color: '#EF4444', titleOverride: '' , bgColor: '', locked: false },
    { id: 'card_active_fees', metricKey: 'fees.active_fees', color: '#14B8A6', titleOverride: '' , bgColor: '', locked: false },
  ];

  // Assign default layout sequentially.
  const withLayout = ensureCardLayouts(cards, grid.cols);

  return {
    version: 2,
    grid,
    cards: withLayout,
    sections: {
      activity: true,
      quickStats: true,
      brandingTips: true,
    },
    ui: {
      brandingBannerDismissed: false,
    },
    _meta: {
      created_at: nowISO(),
      updated_at: nowISO(),
    },
  };
}

function clampInt(n, fallback, min, max) {
  const x = Number.isFinite(n) ? Math.floor(n) : fallback;
  if (Number.isFinite(min) && x < min) return min;
  if (Number.isFinite(max) && x > max) return max;
  return x;
}

function sanitizeLayout(layout, cols) {
  const l = layout && typeof layout === 'object' ? layout : {};
  const w = clampInt(l.w, 1, 1, cols);
  const h = clampInt(l.h, 1, 1, 50);
  const x = clampInt(l.x, 0, 0, Math.max(0, cols - 1));
  const y = clampInt(l.y, 0, 0, 5000);
  return { x, y, w, h };
}

function ensureCardLayouts(cards, cols) {
  const next = [];
  const taken = new Set();

  const mark = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        taken.add(`${xx},${yy}`);
      }
    }
  };

  const isFree = (x, y) => !taken.has(`${x},${y}`);

  // First pass: mark existing layouts
  for (const c of cards) {
    if (c?.layout) {
      const l = sanitizeLayout(c.layout, cols);
      mark(l.x, l.y, l.w, l.h);
    }
  }

  // Second pass: assign missing layouts (w=1,h=1) to first free spot
  const findFirstFree = () => {
    for (let y = 0; y < 500; y++) {
      for (let x = 0; x < cols; x++) {
        if (isFree(x, y)) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  };

  for (const c of cards) {
    const card = { ...c };
    if (!card.layout) {
      const pos = findFirstFree();
      card.layout = { x: pos.x, y: pos.y, w: 1, h: 1 };
      mark(pos.x, pos.y, 1, 1);
    } else {
      card.layout = sanitizeLayout(card.layout, cols);
    }
    next.push(card);
  }

  return next;
}

function sanitizeConfigV2(input) {
  const base = buildDefaultDashboardConfig();
  if (!input || typeof input !== 'object') return base;

  const next = { ...base };

  // grid
  const inGrid = input.grid && typeof input.grid === 'object' ? input.grid : {};
  const cols = clampInt(inGrid.cols, base.grid.cols, 2, 6);
  next.grid = {
    cols,
    rowHeight: clampInt(inGrid.rowHeight, base.grid.rowHeight, 64, 260),
    margin: Array.isArray(inGrid.margin) && inGrid.margin.length === 2
      ? [clampInt(inGrid.margin[0], base.grid.margin[0], 0, 64), clampInt(inGrid.margin[1], base.grid.margin[1], 0, 64)]
      : base.grid.margin,
  };

  // cards
  if (Array.isArray(input.cards)) {
    const cards = input.cards
      .filter((c) => c && typeof c === 'object')
      .map((c) => ({
        id: String(c.id || uid('card')),
        metricKey: String(c.metricKey || ''),
        days: Number.isFinite(c.days) ? c.days : undefined,
        color: typeof c.color === 'string' ? c.color : undefined,
        titleOverride: typeof c.titleOverride === 'string' ? c.titleOverride : '',
        bgColor: typeof c.bgColor === 'string' ? c.bgColor : '',
        locked: !!c.locked,
        layout: c.layout ? sanitizeLayout(c.layout, cols) : null,
      }))
      .filter((c) => c.metricKey);

    next.cards = cards.length ? ensureCardLayouts(cards, cols) : base.cards;
  }

  // sections
  if (input.sections && typeof input.sections === 'object') {
    next.sections = {
      ...base.sections,
      ...Object.fromEntries(Object.entries(input.sections).map(([k, v]) => [k, !!v])),
    };
  }

  // ui
  if (input.ui && typeof input.ui === 'object') {
    next.ui = {
      ...base.ui,
      brandingBannerDismissed: !!input.ui.brandingBannerDismissed,
    };
  }

  next._meta = {
    ...base._meta,
    ...((input._meta && typeof input._meta === 'object') ? input._meta : {}),
    updated_at: nowISO(),
  };

  return next;
}

function migrateV1ToV2(v1) {
  const base = buildDefaultDashboardConfig();
  if (!v1 || typeof v1 !== 'object') return base;

  const grid = defaultGrid();
  const cols = grid.cols;

  const cards = Array.isArray(v1.cards)
    ? v1.cards
      .filter((c) => c && typeof c === 'object')
      .map((c, idx) => ({
        id: String(c.id || uid('card')),
        metricKey: String(c.metricKey || ''),
        days: Number.isFinite(c.days) ? c.days : undefined,
        color: typeof c.color === 'string' ? c.color : undefined,
        titleOverride: typeof c.titleOverride === 'string' ? c.titleOverride : '',
        layout: { x: idx % cols, y: Math.floor(idx / cols), w: 1, h: 1 },
      }))
      .filter((c) => c.metricKey)
    : base.cards;

  const migrated = {
    version: 2,
    grid,
    cards,
    sections: {
      ...base.sections,
      ...(v1.sections && typeof v1.sections === 'object' ? v1.sections : {}),
    },
    ui: {
      ...base.ui,
      ...(v1.ui && typeof v1.ui === 'object' ? { brandingBannerDismissed: !!v1.ui.brandingBannerDismissed } : {}),
    },
    _meta: {
      created_at: (v1._meta && v1._meta.created_at) ? v1._meta.created_at : nowISO(),
      updated_at: nowISO(),
      migrated_from: STORAGE_NS_V1,
    },
  };

  return sanitizeConfigV2(migrated);
}

export function loadDashboardConfig() {
  const storedV2 = readTenantJson(STORAGE_NS_V2, null);
  if (storedV2) return sanitizeConfigV2(storedV2);

  const storedV1 = readTenantJson(STORAGE_NS_V1, null);
  if (storedV1) {
    const migrated = migrateV1ToV2(storedV1);
    writeTenantJson(STORAGE_NS_V2, migrated);
    return migrated;
  }

  const base = buildDefaultDashboardConfig();
  writeTenantJson(STORAGE_NS_V2, base);
  return base;
}

export function saveDashboardConfig(config) {
  const next = sanitizeConfigV2(config);
  writeTenantJson(STORAGE_NS_V2, next);
  return next;
}

export function resetDashboardConfig() {
  const base = buildDefaultDashboardConfig();
  writeTenantJson(STORAGE_NS_V2, base);
  return base;
}

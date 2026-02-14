/*
  Admin Orders — Variant A (front-end demo)
  ----------------------------------------
  Persists Orders in localStorage so the Admin UI is fully usable for demos.

  Notes:
  - This file intentionally has *no* backend dependency.
  - Data model mirrors the specification (snapshots, activity log, notes, flags).
*/

import { appendTenantLog, readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_ORDERS = 'orders:v1';
const NS_ACTIVITY = 'orders:activity:v1';

export const ORDER_STATUSES = [
  'NEW',
  'REVIEW',
  'APPROVED',
  'PRINTING',
  'POSTPROCESS',
  'READY',
  'SHIPPED',
  'DONE',
  'CANCELED',
];

export const ORDER_FLAGS = [
  'OUT_OF_BOUNDS',
  'SLICER_FAILED',
  'MISSING_SLICER_DATA',
  'INVALID_CONFIG',
];

export function nowIso() {
  return new Date().toISOString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pad(n, width = 6) {
  const s = String(n);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

function pick(arr, idx) {
  return arr[Math.max(0, Math.min(arr.length - 1, idx))];
}

function seededRandom(seed) {
  // Deterministic pseudo-random generator (LCG)
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function computeModelBaseCosts(model) {
  const materialCost = round2((model?.slicer_snapshot?.weight_g || 0) * (model?.material_snapshot?.price_per_gram_snapshot || 0));
  const timeRatePerMin = (model?.pricing_snapshot?.rate_per_hour || 150) / 60;
  const timeCost = round2((model?.slicer_snapshot?.time_min || 0) * timeRatePerMin);
  return { materialCost, timeCost };
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function computeFeesTotal(fees = []) {
  return round2(fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0));
}

export function computeOrderTotals(order) {
  const models = order.models || [];
  let subtotalModels = 0;
  let timeSum = 0;
  let weightSum = 0;
  let piecesSum = 0;

  for (const m of models) {
    const qty = Number(m.quantity) || 1;
    piecesSum += qty;
    timeSum += (Number(m?.slicer_snapshot?.time_min) || 0) * qty;
    weightSum += (Number(m?.slicer_snapshot?.weight_g) || 0) * qty;

    const base = m.price_breakdown_snapshot || {};
    subtotalModels += (Number(base.model_total) || 0) * qty;
  }

  const oneTimeFeesTotal = computeFeesTotal(order.one_time_fees || []);

  // For Variant A (demo), minima/rounding deltas are stored on order snapshot if present.
  const minOrderDelta = Number(order?.totals_snapshot?.min_order_delta || 0);
  const roundingDelta = Number(order?.totals_snapshot?.rounding_delta || 0);
  const shippingTotal = Number(order?.totals_snapshot?.shipping_total || 0);

  const total = round2(subtotalModels + oneTimeFeesTotal + shippingTotal + minOrderDelta + roundingDelta);

  return {
    subtotal_models: round2(subtotalModels),
    one_time_fees_total: oneTimeFeesTotal,
    shipping_total: shippingTotal,
    min_order_delta: minOrderDelta,
    rounding_delta: roundingDelta,
    total: total,
    sum_time_min: round2(timeSum),
    sum_weight_g: round2(weightSum),
    sum_pieces: piecesSum,
  };
}

export function extractOrderMaterials(order) {
  const set = new Set();
  for (const m of order.models || []) {
    const name = m?.material_snapshot?.name;
    if (name) set.add(name);
  }
  return Array.from(set);
}

export function extractOrderPresets(order) {
  const set = new Set();
  for (const m of order.models || []) {
    const name = m?.preset_snapshot?.name;
    if (name) set.add(name);
  }
  return Array.from(set);
}

export function collectOrderFlags(order) {
  const set = new Set(order.flags || []);
  for (const m of order.models || []) {
    for (const f of m.flags || []) set.add(f);
  }
  return Array.from(set);
}

function buildSeedOrders() {
  const rnd = seededRandom(20251230);
  const materials = [
    { name: 'PLA', ppg: 3.9 },
    { name: 'PETG', ppg: 4.5 },
    { name: 'ABS', ppg: 6.0 },
  ];
  const presets = [
    { id: 'preset_basic', name: 'Basic', version: 1 },
    { id: 'preset_standard', name: 'Standard', version: 1 },
    { id: 'preset_detail', name: 'Detail', version: 1 },
  ];

  const filenames = [
    'benchy.stl',
    'phone_stand.stl',
    'xyz_cube.stl',
    'gear_assembly.stl',
    'cable_clip.stl',
    'enclosure_corner.stl',
    'knob.stl',
    'bracket_v2.stl',
  ];

  const customers = [
    { name: 'Jan Novák', email: 'jan.novak@example.com', phone: '+420 777 111 222' },
    { name: 'Petr Svoboda', email: 'petr.svoboda@example.com', phone: '+420 777 333 444' },
    { name: 'Eva Dvořáková', email: 'eva.dvorakova@example.com', phone: '+420 777 555 666' },
    { name: 'Firma ABC s.r.o.', email: 'poptavky@firmaabc.cz', phone: '+420 222 123 456' },
  ];

  const addresses = [
    { street: 'Hlavní 123', city: 'Praha', zip: '110 00', country: 'CZ' },
    { street: 'Masarykova 45', city: 'Brno', zip: '602 00', country: 'CZ' },
    { street: 'Sokolská 78', city: 'Ostrava', zip: '702 00', country: 'CZ' },
    { street: 'Komenského 12', city: 'Plzeň', zip: '301 00', country: 'CZ' },
  ];

  const baseDate = new Date();
  const orders = [];

  for (let i = 0; i < 28; i += 1) {
    const created = new Date(baseDate.getTime() - i * 18 * 60 * 60 * 1000); // every ~18h
    const id = `ORD-${pad(1200 + i, 6)}`;
    const customer = pick(customers, Math.floor(rnd() * customers.length));

    const modelsCount = 1 + Math.floor(rnd() * 3);
    const models = [];

    for (let m = 0; m < modelsCount; m += 1) {
      const mat = pick(materials, Math.floor(rnd() * materials.length));
      const preset = pick(presets, Math.floor(rnd() * presets.length));
      const filename = pick(filenames, Math.floor(rnd() * filenames.length));
      const qty = 1 + Math.floor(rnd() * 5);
      const timeMin = Math.round(25 + rnd() * 240);
      const weightG = round2(6 + rnd() * 90);
      const dims = {
        x: Math.round(20 + rnd() * 180),
        y: Math.round(20 + rnd() * 180),
        z: Math.round(10 + rnd() * 200),
      };

      const modelId = `M-${pad(i * 10 + m + 1, 4)}`;

      const model = {
        id: modelId,
        file_snapshot: {
          storage_path: `demo/${id}/${filename}`,
          filename,
          size: Math.round(200_000 + rnd() * 2_000_000),
          uploaded_at: created.toISOString(),
        },
        quantity: qty,
        material_snapshot: {
          material_id: mat.name.toLowerCase(),
          name: mat.name,
          price_per_gram_snapshot: mat.ppg,
        },
        color_snapshot: pick(['Black', 'White', 'Gray', 'Orange'], Math.floor(rnd() * 4)),
        preset_snapshot: {
          preset_id: preset.id,
          name: preset.name,
          version: preset.version,
        },
        resolved_config_snapshot: {
          resolved_values: {
            layer_height: preset.name === 'Detail' ? 0.15 : preset.name === 'Standard' ? 0.2 : 0.28,
            nozzle_diameter: 0.4,
            fill_density: preset.name === 'Basic' ? 12 : preset.name === 'Standard' ? 18 : 22,
            supports: false,
            print_speed: preset.name === 'Detail' ? 45 : 60,
          },
          resolved_meta: {
            layer_height: preset.name === 'Basic' ? 'preset' : 'preset',
            nozzle_diameter: 'default',
            fill_density: 'preset',
            supports: 'default',
            print_speed: 'preset',
          },
          validation_result: {
            ok: true,
            errors: [],
          },
        },
        slicer_snapshot: {
          time_min: timeMin,
          weight_g: weightG,
          dimensions_xyz: dims,
          used_filament_mm: Math.round(2500 + rnd() * 20_000),
        },
        price_breakdown_snapshot: {
          material_cost: 0,
          time_cost: 0,
          fees: [],
          fees_total: 0,
          model_subtotal: 0,
          model_total: 0,
        },
        pricing_snapshot: {
          rate_per_hour: 150,
        },
        flags: [],
        revisions: {
          price: [],
          slicer: [],
        },
      };

      // compute base breakdown (Variant A demo)
      const { materialCost, timeCost } = computeModelBaseCosts(model);
      const feesTotal = 0;
      const subtotal = round2(materialCost + timeCost + feesTotal);
      const total = subtotal;
      model.price_breakdown_snapshot = {
        material_cost: materialCost,
        time_cost: timeCost,
        fees: [],
        fees_total: feesTotal,
        model_subtotal: subtotal,
        model_total: total,
      };

      // seed revisions
      model.revisions.slicer.push({
        id: `s0`,
        created_at: created.toISOString(),
        reason: 'initial',
        slicer_snapshot: deepClone(model.slicer_snapshot),
      });
      model.revisions.price.push({
        id: `p0`,
        created_at: created.toISOString(),
        reason: 'initial',
        price_breakdown_snapshot: deepClone(model.price_breakdown_snapshot),
      });

      // demo flags
      if (dims.x > 200 || dims.y > 200 || dims.z > 220) {
        model.flags.push('OUT_OF_BOUNDS');
      }

      models.push(model);
    }

    const status = pick(ORDER_STATUSES, Math.floor(rnd() * ORDER_STATUSES.length));

    const address = pick(addresses, Math.floor(rnd() * addresses.length));
    const shortId = String(Math.floor(rnd() * 99999999)).padStart(8, '0');

    const order = {
      id,
      tenant_id: 'demo-tenant',
      created_at: created.toISOString(),
      status,
      customer_snapshot: deepClone(customer),
      shipping_address: deepClone(address),
      storage: {
        orderFolderId: `seed-${shortId}`,
        storagePath: `Orders/#${id}__${shortId}/`,
        savedAt: created.toISOString(),
        fileManifest: models.map((m) => ({
          type: 'model',
          filename: m.file_snapshot.filename,
          sha256: '',
          sizeBytes: m.file_snapshot.size,
        })),
        status: 'complete',
      },
      models,
      one_time_fees: [],
      totals_snapshot: {
        shipping_total: 0,
        min_order_delta: 0,
        rounding_delta: 0,
      },
      flags: [],
      notes: [],
      updated_at: created.toISOString(),
    };

    // order-level flags
    const flags = collectOrderFlags(order);
    order.flags = flags;

    // activity seed
    order.activity = [
      {
        timestamp: created.toISOString(),
        user_id: 'admin',
        type: 'CREATED',
        payload: { status },
      },
    ];

    orders.push(order);
  }

  return orders;
}

export function ensureOrdersSeeded() {
  const existing = readTenantJson(NS_ORDERS, null);
  if (existing?.orders?.length) return;

  const seed = buildSeedOrders();
  writeTenantJson(NS_ORDERS, { orders: seed });

  // also write a shared log namespace (for future cross-order audit)
  appendTenantLog(NS_ACTIVITY, {
    timestamp: nowIso(),
    user_id: 'system',
    type: 'SEED',
    payload: { count: seed.length },
  });
}

export function loadOrders() {
  ensureOrdersSeeded();
  const data = readTenantJson(NS_ORDERS, { orders: [] });
  return deepClone(data.orders || []);
}

export function saveOrders(orders) {
  writeTenantJson(NS_ORDERS, { orders: deepClone(orders) });
}

export function appendOrderActivity(orderId, entry) {
  // global activity log (optional)
  appendTenantLog(NS_ACTIVITY, { order_id: orderId, ...entry });
}

export function getStatusLabel(status, language = 'cs') {
  const map = {
    NEW: language === 'cs' ? 'Nová' : 'New',
    REVIEW: language === 'cs' ? 'Kontrola' : 'Review',
    APPROVED: language === 'cs' ? 'Schváleno' : 'Approved',
    PRINTING: language === 'cs' ? 'Tiskne se' : 'Printing',
    POSTPROCESS: language === 'cs' ? 'Postprocess' : 'Postprocess',
    READY: language === 'cs' ? 'Připraveno' : 'Ready',
    SHIPPED: language === 'cs' ? 'Odesláno' : 'Shipped',
    DONE: language === 'cs' ? 'Hotovo' : 'Done',
    CANCELED: language === 'cs' ? 'Zrušeno' : 'Canceled',
  };
  return map[status] || status;
}

export function getOrderStoragePath(order) {
  return order?.storage?.storagePath || null;
}

export function getOrderStorageStatus(order) {
  return order?.storage?.status || 'pending';
}

export function getFlagLabel(flag, language = 'cs') {
  const map = {
    OUT_OF_BOUNDS: language === 'cs' ? 'Mimo limity tiskárny' : 'Out of bounds',
    SLICER_FAILED: language === 'cs' ? 'Slicer selhal' : 'Slicer failed',
    MISSING_SLICER_DATA: language === 'cs' ? 'Chybí slicer data' : 'Missing slicer data',
    INVALID_CONFIG: language === 'cs' ? 'Neplatná konfigurace' : 'Invalid config',
  };
  return map[flag] || flag;
}

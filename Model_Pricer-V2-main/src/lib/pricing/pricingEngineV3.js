// Pricing Engine V3
// Used by /test-kalkulacka (tenant-scoped configs from AdminPricing + AdminFees)
// Pipeline: base → fees → markup → minima → rounding

function safeNum(v, fallback = 0) {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampMin0(v) {
  return Math.max(0, safeNum(v, 0));
}

function normStr(v) {
  return String(v ?? '').trim();
}

function normStrLower(v) {
  return normStr(v).toLowerCase();
}

function parseBoolLoose(v) {
  if (typeof v === 'boolean') return v;
  const s = normStrLower(v);
  if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
  return false;
}


// Fallback normalizer (belt & suspenders):
// Some callers may pass PricingConfigV3 that stores rules under tenant_pricing
// without duplicating the engine-root fields. Admin storage should normalize on load/save,
// but this makes the engine resilient.
function normalizePricingConfigEngineShape(pricingConfig) {
  const pc = (pricingConfig && typeof pricingConfig === 'object') ? pricingConfig : {};
  const tp = pc.tenant_pricing && typeof pc.tenant_pricing === 'object' ? pc.tenant_pricing : null;
  if (!tp) return pc;

  const rate_per_hour = clampMin0(tp.rate_per_hour ?? pc.rate_per_hour ?? pc.timeRate ?? 0);

  const minimum_billed_minutes = parseBoolLoose(tp.min_billed_minutes_enabled)
    ? clampMin0(tp.min_billed_minutes_value)
    : clampMin0(pc.minimum_billed_minutes ?? 0);

  const minimum_price_per_model = parseBoolLoose(tp.min_price_per_model_enabled)
    ? clampMin0(tp.min_price_per_model_value)
    : clampMin0(pc.minimum_price_per_model ?? 0);

  const minimum_order_total = parseBoolLoose(tp.min_order_total_enabled)
    ? clampMin0(tp.min_order_total_value)
    : clampMin0(pc.minimum_order_total ?? 0);

  const rounding_enabled = parseBoolLoose(tp.rounding_enabled ?? pc.rounding?.enabled);
  const rounding = {
    enabled: rounding_enabled,
    step: Math.max(1, Math.floor(clampMin0(tp.rounding_step ?? pc.rounding?.step ?? 1))),
    mode: (tp.rounding_mode ?? pc.rounding?.mode ?? 'nearest') === 'up' ? 'up' : 'nearest',
    smart_rounding_enabled: parseBoolLoose(tp.smart_rounding_enabled ?? pc.rounding?.smart_rounding_enabled ?? true),
  };

  const markup_enabled = parseBoolLoose(tp.markup_enabled ?? pc.markup?.enabled);
  const markup_mode = markup_enabled ? (tp.markup_mode ?? pc.markup?.mode ?? 'percent') : 'off';

  const markup_value = clampMin0(tp.markup_value ?? pc.markup?.value ?? 0);
  const markup_min_flat = clampMin0(tp.markup_min_flat ?? tp.markup_value ?? pc.markup?.min_flat ?? markup_value);

  const markup = {
    enabled: markup_enabled,
    mode: ['flat', 'percent', 'min_flat', 'off'].includes(String(markup_mode || ''))
      ? String(markup_mode)
      : (markup_enabled ? 'percent' : 'off'),
    value: markup_value,
    ...(String(markup_mode) === 'min_flat'
      ? { min_flat: markup_min_flat || markup_value }
      : (pc.markup?.min_flat != null ? { min_flat: markup_min_flat } : {})),
  };

  if (!markup.enabled) markup.mode = 'off';

  return {
    ...pc,
    rate_per_hour,
    minimum_billed_minutes,
    minimum_price_per_model,
    minimum_order_total,
    rounding,
    markup,
  };
}

function roundToStep(value, step, mode) {
  const v = safeNum(value, 0);
  const s = Math.max(1, safeNum(step, 1));
  if (mode === 'up') return Math.ceil(v / s) * s;
  return Math.round(v / s) * s;
}

function getSurfaceMm2FromFile(file, metrics, modelInfo) {
  // We only use real mesh surface if available (computed client-side from STL).
  // DO NOT fallback to bbox area for per_cm2 fees, because it would be misleading.
  const client = file?.clientModelInfo || {};
  const surfaceMm2 = safeNum(
    modelInfo?.surfaceMm2 ?? metrics?.surfaceMm2 ?? client?.surfaceMm2,
    NaN,
  );
  return Number.isFinite(surfaceMm2) && surfaceMm2 > 0 ? surfaceMm2 : null;
}

function getFileId(file, idx) {
  return String(file?.id || file?.fileId || file?.key || `file-${idx}`);
}

function getModelMetrics(file) {
  const metrics = file?.result?.metrics || {};
  const modelInfo = file?.result?.modelInfo || {};

  const estimatedTimeSeconds = safeNum(metrics?.estimatedTimeSeconds, 0);
  const filamentGrams = safeNum(metrics?.filamentGrams, 0);

  const volumeMm3 = safeNum(modelInfo?.volumeMm3, 0);
  const sizeMm = modelInfo?.sizeMm || {};

  const surfaceMm2 = getSurfaceMm2FromFile(file, metrics, modelInfo);
  const surfaceCm2 = surfaceMm2 != null ? surfaceMm2 / 100 : null;

  return {
    estimatedTimeSeconds,
    filamentGrams,
    volumeMm3,
    volumeCm3: volumeMm3 / 1000,
    sizeMm,
    surfaceMm2,
    surfaceCm2,
  };
}

function getMaterialPricePerGram(pricingConfig, materialKey) {
  const mats = Array.isArray(pricingConfig?.materials) ? pricingConfig.materials : [];
  const key = normStrLower(materialKey);

  const m = mats.find((x) => normStrLower(x?.key) === key) || mats.find((x) => x?.enabled && normStrLower(x?.key) === key);
  if (m && Number.isFinite(Number(m.price_per_gram))) return safeNum(m.price_per_gram, 0);

  const legacy = pricingConfig?.materialPrices && typeof pricingConfig.materialPrices === 'object' ? pricingConfig.materialPrices : null;
  if (legacy && Object.prototype.hasOwnProperty.call(legacy, key)) return safeNum(legacy[key], 0);

  return 0;
}

function getChargeBasis(fee) {
  const b = String(fee?.charge_basis || 'PER_FILE');
  return b === 'PER_PIECE' ? 'PER_PIECE' : 'PER_FILE';
}

function shouldApplyFee(fee, selectedFeeIds) {
  if (!fee || fee.active !== true) return false;
  if (fee.required === true) return true;

  // If not selectable, treat as "always-on" (hidden) fee.
  if (fee.selectable !== true) return true;

  return selectedFeeIds?.has?.(fee.id) || false;
}

function getFeeTargets(fee, feeTargetsById) {
  if (!fee?.apply_to_selected_models_enabled) {
    return { mode: 'ALL', modelIds: [] };
  }

  const entry = feeTargetsById && typeof feeTargetsById === 'object' ? feeTargetsById[fee.id] : null;
  const mode = entry?.mode === 'SELECTED' ? 'SELECTED' : 'ALL';
  const modelIds = Array.isArray(entry?.modelIds) ? entry.modelIds.map(String) : [];
  return { mode, modelIds };
}

function normalizeConditionOp(opRaw) {
  const o = normStrLower(opRaw);
  if (!o) return '';
  const map = {
    // canonical
    eq: 'eq',
    neq: 'neq',
    gt: 'gt',
    gte: 'gte',
    lt: 'lt',
    lte: 'lte',
    contains: 'contains',

    // legacy aliases
    equals: 'eq',
    '=': 'eq',
    '==': 'eq',

    not_equals: 'neq',
    '!=': 'neq',
    '!==': 'neq',

    greater_than: 'gt',
    '>': 'gt',

    greater_than_or_equal: 'gte',
    '>=': 'gte',

    less_than: 'lt',
    '<': 'lt',

    less_than_or_equal: 'lte',
    '<=': 'lte',
  };
  return map[o] || o;
}

function evalConditionSingle(cond, context) {
  const key = normStr(cond?.key);
  const op = normalizeConditionOp(cond?.op ?? cond?.operator);
  const expectedRaw = cond?.value;

  const actual = context?.[key];

  // Normalize expected (string form)
  const expectedStr = normStr(expectedRaw);
  const expectedLower = expectedStr.toLowerCase();

  // Normalize actual (string form)
  const actualLower = normStrLower(actual);

  // Numeric compare (strict: if NaN => fail for numeric ops)
  const actualNum = safeNum(actual, NaN);
  const expectedNum = safeNum(expectedRaw, NaN);
  const hasNum = Number.isFinite(actualNum) && Number.isFinite(expectedNum);

  // Bool compare (loose)
  const looksBool = (v) => {
    const s = normStrLower(v);
    return s === 'true' || s === 'false' || s === '1' || s === '0' || s === 'yes' || s === 'no' || s === 'y' || s === 'n';
  };
  const isBool = typeof actual === 'boolean' || typeof expectedRaw === 'boolean' || looksBool(actual) || looksBool(expectedRaw);

  let ok = true;

  if (op === 'eq') {
    if (isBool) ok = parseBoolLoose(actual) === parseBoolLoose(expectedRaw);
    else if (hasNum) ok = actualNum === expectedNum;
    else ok = actualLower === expectedLower;
  } else if (op === 'neq') {
    if (isBool) ok = parseBoolLoose(actual) !== parseBoolLoose(expectedRaw);
    else if (hasNum) ok = actualNum !== expectedNum;
    else ok = actualLower !== expectedLower;
  } else if (op === 'gt') {
    ok = hasNum ? actualNum > expectedNum : false;
  } else if (op === 'gte') {
    ok = hasNum ? actualNum >= expectedNum : false;
  } else if (op === 'lt') {
    ok = hasNum ? actualNum < expectedNum : false;
  } else if (op === 'lte') {
    ok = hasNum ? actualNum <= expectedNum : false;
  } else if (op === 'contains') {
    ok = actualLower.includes(expectedLower);
  } else {
    // Unknown operator => fail safe (do not match)
    ok = false;
  }

  return {
    key,
    operator: op,
    expected: expectedStr,
    actual,
    ok,
  };
}

function evaluateConditionsWithDebug(conditions, context) {
  const arr = Array.isArray(conditions) ? conditions : [];
  if (arr.length === 0) {
    return { match: true, details: [] };
  }

  const details = arr.map((c) => evalConditionSingle(c, context));
  const match = details.every((d) => d.ok);
  return { match, details };
}

export function evaluateConditions(conditions, context) {
  return evaluateConditionsWithDebug(conditions, context).match;
}

function calcBase({ file, cfg, pricingConfig }) {
  const metrics = getModelMetrics(file);

  const quantity = Math.max(1, Math.floor(clampMin0(cfg?.quantity || 1)));
  const materialKey = normStrLower(cfg?.material || cfg?.materialKey || pricingConfig?.default_material_key || 'pla');

  const pricePerGram = clampMin0(getMaterialPricePerGram(pricingConfig, materialKey));
  const ratePerHour = clampMin0(pricingConfig?.rate_per_hour);

  const rawMinutes = metrics.estimatedTimeSeconds > 0 ? Math.ceil(metrics.estimatedTimeSeconds / 60) : 0;
  const minBilled = clampMin0(pricingConfig?.minimum_billed_minutes);
  const billedMinutes = Math.max(rawMinutes, minBilled);

  const materialCostPerPiece = clampMin0(metrics.filamentGrams) * pricePerGram;
  const timeCostPerPiece = billedMinutes * (ratePerHour / 60);

  return {
    metrics,
    quantity,
    materialKey,
    pricePerGram,
    ratePerHour,
    billedMinutes,
    rawMinutes,
    materialCostPerPiece,
    timeCostPerPiece,
    basePerPiece: materialCostPerPiece + timeCostPerPiece,
    baseTotal: (materialCostPerPiece + timeCostPerPiece) * quantity,
  };
}

function feeTypeUnitAmount(fee, ctx, base) {
  const type = String(fee?.type || 'flat');
  const value = safeNum(fee?.value, 0);

  if (type === 'flat') return value;
  if (type === 'per_piece') return value;

  if (type === 'per_gram') return clampMin0(ctx?.filamentGrams) * value;
  if (type === 'per_minute') return clampMin0(base?.billedMinutes) * value;
  if (type === 'per_cm3') return clampMin0(ctx?.volumeCm3) * value;
  if (type === 'per_cm2') return clampMin0(ctx?.surfaceCm2) * value;

  // Unknown types fallback
  return value;
}

function buildModelContext({ fileId, cfg, base }) {
  const metrics = base?.metrics || {};

  const materialKey = normStrLower(cfg?.material || cfg?.materialKey || base?.materialKey);
  const qualityPreset = normStrLower(cfg?.quality);

  const supportsEnabled = !!cfg?.supports;
  const infillPercent = safeNum(cfg?.infill, 0);

  const filamentGrams = safeNum(metrics?.filamentGrams, 0);
  const estimatedTimeSeconds = safeNum(metrics?.estimatedTimeSeconds, 0);

  const volumeMm3 = safeNum(metrics?.volumeMm3, 0);
  const volumeCm3 = Number.isFinite(Number(metrics?.volumeCm3)) ? safeNum(metrics?.volumeCm3, 0) : volumeMm3 / 1000;

  const surfaceCm2Raw = metrics?.surfaceCm2;
  const surfaceCm2 = Number.isFinite(Number(surfaceCm2Raw)) && safeNum(surfaceCm2Raw, 0) > 0 ? safeNum(surfaceCm2Raw, 0) : null;

  const sizeRaw = metrics?.sizeMm || {};
  const sizeMm = {
    x: Number.isFinite(Number(sizeRaw?.x)) ? safeNum(sizeRaw.x, 0) : null,
    y: Number.isFinite(Number(sizeRaw?.y)) ? safeNum(sizeRaw.y, 0) : null,
    z: Number.isFinite(Number(sizeRaw?.z)) ? safeNum(sizeRaw.z, 0) : null,
  };

  return {
    // Condition keys used in AdminFees UI
    material_key: materialKey, // canonical
    material: materialKey, // compatibility with AdminFees keys
    quality_preset: qualityPreset,
    supports_enabled: supportsEnabled,
    support_enabled: supportsEnabled, // legacy alias
    infill_percent: infillPercent,

    // Metrics (canonical keys used by AdminFees numeric conditions)
    filamentGrams,
    estimatedTimeSeconds,
    billedMinutes: base?.billedMinutes || 0,
    volumeMm3,
    volumeCm3,
    surfaceCm2,
    sizeMm,

    // Optional aliases (future-proof)
    grams: filamentGrams,
    timeSeconds: estimatedTimeSeconds,
    volume_cm3: volumeCm3,
    surface_cm2: surfaceCm2,
    dimensionsMm: sizeMm,

    // Other
    fileId,
    quantity: base?.quantity || 1,
  };
}


function subsetKey(targets, conditions) {
  const t = targets?.mode === 'SELECTED' ? `SEL:${(targets.modelIds || []).slice().sort().join(',')}` : 'ALL';
  const c = Array.isArray(conditions) ? JSON.stringify(conditions) : '[]';
  return `${t}|${c}`;
}

export function calculateOrderQuote({
  uploadedFiles,
  printConfigs,
  pricingConfig,
  feesConfig,
  feeSelections,
}) {
  const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  const cfgById = printConfigs && typeof printConfigs === 'object' ? printConfigs : {};

  const pc = normalizePricingConfigEngineShape(pricingConfig);
  const fc = feesConfig && typeof feesConfig === 'object' ? feesConfig : {};

  const fees = Array.isArray(fc.fees) ? fc.fees : [];

  const selectedFeeIds = feeSelections?.selectedFeeIds instanceof Set
    ? feeSelections.selectedFeeIds
    : new Set(Array.isArray(feeSelections?.selectedFeeIds) ? feeSelections.selectedFeeIds.map(String) : []);

  const feeTargetsById = feeSelections?.feeTargetsById && typeof feeSelections.feeTargetsById === 'object'
    ? feeSelections.feeTargetsById
    : {};

  const rounding = pc.rounding && typeof pc.rounding === 'object' ? pc.rounding : { enabled: false };
  const markup = pc.markup && typeof pc.markup === 'object' ? pc.markup : { enabled: false, mode: 'off' };

  const minPerModel = clampMin0(pc.minimum_price_per_model);
  const minOrderTotal = clampMin0(pc.minimum_order_total);

  // --- Models (base + MODEL fees + per-model minima/rounding)
  const modelResults = [];
  const modelTotalsById = {};

  let materialTotal = 0;
  let timeTotal = 0;
  let servicesPositive = 0;
  let discountsNegative = 0;

  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    const id = getFileId(f, i);
    const cfg = cfgById[id] || {};

    const base = calcBase({ file: f, cfg, pricingConfig: pc });
    const ctx = buildModelContext({ fileId: id, cfg, base });

    // Simple totals (base)
    materialTotal += base.materialCostPerPiece * base.quantity;
    timeTotal += base.timeCostPerPiece * base.quantity;

    // Fees
    const feeRows = [];

    let nonPercentTotal = 0;
    let percentCandidates = [];

    // For percent base (per piece, approximate): basePerPiece + (non-percent PER_PIECE fees)
    let nonPercentPerPieceUnitSum = 0;

    for (const fee of fees) {
      if (!fee || fee.scope !== 'MODEL' || fee.active !== true) continue;

      const apply = shouldApplyFee(fee, selectedFeeIds);
      const targets = getFeeTargets(fee, feeTargetsById);
      const targeted = targets.mode === 'SELECTED' && targets.modelIds.length > 0;
      const targetOk = !targeted || targets.modelIds.includes(id);

      const cond = evaluateConditionsWithDebug(fee.conditions, ctx);
      const match = cond.match;

      if (!apply || !match || !targetOk) {
        feeRows.push({
          id: fee.id,
          name: fee.name,
          scope: fee.scope,
          type: fee.type,
          value: safeNum(fee.value, 0),
          required: !!fee.required,
          selectable: !!fee.selectable,
          selected: !!selectedFeeIds?.has?.(fee.id),
          applied: false,
          amount: 0,
          reason: {
            apply,
            match,
            targetOk,
            targets,
            conditions: cond.details,
          },
        });
        continue;
      }

      // per_cm2 needs real surface. If we don't have it, skip fee (and show it in developer breakdown).
      if (String(fee.type) === 'per_cm2' && !(Number.isFinite(ctx?.surfaceCm2) && ctx.surfaceCm2 > 0)) {
        feeRows.push({
          id: fee.id,
          name: fee.name,
          scope: fee.scope,
          type: fee.type,
          value: safeNum(fee.value, 0),
          required: !!fee.required,
          selectable: !!fee.selectable,
          selected: !!selectedFeeIds?.has?.(fee.id),
          applied: false,
          amount: 0,
          reason: {
            apply,
            match,
            targetOk,
            targets,
            surface_unavailable: true,
            conditions: cond.details,
          },
        });
        continue;
      }

      const charge = getChargeBasis(fee);
      const unit = feeTypeUnitAmount(fee, ctx, base);

      if (String(fee.type) === 'percent') {
        percentCandidates.push({ fee, charge, targets, cond });
        feeRows.push({
          id: fee.id,
          name: fee.name,
          scope: fee.scope,
          type: fee.type,
          value: safeNum(fee.value, 0),
          required: !!fee.required,
          selectable: !!fee.selectable,
          selected: !!selectedFeeIds?.has?.(fee.id),
          applied: true,
          amount: 0, // computed later
          pending_percent: true,
          reason: {
            apply,
            match,
            targetOk,
            targets,
            conditions: cond.details,
          },
        });
        continue;
      }

      const amount = charge === 'PER_PIECE' ? unit * base.quantity : unit;
      nonPercentTotal += amount;

      if (charge === 'PER_PIECE') nonPercentPerPieceUnitSum += unit;

      feeRows.push({
        id: fee.id,
        name: fee.name,
        scope: fee.scope,
        type: fee.type,
        value: safeNum(fee.value, 0),
        required: !!fee.required,
        selectable: !!fee.selectable,
        selected: !!selectedFeeIds?.has?.(fee.id),
        applied: true,
        amount,
        charge_basis: charge,
        unit_amount: unit,
        reason: {
          apply,
          match,
          targetOk,
          targets,
          conditions: cond.details,
        },
      });
    }

    // Percent MODEL fees (base: basePerPiece + non-percent PER_PIECE fees)
    const percentBasePerPiece = base.basePerPiece + nonPercentPerPieceUnitSum;
    let percentTotal = 0;

    if (percentCandidates.length > 0) {
      for (const cand of percentCandidates) {
        const fee = cand.fee;
        const charge = cand.charge;
        const pct = safeNum(fee.value, 0);

        const unitPct = (percentBasePerPiece * pct) / 100;
        const amount = charge === 'PER_PIECE' ? unitPct * base.quantity : unitPct;
        percentTotal += amount;

        // Patch the pending row
        const idxRow = feeRows.findIndex((r) => r.id === fee.id);
        if (idxRow >= 0) {
          feeRows[idxRow] = {
            ...feeRows[idxRow],
            amount,
            charge_basis: charge,
            unit_amount: unitPct,
            pending_percent: false,
            percent_base_per_piece: percentBasePerPiece,
          };
        }
      }
    }

    const feesTotal = nonPercentTotal + percentTotal;

    // Simple fees aggregation
    if (feesTotal >= 0) servicesPositive += feesTotal;
    else discountsNegative += feesTotal;

    // Subtotal (MODEL line item)
    let modelSubtotal = base.baseTotal + feesTotal;

    // Min per model (line item)
    let minApplied = false;
    if (minPerModel > 0 && modelSubtotal < minPerModel) {
      modelSubtotal = minPerModel;
      minApplied = true;
    }

    // Rounding per model (if smart rounding disabled)
    let perModelRounded = modelSubtotal;
    let roundingAppliedPerModel = false;
    if (rounding.enabled && !rounding.smart_rounding_enabled) {
      const rounded = roundToStep(perModelRounded, rounding.step, rounding.mode);
      roundingAppliedPerModel = rounded !== perModelRounded;
      perModelRounded = rounded;
    }

    modelTotalsById[id] = perModelRounded;

    modelResults.push({
      id,
      name: f?.name || f?.file?.name || `Model ${i + 1}`,
      status: f?.status || 'unknown',
      quantity: base.quantity,
      config: cfg,
      base: {
        materialKey: base.materialKey,
        pricePerGram: base.pricePerGram,
        ratePerHour: base.ratePerHour,
        filamentGrams: base.metrics.filamentGrams,
        estimatedTimeSeconds: base.metrics.estimatedTimeSeconds,
        billedMinutes: base.billedMinutes,
        volumeCm3: base.metrics.volumeCm3,
        surfaceCm2: base.metrics.surfaceCm2,
        materialCostPerPiece: base.materialCostPerPiece,
        timeCostPerPiece: base.timeCostPerPiece,
        basePerPiece: base.basePerPiece,
        baseTotal: base.baseTotal,
      },
      fees: feeRows,
      totals: {
        feesTotal,
        subtotalBeforeMin: base.baseTotal + feesTotal,
        subtotalAfterMin: modelSubtotal,
        subtotalAfterPerModelRounding: perModelRounded,
      },
      flags: {
        min_price_per_model_applied: minApplied,
        rounding_per_model_applied: roundingAppliedPerModel,
      },
    });
  }

  const modelsTotal = Object.values(modelTotalsById).reduce((a, b) => a + safeNum(b, 0), 0);

  // --- Volume Discounts (S05)
  const volumeConfig = pc.volume_discounts && typeof pc.volume_discounts === 'object' ? pc.volume_discounts : null;
  const volumeEnabled = !!volumeConfig?.enabled;
  let volumeDiscountTotal = 0;
  const volumeDiscountDetails = [];

  if (volumeEnabled && Array.isArray(volumeConfig?.tiers) && volumeConfig.tiers.length > 0) {
    // Sort tiers descending by min_qty for matching
    const sortedTiers = [...volumeConfig.tiers]
      .filter(t => t && safeNum(t.min_qty, 0) >= 1)
      .sort((a, b) => safeNum(b.min_qty, 0) - safeNum(a.min_qty, 0));

    const scope = volumeConfig.scope || 'per_model';
    const mode = volumeConfig.mode || 'percent';

    // For per_order scope, total quantity across all models
    const totalOrderQty = modelResults.reduce((sum, m) => sum + safeNum(m.quantity, 1), 0);

    for (const model of modelResults) {
      const qty = scope === 'per_order' ? totalOrderQty : safeNum(model.quantity, 1);
      const matchingTier = sortedTiers.find(t => qty >= safeNum(t.min_qty, 0));

      if (!matchingTier) {
        volumeDiscountDetails.push({ modelId: model.id, applied: false, savings: 0 });
        continue;
      }

      const originalPerPiece = model.totals.subtotalAfterPerModelRounding / safeNum(model.quantity, 1);
      let discountedPerPiece = originalPerPiece;
      let savings = 0;

      if (mode === 'percent') {
        const pct = safeNum(matchingTier.value, 0);
        discountedPerPiece = originalPerPiece * (1 - pct / 100);
        savings = (originalPerPiece - discountedPerPiece) * safeNum(model.quantity, 1);
      } else if (mode === 'fixed_price') {
        discountedPerPiece = safeNum(matchingTier.value, originalPerPiece);
        savings = Math.max(0, (originalPerPiece - discountedPerPiece) * safeNum(model.quantity, 1));
      }

      volumeDiscountTotal += savings;

      // Adjust model total
      const newModelTotal = modelTotalsById[model.id] - savings;
      modelTotalsById[model.id] = Math.max(0, newModelTotal);

      volumeDiscountDetails.push({
        modelId: model.id,
        applied: true,
        tier: { min_qty: matchingTier.min_qty, value: matchingTier.value, label: matchingTier.label },
        originalPerPiece,
        discountedPerPiece,
        savings,
      });
    }

    // Subtract from discountsNegative (negative number)
    discountsNegative -= volumeDiscountTotal;
  }

  // Recompute modelsTotal after volume discounts
  const modelsTotalAfterVolume = Object.values(modelTotalsById).reduce((a, b) => a + safeNum(b, 0), 0);

  // --- ORDER fees
  const orderFeeRows = [];
  let orderNonPercentTotal = 0;
  let orderPercentTotal = 0;

  // Map order non-percent totals by subset key (for percent base)
  const orderNonPercentBySubsetKey = {};

  const orderPercentCandidates = [];

  // Pre-compute model contexts + bases for order aggregation
  const modelCtxById = {};
  const modelBaseById = {};
  for (const m of modelResults) {
    const cfg = m.config || {};
    // Context for condition evaluation
    modelCtxById[m.id] = {
      material: normStr(cfg?.material || m.base.materialKey),
      quality_preset: normStr(cfg?.quality),
      support_enabled: !!cfg?.supports,
      infill_percent: safeNum(cfg?.infill, 0),
    };

    // Aggregation metrics (include quantity scaling at aggregation time)
    const surfRaw = m.base.surfaceCm2;
    const surfCm2 = Number.isFinite(surfRaw) && surfRaw > 0 ? surfRaw : null;
    modelBaseById[m.id] = {
      filamentGrams: safeNum(m.base.filamentGrams, 0),
      billedMinutes: safeNum(m.base.billedMinutes, 0),
      volumeCm3: safeNum(m.base.volumeCm3, 0),
      surfaceCm2: surfCm2,
      surfaceAvailable: surfCm2 != null,
      quantity: safeNum(m.quantity, 1),
    };
  }

for (const fee of fees) {
    if (!fee || fee.scope !== 'ORDER' || fee.active !== true) continue;

    const apply = shouldApplyFee(fee, selectedFeeIds);
    const targets = getFeeTargets(fee, feeTargetsById);
    const targeted = targets.mode === 'SELECTED' && targets.modelIds.length > 0;

    // Build subset of models that match conditions and targets
    const subsetIds = [];
    const matchDebug = [];

    for (const m of modelResults) {
      const id = m.id;
      const targetOk = !targeted || targets.modelIds.includes(id);
      const cond = evaluateConditionsWithDebug(fee.conditions, modelCtxById[id]);
      const match = cond.match;

      matchDebug.push({
        modelId: id,
        modelName: m.name,
        targetOk,
        match,
        conditions: cond.details,
      });

      if (targetOk && match) subsetIds.push(id);
    }

    const hasSubset = subsetIds.length > 0;

    if (!apply || !hasSubset) {
      orderFeeRows.push({
        id: fee.id,
        name: fee.name,
        scope: fee.scope,
        type: fee.type,
        value: safeNum(fee.value, 0),
        required: !!fee.required,
        selectable: !!fee.selectable,
        selected: !!selectedFeeIds?.has?.(fee.id),
        applied: false,
        amount: 0,
        subset: subsetIds,
        reason: {
          apply,
          hasSubset,
          targets,
          models: matchDebug,
        },
      });
      continue;
    }

    const key = subsetKey(targets, fee.conditions);

    if (String(fee.type) === 'percent') {
      orderPercentCandidates.push({ fee, subsetIds, key, targets, matchDebug, apply });
      orderFeeRows.push({
        id: fee.id,
        name: fee.name,
        scope: fee.scope,
        type: fee.type,
        value: safeNum(fee.value, 0),
        required: !!fee.required,
        selectable: !!fee.selectable,
        selected: !!selectedFeeIds?.has?.(fee.id),
        applied: true,
        amount: 0,
        pending_percent: true,
        subset: subsetIds,
        reason: {
          apply,
          hasSubset,
          targets,
          models: matchDebug,
        },
      });
      continue;
    }

    // per_cm2 needs surface from each model in subset. If any is missing, skip fee.
    if (String(fee.type) === 'per_cm2') {
      const missingSurfaceModels = subsetIds.filter((id) => !(modelBaseById[id]?.surfaceAvailable));
      if (missingSurfaceModels.length > 0) {
        orderFeeRows.push({
          id: fee.id,
          name: fee.name,
          scope: fee.scope,
          type: fee.type,
          value: safeNum(fee.value, 0),
          required: !!fee.required,
          selectable: !!fee.selectable,
          selected: !!selectedFeeIds?.has?.(fee.id),
          applied: false,
          amount: 0,
          subset: subsetIds,
          subset_key: key,
          reason: {
            apply,
            hasSubset,
            targets,
            surface_unavailable: true,
            surface_unavailable_models: missingSurfaceModels,
            models: matchDebug,
          },
        });
        continue;
      }
    }

    // Aggregate metrics for subset (include quantity)
    let grams = 0;
    let minutes = 0;
    let vol = 0;
    let surf = 0;
    let pieces = 0;

    for (const id of subsetIds) {
      const b = modelBaseById[id] || {};
      const q = Math.max(1, Math.floor(clampMin0(b.quantity || 1)));
      grams += clampMin0(b.filamentGrams) * q;
      minutes += clampMin0(b.billedMinutes) * q;
      vol += clampMin0(b.volumeCm3) * q;
      surf += clampMin0(b.surfaceCm2) * q;
      pieces += q;
    }

    const type = String(fee.type || 'flat');
    const value = safeNum(fee.value, 0);

    let amount = 0;
    if (type === 'flat') amount = value;
    else if (type === 'per_gram') amount = grams * value;
    else if (type === 'per_minute') amount = minutes * value;
    else if (type === 'per_cm3') amount = vol * value;
    else if (type === 'per_cm2') amount = surf * value;
    else if (type === 'per_piece') amount = pieces * value;
    else amount = value;

    orderNonPercentTotal += amount;
    orderNonPercentBySubsetKey[key] = safeNum(orderNonPercentBySubsetKey[key], 0) + amount;

    orderFeeRows.push({
      id: fee.id,
      name: fee.name,
      scope: fee.scope,
      type: fee.type,
      value: safeNum(fee.value, 0),
      required: !!fee.required,
      selectable: !!fee.selectable,
      selected: !!selectedFeeIds?.has?.(fee.id),
      applied: true,
      amount,
      subset: subsetIds,
      subset_key: key,
      aggregation: { grams, minutes, vol_cm3: vol, surf_cm2: surf, pieces },
      reason: {
        apply,
        hasSubset,
        targets,
        models: matchDebug,
      },
    });
  }

  // Percent ORDER fees (base: subset models total + subset order non-percent fees with same subset key)
  for (const cand of orderPercentCandidates) {
    const fee = cand.fee;
    const pct = safeNum(fee.value, 0);

    const subsetModelsTotal = cand.subsetIds.reduce((sum, id) => sum + safeNum(modelTotalsById[id], 0), 0);
    const subsetNonPercent = safeNum(orderNonPercentBySubsetKey[cand.key], 0);

    const baseForPercent = subsetModelsTotal + subsetNonPercent;
    const amount = (baseForPercent * pct) / 100;

    orderPercentTotal += amount;

    // Patch pending row
    const idxRow = orderFeeRows.findIndex((r) => r.id === fee.id);
    if (idxRow >= 0) {
      orderFeeRows[idxRow] = {
        ...orderFeeRows[idxRow],
        amount,
        pending_percent: false,
        percent_base: baseForPercent,
        subset_key: cand.key,
      };
    }
  }

  const orderFeesTotal = orderNonPercentTotal + orderPercentTotal;

  // Simple order fee aggregation
  if (orderFeesTotal >= 0) servicesPositive += orderFeesTotal;
  else discountsNegative += orderFeesTotal;

  // --- Markup (order-level)
  const subtotalBeforeMarkup = modelsTotalAfterVolume + orderFeesTotal;
  let markupAmount = 0;

  if (markup.enabled && markup.mode && markup.mode !== 'off') {
    const mode = String(markup.mode);
    if (mode === 'flat') {
      markupAmount = safeNum(markup.value, 0);
    } else if (mode === 'percent') {
      markupAmount = (subtotalBeforeMarkup * safeNum(markup.value, 0)) / 100;
    } else if (mode === 'min_flat') {
      const target = clampMin0(markup.min_flat > 0 ? markup.min_flat : markup.value);
      if (subtotalBeforeMarkup < target) markupAmount = target - subtotalBeforeMarkup;
    }
  }

  let totalAfterMarkup = subtotalBeforeMarkup + markupAmount;

  // --- Min order total
  let minOrderApplied = false;
  if (minOrderTotal > 0 && totalAfterMarkup < minOrderTotal) {
    totalAfterMarkup = minOrderTotal;
    minOrderApplied = true;
  }

  // --- Final rounding (always if enabled)
  let totalRounded = totalAfterMarkup;
  let roundingAppliedFinal = false;
  if (rounding.enabled) {
    const rounded = roundToStep(totalAfterMarkup, rounding.step, rounding.mode);
    roundingAppliedFinal = rounded !== totalAfterMarkup;
    totalRounded = rounded;
  }

  // Clamp final total to >= 0 (discounts can push it below)
  const total = Math.max(0, safeNum(totalRounded, 0));
  const clampedToZero = total !== safeNum(totalRounded, 0);

  return {
    currency: 'CZK',
    total,
    totals: {
      material: materialTotal,
      time: timeTotal,
      modelsTotal: modelsTotalAfterVolume,
      volumeDiscountTotal,
      orderFeesTotal,
      subtotalBeforeMarkup,
      markupAmount,
      totalAfterMarkup,
      totalRounded,
    },
    simple: {
      material: materialTotal,
      time: timeTotal,
      services: servicesPositive,
      discount: discountsNegative, // negative number (includes volume discount)
      markup: markupAmount,
    },
    models: modelResults,
    orderFees: orderFeeRows,
    volumeDiscount: volumeEnabled ? {
      enabled: true,
      mode: volumeConfig.mode,
      scope: volumeConfig.scope,
      totalSavings: volumeDiscountTotal,
      details: volumeDiscountDetails,
    } : null,
    flags: {
      min_order_total_applied: minOrderApplied,
      rounding_final_applied: roundingAppliedFinal,
      clamped_to_zero: clampedToZero,
      volume_discount_applied: volumeDiscountTotal > 0,
    },
  };
}


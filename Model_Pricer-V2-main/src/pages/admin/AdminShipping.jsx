// Admin Shipping Methods Configuration Page — V1
// ------------------------------------------------
// Scope: /admin/shipping only
// - Single source of truth: tenant-scoped V1 storage (namespace: shipping:v1)
// - 2-column layout: method list (left) + method editor (right)
// - Supports FIXED, WEIGHT_BASED and PICKUP shipping types
// - Free shipping threshold configuration

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadShippingConfigV1, saveShippingConfigV1 } from '../../utils/adminShippingStorage';

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function createId(prefix = 'ship') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SHIPPING_TYPES = [
  { value: 'FIXED', label_cs: 'Pevna cena', label_en: 'Fixed price' },
  { value: 'WEIGHT_BASED', label_cs: 'Podle hmotnosti', label_en: 'Weight-based' },
  { value: 'PICKUP', label_cs: 'Osobni odber', label_en: 'Personal pickup' },
];

export default function AdminShipping() {
  const { t, language } = useLanguage();
  const cs = language === 'cs';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  useEffect(() => {
    try {
      const cfg = loadShippingConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.methods?.length) setSelectedMethodId(cfg.methods[0].id);
      setLoading(false);
    } catch (e) {
      console.error('[AdminShipping] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const selectedMethod = useMemo(() => {
    if (!config?.methods || !selectedMethodId) return null;
    return config.methods.find((m) => m.id === selectedMethodId) || null;
  }, [config, selectedMethodId]);

  const ui = useMemo(() => ({
    title: cs ? 'Doprava' : 'Shipping',
    subtitle: cs
      ? 'Spravuj zpusoby dopravy, cenove tiery podle hmotnosti a prahu pro dopravu zdarma.'
      : 'Manage shipping methods, weight-based pricing tiers and free shipping threshold.',
    newMethod: cs ? 'Nova metoda' : 'New method',
    save: cs ? 'Ulozit' : 'Save',
    saving: cs ? 'Ukladam...' : 'Saving...',
    saved: cs ? 'Ulozeno' : 'Saved',
    unsaved: cs ? 'Neulozene zmeny' : 'Unsaved changes',
    noMethods: cs ? 'Zadne metody dopravy' : 'No shipping methods',
    noMethodsHint: cs ? 'Klikni na "Nova metoda".' : 'Click "New method".',
    editorTitle: cs ? 'Editor metody' : 'Method editor',
    emptyEditor: cs ? 'Vyber metodu vlevo.' : 'Select a method on the left.',
  }), [cs]);

  const updateConfig = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const updateMethod = (methodId, patch) => {
    setConfig((prev) => {
      const methods = (prev.methods || []).map((m) => {
        if (m.id !== methodId) return m;
        return { ...m, ...patch };
      });
      return { ...prev, methods };
    });
  };

  const addMethod = () => {
    const id = createId('ship');
    const newMethod = {
      id,
      name: cs ? 'Nova doprava' : 'New shipping',
      type: 'FIXED',
      price: 0,
      weight_tiers: [],
      delivery_days_min: 1,
      delivery_days_max: 3,
      active: true,
      sort_order: (config?.methods?.length || 0),
      description: '',
    };
    setConfig((prev) => ({ ...prev, methods: [...(prev.methods || []), newMethod] }));
    setSelectedMethodId(id);
    setBanner(null);
  };

  const removeMethod = (id) => {
    const ok = window.confirm(cs ? 'Smazat tuto metodu dopravy?' : 'Delete this shipping method?');
    if (!ok) return;
    setConfig((prev) => ({
      ...prev,
      methods: (prev.methods || []).filter((m) => m.id !== id),
    }));
    if (selectedMethodId === id) setSelectedMethodId(null);
  };

  const moveMethod = (methodId, direction) => {
    setConfig((prev) => {
      const methods = [...(prev.methods || [])];
      const idx = methods.findIndex((m) => m.id === methodId);
      if (idx < 0) return prev;
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= methods.length) return prev;
      [methods[idx], methods[swapIdx]] = [methods[swapIdx], methods[idx]];
      return { ...prev, methods: methods.map((m, i) => ({ ...m, sort_order: i })) };
    });
  };

  // Weight tier CRUD for the selected method
  const addWeightTier = () => {
    if (!selectedMethod) return;
    const tiers = [...(selectedMethod.weight_tiers || [])];
    const lastMax = tiers.length > 0 ? safeNum(tiers[tiers.length - 1].max_weight_g, 0) : 0;
    tiers.push({ max_weight_g: lastMax + 1000, price: 0 });
    updateMethod(selectedMethod.id, { weight_tiers: tiers });
  };

  const updateWeightTier = (idx, patch) => {
    if (!selectedMethod) return;
    const tiers = [...(selectedMethod.weight_tiers || [])];
    tiers[idx] = { ...tiers[idx], ...patch };
    updateMethod(selectedMethod.id, { weight_tiers: tiers });
  };

  const removeWeightTier = (idx) => {
    if (!selectedMethod) return;
    const tiers = [...(selectedMethod.weight_tiers || [])];
    tiers.splice(idx, 1);
    updateMethod(selectedMethod.id, { weight_tiers: tiers });
  };

  const handleSave = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveShippingConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      console.error('[AdminShipping] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni selhalo.' : 'Save failed.' });
    }
  };

  const handleReset = () => {
    const ok = window.confirm(cs ? 'Zahodit zmeny?' : 'Discard changes?');
    if (!ok) return;
    try {
      const cfg = loadShippingConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.methods?.length) setSelectedMethodId(cfg.methods[0].id);
      setBanner({ type: 'success', text: cs ? 'Obnoveno.' : 'Reset done.' });
    } catch (e) {
      setBanner({ type: 'error', text: cs ? 'Reset selhal.' : 'Reset failed.' });
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="Loader2" size={18} />
              <span>{cs ? 'Nacitam...' : 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const methods = config?.methods || [];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>{ui.title}</h1>
          <p className="subtitle">{ui.subtitle}</p>
        </div>
        <div className="header-actions">
          <div className={`status-pill ${dirty ? 'dirty' : 'clean'}`}>
            <Icon name={dirty ? 'AlertCircle' : 'CheckCircle2'} size={16} />
            <span>{dirty ? ui.unsaved : ui.saved}</span>
          </div>
          <button className="btn-secondary" onClick={addMethod}>
            <Icon name="Plus" size={18} />
            {ui.newMethod}
          </button>
          <button className="btn-secondary" onClick={handleReset} disabled={!dirty}>
            <Icon name="RotateCcw" size={18} />
            {cs ? 'Reset' : 'Reset'}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            <Icon name="Save" size={18} />
            {saving ? ui.saving : ui.save}
          </button>
        </div>
      </div>

      {banner && (
        <div className={`banner ${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={18} />
          <span>{banner.text}</span>
        </div>
      )}

      <div className="shipping-layout">
        {/* LEFT: METHOD LIST */}
        <div className="shipping-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>{cs ? 'Metody dopravy' : 'Shipping methods'}</h2>
              <span className="muted">{methods.length}</span>
            </div>
            <label className="toggle" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={config?.enabled !== false}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
              />
              <span>{cs ? 'Doprava zapnuta' : 'Shipping enabled'}</span>
            </label>
          </div>

          <div className="panel-body">
            {methods.length === 0 ? (
              <div className="empty-state">
                <Icon name="Package" size={44} />
                <h3>{ui.noMethods}</h3>
                <p>{ui.noMethodsHint}</p>
              </div>
            ) : (
              <div className="method-list">
                {methods.map((method, idx) => {
                  const isActive = method.id === selectedMethodId;
                  const typeLabel = SHIPPING_TYPES.find((t) => t.value === method.type);
                  return (
                    <div
                      key={method.id}
                      className={`method-row ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedMethodId(method.id)}
                    >
                      <div className="method-row-main">
                        <div className="method-row-top">
                          <div className="method-name">
                            <span className={`dot ${method.active ? 'on' : 'off'}`} />
                            <span className="name-text">{method.name}</span>
                          </div>
                          <div className="method-actions">
                            <button className="icon-btn" title={cs ? 'Nahoru' : 'Up'} onClick={(e) => { e.stopPropagation(); moveMethod(method.id, -1); }} disabled={idx === 0}>
                              <Icon name="ChevronUp" size={14} />
                            </button>
                            <button className="icon-btn" title={cs ? 'Dolu' : 'Down'} onClick={(e) => { e.stopPropagation(); moveMethod(method.id, 1); }} disabled={idx === methods.length - 1}>
                              <Icon name="ChevronDown" size={14} />
                            </button>
                            <button className="icon-btn" title={cs ? 'Smazat' : 'Delete'} onClick={(e) => { e.stopPropagation(); removeMethod(method.id); }}>
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="method-row-bottom">
                          <span className="chip">{typeLabel ? (cs ? typeLabel.label_cs : typeLabel.label_en) : method.type}</span>
                          {method.type === 'FIXED' && <span className="chip">{safeNum(method.price).toFixed(2)} CZK</span>}
                          {method.type === 'PICKUP' && <span className="chip">{cs ? 'Zdarma' : 'Free'}</span>}
                          {method.type === 'WEIGHT_BASED' && <span className="chip">{(method.weight_tiers || []).length} {cs ? 'tieru' : 'tiers'}</span>}
                          {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                            <span className="chip">
                              <Icon name="Clock" size={12} />
                              {method.delivery_days_min}–{method.delivery_days_max} {cs ? 'dni' : 'days'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div className="shipping-editor">
          {!selectedMethod ? (
            <div className="admin-card">
              <div className="card-body" style={{ padding: 16 }}>
                <div className="empty-editor">
                  <Icon name="MousePointer2" size={44} />
                  <h3>{ui.editorTitle}</h3>
                  <p>{ui.emptyEditor}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION: BASIC SETTINGS */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{cs ? 'Zakladni nastaveni' : 'Basic settings'}</h2>
                    <p className="card-description">{cs ? 'Nazev, typ, cena a doba doruceni.' : 'Name, type, price and delivery time.'}</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="grid2">
                    <div className="field">
                      <label>{cs ? 'Nazev' : 'Name'}</label>
                      <input
                        className="input"
                        value={selectedMethod.name}
                        onChange={(e) => updateMethod(selectedMethod.id, { name: e.target.value })}
                        placeholder={cs ? 'Napr. Ceska posta' : 'e.g. Standard Shipping'}
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Typ' : 'Type'}</label>
                      <select
                        className="input"
                        value={selectedMethod.type}
                        onChange={(e) => updateMethod(selectedMethod.id, { type: e.target.value, weight_tiers: e.target.value === 'WEIGHT_BASED' ? (selectedMethod.weight_tiers || []) : [] })}
                      >
                        {SHIPPING_TYPES.map((o) => (
                          <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedMethod.type === 'FIXED' && (
                    <div className="grid2" style={{ marginTop: 12 }}>
                      <div className="field">
                        <label>{cs ? 'Cena (CZK)' : 'Price (CZK)'}</label>
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          min="0"
                          value={selectedMethod.price}
                          onChange={(e) => updateMethod(selectedMethod.id, { price: safeNum(e.target.value, 0) })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid2" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label>{cs ? 'Doba doruceni MIN (dny)' : 'Delivery days MIN'}</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={selectedMethod.delivery_days_min}
                        onChange={(e) => updateMethod(selectedMethod.id, { delivery_days_min: safeNum(e.target.value, 0) })}
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Doba doruceni MAX (dny)' : 'Delivery days MAX'}</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={selectedMethod.delivery_days_max}
                        onChange={(e) => updateMethod(selectedMethod.id, { delivery_days_max: safeNum(e.target.value, 0) })}
                      />
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: 12 }}>
                    <label>{cs ? 'Popis' : 'Description'}</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={selectedMethod.description}
                      onChange={(e) => updateMethod(selectedMethod.id, { description: e.target.value })}
                      placeholder={cs ? 'Kratky popis pro zakaznika...' : 'Short description for customer...'}
                    />
                  </div>

                  <div className="toggles" style={{ marginTop: 12 }}>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={selectedMethod.active}
                        onChange={(e) => updateMethod(selectedMethod.id, { active: e.target.checked })}
                      />
                      <span>{cs ? 'Aktivni' : 'Active'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION: WEIGHT TIERS (only for WEIGHT_BASED) */}
              {selectedMethod.type === 'WEIGHT_BASED' && (
                <div className="admin-card">
                  <div className="card-header">
                    <div>
                      <h2>{cs ? 'Hmotnostni tiery' : 'Weight tiers'}</h2>
                      <p className="card-description">
                        {cs
                          ? 'Definuj cenove tiery podle maximalni hmotnosti zasilky. Cena se pouzije pro zasilky az do dane hmotnosti.'
                          : 'Define price tiers by maximum parcel weight. Price applies to parcels up to the given weight.'}
                      </p>
                    </div>
                    <button className="btn-secondary" onClick={addWeightTier}>
                      <Icon name="Plus" size={18} />
                      {cs ? 'Pridat tier' : 'Add tier'}
                    </button>
                  </div>
                  <div className="card-body">
                    {(selectedMethod.weight_tiers || []).length === 0 ? (
                      <div className="help">{cs ? 'Zadne tiery. Pridej aspon jeden.' : 'No tiers. Add at least one.'}</div>
                    ) : (
                      <div className="weight-table">
                        <div className="weight-header">
                          <span>{cs ? 'Max hmotnost (g)' : 'Max weight (g)'}</span>
                          <span>{cs ? 'Cena (CZK)' : 'Price (CZK)'}</span>
                          <span></span>
                        </div>
                        {(selectedMethod.weight_tiers || []).map((wt, idx) => (
                          <div key={idx} className="weight-row">
                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={wt.max_weight_g}
                              onChange={(e) => updateWeightTier(idx, { max_weight_g: safeNum(e.target.value, 0) })}
                            />
                            <input
                              className="input"
                              type="number"
                              step="0.01"
                              min="0"
                              value={wt.price}
                              onChange={(e) => updateWeightTier(idx, { price: safeNum(e.target.value, 0) })}
                            />
                            <button className="icon-btn" onClick={() => removeWeightTier(idx)} title={cs ? 'Smazat' : 'Remove'}>
                              <Icon name="X" size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SECTION: FREE SHIPPING (always visible) */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Doprava zdarma' : 'Free shipping'}</h2>
                <p className="card-description">{cs ? 'Nastav minimalni castku objednavky pro dopravu zdarma.' : 'Set minimum order amount for free shipping.'}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="toggles">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={config?.free_shipping_enabled === true}
                    onChange={(e) => updateConfig({ free_shipping_enabled: e.target.checked })}
                  />
                  <span>{cs ? 'Doprava zdarma zapnuta' : 'Free shipping enabled'}</span>
                </label>
              </div>
              {config?.free_shipping_enabled && (
                <div className="field" style={{ marginTop: 12, maxWidth: 300 }}>
                  <label>{cs ? 'Minimalni castka objednavky (CZK)' : 'Minimum order amount (CZK)'}</label>
                  <input
                    className="input"
                    type="number"
                    step="1"
                    min="0"
                    value={config?.free_shipping_threshold || 0}
                    onChange={(e) => updateConfig({ free_shipping_threshold: safeNum(e.target.value, 0) })}
                  />
                  <div className="help">{cs ? 'Objednavky nad tuto castku budou mit dopravu zdarma.' : 'Orders above this amount get free shipping.'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-page {
          padding: 24px;
          max-width: 1320px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }

        h1 { margin: 0; font-size: 28px; font-weight: 600; color: var(--forge-text-primary); }
        .subtitle { margin: 4px 0 0 0; color: var(--forge-text-secondary); font-size: 14px; max-width: 760px; }

        .header-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 10px; font-size: 12px; border: 1px solid var(--forge-border-default); background: var(--forge-bg-surface); color: var(--forge-text-muted);
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em;
        }
        .status-pill.clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .status-pill.dirty { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        .btn-primary {
          background: var(--forge-accent-primary); color: #0A0E17; border: 1px solid var(--forge-accent-primary); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.04em; font-size: 13px;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-secondary:hover { background: var(--forge-bg-surface); border-color: var(--forge-accent-primary); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: var(--forge-radius-md); margin: 10px 0 16px 0; font-size: 14px;
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-surface); color: var(--forge-text-secondary);
        }
        .banner.success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .banner.error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        .shipping-layout {
          display: grid; grid-template-columns: 400px 1fr; gap: 16px; align-items: start;
        }
        @media (max-width: 1100px) { .shipping-layout { grid-template-columns: 1fr; } }

        .shipping-panel { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md); overflow: hidden; }

        .panel-header { padding: 12px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); }
        .panel-title { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
        .panel-title h2 {
          margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); font-family: var(--forge-font-tech);
        }
        .muted { color: var(--forge-text-muted); font-size: 12px; }
        .panel-body { max-height: calc(100vh - 300px); overflow: auto; }
        @media (max-width: 1100px) { .panel-body { max-height: none; } }

        .method-list { display: grid; }
        .method-row {
          padding: 12px; border-bottom: 1px solid var(--forge-border-default); cursor: pointer; background: var(--forge-bg-surface);
        }
        .method-row:hover { background: var(--forge-bg-elevated); }
        .method-row.active { background: rgba(0,212,170,0.06); border-left: 4px solid var(--forge-accent-primary); padding-left: 8px; }
        .method-row-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .method-name { display: inline-flex; align-items: center; gap: 8px; }
        .method-actions { display: flex; gap: 4px; }
        .method-row-bottom { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; align-items: center; }

        .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; border: 2px solid var(--forge-border-default); }
        .dot.on { background: var(--forge-success); border-color: var(--forge-success); }
        .dot.off { background: var(--forge-text-muted); border-color: var(--forge-text-muted); }
        .name-text { font-weight: 700; color: var(--forge-text-primary); }

        .chip {
          border: 1px solid var(--forge-border-default); border-radius: 999px; padding: 4px 8px;
          font-size: 12px; color: var(--forge-text-secondary); background: var(--forge-bg-elevated); display: inline-flex; align-items: center; gap: 4px;
          font-family: var(--forge-font-tech);
        }

        .icon-btn {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-md);
          padding: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          color: var(--forge-text-secondary);
        }
        .icon-btn:hover { background: var(--forge-bg-surface); border-color: var(--forge-accent-primary); }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .empty-state { padding: 18px; text-align: center; color: var(--forge-text-muted); }
        .empty-state h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .shipping-editor { display: grid; gap: 14px; }

        .admin-card { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md); overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }
        .card-header h2 { margin: 0; font-size: 11px; font-weight: 800; color: var(--forge-text-muted); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em; }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-editor { text-align: center; color: var(--forge-text-muted); }
        .empty-editor h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }

        .field label {
          display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }

        .input {
          width: 100%; border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 12px; font-size: 14px; outline: none; background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
        }
        .input:focus { border-color: var(--forge-accent-primary); box-shadow: 0 0 0 2px rgba(0,212,170,0.15); }
        textarea.input { resize: vertical; }
        .help { font-size: 12px; color: var(--forge-text-muted); margin-top: 6px; }

        .toggles { display: grid; gap: 10px; margin-top: 6px; }
        .toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--forge-text-primary); }

        /* Weight tiers table */
        .weight-table { display: grid; gap: 8px; }
        .weight-header {
          display: grid; grid-template-columns: 1fr 1fr 40px; gap: 8px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); padding: 0 0 4px 0;
          border-bottom: 1px solid var(--forge-border-default);
          font-family: var(--forge-font-tech);
        }
        .weight-row {
          display: grid; grid-template-columns: 1fr 1fr 40px; gap: 8px; align-items: center;
        }
      `}</style>
    </div>
  );
}

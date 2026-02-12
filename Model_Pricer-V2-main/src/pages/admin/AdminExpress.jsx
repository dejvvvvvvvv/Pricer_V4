// Admin Express/Rush Delivery Tiers Configuration Page — V1
// ----------------------------------------------------------
// Scope: /admin/express only
// - Single source of truth: tenant-scoped V1 storage (namespace: express:v1)
// - 2-column layout: tier list (left) + tier editor (right)
// - Supports Standard/Express/Rush delivery tiers with surcharge config
// - Upsell messaging section at bottom

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadExpressConfigV1, saveExpressConfigV1 } from '../../utils/adminExpressStorage';

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createId(prefix = 'tier') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SURCHARGE_TYPES = [
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'fixed', label_cs: 'Fixni castka (CZK)', label_en: 'Fixed (CZK)' },
];

export default function AdminExpress() {
  const { t, language } = useLanguage();
  const cs = language === 'cs';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  // Load config on mount
  useEffect(() => {
    try {
      const cfg = loadExpressConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.tiers?.length) setSelectedTierId(cfg.tiers[0].id);
      setLoading(false);
    } catch (e) {
      console.error('[AdminExpress] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const selectedTier = useMemo(() => {
    if (!config?.tiers || !selectedTierId) return null;
    return config.tiers.find((t) => t.id === selectedTierId) || null;
  }, [config, selectedTierId]);

  const ui = useMemo(() => ({
    title: cs ? 'Express doruceni' : 'Express Delivery',
    subtitle: cs
      ? 'Spravuj urovne doruceni (Standard/Express/Rush), priradzky a upsell nastaveni.'
      : 'Manage delivery tiers (Standard/Express/Rush), surcharges and upsell settings.',
    newTier: cs ? 'Nova uroven' : 'New tier',
    save: cs ? 'Ulozit' : 'Save',
    saving: cs ? 'Ukladam...' : 'Saving...',
    saved: cs ? 'Ulozeno' : 'Saved',
    unsaved: cs ? 'Neulozene zmeny' : 'Unsaved changes',
    noTiers: cs ? 'Zadne urovne doruceni' : 'No delivery tiers',
    noTiersHint: cs ? 'Klikni na "Nova uroven".' : 'Click "New tier".',
    editorTitle: cs ? 'Editor urovne' : 'Tier editor',
    emptyEditor: cs ? 'Vyber uroven vlevo.' : 'Select a tier on the left.',
  }), [cs]);

  const updateConfig = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const updateTier = (tierId, patch) => {
    setConfig((prev) => {
      const tiers = (prev.tiers || []).map((tier) => {
        if (tier.id !== tierId) return tier;
        return { ...tier, ...patch };
      });
      return { ...prev, tiers };
    });
  };

  const addTier = () => {
    const id = createId('tier');
    const newTier = {
      id,
      name: cs ? 'Nova uroven' : 'New tier',
      surcharge_type: 'percent',
      surcharge_value: 0,
      delivery_days: 3,
      is_default: false,
      sort_order: (config?.tiers?.length || 0),
      active: true,
    };
    setConfig((prev) => ({ ...prev, tiers: [...(prev.tiers || []), newTier] }));
    setSelectedTierId(id);
    setBanner(null);
  };

  const removeTier = (id) => {
    const tier = config?.tiers?.find((t) => t.id === id);
    if (tier?.is_default) {
      setBanner({ type: 'error', text: cs ? 'Nelze smazat vychozi uroven.' : 'Cannot delete default tier.' });
      return;
    }
    const ok = window.confirm(cs ? 'Smazat tuto uroven?' : 'Delete this tier?');
    if (!ok) return;
    setConfig((prev) => ({
      ...prev,
      tiers: (prev.tiers || []).filter((t) => t.id !== id),
    }));
    if (selectedTierId === id) setSelectedTierId(null);
  };

  const setAsDefault = (tierId) => {
    setConfig((prev) => ({
      ...prev,
      tiers: (prev.tiers || []).map((t) => ({
        ...t,
        is_default: t.id === tierId,
      })),
    }));
  };

  const moveTier = (tierId, direction) => {
    setConfig((prev) => {
      const tiers = [...(prev.tiers || [])];
      const idx = tiers.findIndex((t) => t.id === tierId);
      if (idx < 0) return prev;
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= tiers.length) return prev;
      [tiers[idx], tiers[swapIdx]] = [tiers[swapIdx], tiers[idx]];
      return { ...prev, tiers: tiers.map((t, i) => ({ ...t, sort_order: i })) };
    });
  };

  const handleSave = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveExpressConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      console.error('[AdminExpress] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni selhalo.' : 'Save failed.' });
    }
  };

  const handleReset = () => {
    const ok = window.confirm(cs ? 'Zahodit zmeny a nacist ulozenou konfiguraci?' : 'Discard changes and reload saved config?');
    if (!ok) return;
    try {
      const cfg = loadExpressConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.tiers?.length) setSelectedTierId(cfg.tiers[0].id);
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

  const tiers = config?.tiers || [];

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
          <button className="btn-secondary" onClick={addTier}>
            <Icon name="Plus" size={18} />
            {ui.newTier}
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

      <div className="express-layout">
        {/* LEFT: TIER LIST */}
        <div className="express-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>{cs ? 'Urovne doruceni' : 'Delivery tiers'}</h2>
              <span className="muted">{tiers.length}</span>
            </div>
            <ForgeCheckbox
              checked={config?.enabled !== false}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              label={cs ? 'Express doruceni zapnuto' : 'Express delivery enabled'}
              style={{ marginTop: 8 }}
            />
          </div>

          <div className="panel-body">
            {tiers.length === 0 ? (
              <div className="empty-state">
                <Icon name="Truck" size={44} />
                <h3>{ui.noTiers}</h3>
                <p>{ui.noTiersHint}</p>
              </div>
            ) : (
              <div className="tier-list">
                {tiers.map((tier, idx) => {
                  const isActive = tier.id === selectedTierId;
                  return (
                    <div
                      key={tier.id}
                      className={`tier-row ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedTierId(tier.id)}
                    >
                      <div className="tier-row-main">
                        <div className="tier-row-top">
                          <div className="tier-name">
                            <span className={`dot ${tier.active ? 'on' : 'off'}`} />
                            <span className="name-text">{tier.name}</span>
                            {tier.is_default && <span className="chip default-chip">{cs ? 'Vychozi' : 'Default'}</span>}
                          </div>
                          <div className="tier-actions">
                            <button className="icon-btn" title={cs ? 'Nahoru' : 'Move up'} onClick={(e) => { e.stopPropagation(); moveTier(tier.id, -1); }} disabled={idx === 0}>
                              <Icon name="ChevronUp" size={14} />
                            </button>
                            <button className="icon-btn" title={cs ? 'Dolu' : 'Move down'} onClick={(e) => { e.stopPropagation(); moveTier(tier.id, 1); }} disabled={idx === tiers.length - 1}>
                              <Icon name="ChevronDown" size={14} />
                            </button>
                            <button className="icon-btn" title={cs ? 'Smazat' : 'Delete'} onClick={(e) => { e.stopPropagation(); removeTier(tier.id); }}>
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="tier-row-bottom">
                          <span className="chip">
                            {tier.surcharge_type === 'percent' ? `+${safeNum(tier.surcharge_value)}%` : `+${safeNum(tier.surcharge_value).toFixed(2)} CZK`}
                          </span>
                          <span className="chip">
                            <Icon name="Clock" size={12} /> {safeNum(tier.delivery_days)} {cs ? 'dni' : 'days'}
                          </span>
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
        <div className="express-editor">
          {!selectedTier ? (
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
              {/* SECTION: TIER SETTINGS */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{cs ? 'Nastaveni urovne' : 'Tier settings'}</h2>
                    <p className="card-description">{cs ? 'Nazev, prirazka, doba doruceni a aktivace.' : 'Name, surcharge, delivery time and activation.'}</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="grid2">
                    <div className="field">
                      <label>{cs ? 'Nazev' : 'Name'}</label>
                      <input
                        className="input"
                        value={selectedTier.name}
                        onChange={(e) => updateTier(selectedTier.id, { name: e.target.value })}
                        placeholder={cs ? 'Napr. Express' : 'e.g. Express'}
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Doba doruceni (dny)' : 'Delivery days'}</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={selectedTier.delivery_days}
                        onChange={(e) => updateTier(selectedTier.id, { delivery_days: safeNum(e.target.value, 0) })}
                      />
                    </div>
                  </div>
                  <div className="grid2" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label>{cs ? 'Typ prirazky' : 'Surcharge type'}</label>
                      <select
                        className="input"
                        value={selectedTier.surcharge_type}
                        onChange={(e) => updateTier(selectedTier.id, { surcharge_type: e.target.value })}
                      >
                        {SURCHARGE_TYPES.map((o) => (
                          <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>{cs ? 'Hodnota prirazky' : 'Surcharge value'}</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={selectedTier.surcharge_value}
                        onChange={(e) => updateTier(selectedTier.id, { surcharge_value: safeNum(e.target.value, 0) })}
                      />
                      <div className="help">
                        {selectedTier.surcharge_type === 'percent'
                          ? (cs ? 'Procento navyseni ceny objednavky.' : 'Percentage added to order total.')
                          : (cs ? 'Fixni castka pridana k objednavce.' : 'Fixed amount added to the order.')}
                      </div>
                    </div>
                  </div>
                  <div className="toggles" style={{ marginTop: 12 }}>
                    <ForgeCheckbox
                      checked={selectedTier.active}
                      onChange={(e) => updateTier(selectedTier.id, { active: e.target.checked })}
                      label={cs ? 'Aktivni' : 'Active'}
                    />
                    <ForgeCheckbox
                      checked={selectedTier.is_default}
                      onChange={() => setAsDefault(selectedTier.id)}
                      label={cs ? 'Vychozi uroven (preselected)' : 'Default tier (preselected)'}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: PREVIEW */}
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{cs ? 'Nahled pro zakaznika' : 'Customer preview'}</h2>
                    <p className="card-description">{cs ? 'Takto urovne uvidi zakaznik v kalkulacce.' : 'This is how tiers appear in the calculator.'}</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="preview-tiers">
                    {tiers.filter((t) => t.active).map((tier) => (
                      <div key={tier.id} className={`preview-card ${tier.id === selectedTier.id ? 'highlighted' : ''} ${tier.is_default ? 'default' : ''}`}>
                        <div className="preview-name">{tier.name}</div>
                        <div className="preview-surcharge">
                          {tier.surcharge_value === 0
                            ? (cs ? 'Bez priplatku' : 'No surcharge')
                            : tier.surcharge_type === 'percent'
                              ? `+${safeNum(tier.surcharge_value)}%`
                              : `+${safeNum(tier.surcharge_value).toFixed(2)} CZK`}
                        </div>
                        <div className="preview-days">
                          <Icon name="Clock" size={14} />
                          {safeNum(tier.delivery_days)} {cs ? 'dni' : 'days'}
                        </div>
                        {tier.is_default && <div className="preview-badge">{cs ? 'Doporuceno' : 'Recommended'}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION: UPSELL SETTINGS (always visible) */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Upsell nastaveni' : 'Upsell settings'}</h2>
                <p className="card-description">{cs ? 'Zobrazit upsell zpravu pri vyberu pomalejsi urovne.' : 'Show upsell message when selecting a slower tier.'}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="toggles">
                <ForgeCheckbox
                  checked={config?.upsell_enabled !== false}
                  onChange={(e) => updateConfig({ upsell_enabled: e.target.checked })}
                  label={cs ? 'Upsell zpravy zapnuty' : 'Upsell messages enabled'}
                />
              </div>
              {config?.upsell_enabled !== false && (
                <div className="field" style={{ marginTop: 12 }}>
                  <label>{cs ? 'Vlastni upsell zprava (volitelne)' : 'Custom upsell message (optional)'}</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={config?.upsell_message || ''}
                    onChange={(e) => updateConfig({ upsell_message: e.target.value })}
                    placeholder={cs ? 'Napr. Upgrade na Express a mej to do 2 dnu!' : 'e.g. Upgrade to Express and get it in 2 days!'}
                  />
                  <div className="help">{cs ? 'Pokud prazdne, pouzije se vychozi text.' : 'If empty, default text is used.'}</div>
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
          background: var(--forge-bg-void);
          min-height: 100vh;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
        }

        .subtitle {
          margin: 4px 0 0 0;
          color: var(--forge-text-secondary);
          font-size: 14px;
          max-width: 760px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
        }
        .status-pill.clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .status-pill.dirty { border-color: rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); color: var(--forge-warning); }

        .btn-primary {
          background: var(--forge-accent-primary); color: var(--forge-bg-void); border: 1px solid var(--forge-accent-primary); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-family: var(--forge-font-tech); letter-spacing: 0.02em;
        }
        .btn-primary:hover { background: var(--forge-accent-primary-h); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-secondary:hover { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: var(--forge-radius-md); margin: 10px 0 16px 0; font-size: 14px;
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-secondary);
        }
        .banner.success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .banner.error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        .express-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1100px) { .express-layout { grid-template-columns: 1fr; } }

        .express-panel {
          background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); overflow: hidden;
        }

        .panel-header {
          padding: 12px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }

        .panel-title {
          display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;
        }
        .panel-title h2 {
          margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
        }

        .muted { color: var(--forge-text-muted); font-size: 12px; }

        .panel-body { max-height: calc(100vh - 300px); overflow: auto; }
        @media (max-width: 1100px) { .panel-body { max-height: none; } }

        .tier-list { display: grid; }

        .tier-row {
          padding: 12px; border-bottom: 1px solid var(--forge-border-default); cursor: pointer; background: var(--forge-bg-surface);
        }
        .tier-row:hover { background: var(--forge-bg-elevated); }
        .tier-row.active { background: rgba(0,212,170,0.06); border-left: 4px solid var(--forge-accent-primary); padding-left: 8px; }

        .tier-row-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .tier-name { display: inline-flex; align-items: center; gap: 8px; }
        .tier-actions { display: flex; gap: 4px; }
        .tier-row-bottom { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; align-items: center; }

        .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; border: 2px solid var(--forge-border-default); }
        .dot.on { background: var(--forge-success); border-color: var(--forge-success); }
        .dot.off { background: var(--forge-text-muted); border-color: var(--forge-text-muted); }
        .name-text { font-weight: 700; color: var(--forge-text-primary); }

        .chip {
          border: 1px solid var(--forge-border-default); border-radius: 999px; padding: 4px 8px;
          font-size: 12px; color: var(--forge-text-secondary); background: var(--forge-bg-elevated); display: inline-flex; align-items: center; gap: 4px;
          font-family: var(--forge-font-tech);
        }
        .default-chip { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-accent-primary); }

        .icon-btn {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-md);
          padding: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          color: var(--forge-text-secondary);
        }
        .icon-btn:hover { background: var(--forge-bg-overlay); color: var(--forge-text-primary); }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .empty-state { padding: 18px; text-align: center; color: var(--forge-text-muted); }
        .empty-state h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .express-editor { display: grid; gap: 14px; }

        .admin-card { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }
        .card-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-editor { text-align: center; color: var(--forge-text-muted); }
        .empty-editor h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }

        .field label {
          display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-secondary); margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }

        .input {
          width: 100%; border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 12px; font-size: 14px; outline: none; background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
        }
        .input:focus { border-color: var(--forge-accent-primary); }
        textarea.input { resize: vertical; }
        .help { font-size: 12px; color: var(--forge-text-muted); margin-top: 6px; }

        .toggles { display: grid; gap: 10px; margin-top: 6px; }
        .toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--forge-text-primary); }

        /* Preview cards */
        .preview-tiers { display: flex; gap: 12px; flex-wrap: wrap; }
        .preview-card {
          border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); padding: 16px; min-width: 140px;
          text-align: center; background: var(--forge-bg-elevated); flex: 1;
        }
        .preview-card.highlighted { border-color: var(--forge-accent-primary); background: rgba(0,212,170,0.06); }
        .preview-card.default { border-width: 2px; }
        .preview-name { font-weight: 700; font-size: 16px; color: var(--forge-text-primary); margin-bottom: 4px; }
        .preview-surcharge { font-size: 14px; color: var(--forge-text-secondary); font-family: var(--forge-font-tech); }
        .preview-days { font-size: 13px; color: var(--forge-text-muted); margin-top: 6px; display: flex; align-items: center; gap: 4px; justify-content: center; }
        .preview-badge {
          margin-top: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase;
          color: var(--forge-accent-primary); background: rgba(0,212,170,0.08); border-radius: 999px; padding: 3px 8px; display: inline-block;
          font-family: var(--forge-font-tech); letter-spacing: 0.08em;
        }
      `}</style>
    </div>
  );
}

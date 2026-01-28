import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTenantId } from '../../utils/adminTenantStorage';

import {
  // branding + plan
  getBranding,
  getPlanFeatures,

  // widgets
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  duplicateWidget,
  toggleWidgetStatus,

  // domains
  getWidgetDomains,
  addWidgetDomain,
  toggleWidgetDomain,
  deleteWidgetDomain,
  validateDomainInput,
} from '../../utils/adminBrandingWidgetStorage';

// Pozn.: Varianta A = localStorage (demo). Později (Varianta B) se jen vymění helper za API.

const EMBED_SCRIPT_URL = 'https://commun-printing.com/widget.js';

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const isValidHex = (val) => /^#([0-9a-fA-F]{6})$/.test(String(val || '').trim());

const toNullableHex = (val) => {
  const v = String(val || '').trim();
  if (!v) return null;
  return isValidHex(v) ? v.toUpperCase() : v;
};

const buildEmbedCode = (widget) => {
  if (!widget) return '';

  const typeAttr = widget.type === 'price_only' ? 'price_only' : 'full_calculator';
  const themeAttr = widget.themeMode || 'auto';

  const attrs = [
    `data-widget=\"${widget.publicId}\"`,
    `data-type=\"${typeAttr}\"`,
    `data-theme=\"${themeAttr}\"`,
    widget.primaryColorOverride ? `data-color=\"${widget.primaryColorOverride}\"` : null,
    widget.widthMode === 'fixed' && widget.widthPx ? `data-width=\"${widget.widthPx}\"` : null,
    widget.localeDefault ? `data-locale=\"${widget.localeDefault}\"` : null,
  ].filter(Boolean);

  return `<!-- ModelPricer Widget (instance: ${widget.name || widget.publicId}) -->\n` +
    `<script src=\"${EMBED_SCRIPT_URL}\" async></script>\n` +
    `<div id=\"3d-print-calculator\"\n  ${attrs.join('\n  ')}\n></div>`;
};

const WidgetPreview = ({ branding, widget }) => {
  const effectivePrimary = widget?.primaryColorOverride || branding?.colors?.primaryColor || '#2563EB';
  const effectiveFont = branding?.typography?.fontFamily || 'Inter';
  const radius = branding?.widgetUI?.borderRadiusPx ?? 12;
  const showLogo = branding?.widgetUI?.showLogo ?? true;
  const showCompanyName = branding?.widgetUI?.showCompanyName ?? true;
  const showSlogan = branding?.widgetUI?.showSlogan ?? true;
  const showPoweredBy = branding?.widgetUI?.showPoweredBy ?? true;

  const isDisabled = widget?.status === 'disabled';

  return (
    <div className="previewShell" style={{ fontFamily: effectiveFont }}>
      <div className="previewCard" style={{ borderRadius: radius }}>
        <div className="previewHeader">
          <div className="brandLeft">
            {showLogo ? (
              <div className="logoBox" style={{ borderRadius: Math.min(radius, 10), borderColor: effectivePrimary }}>
                <Icon name="Cube" size={18} color={effectivePrimary} />
              </div>
            ) : null}
            <div className="brandText">
              {showCompanyName ? (
                <div className="companyName">{branding?.companyName || 'Vaše firma'}</div>
              ) : null}
              {showSlogan ? (
                <div className="slogan">{branding?.slogan || '3D tisk na zakázku'}</div>
              ) : null}
            </div>
          </div>
          <span className={`badge ${isDisabled ? 'badgeDisabled' : 'badgeOk'}`}>{isDisabled ? 'Disabled' : 'Live'}</span>
        </div>

        <div className="previewBody">
          <div className="fakeRow">
            <div className="fakeInput" style={{ borderRadius: radius }}>Nahrát model (STL/OBJ)…</div>
            <div className="fakeSelect" style={{ borderRadius: radius }}>Materiál</div>
          </div>
          <button className="fakeButton" style={{ background: effectivePrimary, borderRadius: radius }}>
            Vypočítat cenu
          </button>
        </div>

        {showPoweredBy ? (
          <div className="poweredBy">
            Powered by <strong>ModelPricer</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AdminWidget = () => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState(null);
  const [branding, setBranding] = useState(null);

  const [widgets, setWidgets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [editor, setEditor] = useState(null);
  const [editorBase, setEditorBase] = useState(null);

  const [domains, setDomains] = useState([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('full_calculator');

  // domain input
  const [domainInput, setDomainInput] = useState('');
  const [allowSubdomains, setAllowSubdomains] = useState(true);
  const [domainError, setDomainError] = useState(null);

  const toastTimer = useRef(null);

  const showToast = (msg, kind = 'ok') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const refresh = () => {
    const tenantId = getTenantId();
    const p = getPlanFeatures(tenantId);
    const b = getBranding(tenantId);
    const w = getWidgets(tenantId);

    setPlan(p);
    setBranding(b);
    setWidgets(w);

    // auto-select
    const nextSelected = selectedId && w.find(x => x.id === selectedId) ? selectedId : (w[0]?.id ?? null);
    setSelectedId(nextSelected);

    // keep editor consistent
    if (nextSelected) {
      const ww = w.find(x => x.id === nextSelected);
      setEditor(deepClone(ww));
      setEditorBase(deepClone(ww));
      setDomains(getWidgetDomains(ww.id));
    } else {
      setEditor(null);
      setEditorBase(null);
      setDomains([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    try {
      refresh();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const w = widgets.find(x => x.id === selectedId);
    if (!w) return;
    setEditor(deepClone(w));
    setEditorBase(deepClone(w));
    setDomains(getWidgetDomains(w.id));
  }, [selectedId]);

  const isDirty = useMemo(() => {
    if (!editor || !editorBase) return false;
    return JSON.stringify(editor) !== JSON.stringify(editorBase);
  }, [editor, editorBase]);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const maxWidgets = plan?.features?.max_widget_instances ?? 1;
  const canUseWhitelist = plan?.features?.can_use_domain_whitelist ?? true;

  const canCreateMore = widgets.length < maxWidgets;

  const selectWidget = (id) => {
    if (id === selectedId) return;
    if (isDirty) {
      const ok = window.confirm('Máš neuložené změny. Opravdu chceš přepnout widget bez uložení?');
      if (!ok) return;
    }
    setSelectedId(id);
  };

  const validateEditor = () => {
    const errors = {};
    if (!editor) return errors;

    if (!editor.name || String(editor.name).trim().length < 2) {
      errors.name = 'Zadej název (min. 2 znaky).';
    }

    // primaryColorOverride can be null/empty or valid hex
    if (editor.primaryColorOverride && !isValidHex(editor.primaryColorOverride)) {
      errors.primaryColorOverride = 'Barva musí být ve formátu #RRGGBB.';
    }

    if (editor.widthMode === 'fixed') {
      const v = Number(editor.widthPx);
      if (!Number.isFinite(v) || v <= 0) {
        errors.widthPx = 'Zadej šířku > 0.';
      }
    }

    return errors;
  };

  const errors = useMemo(validateEditor, [editor]);
  const canSave = isDirty && Object.keys(errors).length === 0 && !saving;

  const onSave = async () => {
    if (!editor) return;
    if (Object.keys(errors).length > 0) {
      showToast('Oprav chyby ve formuláři.', 'err');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: String(editor.name || '').trim(),
        status: editor.status,
        type: editor.type,
        themeMode: editor.themeMode,
        primaryColorOverride: toNullableHex(editor.primaryColorOverride),
        widthMode: editor.widthMode,
        widthPx: editor.widthMode === 'fixed' ? Number(editor.widthPx || 0) : null,
        localeDefault: editor.localeDefault || 'cs',
        configProfileId: editor.configProfileId ?? null,
      };

      updateWidget(getTenantId(), editor.id, payload);
      showToast('Uloženo');
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Uložení se nezdařilo.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const onResetEditor = () => {
    if (!editorBase) return;
    const ok = window.confirm('Vrátit neuložené změny do posledního uloženého stavu?');
    if (!ok) return;
    setEditor(deepClone(editorBase));
  };

  const onCreate = () => {
    setCreateName('');
    setCreateType('full_calculator');
    setCreateOpen(true);
  };

  const confirmCreate = () => {
    try {
      const name = String(createName || '').trim();
      if (name.length < 2) {
        showToast('Zadej název (min. 2 znaky).', 'err');
        return;
      }
      if (!canCreateMore) {
        showToast(`Limit tarifu: max. ${maxWidgets} widget(y).`, 'err');
        return;
      }

      const widget = createWidget(getTenantId(), {
        name,
        type: createType,
      });

      setCreateOpen(false);
      showToast('Widget vytvořen');

      // refresh + select new
      const w = getWidgets(getTenantId());
      setWidgets(w);
      setSelectedId(widget.id);
      setEditor(deepClone(widget));
      setEditorBase(deepClone(widget));
      setDomains(getWidgetDomains(widget.id));

    } catch (e) {
      console.error(e);
      showToast('Nelze vytvořit widget (limit tarifu nebo chyba).', 'err');
    }
  };

  const onDuplicate = (id) => {
    try {
      if (!canCreateMore) {
        showToast(`Limit tarifu: max. ${maxWidgets} widget(y).`, 'err');
        return;
      }
      const dupe = duplicateWidget(getTenantId(), id);
      showToast('Zduplikováno');
      const w = getWidgets(getTenantId());
      setWidgets(w);
      setSelectedId(dupe.id);
    } catch (e) {
      console.error(e);
      showToast('Duplicace se nezdařila.', 'err');
    }
  };

  const onToggleEnabled = (id) => {
    try {
      toggleWidgetStatus(getTenantId(), id);
      showToast('Změněno');
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Změna stavu se nezdařila.', 'err');
    }
  };

  const onDelete = (id) => {
    const w = widgets.find(x => x.id === id);
    const ok = window.confirm(`Smazat widget "${w?.name || id}"?`);
    if (!ok) return;

    try {
      deleteWidget(getTenantId(), id);
      showToast('Smazáno');
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Smazání se nezdařilo.', 'err');
    }
  };

  const onCopyEmbed = async (widget) => {
    try {
      const code = buildEmbedCode(widget);
      await navigator.clipboard.writeText(code);
      showToast('Embed kód zkopírován');
    } catch (e) {
      console.error(e);
      // fallback
      try {
        const el = document.createElement('textarea');
        el.value = buildEmbedCode(widget);
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('Embed kód zkopírován');
      } catch {
        showToast('Nelze kopírovat do schránky.', 'err');
      }
    }
  };

  const onAddDomain = () => {
    if (!editor) return;

    const candidate = String(domainInput || '').trim();
    const res = validateDomainInput(candidate);

    if (!res.ok) {
      setDomainError(res.error || 'Neplatná doména');
      return;
    }

    try {
      addWidgetDomain(editor.id, res.domain, allowSubdomains);
      setDomainInput('');
      setAllowSubdomains(true);
      setDomainError(null);
      setDomains(getWidgetDomains(editor.id));
      showToast('Doména přidána');
    } catch (e) {
      console.error(e);
      showToast('Doménu nelze přidat (duplicitní nebo chyba).', 'err');
    }
  };

  const onToggleDomain = (domainId, enabled) => {
    try {
      toggleWidgetDomain(domainId, enabled);
      setDomains(getWidgetDomains(editor.id));
    } catch (e) {
      console.error(e);
      showToast('Změna domény se nezdařila.', 'err');
    }
  };

  const onDeleteDomain = (domainId) => {
    const d = domains.find(x => x.id === domainId);
    const ok = window.confirm(`Smazat doménu ${d?.domain || ''}?`);
    if (!ok) return;

    try {
      deleteWidgetDomain(domainId);
      setDomains(getWidgetDomains(editor.id));
      showToast('Doména smazána');
    } catch (e) {
      console.error(e);
      showToast('Smazání domény se nezdařilo.', 'err');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const selectedWidget = widgets.find(w => w.id === selectedId) || null;
  const embedCode = buildEmbedCode(editor || selectedWidget);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>{t('admin.widget.title') || 'Widget'}</h1>
          <p className="subtitle">Widget instances, embed kód a whitelist domén (Varianta A – demo bez backendu)</p>
        </div>

        <div className="header-actions">
          <div className="planInfo">
            <div className="planName">Tarif: <strong>{plan?.planName || 'Starter'}</strong></div>
            <div className="planCaps">Widgety: {widgets.length}/{maxWidgets}</div>
          </div>

          <button className="btn-secondary" onClick={refresh} title="Obnovit">
            <Icon name="RefreshCw" size={18} />
            Obnovit
          </button>

          <button className="btn-primary" onClick={onCreate} disabled={!canCreateMore}>
            <Icon name="Plus" size={18} />
            Vytvořit widget
          </button>
        </div>
      </div>

      {/* dirty banner */}
      {isDirty ? (
        <div className="dirtyBanner">
          <Icon name="AlertTriangle" size={18} />
          <span>Máš neuložené změny v editoru widgetu.</span>
          <div className="dirtyActions">
            <button className="btn-secondary" onClick={onResetEditor}>
              Vrátit změny
            </button>
            <button className="btn-primary" onClick={onSave} disabled={!canSave}>
              <Icon name="Save" size={18} />
              Uložit změny
            </button>
          </div>
        </div>
      ) : null}

      <div className="layout">
        {/* LEFT: widget list */}
        <div className="leftPanel">
          <div className="panelTitle">Widget instances</div>

          {!canCreateMore ? (
            <div className="limitBox">
              <Icon name="Lock" size={18} />
              <div>
                <div><strong>Dosažen limit tarifu</strong></div>
                <div className="muted">Maximálně {maxWidgets} widget(y). Pro další widgety bude potřeba vyšší tarif.</div>
              </div>
            </div>
          ) : null}

          <div className="widgetList">
            {widgets.map((w) => {
              const isActive = w.status !== 'disabled';
              const isSelected = w.id === selectedId;
              const domainCount = getWidgetDomains(w.id).filter(d => d.isActive).length;

              return (
                <div key={w.id} className={`widgetCard ${isSelected ? 'selected' : ''}`} onClick={() => selectWidget(w.id)}>
                  <div className="widgetCardTop">
                    <div className="widgetNameRow">
                      <div className="widgetName">{w.name}</div>
                      <span className={`badge ${isActive ? 'badgeOk' : 'badgeDisabled'}`}>{isActive ? 'Active' : 'Disabled'}</span>
                    </div>

                    <div className="widgetMeta">
                      <span className="metaItem">
                        <Icon name={w.type === 'price_only' ? 'DollarSign' : 'Calculator'} size={14} />
                        {w.type === 'price_only' ? 'Price-only' : 'Full'}
                      </span>
                      <span className="metaItem">
                        <Icon name="Globe" size={14} />
                        {domainCount} domén
                      </span>
                    </div>
                  </div>

                  <div className="widgetCardActions" onClick={(e) => e.stopPropagation()}>
                    <button className="iconBtn" title="Kopírovat embed" onClick={() => onCopyEmbed(w)}>
                      <Icon name="Copy" size={16} />
                    </button>
                    <button className="iconBtn" title="Duplikovat" onClick={() => onDuplicate(w.id)} disabled={!canCreateMore}>
                      <Icon name="CopyPlus" size={16} />
                    </button>
                    <button className="iconBtn" title={isActive ? 'Disable' : 'Enable'} onClick={() => onToggleEnabled(w.id)}>
                      <Icon name={isActive ? 'PauseCircle' : 'PlayCircle'} size={16} />
                    </button>
                    <button className="iconBtn danger" title="Smazat" onClick={() => onDelete(w.id)}>
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>

                  <div className="widgetPublicId">{w.publicId}</div>
                </div>
              );
            })}

            {widgets.length === 0 ? (
              <div className="emptyState">
                <Icon name="Info" size={20} />
                <div>
                  <div><strong>Zatím nemáš žádný widget</strong></div>
                  <div className="muted">Vytvoř si první widget a zkopíruj embed kód.</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT: editor */}
        <div className="rightPanel">
          {!editor ? (
            <div className="emptyEditor">
              <Icon name="Pointer" size={20} />
              Vyber widget vlevo.
            </div>
          ) : (
            <>
              <div className="panelTitle">Editor: {editor.name}</div>

              <div className="grid2">
                <div className="card">
                  <div className="cardHeader">
                    <div>
                      <div className="cardTitle">Konfigurace widgetu</div>
                      <div className="muted">Tyto hodnoty jsou per-widget (ne globální branding).</div>
                    </div>
                    <div className="cardHeaderRight">
                      <button className="btn-secondary" onClick={onResetEditor} disabled={!isDirty}>
                        Reset
                      </button>
                      <button className="btn-primary" onClick={onSave} disabled={!canSave}>
                        <Icon name="Save" size={18} />
                        Uložit
                      </button>
                    </div>
                  </div>

                  <div className="form">
                    <div className="formRow">
                      <label>Název</label>
                      <input
                        className={`input ${errors.name ? 'inputError' : ''}`}
                        value={editor.name || ''}
                        onChange={(e) => setEditor(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Např. Homepage"
                      />
                      {errors.name ? <div className="errorText">{errors.name}</div> : null}
                    </div>

                    <div className="formRow">
                      <label>Typ</label>
                      <select
                        className="input"
                        value={editor.type}
                        onChange={(e) => setEditor(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="full_calculator">Full calculator</option>
                        <option value="price_only">Price only</option>
                      </select>
                    </div>

                    <div className="formRow">
                      <label>Theme</label>
                      <select
                        className="input"
                        value={editor.themeMode}
                        onChange={(e) => setEditor(prev => ({ ...prev, themeMode: e.target.value }))}
                      >
                        <option value="auto">Auto</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div className="formRow">
                      <label>Primary color (override)</label>
                      <input
                        className={`input ${errors.primaryColorOverride ? 'inputError' : ''}`}
                        value={editor.primaryColorOverride || ''}
                        onChange={(e) => setEditor(prev => ({ ...prev, primaryColorOverride: e.target.value }))}
                        placeholder="#2563EB (prázdné = z Brandingu)"
                      />
                      {errors.primaryColorOverride ? <div className="errorText">{errors.primaryColorOverride}</div> : null}
                    </div>

                    <div className="formRow">
                      <label>Šířka</label>
                      <div className="rowInline">
                        <select
                          className="input"
                          value={editor.widthMode}
                          onChange={(e) => setEditor(prev => ({ ...prev, widthMode: e.target.value }))}
                        >
                          <option value="auto">Auto</option>
                          <option value="fixed">Fixed</option>
                        </select>
                        <input
                          className={`input ${errors.widthPx ? 'inputError' : ''}`}
                          style={{ width: 140 }}
                          type="number"
                          min={0}
                          value={editor.widthMode === 'fixed' ? (editor.widthPx ?? '') : ''}
                          onChange={(e) => setEditor(prev => ({ ...prev, widthPx: e.target.value }))}
                          placeholder="px"
                          disabled={editor.widthMode !== 'fixed'}
                        />
                      </div>
                      {errors.widthPx ? <div className="errorText">{errors.widthPx}</div> : null}
                    </div>

                    <div className="formRow">
                      <label>Locale</label>
                      <select
                        className="input"
                        value={editor.localeDefault || 'cs'}
                        onChange={(e) => setEditor(prev => ({ ...prev, localeDefault: e.target.value }))}
                      >
                        <option value="cs">cs</option>
                        <option value="en">en</option>
                      </select>
                    </div>

                    <div className="formRow">
                      <label>Konfigurační profil</label>
                      <select className="input" value={editor.configProfileId || ''} disabled>
                        <option value="">(brzy) Použít tenant default</option>
                      </select>
                      <div className="muted" style={{ marginTop: 6 }}>
                        Později: různé profily (Pricing/Fees/Params) pro různé widgety.
                      </div>
                    </div>

                  </div>
                </div>

                <div className="card">
                  <div className="cardHeader">
                    <div>
                      <div className="cardTitle">Preview</div>
                      <div className="muted">Náhled bere branding + per-widget override.</div>
                    </div>
                  </div>
                  <WidgetPreview branding={branding} widget={editor} />
                </div>
              </div>

              <div className="grid2">
                <div className="card">
                  <div className="cardHeader">
                    <div>
                      <div className="cardTitle">Embed code</div>
                      <div className="muted">Použij tento snippet na svém webu.</div>
                    </div>
                    <button className="btn-secondary" onClick={() => onCopyEmbed(editor)}>
                      <Icon name="Copy" size={18} />
                      Copy
                    </button>
                  </div>

                  <textarea className="code" readOnly value={embedCode} />

                  <div className="muted" style={{ marginTop: 10 }}>
                    Pozn.: data-atributy jsou override; finální config má mít server jako source of truth (Varianta B).
                  </div>
                </div>

                <div className="card">
                  <div className="cardHeader">
                    <div>
                      <div className="cardTitle">Povolené domény</div>
                      <div className="muted">Whitelist domén pro bezpečný embed (blokuje použití jinde).</div>
                    </div>
                    {!canUseWhitelist ? (
                      <span className="badge badgeDisabled">Nedostupné v tarifu</span>
                    ) : null}
                  </div>

                  {!canUseWhitelist ? (
                    <div className="limitBox" style={{ marginTop: 10 }}>
                      <Icon name="Lock" size={18} />
                      <div className="muted">Whitelist domén není dostupný v aktuálním tarifu.</div>
                    </div>
                  ) : (
                    <>
                      <div className="domainAdd">
                        <input
                          className={`input ${domainError ? 'inputError' : ''}`}
                          value={domainInput}
                          onChange={(e) => { setDomainInput(e.target.value); setDomainError(null); }}
                          placeholder="example.com"
                        />
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={allowSubdomains}
                            onChange={(e) => setAllowSubdomains(e.target.checked)}
                          />
                          Povolit subdomény
                        </label>
                        <button className="btn-primary" onClick={onAddDomain}>
                          Přidat
                        </button>
                      </div>
                      {domainError ? <div className="errorText">{domainError}</div> : null}

                      <div className="domainList">
                        {domains.length === 0 ? (
                          <div className="muted" style={{ padding: 8 }}>
                            Zatím žádná doména. Pro demo můžeš přidat např. <code>localhost</code>.
                          </div>
                        ) : null}

                        {domains.map((d) => (
                          <div key={d.id} className="domainRow">
                            <div className="domainMain">
                              <div className="domainName">
                                {d.domain}
                                {d.allowSubdomains ? <span className="chip">*.{d.domain}</span> : null}
                              </div>
                              <div className="muted">{d.isActive ? 'Active' : 'Disabled'}</div>
                            </div>

                            <div className="domainActions">
                              <label className="toggle">
                                <input
                                  type="checkbox"
                                  checked={!!d.isActive}
                                  onChange={(e) => onToggleDomain(d.id, e.target.checked)}
                                />
                                <span />
                              </label>
                              <button className="iconBtn danger" title="Smazat" onClick={() => onDeleteDomain(d.id)}>
                                <Icon name="Trash2" size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                </div>
              </div>

            </>
          )}
        </div>
      </div>

      {/* toast */}
      {toast ? (
        <div className={`toast ${toast.kind === 'err' ? 'toastErr' : 'toastOk'}`}>
          {toast.kind === 'err' ? <Icon name="XCircle" size={18} /> : <Icon name="CheckCircle" size={18} />}
          <span>{toast.msg}</span>
        </div>
      ) : null}

      {/* create modal */}
      {createOpen ? (
        <div className="modalOverlay" onClick={() => setCreateOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">Vytvořit nový widget</div>
              <button className="iconBtn" onClick={() => setCreateOpen(false)}>
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="modalBody">
              <div className="formRow">
                <label>Název</label>
                <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Např. Homepage" />
              </div>

              <div className="formRow">
                <label>Typ</label>
                <select className="input" value={createType} onChange={(e) => setCreateType(e.target.value)}>
                  <option value="full_calculator">Full calculator</option>
                  <option value="price_only">Price only</option>
                </select>
              </div>

              <div className="muted" style={{ marginTop: 6 }}>
                Po vytvoření se widget automaticky otevře v editoru a vygeneruje se embed kód.
              </div>
            </div>

            <div className="modalFooter">
              <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Zrušit</button>
              <button className="btn-primary" onClick={confirmCreate}>
                <Icon name="Plus" size={18} />
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .admin-page { padding: 20px; }
        .loading { padding: 40px; text-align: center; }

        .admin-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .subtitle { color: #6b7280; margin-top: 6px; }

        .header-actions { display: flex; gap: 10px; align-items: center; }
        .planInfo { text-align: right; margin-right: 8px; }
        .planName { font-size: 13px; color: #111827; }
        .planCaps { font-size: 12px; color: #6b7280; }

        .btn-primary, .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          border: 1px solid transparent;
          background: #2563eb;
          color: white;
        }

        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary {
          background: white;
          color: #111827;
          border-color: #e5e7eb;
        }

        .dirtyBanner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border: 1px solid #fde68a;
          background: #fffbeb;
          border-radius: 10px;
          margin-bottom: 14px;
        }

        .dirtyActions { display: flex; gap: 10px; }

        .layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .layout { grid-template-columns: 1fr; }
          .planInfo { display: none; }
        }

        .leftPanel, .rightPanel {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
        }

        .panelTitle {
          font-weight: 800;
          margin-bottom: 10px;
        }

        .widgetList { display: flex; flex-direction: column; gap: 10px; }

        .widgetCard {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .widgetCard:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
        .widgetCard.selected { border-color: #93c5fd; box-shadow: 0 6px 18px rgba(37,99,235,0.12); }

        .widgetCardTop { display: flex; flex-direction: column; gap: 6px; }

        .widgetNameRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .widgetName { font-weight: 800; }

        .widgetMeta { display: flex; gap: 12px; color: #6b7280; font-size: 12px; }
        .metaItem { display: inline-flex; gap: 6px; align-items: center; }

        .widgetCardActions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        .widgetPublicId { margin-top: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #6b7280; }

        .iconBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
        }

        .iconBtn:disabled { opacity: 0.5; cursor: not-allowed; }
        .iconBtn:hover { background: #f9fafb; }
        .iconBtn.danger { border-color: #fecaca; color: #b91c1c; }
        .iconBtn.danger:hover { background: #fef2f2; }

        .badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .badgeOk { background: #dcfce7; color: #166534; }
        .badgeDisabled { background: #fee2e2; color: #991b1b; }

        .limitBox {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          margin-bottom: 10px;
        }

        .muted { color: #6b7280; font-size: 12px; }

        .emptyState {
          display: flex;
          gap: 10px;
          padding: 10px;
          border: 1px dashed #e5e7eb;
          border-radius: 12px;
          color: #6b7280;
        }

        .emptyEditor {
          padding: 22px;
          display: flex;
          gap: 10px;
          align-items: center;
          color: #6b7280;
        }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        @media (max-width: 1100px) { .grid2 { grid-template-columns: 1fr; } }

        .card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          background: white;
        }

        .cardHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
        }

        .cardTitle { font-weight: 800; }

        .cardHeaderRight { display: flex; gap: 10px; }

        .form { display: flex; flex-direction: column; gap: 12px; }

        .formRow label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; }

        .input {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          outline: none;
        }

        .input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(147,197,253,0.35); }
        .inputError { border-color: #fca5a5; box-shadow: 0 0 0 3px rgba(252,165,165,0.25); }

        .rowInline { display: flex; gap: 10px; align-items: center; }

        .errorText { color: #b91c1c; font-size: 12px; margin-top: 6px; }

        .code {
          width: 100%;
          min-height: 160px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          background: #0b1220;
          color: #e5e7eb;
          white-space: pre;
        }

        /* domain */
        .domainAdd { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; margin-top: 8px; }
        @media (max-width: 900px) { .domainAdd { grid-template-columns: 1fr; } }

        .check { display: inline-flex; gap: 8px; align-items: center; font-size: 12px; color: #111827; }

        .domainList { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }

        .domainRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px;
        }

        .domainName { font-weight: 800; }
        .chip { margin-left: 8px; padding: 2px 8px; border-radius: 999px; font-size: 11px; background: #eff6ff; color: #1d4ed8; }

        .domainActions { display: flex; gap: 10px; align-items: center; }

        /* toggle */
        .toggle { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
        .toggle input { display: none; }
        .toggle span {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: #e5e7eb;
          position: relative;
          transition: background 0.2s;
        }
        .toggle span::after {
          content: '';
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: white;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .toggle input:checked + span { background: #2563eb; }
        .toggle input:checked + span::after { transform: translateX(20px); }

        /* preview */
        .previewShell { padding: 4px; }
        .previewCard {
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          overflow: hidden;
        }
        .previewHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .brandLeft { display: flex; gap: 10px; align-items: center; }
        .logoBox {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          background: white;
        }
        .companyName { font-weight: 900; font-size: 13px; }
        .slogan { font-size: 12px; color: #6b7280; }

        .previewBody { padding: 12px; }
        .fakeRow { display: grid; grid-template-columns: 1fr 150px; gap: 10px; }
        .fakeInput, .fakeSelect {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 10px;
          font-size: 12px;
          color: #6b7280;
        }
        .fakeButton {
          margin-top: 12px;
          width: 100%;
          padding: 12px;
          border: none;
          color: white;
          font-weight: 800;
          cursor: pointer;
        }
        .poweredBy { padding: 10px; font-size: 12px; color: #6b7280; text-align: center; }

        /* toast */
        .toast {
          position: fixed;
          right: 18px;
          bottom: 18px;
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          z-index: 9999;
          font-weight: 700;
        }
        .toastOk { border-color: #bbf7d0; }
        .toastErr { border-color: #fecaca; }

        /* modal */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          padding: 16px;
        }
        .modal {
          width: 520px;
          max-width: 100%;
          background: white;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .modalHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modalTitle { font-weight: 900; }
        .modalBody { padding: 12px; }
        .modalFooter {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </div>
  );
};

export default AdminWidget;

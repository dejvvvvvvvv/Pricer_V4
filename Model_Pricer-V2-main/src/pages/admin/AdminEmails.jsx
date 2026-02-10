// Admin Email Notifications Configuration Page — V1
// --------------------------------------------------
// Scope: /admin/emails only
// - Single source of truth: tenant-scoped V1 storage (namespace: email:v1)
// - 3 tabs: Templates, Provider Config, Email Log
// - Templates: event triggers with enable/disable and subject line
// - Provider: SMTP / Resend / SendGrid configuration
// - Log: recent sent emails from localStorage log

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { loadEmailConfigV1, saveEmailConfigV1 } from '../../utils/adminEmailStorage';
import { readTenantJson } from '../../utils/adminTenantStorage';

function createId(prefix = 'trig') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const PROVIDER_OPTIONS = [
  { value: 'none', label_cs: 'Zadny (vypnuto)', label_en: 'None (disabled)' },
  { value: 'smtp', label_cs: 'SMTP', label_en: 'SMTP' },
  { value: 'resend', label_cs: 'Resend', label_en: 'Resend' },
  { value: 'sendgrid', label_cs: 'SendGrid', label_en: 'SendGrid' },
];

const EVENT_LABELS = {
  order_confirmed: { cs: 'Objednavka potvrzena', en: 'Order confirmed' },
  order_printing: { cs: 'Tisk zahajen', en: 'Printing started' },
  order_shipped: { cs: 'Objednavka odeslana', en: 'Order shipped' },
  order_completed: { cs: 'Objednavka dokoncena', en: 'Order completed' },
};

const TABS = [
  { id: 'templates', icon: 'Mail', label_cs: 'Sablony', label_en: 'Templates' },
  { id: 'provider', icon: 'Settings', label_cs: 'Provider', label_en: 'Provider' },
  { id: 'log', icon: 'FileText', label_cs: 'Log', label_en: 'Log' },
];

export default function AdminEmails() {
  const { t, language } = useLanguage();
  const cs = language === 'cs';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [emailLog, setEmailLog] = useState([]);
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  useEffect(() => {
    try {
      const cfg = loadEmailConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      const log = readTenantJson('email-log:v1', []);
      setEmailLog(Array.isArray(log) ? log : []);
      setLoading(false);
    } catch (e) {
      console.error('[AdminEmails] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const ui = useMemo(() => ({
    title: cs ? 'Emailove notifikace' : 'Email Notifications',
    subtitle: cs
      ? 'Nastaveni emailovych triggeru, providera a historie odeslanych emailu.'
      : 'Configure email triggers, provider settings and sent email history.',
    save: cs ? 'Ulozit' : 'Save',
    saving: cs ? 'Ukladam...' : 'Saving...',
    saved: cs ? 'Ulozeno' : 'Saved',
    unsaved: cs ? 'Neulozene zmeny' : 'Unsaved changes',
  }), [cs]);

  const updateConfig = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const updateTrigger = (idx, patch) => {
    setConfig((prev) => {
      const triggers = [...(prev.triggers || [])];
      triggers[idx] = { ...triggers[idx], ...patch };
      return { ...prev, triggers };
    });
  };

  const addTrigger = () => {
    setConfig((prev) => ({
      ...prev,
      triggers: [
        ...(prev.triggers || []),
        { event: `custom_${createId()}`, enabled: false, template_id: '' },
      ],
    }));
  };

  const removeTrigger = (idx) => {
    setConfig((prev) => {
      const triggers = [...(prev.triggers || [])];
      triggers.splice(idx, 1);
      return { ...prev, triggers };
    });
  };

  const updateTemplate = (event, patch) => {
    setConfig((prev) => {
      const templates = { ...(prev.templates || {}) };
      templates[event] = { ...(templates[event] || {}), ...patch };
      return { ...prev, templates };
    });
  };

  const handleSave = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveEmailConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      console.error('[AdminEmails] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni selhalo.' : 'Save failed.' });
    }
  };

  const handleReset = () => {
    const ok = window.confirm(cs ? 'Zahodit zmeny?' : 'Discard changes?');
    if (!ok) return;
    try {
      const cfg = loadEmailConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
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

  const triggers = config?.triggers || [];
  const templates = config?.templates || {};
  const provider = config?.provider || 'none';

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

      {/* TAB NAVIGATION */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{cs ? tab.label_cs : tab.label_en}</span>
          </button>
        ))}
      </div>

      {/* TAB: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Emailove triggery' : 'Email triggers'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Kazdemu eventu muzes prirazdit sablonu a zapnout/vypnout odesilani.'
                    : 'Assign a template to each event and enable/disable sending.'}
                </p>
              </div>
              <button className="btn-secondary" onClick={addTrigger}>
                <Icon name="Plus" size={18} />
                {cs ? 'Pridat trigger' : 'Add trigger'}
              </button>
            </div>
            <div className="card-body">
              {triggers.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Mail" size={44} />
                  <h3>{cs ? 'Zadne triggery' : 'No triggers'}</h3>
                  <p>{cs ? 'Pridej emailovy trigger.' : 'Add an email trigger.'}</p>
                </div>
              ) : (
                <div className="trigger-list">
                  {triggers.map((trigger, idx) => {
                    const eventLabel = EVENT_LABELS[trigger.event];
                    const tpl = templates[trigger.event] || {};
                    return (
                      <div key={`${trigger.event}_${idx}`} className="trigger-row">
                        <div className="trigger-header">
                          <div className="trigger-left">
                            <label className="toggle">
                              <input
                                type="checkbox"
                                checked={trigger.enabled}
                                onChange={(e) => updateTrigger(idx, { enabled: e.target.checked })}
                              />
                              <span className="trigger-event-name">
                                {eventLabel ? (cs ? eventLabel.cs : eventLabel.en) : trigger.event}
                              </span>
                            </label>
                            <span className="muted">{trigger.event}</span>
                          </div>
                          <button className="icon-btn" title={cs ? 'Smazat' : 'Remove'} onClick={() => removeTrigger(idx)}>
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                        <div className="trigger-fields">
                          <div className="field">
                            <label>{cs ? 'Template ID' : 'Template ID'}</label>
                            <input
                              className="input"
                              value={trigger.template_id}
                              onChange={(e) => updateTrigger(idx, { template_id: e.target.value })}
                              placeholder={cs ? 'Napr. order_confirmed' : 'e.g. order_confirmed'}
                            />
                          </div>
                          <div className="field">
                            <label>{cs ? 'Predmet (Subject)' : 'Subject'}</label>
                            <input
                              className="input"
                              value={tpl.subject || ''}
                              onChange={(e) => updateTemplate(trigger.event, { subject: e.target.value })}
                              placeholder={cs ? 'Predmet emailu...' : 'Email subject...'}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PROVIDER */}
      {activeTab === 'provider' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Nastaveni providera' : 'Provider settings'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Vyber emailoveho poskytovatele a nastav prihlasovaci udaje.'
                    : 'Select email provider and configure credentials.'}
                </p>
              </div>
            </div>
            <div className="card-body">
              <div className="grid2">
                <div className="field">
                  <label>{cs ? 'Provider' : 'Provider'}</label>
                  <select
                    className="input"
                    value={provider}
                    onChange={(e) => updateConfig({ provider: e.target.value })}
                  >
                    {PROVIDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {provider === 'smtp' && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', marginBottom: 12, fontFamily: 'var(--forge-font-heading)' }}>
                    {cs ? 'SMTP nastaveni' : 'SMTP settings'}
                  </h3>
                  <div className="grid2">
                    <div className="field">
                      <label>{cs ? 'Host' : 'Host'}</label>
                      <input
                        className="input"
                        value={config?.smtp_host || ''}
                        onChange={(e) => updateConfig({ smtp_host: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Port' : 'Port'}</label>
                      <input
                        className="input"
                        type="number"
                        value={config?.smtp_port || 587}
                        onChange={(e) => updateConfig({ smtp_port: Number(e.target.value) || 587 })}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid2" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label>{cs ? 'Uzivatel' : 'Username'}</label>
                      <input
                        className="input"
                        value={config?.smtp_user || ''}
                        onChange={(e) => updateConfig({ smtp_user: e.target.value })}
                        placeholder={cs ? 'Uzivatelske jmeno' : 'Username'}
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Heslo' : 'Password'}</label>
                      <div className="security-note">
                        <Icon name="ShieldAlert" size={16} />
                        <span>{cs ? 'Heslo se nastavuje v .env souboru na serveru (nikdy ne v prohlizeci).' : 'Password is set in .env file on server (never in browser).'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(provider === 'resend' || provider === 'sendgrid') && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', marginBottom: 12, fontFamily: 'var(--forge-font-heading)' }}>
                    {provider === 'resend' ? 'Resend' : 'SendGrid'} {cs ? 'nastaveni' : 'settings'}
                  </h3>
                  <div className="field">
                    <label>{cs ? 'API klic (nazev)' : 'API key (name)'}</label>
                    <input
                      className="input"
                      value={config?.api_key_name || ''}
                      onChange={(e) => updateConfig({ api_key_name: e.target.value })}
                      placeholder={cs ? 'Napr. RESEND_API_KEY' : 'e.g. RESEND_API_KEY'}
                    />
                    <div className="help">
                      {cs
                        ? 'Samotny API klic patri do .env souboru na serveru. Zde uloz pouze nazev env promenne.'
                        : 'The actual API key belongs in .env on the server. Store only the env variable name here.'}
                    </div>
                  </div>
                </div>
              )}

              {provider !== 'none' && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', marginBottom: 12, fontFamily: 'var(--forge-font-heading)' }}>
                    {cs ? 'Odesilatel' : 'Sender'}
                  </h3>
                  <div className="grid2">
                    <div className="field">
                      <label>{cs ? 'Jmeno odesilatele' : 'Sender name'}</label>
                      <input
                        className="input"
                        value={config?.sender_name || ''}
                        onChange={(e) => updateConfig({ sender_name: e.target.value })}
                        placeholder={cs ? 'Napr. ModelPricer' : 'e.g. ModelPricer'}
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Email odesilatele' : 'Sender email'}</label>
                      <input
                        className="input"
                        type="email"
                        value={config?.sender_email || ''}
                        onChange={(e) => updateConfig({ sender_email: e.target.value })}
                        placeholder="noreply@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: LOG */}
      {activeTab === 'log' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Historie emailu' : 'Email log'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Posledni odeslane emaily (ulozeno v localStorage).'
                    : 'Recent sent emails (stored in localStorage).'}
                </p>
              </div>
            </div>
            <div className="card-body">
              {emailLog.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Inbox" size={44} />
                  <h3>{cs ? 'Zadne zaznamy' : 'No records'}</h3>
                  <p>{cs ? 'Zatim nebyly odeslany zadne emaily.' : 'No emails have been sent yet.'}</p>
                </div>
              ) : (
                <div className="log-table">
                  <div className="log-header">
                    <span>{cs ? 'Datum' : 'Date'}</span>
                    <span>{cs ? 'Prijemce' : 'Recipient'}</span>
                    <span>{cs ? 'Predmet' : 'Subject'}</span>
                    <span>{cs ? 'Stav' : 'Status'}</span>
                    <span>{cs ? 'Trigger' : 'Trigger'}</span>
                  </div>
                  {emailLog.map((entry, idx) => (
                    <div key={idx} className="log-row">
                      <span className="log-date">{entry.date ? new Date(entry.date).toLocaleString(cs ? 'cs-CZ' : 'en-US') : '—'}</span>
                      <span className="log-recipient">{entry.recipient || '—'}</span>
                      <span className="log-subject">{entry.subject || '—'}</span>
                      <span className={`log-status ${entry.status === 'sent' ? 'sent' : 'failed'}`}>
                        <Icon name={entry.status === 'sent' ? 'CheckCircle2' : 'XCircle'} size={14} />
                        {entry.status || '—'}
                      </span>
                      <span className="log-trigger">{entry.event || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

        h1 { margin: 0; font-size: 28px; font-weight: 600; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .subtitle { margin: 4px 0 0 0; color: var(--forge-text-secondary); font-size: 14px; max-width: 760px; }

        .header-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 10px; font-size: 12px; border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated); color: var(--forge-text-secondary);
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

        /* Tabs */
        .tab-bar {
          display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid var(--forge-border-default); padding-bottom: 0;
        }
        .tab-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px;
          border: none; background: none; font-size: 14px; font-weight: 600;
          color: var(--forge-text-muted); cursor: pointer; border-bottom: 2px solid transparent;
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s;
          font-family: var(--forge-font-tech); letter-spacing: 0.04em;
        }
        .tab-btn:hover { color: var(--forge-text-primary); }
        .tab-btn.active { color: var(--forge-accent-primary); border-bottom-color: var(--forge-accent-primary); }

        .tab-content { }

        .admin-card { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }
        .card-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-state { padding: 18px; text-align: center; color: var(--forge-text-muted); }
        .empty-state h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .muted { color: var(--forge-text-muted); font-size: 12px; }

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
        .help { font-size: 12px; color: var(--forge-text-muted); margin-top: 6px; }

        .toggles { display: grid; gap: 10px; margin-top: 6px; }
        .toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--forge-text-primary); }

        .icon-btn {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-md);
          padding: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          color: var(--forge-text-secondary);
        }
        .icon-btn:hover { background: var(--forge-bg-overlay); color: var(--forge-text-primary); }

        /* Security note */
        .security-note {
          display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
          border: 1px solid rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); border-radius: var(--forge-radius-md);
          font-size: 13px; color: var(--forge-warning);
        }

        /* Trigger list */
        .trigger-list { display: grid; gap: 12px; }
        .trigger-row {
          border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); padding: 12px; background: var(--forge-bg-surface);
        }
        .trigger-header {
          display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;
        }
        .trigger-left { display: flex; flex-direction: column; gap: 4px; }
        .trigger-event-name { font-weight: 700; color: var(--forge-text-primary); }
        .trigger-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .trigger-fields { grid-template-columns: 1fr; } }

        /* Log table */
        .log-table { display: grid; gap: 0; overflow-x: auto; }
        .log-header {
          display: grid; grid-template-columns: 170px 180px 1fr 90px 130px; gap: 8px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); padding: 8px 12px;
          background: var(--forge-bg-elevated); border-bottom: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md) var(--forge-radius-md) 0 0;
          font-family: var(--forge-font-tech);
        }
        .log-row {
          display: grid; grid-template-columns: 170px 180px 1fr 90px 130px; gap: 8px;
          font-size: 13px; color: var(--forge-text-secondary); padding: 8px 12px;
          border-bottom: 1px solid var(--forge-border-default); align-items: center;
        }
        .log-row:last-child { border-bottom: none; }
        .log-date { font-size: 12px; color: var(--forge-text-muted); font-family: var(--forge-font-mono); }
        .log-recipient { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--forge-text-primary); }
        .log-subject { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .log-status { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
        .log-status.sent { color: var(--forge-success); }
        .log-status.failed { color: var(--forge-error); }
        .log-trigger { font-size: 12px; color: var(--forge-text-muted); font-family: var(--forge-font-mono); }
        @media (max-width: 900px) {
          .log-header, .log-row { grid-template-columns: 1fr 1fr; }
          .log-header span:nth-child(n+3), .log-row span:nth-child(n+3) { display: none; }
        }
      `}</style>
    </div>
  );
}

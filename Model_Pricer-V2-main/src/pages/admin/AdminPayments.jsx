// Admin Payment Methods Configuration Page — V1
// -----------------------------------------------
// Scope: /admin/payments only
// - Single source of truth: tenant-scoped V1 storage (namespace: payment:v1)
// - 2 sections: Bank Transfer, Card Payment
// - Bank Transfer: account details, due days, variable symbol config
// - Card Payment: Stripe toggle with integration link

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import { finalizeDecimal, parseIntInput } from '@/utils/formatters';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { getPaymentConfig, savePaymentConfig } from '../../utils/adminPaymentStorage';
import { isStripeConfigured } from '@/lib/stripe/stripeClient';
import { debug } from '../../lib/debug';

const DUE_DAYS_OPTIONS = [7, 14, 21, 30];

export default function AdminPayments() {
  const { t } = useLanguage();

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  useEffect(() => {
    try {
      const cfg = getPaymentConfig();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setLoading(false);
    } catch (e) {
      debug('[AdminPayments] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: t('admin.payments.failedLoad') });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Stripe status ---
  const [stripeStatus, setStripeStatus] = useState(null); // null = loading, true = configured, false = not configured
  const stripePublicKey = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || '';
  const stripeIsTestKey = stripePublicKey.startsWith('pk_test_');
  const stripeIsLiveKey = stripePublicKey.startsWith('pk_live_');
  const stripeHasKey = stripeIsTestKey || stripeIsLiveKey;
  const stripeMaskedKey = stripeHasKey
    ? `${stripePublicKey.slice(0, 8)}${'*'.repeat(12)}${stripePublicKey.slice(-4)}`
    : '';

  useEffect(() => {
    isStripeConfigured()
      .then(setStripeStatus)
      .catch(() => setStripeStatus(false));
  }, []);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/payments/webhook`
    : '/api/payments/webhook';

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const ui = useMemo(() => ({
    title: t('admin.payments.title'),
    subtitle: t('admin.payments.subtitle'),
    save: t('admin.payments.save'),
    saving: t('admin.payments.saving'),
    saved: t('admin.payments.saved'),
    unsaved: t('admin.payments.unsaved'),
  }), [t]);

  const updateBankTransfer = (patch) => {
    setConfig((prev) => ({
      ...prev,
      bank_transfer: { ...prev.bank_transfer, ...patch },
    }));
  };

  const updateVariableSymbol = (patch) => {
    setConfig((prev) => ({
      ...prev,
      bank_transfer: {
        ...prev.bank_transfer,
        variable_symbol: { ...prev.bank_transfer.variable_symbol, ...patch },
      },
    }));
  };

  const updateCardPayment = (patch) => {
    setConfig((prev) => ({
      ...prev,
      card_payment: { ...prev.card_payment, ...patch },
    }));
  };

  const handleSave = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = savePaymentConfig(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
      setTimeout(() => setBanner(null), 3000);
    } catch (e) {
      debug('[AdminPayments] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: t('admin.payments.saveFailed') });
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: t('admin.payments.discardTitle'),
      message: t('admin.payments.discardMsg'),
      confirmLabel: t('admin.payments.discardConfirm'),
      cancelLabel: t('admin.payments.discardCancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      const cfg = getPaymentConfig();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setBanner({ type: 'success', text: t('admin.payments.resetDone') });
      setTimeout(() => setBanner(null), 3000);
    } catch (e) {
      setBanner({ type: 'error', text: t('admin.payments.resetFailed') });
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="Loader2" size={18} />
              <span>{t('admin.payments.loading')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bt = config?.bank_transfer || {};
  const vs = bt.variable_symbol || {};
  const cp = config?.card_payment || {};

  const vsPreview = vs.mode === 'auto'
    ? `${vs.prefix || ''}${vs.next_value || 70001}`
    : t('admin.payments.vsOrderPreview');

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
            {t('admin.payments.reset')}
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

      {/* SECTION 1: Bank Transfer */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="Building2" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
            <div>
              <h2>{t('admin.payments.bankTransferTitle')}</h2>
              <p className="card-description">
                {t('admin.payments.bankTransferDesc')}
              </p>
            </div>
          </div>
          <ForgeCheckbox
            checked={bt.enabled}
            onChange={(e) => updateBankTransfer({ enabled: e.target.checked })}
            label={<span style={{ fontWeight: 600, fontSize: 13 }}>{bt.enabled ? t('admin.payments.enabled') : t('admin.payments.disabled')}</span>}
          />
        </div>
        <div className="card-body">
          {!bt.enabled ? (
            <div className="info-box">
              <Icon name="Info" size={16} />
              <span>{t('admin.payments.bankDisabledHint')}</span>
            </div>
          ) : (
            <>
              <div className="grid2">
                <div className="field">
                  <label>{t('admin.payments.accountNumber')}</label>
                  <input
                    className="input"
                    value={bt.account_number || ''}
                    onChange={(e) => updateBankTransfer({ account_number: e.target.value })}
                    placeholder="123456789/0100"
                  />
                </div>
                <div className="field">
                  <label>IBAN</label>
                  <input
                    className="input"
                    value={bt.iban || ''}
                    onChange={(e) => updateBankTransfer({ iban: e.target.value })}
                    placeholder="CZ6508000000192000145399"
                  />
                </div>
              </div>
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>SWIFT / BIC</label>
                  <input
                    className="input"
                    value={bt.swift || ''}
                    onChange={(e) => updateBankTransfer({ swift: e.target.value })}
                    placeholder="GIBACZPX"
                  />
                </div>
                <div className="field">
                  <label>{t('admin.payments.bankName')}</label>
                  <input
                    className="input"
                    value={bt.bank_name || ''}
                    onChange={(e) => updateBankTransfer({ bank_name: e.target.value })}
                    placeholder={t('admin.payments.bankName')}
                  />
                </div>
              </div>
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>{t('admin.payments.dueDays')}</label>
                  <select
                    className="input"
                    value={bt.due_days || 14}
                    onChange={(e) => updateBankTransfer({ due_days: Number(e.target.value) })}
                  >
                    {DUE_DAYS_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d} {t('admin.payments.dueDaysSuffix')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>{t('admin.payments.paymentInstructions')}</label>
                <textarea
                  className="input textarea"
                  rows={3}
                  value={bt.payment_instructions || ''}
                  onChange={(e) => updateBankTransfer({ payment_instructions: e.target.value })}
                  placeholder={t('admin.payments.paymentInstructionsPlaceholder')}
                />
              </div>

              {/* Variable Symbol sub-section */}
              <div style={{ marginTop: 20, borderTop: '1px solid var(--forge-border-default)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="Hash" size={16} style={{ color: 'var(--forge-accent-primary)' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)' }}>
                    {t('admin.payments.variableSymbol')}
                  </h3>
                </div>

                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="vs_mode"
                      value="auto"
                      checked={vs.mode === 'auto'}
                      onChange={() => updateVariableSymbol({ mode: 'auto' })}
                    />
                    <span>{t('admin.payments.vsAutoMode')}</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="vs_mode"
                      value="order_number"
                      checked={vs.mode === 'order_number'}
                      onChange={() => updateVariableSymbol({ mode: 'order_number' })}
                    />
                    <span>{t('admin.payments.vsOrderMode')}</span>
                  </label>
                </div>

                {vs.mode === 'auto' && (
                  <div className="grid2" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label>{t('admin.payments.vsNextValue')}</label>
                      <input
                        className="input"
                        type="text"
                        inputMode="numeric"
                        value={vs.next_value ?? ''}
                        onChange={(e) => updateVariableSymbol({ next_value: parseIntInput(e.target.value) })}
                        onBlur={() => updateVariableSymbol({ next_value: Math.max(1, finalizeDecimal(vs.next_value, 70001)) })}
                      />
                    </div>
                    <div className="field">
                      <label>{t('admin.payments.vsPrefix')}</label>
                      <input
                        className="input"
                        value={vs.prefix || ''}
                        onChange={(e) => updateVariableSymbol({ prefix: e.target.value })}
                        placeholder={t('admin.payments.vsPrefixPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                <div className="vs-preview">
                  <Icon name="Info" size={14} />
                  <span>
                    {t('admin.payments.vsNextLabel')}
                    <strong>{vsPreview}</strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 2: Card Payment */}
      <div className="admin-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="CreditCard" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
            <div>
              <h2>{t('admin.payments.cardPaymentTitle')}</h2>
              <p className="card-description">
                {t('admin.payments.cardPaymentDesc')}
              </p>
            </div>
          </div>
          <ForgeCheckbox
            checked={cp.enabled}
            onChange={(e) => updateCardPayment({ enabled: e.target.checked })}
            label={<span style={{ fontWeight: 600, fontSize: 13 }}>{cp.enabled ? t('admin.payments.enabled') : t('admin.payments.disabled')}</span>}
          />
        </div>
        <div className="card-body">
          {!cp.enabled ? (
            <div className="info-box">
              <Icon name="Info" size={16} />
              <span>{t('admin.payments.cardDisabledHint')}</span>
            </div>
          ) : (
            <>
              <div className="info-box info-box-accent">
                <Icon name="Info" size={16} />
                <span>
                  {t('admin.payments.cardStripeInfo')}
                  <a href="/admin/integrations" style={{ color: 'var(--forge-accent-primary)', fontWeight: 600 }}>
                    {t('admin.payments.settingsIntegrations')}
                  </a>.
                </span>
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>{t('admin.payments.provider')}</label>
                <div className="provider-badge">
                  <Icon name="CreditCard" size={14} />
                  <span>Stripe</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 3: Stripe Configuration */}
      <div className="admin-card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="Zap" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
            <div>
              <h2>{t('admin.payments.stripeConfigTitle')}</h2>
              <p className="card-description">
                {t('admin.payments.stripeConfigDesc')}
              </p>
            </div>
          </div>
          {stripeStatus === null ? (
            <span className="stripe-status-badge stripe-status-checking">
              <Icon name="Loader2" size={14} className="stripe-spinner" />
              {t('admin.payments.stripeChecking')}
            </span>
          ) : stripeStatus && stripeHasKey ? (
            <span className={`stripe-status-badge ${stripeIsTestKey ? 'stripe-status-test' : 'stripe-status-active'}`}>
              <Icon name={stripeIsTestKey ? 'FlaskConical' : 'CheckCircle2'} size={14} />
              {stripeIsTestKey ? t('admin.payments.stripeTestMode') : t('admin.payments.stripeActive')}
            </span>
          ) : (
            <span className="stripe-status-badge stripe-status-inactive">
              <Icon name="XCircle" size={14} />
              {t('admin.payments.stripeNotConfigured')}
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="stripe-config-grid">
            {/* Public Key */}
            <div className="stripe-config-row">
              <div className="stripe-config-label">
                <Icon name="Key" size={14} />
                <span>{t('admin.payments.stripePublicKey')}</span>
              </div>
              <div className="stripe-config-value">
                {stripeHasKey ? (
                  <code className="stripe-key-display">{stripeMaskedKey}</code>
                ) : (
                  <span style={{ color: 'var(--forge-text-muted)', fontStyle: 'italic' }}>
                    {t('admin.payments.stripeNoKey')}
                  </span>
                )}
              </div>
            </div>

            {/* Mode */}
            <div className="stripe-config-row">
              <div className="stripe-config-label">
                <Icon name="ToggleLeft" size={14} />
                <span>{t('admin.payments.stripeMode')}</span>
              </div>
              <div className="stripe-config-value">
                {stripeHasKey ? (
                  <span className={`stripe-mode-badge ${stripeIsTestKey ? 'test' : 'live'}`}>
                    <Icon name={stripeIsTestKey ? 'FlaskConical' : 'Shield'} size={12} />
                    {stripeIsTestKey ? t('admin.payments.stripeTest') : t('admin.payments.stripeLive')}
                  </span>
                ) : (
                  <span style={{ color: 'var(--forge-text-muted)' }}>-</span>
                )}
              </div>
            </div>

            {/* Webhook URL */}
            <div className="stripe-config-row">
              <div className="stripe-config-label">
                <Icon name="Webhook" size={14} />
                <span>{t('admin.payments.stripeWebhookUrl')}</span>
              </div>
              <div className="stripe-config-value">
                <code className="stripe-key-display">{webhookUrl}</code>
              </div>
            </div>
          </div>

          <div className="info-box" style={{ marginTop: 14 }}>
            <Icon name="Info" size={16} />
            <span>{t('admin.payments.stripeWebhookHint')}</span>
          </div>

          {/* Setup Guide */}
          {!stripeStatus && (
            <div className="stripe-setup-guide">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon name="BookOpen" size={16} style={{ color: 'var(--forge-accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)' }}>
                  {t('admin.payments.stripeSetupGuide')}
                </h3>
              </div>
              <div className="stripe-steps">
                <p>{t('admin.payments.stripeStep1')}</p>
                <p>{t('admin.payments.stripeStep2')}</p>
                <p>{t('admin.payments.stripeStep3')}</p>
                <p>{t('admin.payments.stripeStep4')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog />

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

        .admin-card { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }
        .card-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

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
          color: var(--forge-text-primary); box-sizing: border-box;
        }
        .input:focus { border-color: var(--forge-accent-primary); }

        .textarea { resize: vertical; font-family: inherit; }

        .info-box {
          display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
          border-radius: var(--forge-radius-md); font-size: 13px; color: var(--forge-text-muted);
        }
        .info-box-accent {
          border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.06); color: var(--forge-text-secondary);
        }

        .radio-group {
          display: flex; gap: 20px; flex-wrap: wrap;
        }
        .radio-label {
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-size: 14px; color: var(--forge-text-primary); font-weight: 500;
        }
        .radio-label input[type="radio"] {
          accent-color: var(--forge-accent-primary);
          width: 16px; height: 16px; cursor: pointer;
        }

        .vs-preview {
          display: flex; align-items: center; gap: 6px; margin-top: 12px;
          padding: 8px 12px; border-radius: var(--forge-radius-md);
          background: var(--forge-bg-elevated); border: 1px solid var(--forge-border-default);
          font-size: 13px; color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
        }
        .vs-preview strong {
          color: var(--forge-accent-primary); font-weight: 700;
        }

        .provider-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: var(--forge-radius-md);
          background: var(--forge-bg-elevated); border: 1px solid var(--forge-border-default);
          font-size: 14px; font-weight: 600; color: var(--forge-text-primary);
          font-family: var(--forge-font-tech);
        }

        /* Stripe Config Section */
        .stripe-status-badge {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 12px; font-size: 12px; font-weight: 700;
          font-family: var(--forge-font-tech); letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .stripe-status-active {
          border: 1px solid rgba(0,212,170,0.4); background: rgba(0,212,170,0.1); color: var(--forge-success);
        }
        .stripe-status-test {
          border: 1px solid rgba(255,181,71,0.4); background: rgba(255,181,71,0.1); color: var(--forge-warning);
        }
        .stripe-status-inactive {
          border: 1px solid rgba(255,71,87,0.4); background: rgba(255,71,87,0.1); color: var(--forge-error);
        }
        .stripe-status-checking {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-muted);
        }
        .stripe-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .stripe-config-grid {
          display: flex; flex-direction: column; gap: 0;
        }
        .stripe-config-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--forge-border-default);
        }
        .stripe-config-row:last-child { border-bottom: none; }
        .stripe-config-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: var(--forge-text-secondary);
          min-width: 200px;
        }
        .stripe-config-value {
          font-size: 13px; color: var(--forge-text-primary); text-align: right;
          flex: 1; overflow: hidden; text-overflow: ellipsis;
        }
        .stripe-key-display {
          font-family: var(--forge-font-tech); font-size: 12px;
          background: var(--forge-bg-elevated); border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-sm, 4px); padding: 4px 8px;
          color: var(--forge-text-primary); user-select: all;
          word-break: break-all;
        }
        .stripe-mode-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: var(--forge-radius-sm, 4px);
          font-size: 12px; font-weight: 700; font-family: var(--forge-font-tech);
        }
        .stripe-mode-badge.test {
          background: rgba(255,181,71,0.1); color: var(--forge-warning);
          border: 1px solid rgba(255,181,71,0.3);
        }
        .stripe-mode-badge.live {
          background: rgba(0,212,170,0.1); color: var(--forge-success);
          border: 1px solid rgba(0,212,170,0.3);
        }
        .stripe-setup-guide {
          margin-top: 16px; padding: 14px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          background: var(--forge-bg-elevated);
        }
        .stripe-steps p {
          margin: 0 0 6px 0; font-size: 13px; color: var(--forge-text-secondary);
          line-height: 1.6;
        }
        .stripe-steps p:last-child { margin-bottom: 0; }

        @media (max-width: 640px) {
          .stripe-config-row { flex-direction: column; align-items: flex-start; gap: 4px; }
          .stripe-config-label { min-width: auto; }
          .stripe-config-value { text-align: left; }
        }
      `}</style>
    </div>
  );
}

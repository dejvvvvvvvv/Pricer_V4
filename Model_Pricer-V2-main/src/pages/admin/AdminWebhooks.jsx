// Admin Webhooks Page — Register, test, and manage webhook endpoints
// Route: /admin/webhooks

import React, { useEffect, useState, useCallback } from 'react';
import Icon from '../../components/AppIcon';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import { ForgeConfirmDialog, useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { SkeletonTable } from '../../components/ui/forge/ForgeSkeleton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { debug } from '@/lib/debug';
import { generateId } from '@/utils/generateId';
import {
  getWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
} from '../../services/webhookApi';

// ─── Constants ───────────────────────────────────────────────

const AVAILABLE_EVENTS = [
  { key: 'order.created', label: 'Objednavka vytvorena', color: '#00D4AA' },
  { key: 'order.updated', label: 'Objednavka aktualizovana', color: '#3B82F6' },
  { key: 'order.completed', label: 'Objednavka dokoncena', color: '#10B981' },
  { key: 'order.cancelled', label: 'Objednavka zrusena', color: '#EF4444' },
  { key: 'slice.completed', label: 'Slicing dokoncen', color: '#8B5CF6' },
  { key: 'slice.failed', label: 'Slicing selhal', color: '#F97316' },
];

// ─── Styles ──────────────────────────────────────────────────

const cardStyle = {
  backgroundColor: 'var(--forge-bg-surface)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-md, 12px)',
  padding: '24px',
  marginBottom: '20px',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--forge-text-secondary)',
  fontFamily: 'var(--forge-font-body)',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-sm, 8px)',
  color: 'var(--forge-text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--forge-font-body)',
  outline: 'none',
  boxSizing: 'border-box',
};

const monoInputStyle = {
  ...inputStyle,
  fontFamily: 'var(--forge-font-tech)',
  fontSize: '13px',
};

const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  backgroundColor: 'var(--forge-accent-primary)',
  color: '#08090C',
  border: 'none',
  borderRadius: 'var(--forge-radius-sm, 8px)',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'var(--forge-font-body)',
  cursor: 'pointer',
  transition: 'opacity 150ms, transform 120ms ease-out',
};

const btnOutline = {
  ...btnPrimary,
  backgroundColor: 'transparent',
  border: '1px solid var(--forge-border-default)',
  color: 'var(--forge-text-secondary)',
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 500,
};

const btnDanger = {
  ...btnOutline,
  borderColor: 'var(--forge-error, #DC2626)',
  color: 'var(--forge-error, #DC2626)',
};

const btnSmall = {
  ...btnOutline,
  padding: '6px 12px',
  fontSize: '12px',
};

// ─── Event Badge ─────────────────────────────────────────────

function EventBadge({ eventKey }) {
  const event = AVAILABLE_EVENTS.find((e) => e.key === eventKey);
  const color = event?.color || 'var(--forge-text-muted)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontFamily: 'var(--forge-font-tech)',
        fontWeight: 500,
        color: color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
      }}
    >
      {eventKey}
    </span>
  );
}

// ─── Status Badge ────────────────────────────────────────────

function StatusBadge({ active }) {
  const color = active ? 'var(--forge-success, #10B981)' : 'var(--forge-text-muted)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontFamily: 'var(--forge-font-tech)',
        color: color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
        }}
      />
      {active ? 'Aktivni' : 'Neaktivni'}
    </span>
  );
}

// ─── Delivery Log Item ───────────────────────────────────────

function DeliveryLogItem({ delivery }) {
  const isSuccess = delivery.statusCode >= 200 && delivery.statusCode < 300;
  const color = isSuccess ? 'var(--forge-success, #10B981)' : 'var(--forge-error, #EF4444)';
  const date = delivery.timestamp
    ? new Date(delivery.timestamp).toLocaleString('cs-CZ')
    : '—';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 'var(--forge-radius-sm, 8px)',
        backgroundColor: 'var(--forge-bg-elevated)',
        fontSize: '12px',
        fontFamily: 'var(--forge-font-tech)',
      }}
    >
      <span style={{ color: 'var(--forge-text-muted)' }}>{date}</span>
      <span style={{ color: 'var(--forge-text-secondary)' }}>{delivery.event || '—'}</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: color,
          fontWeight: 600,
        }}
      >
        <Icon name={isSuccess ? 'Check' : 'X'} size={12} />
        {delivery.statusCode}
      </span>
    </div>
  );
}

// ─── Test Result Flash ───────────────────────────────────────

function TestResultFlash({ result, onDismiss }) {
  if (!result) return null;

  const isSuccess = result.success;
  const color = isSuccess ? 'var(--forge-success, #10B981)' : 'var(--forge-error, #EF4444)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: 'var(--forge-radius-sm, 8px)',
        backgroundColor: `${isSuccess ? '#10B981' : '#EF4444'}15`,
        border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}30`,
        color: color,
        fontSize: '13px',
        fontFamily: 'var(--forge-font-body)',
        marginTop: '12px',
        animation: 'forge-fade-in 200ms ease-out',
      }}
    >
      <Icon name={isSuccess ? 'CheckCircle' : 'XCircle'} size={16} />
      <span style={{ flex: 1 }}>{result.message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: color,
          padding: '2px',
          display: 'flex',
        }}
        aria-label="Zavrit"
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}

// ─── Webhook Card ────────────────────────────────────────────

function WebhookCard({ webhook, onTest, onDelete, testResult, testingId }) {
  const isTesting = testingId === webhook.id;

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: URL + events + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '14px',
                color: 'var(--forge-text-primary)',
                wordBreak: 'break-all',
              }}
            >
              {webhook.url}
            </span>
            <StatusBadge active={webhook.active !== false} />
          </div>

          {/* Events */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            {(webhook.events || []).map((ev) => (
              <EventBadge key={ev} eventKey={ev} />
            ))}
          </div>

          {/* Created date */}
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Vytvoreno:{' '}
            {webhook.createdAt
              ? new Date(webhook.createdAt).toLocaleDateString('cs-CZ')
              : '—'}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            style={btnSmall}
            onClick={() => onTest(webhook.id)}
            disabled={isTesting}
            title="Odeslat testovaci udalost"
          >
            <Icon name={isTesting ? 'Loader2' : 'Send'} size={14} />
            {isTesting ? 'Testovani...' : 'Test'}
          </button>
          <button
            style={{ ...btnSmall, borderColor: 'var(--forge-error)', color: 'var(--forge-error)' }}
            onClick={() => onDelete(webhook)}
            title="Smazat webhook"
          >
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      {/* Test result flash */}
      {testResult && testResult.webhookId === webhook.id && (
        <TestResultFlash
          result={testResult}
          onDismiss={() => {}}
        />
      )}

      {/* Delivery log preview */}
      {webhook.deliveries && webhook.deliveries.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            Posledni doruceni
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {webhook.deliveries.slice(0, 5).map((d, i) => (
              <DeliveryLogItem key={d.id || i} delivery={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Webhook Form ────────────────────────────────────────

function AddWebhookForm({ onSubmit, onCancel, saving }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState([]);
  const [secret, setSecret] = useState('');
  const [urlError, setUrlError] = useState('');

  const toggleEvent = (key) => {
    setEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  const handleGenerateSecret = () => {
    setSecret(generateId());
  };

  const validateUrl = (value) => {
    if (!value.trim()) {
      setUrlError('URL je povinne');
      return false;
    }
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('URL musi zacinat http:// nebo https://');
        return false;
      }
    } catch {
      setUrlError('Neplatny format URL');
      return false;
    }
    setUrlError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateUrl(url)) return;
    if (events.length === 0) return;

    onSubmit({
      url: url.trim(),
      events,
      secret: secret.trim() || undefined,
    });
  };

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <Icon
          name="Plus"
          size={18}
          style={{ color: 'var(--forge-accent-primary)' }}
        />
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--forge-text-primary)',
          }}
        >
          Novy webhook
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* URL */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Endpoint URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) validateUrl(e.target.value);
            }}
            onBlur={() => url && validateUrl(url)}
            placeholder="https://example.com/webhooks/model-pricer"
            style={{
              ...monoInputStyle,
              borderColor: urlError
                ? 'var(--forge-error, #EF4444)'
                : 'var(--forge-border-default)',
            }}
            required
          />
          {urlError && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--forge-error, #EF4444)',
                fontFamily: 'var(--forge-font-body)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              {urlError}
            </span>
          )}
        </div>

        {/* Events */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Udalosti *</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '8px',
            }}
          >
            {AVAILABLE_EVENTS.map((ev) => {
              const checked = events.includes(ev.key);
              return (
                <button
                  key={ev.key}
                  type="button"
                  onClick={() => toggleEvent(ev.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--forge-radius-sm, 8px)',
                    border: `1px solid ${checked ? ev.color + '60' : 'var(--forge-border-default)'}`,
                    backgroundColor: checked ? ev.color + '12' : 'var(--forge-bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease-out',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: `2px solid ${checked ? ev.color : 'var(--forge-border-active)'}`,
                      backgroundColor: checked ? ev.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    {checked && <Icon name="Check" size={12} style={{ color: '#fff' }} />}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--forge-font-tech)',
                        color: checked ? ev.color : 'var(--forge-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {ev.key}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--forge-font-body)',
                        color: 'var(--forge-text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {ev.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {events.length === 0 && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-body)',
                marginTop: '6px',
                display: 'block',
              }}
            >
              Vyberte alespon jednu udalost
            </span>
          )}
        </div>

        {/* Secret */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Webhook Secret (volitelne)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="whsec_..."
              style={{ ...monoInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={handleGenerateSecret}
              style={btnOutline}
              title="Automaticky vygenerovat secret"
            >
              <Icon name="RefreshCw" size={14} />
              Generovat
            </button>
          </div>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              fontFamily: 'var(--forge-font-body)',
              marginTop: '4px',
              display: 'block',
            }}
          >
            Secret bude pouzit k podpisu payloadu (HMAC-SHA256).
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={btnOutline}>
            Zrusit
          </button>
          <button
            type="submit"
            disabled={saving || events.length === 0}
            style={{
              ...btnPrimary,
              opacity: saving || events.length === 0 ? 0.6 : 1,
              cursor: saving || events.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Icon name={saving ? 'Loader2' : 'Save'} size={16} />
            {saving ? 'Ukladani...' : 'Ulozit webhook'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div
      style={{
        ...cardStyle,
        textAlign: 'center',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--forge-bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Icon
          name="Webhook"
          size={28}
          style={{ color: 'var(--forge-text-muted)' }}
        />
      </div>
      <h3
        style={{
          fontFamily: 'var(--forge-font-heading)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--forge-text-primary)',
          margin: '0 0 8px',
        }}
      >
        Zadne webhooky
      </h3>
      <p
        style={{
          fontFamily: 'var(--forge-font-body)',
          fontSize: '14px',
          color: 'var(--forge-text-muted)',
          margin: '0 0 24px',
          maxWidth: '480px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}
      >
        Webhooky umoznuji automaticky odesilat notifikace na vasi URL adresu
        kdyz se v systemu stane urcita udalost (napr. nova objednavka, dokonceny
        slicing). Muzete je vyuzit pro integraci s vlastnimi systemy, CRM, Slack
        nebo dalsi automatizaci.
      </p>
      <button onClick={onAdd} style={btnPrimary}>
        <Icon name="Plus" size={16} />
        Pridat prvni webhook
      </button>
    </div>
  );
}

// ─── Error Banner ────────────────────────────────────────────

function ErrorBanner({ message, onRetry }) {
  return (
    <div
      style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderColor: 'var(--forge-error, #EF4444)',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
      }}
    >
      <Icon
        name="AlertTriangle"
        size={20}
        style={{ color: 'var(--forge-error)', flexShrink: 0 }}
      />
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--forge-font-body)',
          fontSize: '14px',
          color: 'var(--forge-text-primary)',
        }}
      >
        {message}
      </span>
      {onRetry && (
        <button onClick={onRetry} style={btnOutline}>
          <Icon name="RefreshCw" size={14} />
          Zkusit znovu
        </button>
      )}
    </div>
  );
}

// =============================================================
// AdminWebhooks — Main Component
// =============================================================

export default function AdminWebhooks() {
  useDocumentTitle('Webhooks | Admin');

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // ─── Load webhooks ──────────────────────────────────────────

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWebhooks();
      // Backend may return { data: [...] } or plain array
      const list = Array.isArray(data) ? data : (data?.data || data?.webhooks || []);
      setWebhooks(list);
    } catch (err) {
      debug('AdminWebhooks: fetch error', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Nepodarilo se nacist webhooky. Zkontrolujte pripojeni.'
      );
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // ─── Create webhook ─────────────────────────────────────────

  const handleCreate = useCallback(
    async (config) => {
      setSaving(true);
      try {
        await createWebhook(config);
        setShowForm(false);
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: create error', err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Nepodarilo se vytvorit webhook.'
        );
      } finally {
        setSaving(false);
      }
    },
    [fetchWebhooks]
  );

  // ─── Delete webhook ─────────────────────────────────────────

  const handleDelete = useCallback(
    async (webhook) => {
      const ok = await confirm({
        title: 'Smazat webhook?',
        message: `Webhook "${webhook.url}" bude trvale odstranen. Tuto akci nelze vzit zpet.`,
        confirmLabel: 'Smazat',
        cancelLabel: 'Zrusit',
        destructive: true,
      });
      if (!ok) return;

      try {
        await deleteWebhook(webhook.id);
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: delete error', err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Nepodarilo se smazat webhook.'
        );
      }
    },
    [confirm, fetchWebhooks]
  );

  // ─── Test webhook ───────────────────────────────────────────

  const handleTest = useCallback(
    async (webhookId) => {
      setTestingId(webhookId);
      setTestResult(null);
      try {
        const data = await testWebhook(webhookId);
        setTestResult({
          webhookId,
          success: true,
          message:
            data?.message ||
            `Test uspesny — odpoved ${data?.statusCode || 200}`,
        });
        // Refresh to update delivery log
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: test error', err);
        setTestResult({
          webhookId,
          success: false,
          message:
            err?.response?.data?.message ||
            err?.message ||
            'Testovaci udalost selhala. Zkontrolujte endpoint.',
        });
      } finally {
        setTestingId(null);
      }
    },
    [fetchWebhooks]
  );

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '900px' }}>
      <ForgePageHeader
        title="Webhooky"
        breadcrumb="ADMIN / WEBHOOKS"
        actions={
          !showForm && !loading && (
            <button
              onClick={() => setShowForm(true)}
              style={btnPrimary}
            >
              <Icon name="Plus" size={16} />
              Pridat webhook
            </button>
          )
        }
      />

      <div style={{ marginTop: '24px' }}>
        {/* Error banner */}
        {error && (
          <ErrorBanner message={error} onRetry={fetchWebhooks} />
        )}

        {/* Loading state */}
        {loading && <SkeletonTable rows={3} columns={3} />}

        {/* Add form */}
        {showForm && !loading && (
          <AddWebhookForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        )}

        {/* Webhook list */}
        {!loading && webhooks.length > 0 && (
          <div>
            {webhooks.map((wh) => (
              <WebhookCard
                key={wh.id}
                webhook={wh}
                onTest={handleTest}
                onDelete={handleDelete}
                testResult={testResult}
                testingId={testingId}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && webhooks.length === 0 && !error && !showForm && (
          <EmptyState onAdd={() => setShowForm(true)} />
        )}

        {/* Info card */}
        {!loading && webhooks.length > 0 && (
          <div
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: 'var(--forge-bg-elevated)',
              border: '1px solid var(--forge-border-default)',
            }}
          >
            <Icon
              name="Info"
              size={16}
              style={{
                color: 'var(--forge-text-muted)',
                flexShrink: 0,
                marginTop: '2px',
              }}
            />
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'var(--forge-font-body)',
                color: 'var(--forge-text-muted)',
                lineHeight: 1.6,
              }}
            >
              Webhook payloady jsou podepsany pomoci HMAC-SHA256 pokud je nastaven
              secret. Overujte podpis v hlavicce{' '}
              <code
                style={{
                  fontFamily: 'var(--forge-font-tech)',
                  backgroundColor: 'var(--forge-bg-surface)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                X-Webhook-Signature
              </code>{' '}
              na vasem endpointu.
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog />

      <style>{`
        @keyframes forge-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

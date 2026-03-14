// Admin Webhooks Page — Register, test, manage webhook endpoints, delivery logs, docs
// Route: /admin/webhooks

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Icon from '../../components/AppIcon';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import { ForgeConfirmDialog, useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { CopyButton } from '../../components/ui/forge/CopyButton';
import { SkeletonTable } from '../../components/ui/forge/ForgeSkeleton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useLanguage } from '../../contexts/LanguageContext';
import { debug } from '@/lib/debug';
import { generateId } from '@/utils/generateId';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  retryDelivery,
  regenerateSecret,
} from '../../services/webhookApi';

// ─── Constants ───────────────────────────────────────────────

const AVAILABLE_EVENTS = [
  { key: 'order.created', label: 'Objednavka vytvorena', color: '#00D4AA', group: 'Objednavky' },
  { key: 'order.updated', label: 'Objednavka aktualizovana', color: '#3B82F6', group: 'Objednavky' },
  { key: 'order.completed', label: 'Objednavka dokoncena', color: '#10B981', group: 'Objednavky' },
  { key: 'order.cancelled', label: 'Objednavka zrusena', color: '#EF4444', group: 'Objednavky' },
  { key: 'payment.received', label: 'Platba prijata', color: '#8B5CF6', group: 'Platby' },
  { key: 'payment.refunded', label: 'Platba vracena', color: '#F97316', group: 'Platby' },
  { key: 'invoice.created', label: 'Faktura vytvorena', color: '#06B6D4', group: 'Faktury' },
  { key: 'invoice.paid', label: 'Faktura uhrazena', color: '#84CC16', group: 'Faktury' },
];

const EVENT_GROUPS = ['Objednavky', 'Platby', 'Faktury'];

const TABS = [
  { key: 'webhooks', label: 'Webhooky', icon: 'Webhook' },
  { key: 'deliveries', label: 'Doruceni', icon: 'Send' },
  { key: 'docs', label: 'Dokumentace', icon: 'BookOpen' },
];

// ─── Payload examples for documentation ──────────────────────

const PAYLOAD_EXAMPLES = {
  'order.created': {
    event: 'order.created',
    timestamp: '2026-03-12T14:30:00.000Z',
    data: {
      id: 'ord_abc123',
      status: 'new',
      customer: { email: 'zakaznik@example.com', name: 'Jan Novak' },
      items: [{ model: 'dil_v2.stl', material: 'PLA', quantity: 2, price: 450 }],
      total: 900,
      currency: 'CZK',
    },
  },
  'order.updated': {
    event: 'order.updated',
    timestamp: '2026-03-12T15:00:00.000Z',
    data: {
      id: 'ord_abc123',
      status: 'in_progress',
      previous_status: 'new',
      updated_fields: ['status'],
    },
  },
  'order.completed': {
    event: 'order.completed',
    timestamp: '2026-03-12T18:00:00.000Z',
    data: {
      id: 'ord_abc123',
      status: 'completed',
      completed_at: '2026-03-12T18:00:00.000Z',
      total: 900,
      currency: 'CZK',
    },
  },
  'order.cancelled': {
    event: 'order.cancelled',
    timestamp: '2026-03-12T16:00:00.000Z',
    data: {
      id: 'ord_abc123',
      status: 'cancelled',
      reason: 'Zakaznik zrusil objednavku',
      cancelled_at: '2026-03-12T16:00:00.000Z',
    },
  },
  'payment.received': {
    event: 'payment.received',
    timestamp: '2026-03-12T14:35:00.000Z',
    data: {
      id: 'pay_xyz789',
      order_id: 'ord_abc123',
      amount: 900,
      currency: 'CZK',
      method: 'card',
      status: 'succeeded',
    },
  },
  'payment.refunded': {
    event: 'payment.refunded',
    timestamp: '2026-03-13T10:00:00.000Z',
    data: {
      id: 'pay_xyz789',
      order_id: 'ord_abc123',
      amount: 900,
      currency: 'CZK',
      refund_reason: 'Vadny vyrobek',
    },
  },
  'invoice.created': {
    event: 'invoice.created',
    timestamp: '2026-03-12T14:40:00.000Z',
    data: {
      id: 'inv_def456',
      order_id: 'ord_abc123',
      number: 'FA-2026-0042',
      total: 900,
      currency: 'CZK',
      due_date: '2026-03-26',
    },
  },
  'invoice.paid': {
    event: 'invoice.paid',
    timestamp: '2026-03-12T14:45:00.000Z',
    data: {
      id: 'inv_def456',
      order_id: 'ord_abc123',
      number: 'FA-2026-0042',
      paid_at: '2026-03-12T14:45:00.000Z',
      amount: 900,
      currency: 'CZK',
    },
  },
};

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
  color: 'var(--forge-bg-void)',
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

const btnSmall = {
  ...btnOutline,
  padding: '6px 12px',
  fontSize: '12px',
};

const sectionLabel = {
  fontSize: '11px',
  fontFamily: 'var(--forge-font-tech)',
  color: 'var(--forge-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '8px',
  display: 'block',
};

const codeBlockStyle = {
  backgroundColor: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-sm, 8px)',
  padding: '16px',
  fontSize: '12px',
  fontFamily: 'var(--forge-font-tech)',
  color: 'var(--forge-text-primary)',
  whiteSpace: 'pre',
  overflowX: 'auto',
  lineHeight: 1.6,
  margin: 0,
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

// ─── HTTP Status Badge ───────────────────────────────────────

function HttpStatusBadge({ code }) {
  const isSuccess = code >= 200 && code < 300;
  const isClientErr = code >= 400 && code < 500;
  const color = isSuccess
    ? 'var(--forge-success, #10B981)'
    : isClientErr
      ? 'var(--forge-warning)'
      : 'var(--forge-error, #EF4444)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'var(--forge-font-tech)',
        fontWeight: 600,
        color: color,
        backgroundColor: isSuccess ? 'rgba(0, 212, 170, 0.08)' : isClientErr ? 'rgba(255, 170, 0, 0.08)' : 'rgba(255, 71, 87, 0.08)',
      }}
    >
      <Icon name={isSuccess ? 'Check' : 'X'} size={10} />
      {code}
    </span>
  );
}

// ─── Success Rate Bar ────────────────────────────────────────

function SuccessRateBar({ deliveries }) {
  if (!deliveries || deliveries.length === 0) return null;
  const total = deliveries.length;
  const success = deliveries.filter(
    (d) => d.statusCode >= 200 && d.statusCode < 300
  ).length;
  const rate = Math.round((success / total) * 100);
  const color =
    rate >= 90
      ? 'var(--forge-success, #10B981)'
      : rate >= 50
        ? 'var(--forge-warning)'
        : 'var(--forge-error, #EF4444)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'var(--forge-bg-elevated)',
          overflow: 'hidden',
          minWidth: 60,
        }}
      >
        <div
          style={{
            width: `${rate}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 2,
            transition: 'width 300ms ease-out',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-tech)',
          color: color,
          fontWeight: 600,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {rate}%
      </span>
    </div>
  );
}

// ─── Secret Display ──────────────────────────────────────────

function SecretDisplay({ secret, webhookId, onRegenerate }) {
  const [revealed, setRevealed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!secret) {
    return (
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-muted)',
          fontStyle: 'italic',
        }}
      >
        Bez secret klice
      </span>
    );
  }

  const masked = secret.substring(0, 8) + '••••••••••••••••';

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate(webhookId);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <code
        style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '12px',
          color: 'var(--forge-text-primary)',
          backgroundColor: 'var(--forge-bg-elevated)',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid var(--forge-border-default)',
          userSelect: revealed ? 'text' : 'none',
        }}
      >
        {revealed ? secret : masked}
      </code>
      <button
        onClick={() => setRevealed((r) => !r)}
        style={{ ...btnSmall, padding: '4px 8px' }}
        title={revealed ? 'Skryt' : 'Zobrazit'}
        aria-label={revealed ? 'Skryt secret' : 'Zobrazit secret'}
      >
        <Icon name={revealed ? 'EyeOff' : 'Eye'} size={13} />
      </button>
      <CopyButton
        text={secret}
        label="Kopirovat"
        copiedLabel="Skopirovano"
        style={{ padding: '4px 8px', fontSize: '11px' }}
      />
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        style={{
          ...btnSmall,
          padding: '4px 8px',
          borderColor: 'var(--forge-error)',
          color: 'var(--forge-error)',
          opacity: regenerating ? 0.6 : 1,
        }}
        title="Regenerovat secret (stary prestane fungovat)"
      >
        <Icon name={regenerating ? 'Loader2' : 'RefreshCw'} size={12} />
      </button>
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
        backgroundColor: isSuccess ? 'rgba(0, 212, 170, 0.08)' : 'rgba(255, 71, 87, 0.08)',
        border: `1px solid ${isSuccess ? 'rgba(0, 212, 170, 0.18)' : 'rgba(255, 71, 87, 0.18)'}`,
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
        style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: '2px', display: 'flex' }}
        aria-label="Zavrit"
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}

// ─── Webhook Card ────────────────────────────────────────────

function WebhookCard({
  webhook,
  onTest,
  onDelete,
  onToggleActive,
  onEdit,
  onRegenerate,
  testResult,
  testingId,
  clearTestResult,
  cs = true,
  t,
}) {
  const isTesting = testingId === webhook.id;
  const lastTriggered = webhook.deliveries?.length
    ? new Date(webhook.deliveries[0].timestamp).toLocaleString(cs ? 'cs-CZ' : 'en-US')
    : null;
  const safeT = t || ((key, fallback) => fallback || key);

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: URL + metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {(webhook.events || []).map((ev) => (
              <EventBadge key={ev} eventKey={ev} />
            ))}
          </div>

          {/* Metadata row */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={sectionLabel}>
              Vytvoreno:{' '}
              {webhook.createdAt
                ? new Date(webhook.createdAt).toLocaleDateString('cs-CZ')
                : '\u2014'}
            </span>
            {lastTriggered && (
              <span style={sectionLabel}>
                {safeT('admin.webhooks.lastActivity', cs ? 'Posledni aktivita' : 'Last activity')}: {lastTriggered}
              </span>
            )}
          </div>

          {/* Success rate */}
          {webhook.deliveries && webhook.deliveries.length > 0 && (
            <div style={{ maxWidth: 200, marginTop: '8px' }}>
              <span style={{ ...sectionLabel, marginBottom: '4px' }}>{safeT('admin.webhooks.deliverySuccessRate', cs ? 'Uspesnost doruceni' : 'Delivery success rate')}</span>
              <SuccessRateBar deliveries={webhook.deliveries} />
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            style={btnSmall}
            onClick={() => onToggleActive(webhook)}
            title={webhook.active !== false ? safeT('admin.webhooks.deactivate', cs ? 'Deaktivovat' : 'Deactivate') : safeT('admin.webhooks.activate', cs ? 'Aktivovat' : 'Activate')}
          >
            <Icon name={webhook.active !== false ? 'Pause' : 'Play'} size={14} />
          </button>
          <button
            style={btnSmall}
            onClick={() => onEdit(webhook)}
            title={safeT('admin.webhooks.editWebhook', cs ? 'Upravit webhook' : 'Edit webhook')}
          >
            <Icon name="Pencil" size={14} />
          </button>
          <button
            style={btnSmall}
            onClick={() => onTest(webhook.id)}
            disabled={isTesting}
            title={safeT('admin.webhooks.sendTestEvent', cs ? 'Odeslat testovaci udalost' : 'Send test event')}
          >
            <Icon name={isTesting ? 'Loader2' : 'Send'} size={14} />
            {isTesting ? 'Test...' : 'Test'}
          </button>
          <button
            style={{ ...btnSmall, borderColor: 'var(--forge-error)', color: 'var(--forge-error)' }}
            onClick={() => onDelete(webhook)}
            title={safeT('admin.webhooks.deleteWebhook', cs ? 'Smazat webhook' : 'Delete webhook')}
          >
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      {/* Secret display */}
      {webhook.secret && (
        <div style={{ marginTop: '16px' }}>
          <span style={sectionLabel}>Webhook Secret</span>
          <SecretDisplay
            secret={webhook.secret}
            webhookId={webhook.id}
            onRegenerate={onRegenerate}
          />
        </div>
      )}

      {/* Test result flash */}
      {testResult && testResult.webhookId === webhook.id && (
        <TestResultFlash result={testResult} onDismiss={() => clearTestResult()} />
      )}

      {/* Delivery log preview (last 3) */}
      {webhook.deliveries && webhook.deliveries.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <span style={sectionLabel}>Posledni doruceni</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {webhook.deliveries.slice(0, 3).map((d, i) => (
              <DeliveryRow key={d.id || i} delivery={d} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Delivery Row ────────────────────────────────────────────

function DeliveryRow({ delivery, compact, onRetry, onViewPayload, retryingId }) {
  const date = delivery.timestamp
    ? new Date(delivery.timestamp).toLocaleString('cs-CZ')
    : '\u2014';
  const isSuccess = delivery.statusCode >= 200 && delivery.statusCode < 300;
  const isRetrying = retryingId === delivery.id;

  if (compact) {
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
          gap: '12px',
        }}
      >
        <span style={{ color: 'var(--forge-text-muted)', minWidth: 120 }}>{date}</span>
        <EventBadge eventKey={delivery.event || '\u2014'} />
        <HttpStatusBadge code={delivery.statusCode} />
        {delivery.responseTime != null && (
          <span style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>
            {delivery.responseTime}ms
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        borderRadius: 'var(--forge-radius-sm, 8px)',
        backgroundColor: 'var(--forge-bg-elevated)',
        fontSize: '12px',
        fontFamily: 'var(--forge-font-tech)',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: 'var(--forge-text-muted)', minWidth: 130 }}>{date}</span>
      <EventBadge eventKey={delivery.event || '\u2014'} />
      <span
        style={{
          color: 'var(--forge-text-muted)',
          fontSize: '11px',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 80,
        }}
      >
        {delivery.url || ''}
      </span>
      <HttpStatusBadge code={delivery.statusCode} />
      {delivery.responseTime != null && (
        <span style={{ color: 'var(--forge-text-muted)', fontSize: '11px', minWidth: 45, textAlign: 'right' }}>
          {delivery.responseTime}ms
        </span>
      )}
      <div style={{ display: 'flex', gap: '4px' }}>
        {onViewPayload && (
          <button
            onClick={() => onViewPayload(delivery)}
            style={{ ...btnSmall, padding: '3px 8px' }}
            title="Zobrazit payload"
          >
            <Icon name="Code" size={12} />
          </button>
        )}
        {!isSuccess && onRetry && (
          <button
            onClick={() => onRetry(delivery)}
            disabled={isRetrying}
            style={{
              ...btnSmall,
              padding: '3px 8px',
              borderColor: 'var(--forge-accent-primary)',
              color: 'var(--forge-accent-primary)',
              opacity: isRetrying ? 0.6 : 1,
            }}
            title="Znovu odeslat"
          >
            <Icon name={isRetrying ? 'Loader2' : 'RotateCcw'} size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Payload Detail Modal ────────────────────────────────────

function PayloadModal({ delivery, onClose }) {
  if (!delivery) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...cardStyle,
          maxWidth: 680,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          margin: 0,
          animation: 'forge-fade-in 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--forge-font-heading)',
              fontSize: '16px',
              color: 'var(--forge-text-primary)',
            }}
          >
            Detail doruceni
          </h3>
          <button
            onClick={onClose}
            style={{ ...btnSmall, padding: '4px 8px' }}
            aria-label="Zavrit"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <EventBadge eventKey={delivery.event || '\u2014'} />
          <HttpStatusBadge code={delivery.statusCode} />
          {delivery.responseTime != null && (
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)',
              }}
            >
              {delivery.responseTime}ms
            </span>
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <span style={sectionLabel}>URL</span>
          <code
            style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '12px',
              color: 'var(--forge-text-primary)',
              wordBreak: 'break-all',
            }}
          >
            {delivery.url || '\u2014'}
          </code>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={sectionLabel}>Request payload</span>
            {delivery.payload && (
              <CopyButton
                text={JSON.stringify(delivery.payload, null, 2)}
                label="Kopirovat"
                copiedLabel="Skopirovano"
                style={{ padding: '2px 8px', fontSize: '10px' }}
              />
            )}
          </div>
          <pre style={codeBlockStyle}>
            {delivery.payload
              ? JSON.stringify(delivery.payload, null, 2)
              : 'Payload neni k dispozici'}
          </pre>
        </div>

        {delivery.responseBody && (
          <div>
            <span style={sectionLabel}>Response body</span>
            <pre style={codeBlockStyle}>
              {typeof delivery.responseBody === 'string'
                ? delivery.responseBody
                : JSON.stringify(delivery.responseBody, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add/Edit Webhook Form ──────────────────────────────────

function WebhookForm({ onSubmit, onCancel, saving, initial }) {
  const isEdit = !!initial;
  const [url, setUrl] = useState(initial?.url || '');
  const [events, setEvents] = useState(initial?.events || []);
  const [secret, setSecret] = useState(initial?.secret || '');
  const [urlError, setUrlError] = useState('');

  const toggleEvent = (key) => {
    setEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  const selectGroup = (group) => {
    const groupEvents = AVAILABLE_EVENTS.filter((e) => e.group === group).map((e) => e.key);
    const allSelected = groupEvents.every((k) => events.includes(k));
    if (allSelected) {
      setEvents((prev) => prev.filter((e) => !groupEvents.includes(e)));
    } else {
      setEvents((prev) => [...new Set([...prev, ...groupEvents])]);
    }
  };

  const handleGenerateSecret = () => {
    setSecret('whsec_' + generateId().replace(/-/g, ''));
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
      // Block private/reserved IP addresses (SSRF prevention)
      const host = parsed.hostname.toLowerCase();
      const privatePatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^0\./,
        /^\[::1\]$/,
        /^\[fe80:/i,
        /^\[fc00:/i,
        /^\[fd/i,
      ];
      if (privatePatterns.some(p => p.test(host))) {
        setUrlError('Privatni/rezervovane IP adresy nejsou povoleny');
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
      ...(isEdit ? { id: initial.id } : {}),
      url: url.trim(),
      events,
      secret: secret.trim() || undefined,
    });
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Icon
          name={isEdit ? 'Pencil' : 'Plus'}
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
          {isEdit ? 'Upravit webhook' : 'Novy webhook'}
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
              borderColor: urlError ? 'var(--forge-error, #EF4444)' : 'var(--forge-border-default)',
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

        {/* Events by group */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Udalosti *</label>
          {EVENT_GROUPS.map((group) => {
            const groupEvents = AVAILABLE_EVENTS.filter((e) => e.group === group);
            const allChecked = groupEvents.every((e) => events.includes(e.key));
            const someChecked = groupEvents.some((e) => events.includes(e.key));
            return (
              <div key={group} style={{ marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => selectGroup(group)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    padding: '2px 0',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '3px',
                      border: `2px solid ${allChecked ? 'var(--forge-accent-primary)' : 'var(--forge-border-active)'}`,
                      backgroundColor: allChecked ? 'var(--forge-accent-primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {allChecked && <Icon name="Check" size={10} style={{ color: 'var(--forge-bg-void)' }} />}
                    {!allChecked && someChecked && (
                      <span
                        style={{
                          width: 8,
                          height: 2,
                          backgroundColor: 'var(--forge-accent-primary)',
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--forge-font-body)',
                      fontWeight: 600,
                      color: 'var(--forge-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {group}
                  </span>
                </button>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '6px',
                    paddingLeft: '24px',
                  }}
                >
                  {groupEvents.map((ev) => {
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
                          padding: '8px 12px',
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
                            width: 16,
                            height: 16,
                            borderRadius: '3px',
                            border: `2px solid ${checked ? ev.color : 'var(--forge-border-active)'}`,
                            backgroundColor: checked ? ev.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 150ms ease-out',
                          }}
                        >
                          {checked && <Icon name="Check" size={10} style={{ color: 'var(--forge-bg-void)' }} />}
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
                              marginTop: '1px',
                            }}
                          >
                            {ev.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-body)',
                marginTop: '2px',
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
            <button type="button" onClick={handleGenerateSecret} style={btnOutline} title="Vygenerovat secret">
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
            Secret slouzi k overeni podpisu payloadu (HMAC-SHA256). Doporucujeme ho nastavit.
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
            {saving ? 'Ukladani...' : isEdit ? 'Ulozit zmeny' : 'Ulozit webhook'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
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
        <Icon name="Webhook" size={28} style={{ color: 'var(--forge-text-muted)' }} />
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
        Webhooky umoznuji automaticky odesilat notifikace na vasi URL adresu kdyz se v systemu stane
        urcita udalost (napr. nova objednavka, platba, faktura). Muzete je vyuzit pro integraci s
        vlastnimi systemy, CRM, Slack nebo dalsi automatizaci.
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
      <Icon name="AlertTriangle" size={20} style={{ color: 'var(--forge-error)', flexShrink: 0 }} />
      <span
        style={{ flex: 1, fontFamily: 'var(--forge-font-body)', fontSize: '14px', color: 'var(--forge-text-primary)' }}
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

// ─── Deliveries Tab ──────────────────────────────────────────

function DeliveriesTab({ webhooks, onRetry, retryingId }) {
  const [selectedPayload, setSelectedPayload] = useState(null);

  const allDeliveries = useMemo(() => {
    const all = [];
    (webhooks || []).forEach((wh) => {
      (wh.deliveries || []).forEach((d) => {
        all.push({ ...d, webhookUrl: wh.url, webhookId: wh.id });
      });
    });
    return all.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [webhooks]);

  if (allDeliveries.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <Icon name="Inbox" size={32} style={{ color: 'var(--forge-text-muted)', marginBottom: '12px' }} />
        <p
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '14px',
            color: 'var(--forge-text-muted)',
            margin: 0,
          }}
        >
          Zatim zadna doruceni. Doruceni se zobrazi po odeslani prvni udalosti.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--forge-font-heading)',
              fontSize: '16px',
              color: 'var(--forge-text-primary)',
            }}
          >
            Log doruceni
          </h3>
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
            }}
          >
            {allDeliveries.length} zaznam{allDeliveries.length === 1 ? '' : allDeliveries.length < 5 ? 'y' : 'u'}
          </span>
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 14px',
            fontSize: '10px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            gap: '12px',
            marginBottom: '4px',
          }}
        >
          <span style={{ minWidth: 130 }}>Cas</span>
          <span style={{ minWidth: 100 }}>Udalost</span>
          <span style={{ flex: 1, minWidth: 80 }}>URL</span>
          <span style={{ minWidth: 50 }}>Status</span>
          <span style={{ minWidth: 45, textAlign: 'right' }}>Doba</span>
          <span style={{ minWidth: 60 }}>Akce</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {allDeliveries.map((d, i) => (
            <DeliveryRow
              key={d.id || i}
              delivery={{ ...d, url: d.webhookUrl }}
              onRetry={(del) => onRetry(d.webhookId, del.id)}
              onViewPayload={setSelectedPayload}
              retryingId={retryingId}
            />
          ))}
        </div>
      </div>

      <PayloadModal
        delivery={selectedPayload}
        onClose={() => setSelectedPayload(null)}
      />
    </>
  );
}

// ─── Documentation Tab ──────────────────────────────────────

function DocsTab() {
  const [selectedEvent, setSelectedEvent] = useState('order.created');

  return (
    <div>
      {/* Authentication */}
      <div style={cardStyle}>
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            color: 'var(--forge-text-primary)',
          }}
        >
          Overeni podpisu (HMAC-SHA256)
        </h3>
        <p
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 16px',
          }}
        >
          Kazdy webhook request obsahuje hlavicku{' '}
          <code
            style={{
              fontFamily: 'var(--forge-font-tech)',
              backgroundColor: 'var(--forge-bg-elevated)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            X-Webhook-Signature
          </code>{' '}
          s HMAC-SHA256 podpisem tela requestu. Pouzijte svuj webhook secret k overeni, ze request pochazi z ModelPricer.
        </p>

        <span style={sectionLabel}>Node.js</span>
        {/* Intentional example code shown to users — console.log below is part of the displayed Node.js snippet, not runtime logging */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <pre style={codeBlockStyle}>{`const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express middleware
app.post('/webhooks/model-pricer', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Zpracovat udalost
  const { event, data } = req.body;
  console.log('Webhook event:', event, data);
  res.status(200).json({ received: true });
});`}</pre>
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <CopyButton
              text={`const crypto = require('crypto');\n\nfunction verifyWebhookSignature(body, signature, secret) {\n  const expected = crypto\n    .createHmac('sha256', secret)\n    .update(body, 'utf8')\n    .digest('hex');\n  return crypto.timingSafeEqual(\n    Buffer.from(signature),\n    Buffer.from(expected)\n  );\n}`}
              label="Kopirovat"
              copiedLabel="Skopirovano"
            />
          </div>
        </div>

        <span style={sectionLabel}>Python</span>
        <div style={{ position: 'relative' }}>
          <pre style={codeBlockStyle}>{`import hmac
import hashlib

def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

# Flask example
@app.route('/webhooks/model-pricer', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature', '')
    if not verify_webhook(request.data, signature, WEBHOOK_SECRET):
        return jsonify({'error': 'Invalid signature'}), 401

    event = request.json
    print(f"Event: {event['event']}")
    return jsonify({'received': True}), 200`}</pre>
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <CopyButton
              text={`import hmac\nimport hashlib\n\ndef verify_webhook(body: bytes, signature: str, secret: str) -> bool:\n    expected = hmac.new(\n        secret.encode('utf-8'),\n        body,\n        hashlib.sha256\n    ).hexdigest()\n    return hmac.compare_digest(signature, expected)`}
              label="Kopirovat"
              copiedLabel="Skopirovano"
            />
          </div>
        </div>
      </div>

      {/* Payload examples */}
      <div style={cardStyle}>
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            color: 'var(--forge-text-primary)',
          }}
        >
          Priklady payloadu
        </h3>
        <p
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 16px',
          }}
        >
          Kazdy webhook request je POST s JSON telem obsahujicim pole{' '}
          <code style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px' }}>event</code>,{' '}
          <code style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px' }}>timestamp</code> a{' '}
          <code style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px' }}>data</code>.
        </p>

        {/* Event selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {AVAILABLE_EVENTS.map((ev) => (
            <button
              key={ev.key}
              onClick={() => setSelectedEvent(ev.key)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 500,
                border: `1px solid ${selectedEvent === ev.key ? ev.color + '60' : 'var(--forge-border-default)'}`,
                backgroundColor: selectedEvent === ev.key ? ev.color + '15' : 'transparent',
                color: selectedEvent === ev.key ? ev.color : 'var(--forge-text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
            >
              {ev.key}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <pre style={codeBlockStyle}>
            {JSON.stringify(PAYLOAD_EXAMPLES[selectedEvent], null, 2)}
          </pre>
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <CopyButton
              text={JSON.stringify(PAYLOAD_EXAMPLES[selectedEvent], null, 2)}
              label="Kopirovat"
              copiedLabel="Skopirovano"
            />
          </div>
        </div>
      </div>

      {/* HTTP Headers */}
      <div style={cardStyle}>
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            color: 'var(--forge-text-primary)',
          }}
        >
          HTTP hlavicky
        </h3>
        <p
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 16px',
          }}
        >
          Kazdy webhook request obsahuje nasledujici hlavicky:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { header: 'Content-Type', value: 'application/json', desc: 'Telo requestu je vzdy JSON' },
            { header: 'X-Webhook-Signature', value: 'sha256=...', desc: 'HMAC-SHA256 podpis tela requestu' },
            { header: 'X-Webhook-Id', value: 'whd_abc123', desc: 'Unikatni ID doruceni (pro deduplikaci)' },
            { header: 'X-Webhook-Event', value: 'order.created', desc: 'Typ udalosti' },
            { header: 'User-Agent', value: 'ModelPricer-Webhook/1.0', desc: 'Identifikace serveru' },
          ].map((h) => (
            <div
              key={h.header}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: 'var(--forge-radius-sm, 8px)',
                backgroundColor: 'var(--forge-bg-elevated)',
              }}
            >
              <code
                style={{
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '12px',
                  color: 'var(--forge-accent-primary)',
                  minWidth: 180,
                  flexShrink: 0,
                }}
              >
                {h.header}
              </code>
              <code
                style={{
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '12px',
                  color: 'var(--forge-text-muted)',
                  minWidth: 120,
                }}
              >
                {h.value}
              </code>
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-text-secondary)',
                }}
              >
                {h.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Best practices */}
      <div style={cardStyle}>
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            color: 'var(--forge-text-primary)',
          }}
        >
          Doporuceni
        </h3>
        <ul
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '13px',
            color: 'var(--forge-text-secondary)',
            lineHeight: 2,
            margin: 0,
            paddingLeft: '20px',
          }}
        >
          <li>Vzdy overujte podpis pred zpracovanim payloadu.</li>
          <li>
            Odpovezte{' '}
            <code style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '12px' }}>200</code> co nejdrive
            (do 5 sekund) a zpracujte data asynchronne.
          </li>
          <li>Implementujte idempotenci pomoci hlavicky X-Webhook-Id pro pripad opakoveho doruceni.</li>
          <li>Loggujte vsechny prijate webhooky pro debugging.</li>
          <li>Pouzijte HTTPS endpoint s platnym SSL certifikatem.</li>
          <li>Pri selhani doruceni se system pokusi webhook odeslat znovu az 3x s exponencialnim backoff.</li>
        </ul>
      </div>
    </div>
  );
}

// =============================================================
// AdminWebhooks — Main Component
// =============================================================

export default function AdminWebhooks() {
  useDocumentTitle('Webhooks | Admin');
  const { language, t } = useLanguage();
  const cs = language === 'cs';

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [activeTab, setActiveTab] = useState('webhooks');

  // ─── Load webhooks ──────────────────────────────────────────

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWebhooks();
      const list = Array.isArray(data) ? data : (data?.data || data?.webhooks || []);
      setWebhooks(list);
    } catch (err) {
      debug('AdminWebhooks: fetch error', err);
      setError(
        err?.response?.data?.message || err?.message || 'Nepodarilo se nacist webhooky. Zkontrolujte pripojeni.'
      );
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // ─── Create / Update webhook ───────────────────────────────

  const handleSubmit = useCallback(
    async (config) => {
      setSaving(true);
      try {
        if (config.id) {
          await updateWebhook(config.id, config);
        } else {
          await createWebhook(config);
        }
        setShowForm(false);
        setEditingWebhook(null);
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: save error', err);
        setError(err?.response?.data?.message || err?.message || 'Nepodarilo se ulozit webhook.');
      } finally {
        setSaving(false);
      }
    },
    [fetchWebhooks]
  );

  // ─── Toggle active ────────────────────────────────────────

  const handleToggleActive = useCallback(
    async (webhook) => {
      try {
        await updateWebhook(webhook.id, { active: webhook.active === false });
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: toggle error', err);
        setError(err?.response?.data?.message || err?.message || 'Nepodarilo se zmenit stav webhoku.');
      }
    },
    [fetchWebhooks]
  );

  // ─── Edit webhook ─────────────────────────────────────────

  const handleEdit = useCallback((webhook) => {
    setEditingWebhook(webhook);
    setShowForm(true);
  }, []);

  // ─── Delete webhook ───────────────────────────────────────

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
        setError(err?.response?.data?.message || err?.message || 'Nepodarilo se smazat webhook.');
      }
    },
    [confirm, fetchWebhooks]
  );

  // ─── Test webhook ─────────────────────────────────────────

  const handleTest = useCallback(
    async (webhookId) => {
      setTestingId(webhookId);
      setTestResult(null);
      try {
        const data = await testWebhook(webhookId);
        setTestResult({
          webhookId,
          success: true,
          message: data?.message || `Test uspesny \u2014 odpoved ${data?.statusCode || 200}`,
        });
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: test error', err);
        setTestResult({
          webhookId,
          success: false,
          message:
            err?.response?.data?.message || err?.message || 'Testovaci udalost selhala. Zkontrolujte endpoint.',
        });
      } finally {
        setTestingId(null);
      }
    },
    [fetchWebhooks]
  );

  // ─── Retry delivery ──────────────────────────────────────

  const handleRetry = useCallback(
    async (webhookId, deliveryId) => {
      setRetryingId(deliveryId);
      try {
        await retryDelivery(webhookId, deliveryId);
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: retry error', err);
        setError(err?.response?.data?.message || err?.message || 'Nepodarilo se znovu odeslat.');
      } finally {
        setRetryingId(null);
      }
    },
    [fetchWebhooks]
  );

  // ─── Regenerate secret ────────────────────────────────────

  const handleRegenerate = useCallback(
    async (webhookId) => {
      const ok = await confirm({
        title: 'Regenerovat secret?',
        message:
          'Stary secret prestane okamzite fungovat. Budete muset aktualizovat secret na vasem endpointu. Pokracovat?',
        confirmLabel: 'Regenerovat',
        cancelLabel: 'Zrusit',
        destructive: true,
      });
      if (!ok) return;

      try {
        await regenerateSecret(webhookId);
        await fetchWebhooks();
      } catch (err) {
        debug('AdminWebhooks: regenerate error', err);
        setError(err?.response?.data?.message || err?.message || 'Nepodarilo se regenerovat secret.');
      }
    },
    [confirm, fetchWebhooks]
  );

  // ─── Render ───────────────────────────────────────────────

  const isFormVisible = showForm && !loading;

  return (
    <div style={{ maxWidth: '960px' }}>
      <ForgePageHeader
        title="Webhooky"
        breadcrumb="ADMIN / WEBHOOKS"
        actions={
          !isFormVisible &&
          !loading && (
            <button
              onClick={() => {
                setEditingWebhook(null);
                setShowForm(true);
              }}
              style={btnPrimary}
            >
              <Icon name="Plus" size={16} />
              Pridat webhook
            </button>
          )
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          marginTop: '20px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--forge-border-default)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--forge-accent-primary)' : 'transparent'}`,
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
              fontSize: '13px',
              fontFamily: 'var(--forge-font-body)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              marginBottom: '-1px',
            }}
          >
            <Icon name={tab.icon} size={15} />
            {tab.label}
            {tab.key === 'webhooks' && webhooks.length > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--forge-font-tech)',
                  backgroundColor: 'var(--forge-bg-elevated)',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  color: 'var(--forge-text-muted)',
                }}
              >
                {webhooks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={fetchWebhooks} />}

      {/* Loading state */}
      {loading && <SkeletonTable rows={3} columns={3} />}

      {/* ─── Webhooks Tab ─── */}
      {activeTab === 'webhooks' && !loading && (
        <>
          {/* Add/Edit form */}
          {isFormVisible && (
            <WebhookForm
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingWebhook(null);
              }}
              saving={saving}
              initial={editingWebhook}
            />
          )}

          {/* Webhook list */}
          {webhooks.length > 0 && (
            <div>
              {webhooks.map((wh) => (
                <WebhookCard
                  key={wh.id}
                  webhook={wh}
                  onTest={handleTest}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onEdit={handleEdit}
                  onRegenerate={handleRegenerate}
                  testResult={testResult}
                  testingId={testingId}
                  clearTestResult={() => setTestResult(null)}
                  cs={cs}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {webhooks.length === 0 && !error && !isFormVisible && (
            <EmptyState
              onAdd={() => {
                setEditingWebhook(null);
                setShowForm(true);
              }}
            />
          )}

          {/* Info card */}
          {webhooks.length > 0 && !isFormVisible && (
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
                style={{ color: 'var(--forge-text-muted)', flexShrink: 0, marginTop: '2px' }}
              />
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Webhook payloady jsou podepsany pomoci HMAC-SHA256 pokud je nastaven secret. Overujte podpis
                v hlavicce{' '}
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
                na vasem endpointu. Priklady kodu najdete v zalozce Dokumentace.
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Deliveries Tab ─── */}
      {activeTab === 'deliveries' && !loading && (
        <DeliveriesTab
          webhooks={webhooks}
          onRetry={handleRetry}
          retryingId={retryingId}
        />
      )}

      {/* ─── Docs Tab ─── */}
      {activeTab === 'docs' && !loading && <DocsTab />}

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

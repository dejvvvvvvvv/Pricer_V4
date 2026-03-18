import React, { useState } from 'react';
import Icon from '../../../../components/AppIcon';
import { useAuth } from '../../../../context/AuthContext';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!value) return null;

  return (
    <button
      onClick={handleCopy}
      type="button"
      title="Copy"
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        color: copied ? 'var(--forge-success)' : 'var(--forge-text-muted)',
        transition: 'color 120ms ease',
      }}
    >
      <Icon name={copied ? 'Check' : 'Copy'} size={14} />
    </button>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--forge-border-default)',
    }}>
      <div>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>{label}</span>
        <div style={{
          fontSize: '14px',
          fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-primary)',
          marginTop: '2px',
        }}>{value}</div>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

export default function TabCustomer({ order, onSaveNote, onUpdateOrders }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const [noteText, setNoteText] = useState('');
  const customer = order?.customer_snapshot || {};

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const note = {
      text: noteText.trim(),
      created_at: new Date().toISOString(),
      // TODO: replace with real user ID from auth system if available
      user_id: currentUser,
    };
    onSaveNote?.(note);
    setNoteText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Customer info */}
      <div>
        <InfoRow label="Name" value={customer.name} />
        <InfoRow label="Email" value={customer.email} />
        <InfoRow label="Phone" value={customer.phone} />
        <InfoRow label="Company" value={customer.company} />
      </div>

      {/* Company info (if business purchase) */}
      {order?.is_company_purchase && order?.company_info && (
        <div>
          <h4 style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>Firemni udaje</h4>
          <div style={{
            padding: '16px',
            background: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm)',
            border: '1px solid var(--forge-border-default)',
          }}>
            <InfoRow label="Firma" value={order.company_info.name} />
            <InfoRow label="ICO" value={order.company_info.ico} />
            <InfoRow label="DIC" value={order.company_info.dic} />
          </div>
        </div>
      )}

      {/* Coupon info */}
      {order?.coupon_snapshot && order.coupon_snapshot.code && (
        <div>
          <h4 style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>Kupon</h4>
          <div style={{
            padding: '16px',
            background: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm)',
            border: '1px solid var(--forge-border-default)',
          }}>
            <InfoRow label="Kod" value={order.coupon_snapshot.code} />
            {order.coupon_snapshot.type && <InfoRow label="Typ" value={order.coupon_snapshot.type} />}
            {order.coupon_snapshot.discount != null && (
              <InfoRow label="Sleva" value={
                order.coupon_snapshot.type === 'PERCENT'
                  ? `${order.coupon_snapshot.discount}%`
                  : `${Number(order.coupon_snapshot.discount).toFixed(2)} Kc`
              } />
            )}
          </div>
        </div>
      )}

      {/* Payment info */}
      {(order?.payment_method || order?.payment_info) && (
        <div>
          <h4 style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>Platebni udaje</h4>
          <div style={{
            padding: '16px',
            background: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm)',
            border: '1px solid var(--forge-border-default)',
          }}>
            {order.payment_method && <InfoRow label="Zpusob platby" value={order.payment_method} />}
            {order.payment_info?.variable_symbol && <InfoRow label="Variabilni symbol" value={order.payment_info.variable_symbol} />}
            {order.payment_info?.bank_account?.account_number && <InfoRow label="Cislo uctu" value={order.payment_info.bank_account.account_number} />}
            {order.payment_info?.bank_account?.iban && <InfoRow label="IBAN" value={order.payment_info.bank_account.iban} />}
            {order.payment_info?.due_date && (
              <InfoRow label="Splatnost" value={new Date(order.payment_info.due_date).toLocaleDateString('cs-CZ')} />
            )}
          </div>
        </div>
      )}

      {/* Internal notes */}
      <div>
        <h4 style={{
          fontSize: '12px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}>Internal Notes</h4>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            style={{
              flex: 1,
              background: 'var(--forge-bg-elevated)',
              border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-md)',
              padding: '8px 12px',
              fontSize: '13px',
              fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-text-primary)',
              resize: 'vertical',
              minHeight: '60px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={!noteText.trim()}
            style={{
              alignSelf: 'flex-end',
              padding: '8px 14px',
              borderRadius: 'var(--forge-radius-md)',
              border: '1px solid var(--forge-accent-primary)',
              background: noteText.trim() ? 'var(--forge-accent-primary)' : 'var(--forge-bg-elevated)',
              color: noteText.trim() ? '#08090C' : 'var(--forge-text-muted)',
              fontFamily: 'var(--forge-font-body)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: noteText.trim() ? 'pointer' : 'default',
              opacity: noteText.trim() ? 1 : 0.5,
            }}
          >
            Save
          </button>
        </div>

        {/* Existing notes */}
        {(order?.notes || []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(order.notes).map((note, idx) => (
              <div key={note.id || note.created_at || idx} style={{
                padding: '8px 12px',
                background: 'var(--forge-bg-elevated)',
                borderRadius: 'var(--forge-radius-sm)',
                borderLeft: '3px solid var(--forge-accent-primary)',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', margin: 0 }}>
                  {note.text}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', marginTop: '4px', margin: '4px 0 0' }}>
                  {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity log */}
      <div>
        <h4 style={{
          fontSize: '12px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}>Activity</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(order?.activity || []).map((entry, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0',
              borderBottom: idx < (order.activity.length - 1) ? '1px solid var(--forge-border-default)' : 'none',
            }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)',
                minWidth: '130px',
              }}>
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString('cs-CZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
              </span>
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--forge-font-body)',
                color: 'var(--forge-text-secondary)',
              }}>
                {entry.type} {entry.payload?.status ? `→ ${entry.payload.status}` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

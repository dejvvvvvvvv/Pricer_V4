// Admin Customers — derived from Orders data
// ---------------------------------------------
// Scope: /admin/customers only
// - Extracts unique customers from orders (by email)
// - Shows: avatar, name, email, phone, segment, order count, total spent, last order
// - Sortable, searchable, filterable by segment, expandable detail rows
// - Customer segments: Novy, Pravideln (5+), VIP (10+ orders or 10k+ spent)
// - Customer notes (tenant-scoped via storage helpers)
// - CSV export
// - Contact info with copy buttons
// - Stats cards: total customers, new this month, avg LTV, repeat rate

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Icon from '../../components/AppIcon';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import { CopyButton } from '../../components/ui/forge/CopyButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useSortableData } from '../../hooks/useSortableData';
import { readTenantJson, writeTenantJson } from '../../utils/adminTenantStorage';
import { exportCSV } from '../../utils/exportData';
import {
  loadOrders,
  computeOrderTotals,
  extractOrderMaterials,
  getStatusLabel,
  round2,
} from '../../utils/adminOrdersStorage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CUSTOMER_NOTES_NS = 'customer-notes:v1';

const SEGMENTS = {
  NEW: 'NEW',
  REGULAR: 'REGULAR',
  VIP: 'VIP',
};

const SEGMENT_CONFIG = {
  [SEGMENTS.NEW]: {
    labelCs: 'Novy',
    labelEn: 'New',
    color: '#60A5FA',
    icon: 'UserPlus',
  },
  [SEGMENTS.REGULAR]: {
    labelCs: 'Pravideln',
    labelEn: 'Regular',
    color: '#F0A030',
    icon: 'Users',
  },
  [SEGMENTS.VIP]: {
    labelCs: 'VIP',
    labelEn: 'VIP',
    color: '#A78BFA',
    icon: 'Crown',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(amount) {
  return `${round2(amount).toFixed(2)} Kc`;
}

function formatDate(iso, locale = 'cs-CZ') {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso || '--';
  }
}

/** Get the first letter(s) for avatar placeholder */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

/** Compute start of current month as ISO */
function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Determine customer segment */
function getSegment(orderCount, totalSpent) {
  if (orderCount >= 10 || totalSpent >= 10000) return SEGMENTS.VIP;
  if (orderCount >= 5) return SEGMENTS.REGULAR;
  return SEGMENTS.NEW;
}

/** Load customer notes from tenant storage */
function loadCustomerNotes() {
  return readTenantJson(CUSTOMER_NOTES_NS, {});
}

/** Save customer notes to tenant storage */
function saveCustomerNotes(notes) {
  writeTenantJson(CUSTOMER_NOTES_NS, notes);
}

// ---------------------------------------------------------------------------
// Customer aggregation from orders
// ---------------------------------------------------------------------------

function aggregateCustomers(orders) {
  const map = new Map(); // key = email (lowercase)

  for (const order of orders) {
    const snap = order.customer_snapshot;
    if (!snap?.email) continue;

    const key = snap.email.toLowerCase().trim();
    const totals = computeOrderTotals(order);
    const materials = extractOrderMaterials(order);

    if (!map.has(key)) {
      map.set(key, {
        email: snap.email,
        name: snap.name || '',
        phone: snap.phone || '',
        orders: [],
        totalSpent: 0,
        materials: {},
        firstOrderDate: order.created_at || order.date,
        lastOrderDate: order.created_at || order.date,
      });
    }

    const cust = map.get(key);
    // Update name/phone if we have better data
    if (!cust.name && snap.name) cust.name = snap.name;
    if (!cust.phone && snap.phone) cust.phone = snap.phone;

    cust.orders.push({
      id: order.id,
      order_number: order.order_number || order.id?.slice(0, 8),
      status: order.status,
      date: order.created_at || order.date,
      total: totals.total,
      pieces: totals.sum_pieces,
      materials,
    });

    cust.totalSpent += totals.total;

    // Track material frequency
    for (const mat of materials) {
      cust.materials[mat] = (cust.materials[mat] || 0) + 1;
    }

    // Track date range
    const orderDate = order.created_at || order.date;
    if (orderDate && orderDate < cust.firstOrderDate) cust.firstOrderDate = orderDate;
    if (orderDate && orderDate > cust.lastOrderDate) cust.lastOrderDate = orderDate;
  }

  // Convert to array with computed fields
  const monthStart = startOfMonth();
  return Array.from(map.values()).map((c) => {
    const orderCount = c.orders.length;
    const avgOrder = orderCount > 0 ? round2(c.totalSpent / orderCount) : 0;

    // Favorite material
    let favMaterial = '--';
    let maxMatCount = 0;
    for (const [mat, count] of Object.entries(c.materials)) {
      if (count > maxMatCount) {
        maxMatCount = count;
        favMaterial = mat;
      }
    }

    // Order frequency (avg days between orders)
    let orderFrequency = null;
    if (orderCount >= 2) {
      const firstMs = new Date(c.firstOrderDate).getTime();
      const lastMs = new Date(c.lastOrderDate).getTime();
      const diffDays = (lastMs - firstMs) / (1000 * 60 * 60 * 24);
      orderFrequency = Math.round(diffDays / (orderCount - 1));
    }

    // Is new this month?
    const isNewThisMonth = c.firstOrderDate >= monthStart;

    const totalSpent = round2(c.totalSpent);
    const segment = getSegment(orderCount, totalSpent);

    return {
      email: c.email,
      name: c.name,
      phone: c.phone,
      orderCount,
      totalSpent,
      avgOrder,
      lastOrderDate: c.lastOrderDate,
      firstOrderDate: c.firstOrderDate,
      favMaterial,
      orderFrequency,
      isNewThisMonth,
      segment,
      orders: c.orders.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, sub, color = 'var(--forge-accent-primary)' }) {
  return (
    <div style={{
      flex: '1 1 200px',
      minWidth: 180,
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--forge-radius-sm)',
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
      }}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--forge-text-muted)',
          marginBottom: '4px',
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--forge-font-heading)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--forge-text-primary)',
          lineHeight: 1.1,
        }}>{value}</div>
        {sub && (
          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '12px',
            color: 'var(--forge-text-muted)',
            marginTop: '4px',
          }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = getInitials(name);
  // Generate consistent color from name
  let hash = 0;
  const str = name || '?';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const bg = `hsl(${hue}, 40%, 25%)`;
  const fg = `hsl(${hue}, 50%, 75%)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--forge-font-heading)',
        fontWeight: 700,
        fontSize: `${Math.round(size * 0.4)}px`,
        flexShrink: 0,
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function SegmentBadge({ segment, cs }) {
  const cfg = SEGMENT_CONFIG[segment];
  if (!cfg) return null;
  const label = cs ? cfg.labelCs : cfg.labelEn;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '10px',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
      color: cfg.color,
      border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`,
      whiteSpace: 'nowrap',
    }}>
      <Icon name={cfg.icon} size={10} />
      {label}
    </span>
  );
}

function SortableTh({ children, sortKey, currentSort, onSort, align = 'left' }) {
  const active = currentSort?.key === sortKey;
  const dir = active ? currentSort.direction : null;
  return (
    <th
      onClick={() => onSort(sortKey)}
      role="columnheader"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{
        textAlign: align,
        padding: '10px 12px',
        fontFamily: 'var(--forge-font-tech)',
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: active ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--forge-border-default)',
        transition: 'color 150ms',
        position: 'relative',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {children}
        {active && (
          <Icon
            name={dir === 'asc' ? 'ChevronUp' : 'ChevronDown'}
            size={12}
          />
        )}
      </span>
    </th>
  );
}

function CustomerNotes({ email, cs, notes, onSaveNote }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const currentNote = notes[email] || '';

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setDraft(currentNote);
    setEditing(true);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onSaveNote(email, draft.trim());
    setEditing(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditing(false);
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--forge-text-muted)',
        }}>
          <Icon name="StickyNote" size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {cs ? 'Poznamky' : 'Notes'}
        </span>
        {!editing && (
          <button
            onClick={handleStartEdit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 'var(--forge-radius-sm)',
              color: 'var(--forge-accent-primary)',
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Icon name={currentNote ? 'Pencil' : 'Plus'} size={10} />
            {currentNote
              ? (cs ? 'Upravit' : 'Edit')
              : (cs ? 'Pridat' : 'Add')}
          </button>
        )}
      </div>

      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={cs ? 'Napiste poznamku o zakaznikovi...' : 'Write a note about this customer...'}
            rows={3}
            style={{
              width: '100%',
              backgroundColor: 'var(--forge-bg-surface)',
              border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-sm)',
              padding: '8px 12px',
              color: 'var(--forge-text-primary)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--forge-accent-primary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--forge-border-default)';
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--forge-radius-sm)',
                border: 'none',
                backgroundColor: 'var(--forge-accent-primary)',
                color: '#fff',
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cs ? 'Ulozit' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--forge-radius-sm)',
                border: '1px solid var(--forge-border-default)',
                backgroundColor: 'transparent',
                color: 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cs ? 'Zrusit' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : currentNote ? (
        <div style={{
          padding: '10px 12px',
          backgroundColor: 'var(--forge-bg-surface)',
          borderRadius: 'var(--forge-radius-sm)',
          border: '1px solid var(--forge-border-default)',
          fontFamily: 'var(--forge-font-body)',
          fontSize: '13px',
          color: 'var(--forge-text-secondary)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}>
          {currentNote}
        </div>
      ) : null}
    </div>
  );
}

function CustomerDetailRow({ customer, cs, colSpan, notes, onSaveNote }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div style={{
          backgroundColor: 'var(--forge-bg-elevated)',
          borderBottom: '1px solid var(--forge-border-default)',
          padding: '16px 20px',
        }}>
          {/* Stats summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: 'var(--forge-bg-surface)',
            borderRadius: 'var(--forge-radius-sm)',
            border: '1px solid var(--forge-border-default)',
          }}>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Celkem objednavek' : 'Total orders'}</span>
              <span style={detailValueStyle}>{customer.orderCount}</span>
            </div>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Celkem utraceno' : 'Total spent'}</span>
              <span style={{ ...detailValueStyle, fontFamily: 'var(--forge-font-tech)', fontWeight: 700 }}>
                {formatMoney(customer.totalSpent)}
              </span>
            </div>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Prumerna objednavka' : 'Average order'}</span>
              <span style={{ ...detailValueStyle, fontFamily: 'var(--forge-font-tech)' }}>
                {formatMoney(customer.avgOrder)}
              </span>
            </div>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Oblibeny material' : 'Favorite material'}</span>
              <span style={detailValueStyle}>{customer.favMaterial}</span>
            </div>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Frekvence objednavek' : 'Order frequency'}</span>
              <span style={detailValueStyle}>
                {customer.orderFrequency != null
                  ? (cs ? `~${customer.orderFrequency} dni` : `~${customer.orderFrequency} days`)
                  : '--'}
              </span>
            </div>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Prvni objednavka' : 'First order'}</span>
              <span style={detailValueStyle}>{formatDate(customer.firstOrderDate)}</span>
            </div>
          </div>

          {/* Contact info with copy buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--forge-bg-surface)',
              borderRadius: 'var(--forge-radius-sm)',
              border: '1px solid var(--forge-border-default)',
            }}>
              <Icon name="Mail" size={14} style={{ color: 'var(--forge-text-muted)' }} />
              <span style={{
                fontFamily: 'var(--forge-font-body)',
                fontSize: '13px',
                color: 'var(--forge-text-primary)',
              }}>
                {customer.email}
              </span>
              <CopyButton
                text={customer.email}
                label={cs ? 'Kopirovat' : 'Copy'}
                copiedLabel={cs ? 'Zkopirovano!' : 'Copied!'}
                style={{ padding: '2px 4px', fontSize: '10px' }}
              />
            </div>

            {customer.phone && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--forge-bg-surface)',
                borderRadius: 'var(--forge-radius-sm)',
                border: '1px solid var(--forge-border-default)',
              }}>
                <Icon name="Phone" size={14} style={{ color: 'var(--forge-text-muted)' }} />
                <span style={{
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: '13px',
                  color: 'var(--forge-text-primary)',
                }}>
                  {customer.phone}
                </span>
                <CopyButton
                  text={customer.phone}
                  label={cs ? 'Kopirovat' : 'Copy'}
                  copiedLabel={cs ? 'Zkopirovano!' : 'Copied!'}
                  style={{ padding: '2px 4px', fontSize: '10px' }}
                />
              </div>
            )}
          </div>

          {/* Orders list */}
          <div style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--forge-text-muted)',
            marginBottom: '8px',
          }}>
            {cs ? 'Historie objednavek' : 'Order history'} ({customer.orders.length})
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {customer.orders.map((o) => (
              <div
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--forge-bg-surface)',
                  borderRadius: 'var(--forge-radius-sm)',
                  border: '1px solid var(--forge-border-default)',
                  fontSize: '13px',
                  fontFamily: 'var(--forge-font-body)',
                }}
              >
                <span style={{
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '12px',
                  color: 'var(--forge-text-secondary)',
                  minWidth: 80,
                }}>
                  #{o.order_number}
                </span>
                <span style={{ color: 'var(--forge-text-muted)', minWidth: 100 }}>
                  {formatDate(o.date)}
                </span>
                <StatusBadge status={o.status} cs={cs} />
                <span style={{ color: 'var(--forge-text-secondary)', minWidth: 60 }}>
                  {o.pieces} ks
                </span>
                <span style={{
                  color: 'var(--forge-text-muted)',
                  fontSize: '12px',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {o.materials.join(', ') || '--'}
                </span>
                <span style={{
                  fontFamily: 'var(--forge-font-tech)',
                  fontWeight: 700,
                  color: 'var(--forge-text-primary)',
                  minWidth: 90,
                  textAlign: 'right',
                }}>
                  {formatMoney(o.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Notes section */}
          <CustomerNotes
            email={customer.email}
            cs={cs}
            notes={notes}
            onSaveNote={onSaveNote}
          />
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status, cs }) {
  const colorMap = {
    NEW: 'var(--forge-accent-primary)',
    REVIEW: '#F0A030',
    APPROVED: 'var(--forge-accent-primary)',
    PRINTING: '#6C9AFF',
    POSTPROCESS: '#A78BFA',
    READY: '#00D4AA',
    SHIPPED: '#60A5FA',
    DONE: 'var(--forge-success)',
    CANCELED: 'var(--forge-error)',
  };
  const color = colorMap[status] || 'var(--forge-text-muted)';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '10px',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      color,
      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      whiteSpace: 'nowrap',
    }}>
      {getStatusLabel(status, cs ? 'cs' : 'en')}
    </span>
  );
}

function SegmentFilter({ value, onChange, counts, cs }) {
  const options = [
    { key: 'ALL', label: cs ? 'Vsechny' : 'All', count: counts.all },
    { key: SEGMENTS.NEW, label: cs ? 'Novy' : 'New', count: counts[SEGMENTS.NEW] || 0 },
    { key: SEGMENTS.REGULAR, label: cs ? 'Pravideln' : 'Regular', count: counts[SEGMENTS.REGULAR] || 0 },
    { key: SEGMENTS.VIP, label: 'VIP', count: counts[SEGMENTS.VIP] || 0 },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
    }}>
      {options.map((opt) => {
        const isActive = value === opt.key;
        const segCfg = SEGMENT_CONFIG[opt.key];
        const activeColor = segCfg?.color || 'var(--forge-accent-primary)';
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--forge-radius-sm)',
              border: `1px solid ${isActive ? activeColor : 'var(--forge-border-default)'}`,
              backgroundColor: isActive
                ? `color-mix(in srgb, ${activeColor} 12%, transparent)`
                : 'transparent',
              color: isActive ? activeColor : 'var(--forge-text-muted)',
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 150ms',
            }}
          >
            {opt.label}
            <span style={{
              fontSize: '10px',
              opacity: 0.7,
            }}>
              ({opt.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}

const detailLabelStyle = {
  display: 'block',
  fontFamily: 'var(--forge-font-tech)',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--forge-text-muted)',
  marginBottom: '2px',
};

const detailValueStyle = {
  display: 'block',
  fontFamily: 'var(--forge-font-body)',
  fontSize: '13px',
  color: 'var(--forge-text-primary)',
  fontWeight: 500,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminCustomers() {
  const { language } = useLanguage();
  const cs = language === 'cs';
  useDocumentTitle(cs ? 'Zakaznici — Admin' : 'Customers — Admin');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [customerNotes, setCustomerNotes] = useState({});

  // Load orders + notes
  useEffect(() => {
    try {
      const data = loadOrders();
      setOrders(data);
      setCustomerNotes(loadCustomerNotes());
    } catch (e) {
      console.error('[AdminCustomers] Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggregate customers from orders
  const customers = useMemo(() => aggregateCustomers(orders), [orders]);

  // Segment counts (before search filter)
  const segmentCounts = useMemo(() => {
    const counts = { all: customers.length };
    for (const c of customers) {
      counts[c.segment] = (counts[c.segment] || 0) + 1;
    }
    return counts;
  }, [customers]);

  // Search + segment filter
  const filtered = useMemo(() => {
    let result = customers;

    // Segment filter
    if (segmentFilter !== 'ALL') {
      result = result.filter((c) => c.segment === segmentFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }

    return result;
  }, [customers, search, segmentFilter]);

  // Sortable data
  const { sortedData, sortConfig, requestSort } = useSortableData(filtered, {
    key: 'totalSpent',
    direction: 'desc',
  });

  // Stats
  const stats = useMemo(() => {
    const total = customers.length;
    const newThisMonth = customers.filter((c) => c.isNewThisMonth).length;
    const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
    const avgLtv = total > 0 ? round2(totalSpentAll / total) : 0;
    const repeatCount = customers.filter((c) => c.orderCount > 1).length;
    const repeatRate = total > 0 ? Math.round((repeatCount / total) * 100) : 0;
    return { total, newThisMonth, avgLtv, repeatRate };
  }, [customers]);

  const toggleExpand = useCallback((email) => {
    setExpandedEmail((prev) => (prev === email ? null : email));
  }, []);

  const handleSaveNote = useCallback((email, noteText) => {
    setCustomerNotes((prev) => {
      const updated = { ...prev };
      if (noteText) {
        updated[email] = noteText;
      } else {
        delete updated[email];
      }
      saveCustomerNotes(updated);
      return updated;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    const data = sortedData.map((c) => ({
      name: c.name || '--',
      email: c.email,
      phone: c.phone || '--',
      segment: c.segment,
      orderCount: c.orderCount,
      totalSpent: round2(c.totalSpent),
    }));

    const columns = [
      { key: 'name', label: cs ? 'Jmeno' : 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: cs ? 'Telefon' : 'Phone' },
      { key: 'segment', label: 'Segment' },
      { key: 'orderCount', label: cs ? 'Pocet objednavek' : 'Order count' },
      { key: 'totalSpent', label: cs ? 'Celkem utraceno (Kc)' : 'Total spent (Kc)' },
    ];

    const now = new Date().toISOString().slice(0, 10);
    exportCSV(data, `zakaznici-${now}.csv`, columns);
  }, [sortedData, cs]);

  // Table column count for colSpan
  const COL_COUNT = 8;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--forge-text-muted)' }}>
        <Icon name="Loader2" size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '12px', fontFamily: 'var(--forge-font-body)', fontSize: '14px' }}>
          {cs ? 'Nacitam zakazniky...' : 'Loading customers...'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <ForgePageHeader
        title={cs ? 'Zakaznici' : 'Customers'}
        breadcrumb={cs ? 'ADMIN / ZAKAZNICI' : 'ADMIN / CUSTOMERS'}
      />

      {/* Stats cards */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        marginTop: '24px',
        marginBottom: '24px',
      }}>
        <StatCard
          icon="Users"
          label={cs ? 'Celkem zakazniku' : 'Total customers'}
          value={stats.total}
        />
        <StatCard
          icon="UserPlus"
          label={cs ? 'Novych tento mesic' : 'New this month'}
          value={stats.newThisMonth}
          color="#60A5FA"
        />
        <StatCard
          icon="TrendingUp"
          label={cs ? 'Prumerna hodnota zakaznika' : 'Avg. lifetime value'}
          value={formatMoney(stats.avgLtv)}
          color="#F0A030"
        />
        <StatCard
          icon="Repeat"
          label={cs ? 'Vracejici se zakaznici' : 'Repeat customer rate'}
          value={`${stats.repeatRate}%`}
          sub={cs
            ? `${customers.filter((c) => c.orderCount > 1).length} z ${stats.total}`
            : `${customers.filter((c) => c.orderCount > 1).length} of ${stats.total}`}
          color="#A78BFA"
        />
      </div>

      {/* Toolbar: Search + Segment filter + Export */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-sm)',
          padding: '8px 12px',
          flex: '1 1 250px',
          maxWidth: 360,
        }}>
          <Icon name="Search" size={16} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={cs ? 'Hledat jmeno, email, telefon...' : 'Search name, email, phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={cs ? 'Hledat zakazniky' : 'Search customers'}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--forge-text-primary)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              width: '100%',
              padding: 0,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label={cs ? 'Vymazat hledani' : 'Clear search'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                color: 'var(--forge-text-muted)',
              }}
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>

        {/* Segment filter */}
        <SegmentFilter
          value={segmentFilter}
          onChange={setSegmentFilter}
          counts={segmentCounts}
          cs={cs}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Export button */}
        {customers.length > 0 && (
          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--forge-radius-sm)',
              border: '1px solid var(--forge-border-default)',
              backgroundColor: 'var(--forge-bg-surface)',
              color: 'var(--forge-text-secondary)',
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            title={cs ? 'Exportovat jako CSV' : 'Export as CSV'}
          >
            <Icon name="Download" size={14} />
            {cs ? 'Export CSV' : 'Export CSV'}
          </button>
        )}

        {/* Result count */}
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
          whiteSpace: 'nowrap',
        }}>
          {sortedData.length} {cs ? 'zakazniku' : 'customers'}
        </span>
      </div>

      {/* Empty state */}
      {customers.length === 0 && (
        <div style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-md)',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <Icon name="Users" size={40} style={{ color: 'var(--forge-text-muted)', marginBottom: '12px' }} />
          <div style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--forge-text-primary)',
            marginBottom: '8px',
          }}>
            {cs ? 'Zadni zakaznici' : 'No customers yet'}
          </div>
          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '14px',
            color: 'var(--forge-text-muted)',
            maxWidth: 400,
            margin: '0 auto',
          }}>
            {cs
              ? 'Zakaznici se zobrazi automaticky po vytvoreni prvni objednavky.'
              : 'Customers will appear automatically after the first order is created.'}
          </div>
        </div>
      )}

      {/* No search/filter results */}
      {customers.length > 0 && sortedData.length === 0 && (
        <div style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-md)',
          padding: '32px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: '14px',
            color: 'var(--forge-text-muted)',
          }}>
            {cs ? 'Zadne vysledky' : 'No results'}
            {search && <> {cs ? 'pro' : 'for'} &quot;{search}&quot;</>}
          </div>
        </div>
      )}

      {/* Customer table */}
      {sortedData.length > 0 && (
        <div style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-md)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table
              role="table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr>
                  <SortableTh sortKey="name" currentSort={sortConfig} onSort={requestSort}>
                    {cs ? 'Zakaznik' : 'Customer'}
                  </SortableTh>
                  <th style={{
                    padding: '10px 12px',
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--forge-text-muted)',
                    borderBottom: '1px solid var(--forge-border-default)',
                    textAlign: 'left',
                  }}>
                    {cs ? 'Telefon' : 'Phone'}
                  </th>
                  <th style={{
                    padding: '10px 12px',
                    fontFamily: 'var(--forge-font-tech)',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--forge-text-muted)',
                    borderBottom: '1px solid var(--forge-border-default)',
                    textAlign: 'center',
                  }}>
                    Segment
                  </th>
                  <SortableTh sortKey="orderCount" currentSort={sortConfig} onSort={requestSort} align="center">
                    {cs ? 'Objednavek' : 'Orders'}
                  </SortableTh>
                  <SortableTh sortKey="totalSpent" currentSort={sortConfig} onSort={requestSort} align="right">
                    {cs ? 'Celkem utraceno' : 'Total spent'}
                  </SortableTh>
                  <SortableTh sortKey="avgOrder" currentSort={sortConfig} onSort={requestSort} align="right">
                    {cs ? 'Prumer. obj.' : 'Avg. order'}
                  </SortableTh>
                  <SortableTh sortKey="lastOrderDate" currentSort={sortConfig} onSort={requestSort}>
                    {cs ? 'Posledni obj.' : 'Last order'}
                  </SortableTh>
                  <th style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--forge-border-default)',
                    width: 48,
                  }} />
                </tr>
              </thead>
              <tbody>
                {sortedData.map((cust) => {
                  const isExpanded = expandedEmail === cust.email;
                  return (
                    <React.Fragment key={cust.email}>
                      <tr
                        onClick={() => toggleExpand(cust.email)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? 'var(--forge-bg-elevated)' : 'transparent',
                          transition: 'background-color 150ms',
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Customer name + email */}
                        <td style={{
                          padding: '12px',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar name={cust.name || cust.email} size={36} />
                            <div>
                              <div style={{
                                fontWeight: 600,
                                color: 'var(--forge-text-primary)',
                                fontSize: '13px',
                                lineHeight: 1.3,
                              }}>
                                {cust.name || '--'}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--forge-text-muted)',
                                lineHeight: 1.3,
                              }}>
                                {cust.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td style={{
                          padding: '12px',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          color: 'var(--forge-text-secondary)',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}>
                          {cust.phone || '--'}
                        </td>

                        {/* Segment badge */}
                        <td style={{
                          padding: '12px',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          textAlign: 'center',
                        }}>
                          <SegmentBadge segment={cust.segment} cs={cs} />
                        </td>

                        {/* Order count */}
                        <td style={{
                          padding: '12px',
                          textAlign: 'center',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          color: 'var(--forge-text-secondary)',
                          fontWeight: 600,
                        }}>
                          {cust.orderCount}
                        </td>

                        {/* Total spent */}
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          fontFamily: 'var(--forge-font-tech)',
                          fontWeight: 700,
                          color: 'var(--forge-text-primary)',
                          fontSize: '13px',
                        }}>
                          {formatMoney(cust.totalSpent)}
                        </td>

                        {/* Avg order */}
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          fontFamily: 'var(--forge-font-tech)',
                          color: 'var(--forge-text-secondary)',
                          fontSize: '12px',
                        }}>
                          {formatMoney(cust.avgOrder)}
                        </td>

                        {/* Last order date */}
                        <td style={{
                          padding: '12px',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          color: 'var(--forge-text-muted)',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}>
                          {formatDate(cust.lastOrderDate)}
                        </td>

                        {/* Expand icon */}
                        <td style={{
                          padding: '12px',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--forge-border-default)',
                          textAlign: 'center',
                        }}>
                          <Icon
                            name="ChevronDown"
                            size={16}
                            style={{
                              color: 'var(--forge-text-muted)',
                              transition: 'transform 200ms',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          />
                        </td>
                      </tr>

                      {/* Expandable detail row */}
                      {isExpanded && (
                        <CustomerDetailRow
                          customer={cust}
                          cs={cs}
                          colSpan={COL_COUNT}
                          notes={customerNotes}
                          onSaveNote={handleSaveNote}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

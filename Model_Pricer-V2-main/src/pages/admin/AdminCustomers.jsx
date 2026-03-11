// Admin Customers — derived from Orders data
// ---------------------------------------------
// Scope: /admin/customers only
// - Extracts unique customers from orders (by email)
// - Shows: name, email, order count, total spent, last order, avg order value
// - Sortable, searchable, expandable detail rows
// - Stats cards: total customers, new this month, avg LTV, repeat rate

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Icon from '../../components/AppIcon';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useSortableData } from '../../hooks/useSortableData';
import {
  loadOrders,
  computeOrderTotals,
  extractOrderMaterials,
  getStatusLabel,
  round2,
} from '../../utils/adminOrdersStorage';

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

function formatDateTime(iso, locale = 'cs-CZ') {
  try {
    return new Date(iso).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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

    return {
      email: c.email,
      name: c.name,
      phone: c.phone,
      orderCount,
      totalSpent: round2(c.totalSpent),
      avgOrder,
      lastOrderDate: c.lastOrderDate,
      firstOrderDate: c.firstOrderDate,
      favMaterial,
      orderFrequency,
      isNewThisMonth,
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

function CustomerDetailRow({ customer, cs }) {
  return (
    <tr>
      <td colSpan={6} style={{ padding: 0 }}>
        <div style={{
          backgroundColor: 'var(--forge-bg-elevated)',
          borderBottom: '1px solid var(--forge-border-default)',
          padding: '16px 20px',
        }}>
          {/* Detail header */}
          <div style={{
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}>
            <div>
              <span style={detailLabelStyle}>{cs ? 'Telefon' : 'Phone'}</span>
              <span style={detailValueStyle}>{customer.phone || '--'}</span>
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

  // Load orders
  useEffect(() => {
    try {
      const data = loadOrders();
      setOrders(data);
    } catch (e) {
      console.error('[AdminCustomers] Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggregate customers from orders
  const customers = useMemo(() => aggregateCustomers(orders), [orders]);

  // Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

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

      {/* Search bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-sm)',
          padding: '8px 12px',
          flex: '1 1 300px',
          maxWidth: 400,
        }}>
          <Icon name="Search" size={16} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={cs ? 'Hledat podle jmena nebo emailu...' : 'Search by name or email...'}
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
        <span style={{
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
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

      {/* No search results */}
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
            {cs ? 'Zadne vysledky pro' : 'No results for'} &quot;{search}&quot;
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
                    {cs ? 'Posledni objednavka' : 'Last order'}
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
                        {/* Customer */}
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
                        <CustomerDetailRow customer={cust} cs={cs} />
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

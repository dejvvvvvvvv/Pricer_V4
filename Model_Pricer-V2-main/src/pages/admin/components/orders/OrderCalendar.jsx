import React, { useMemo, useState, memo } from 'react';
import Icon from '../../../../components/AppIcon';
import { computeOrderTotals, getStatusLabel, round2 } from '../../../../utils/adminOrdersStorage';
import { getStatusColor } from '../kanban/statusTransitions';

// ========================================
// OrderCalendar — monthly calendar view
// for AdminOrders (4th view mode)
// Pure CSS grid, no external library
// Czech labels
// ========================================

const MONTH_NAMES_CS = [
  'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
  'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec',
];

const DAY_NAMES_CS = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMoney(amount) {
  return `${round2(amount).toFixed(2)} Kc`;
}

function formatShortDate(date) {
  return `${date.getDate()}. ${MONTH_NAMES_CS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Group orders by date key (YYYY-MM-DD based on created_at)
 */
function groupOrdersByDate(orders) {
  const map = {};
  for (const o of orders) {
    if (!o.created_at) continue;
    const d = new Date(o.created_at);
    if (isNaN(d.getTime())) continue;
    const key = toDateKey(d);
    if (!map[key]) map[key] = [];
    map[key].push(o);
  }
  return map;
}

/**
 * Build calendar grid cells for a given month.
 * Returns array of 42 cells (6 weeks x 7 days).
 * Each cell: { date, inMonth, isToday, dateKey }
 */
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6 (ISO week)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const today = new Date();
  const cells = [];

  const startDate = new Date(year, month, 1 - startDow);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday: isSameDay(d, today),
      dateKey: toDateKey(d),
    });
  }

  return cells;
}

/* -------- Sub-components -------- */

function StatusDot({ status }) {
  const color = getStatusColor(status);
  return (
    <span
      title={status}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

function DayCell({ cell, dayOrders, busiestKey, onSelectDay, isSelected }) {
  const count = dayOrders.length;
  // useMemo prevents recomputing totals on every parent render
  const totalRevenue = useMemo(
    () => dayOrders.reduce((sum, o) => sum + computeOrderTotals(o).total, 0),
    [dayOrders],
  );

  // Collect unique statuses for dots (max 5)
  const statuses = [...new Set(dayOrders.map(o => o.status))].slice(0, 5);

  const isBusiest = cell.dateKey === busiestKey && count > 0;

  return (
    <button
      type="button"
      onClick={() => onSelectDay(cell)}
      className={[
        'cal-day',
        cell.inMonth ? '' : 'cal-day--outside',
        cell.isToday ? 'cal-day--today' : '',
        isSelected ? 'cal-day--selected' : '',
        isBusiest ? 'cal-day--busiest' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="cal-day__number">{cell.date.getDate()}</span>

      {count > 0 && (
        <div className="cal-day__info">
          <span className="cal-day__count">{count}</span>
          <div className="cal-day__dots">
            {statuses.map(s => <StatusDot key={s} status={s} />)}
          </div>
        </div>
      )}

      {count > 0 && (
        <span className="cal-day__revenue">{formatMoney(totalRevenue)}</span>
      )}
    </button>
  );
}

function DayDetailPanel({ cell, dayOrders, onClose, onViewOrder, language }) {
  // Pre-compute totals once per dayOrders change, not on every render
  const orderTotalsMap = useMemo(
    () => {
      const map = new Map();
      for (const o of dayOrders) {
        map.set(o.id, computeOrderTotals(o));
      }
      return map;
    },
    [dayOrders],
  );
  const totalRevenue = useMemo(
    () => dayOrders.reduce((sum, o) => sum + (orderTotalsMap.get(o.id)?.total ?? 0), 0),
    [dayOrders, orderTotalsMap],
  );

  if (!cell) return null;

  return (
    <div className="cal-detail">
      <div className="cal-detail__header">
        <div>
          <h3 className="cal-detail__title">{formatShortDate(cell.date)}</h3>
          <div className="cal-detail__subtitle">
            {dayOrders.length} {dayOrders.length === 1 ? 'objednavka' : dayOrders.length < 5 ? 'objednavky' : 'objednavek'}
            {' '}&middot;{' '}{formatMoney(totalRevenue)}
          </div>
        </div>
        <button type="button" className="cal-detail__close" onClick={onClose}>
          <Icon name="X" size={16} />
        </button>
      </div>

      {dayOrders.length === 0 ? (
        <div className="cal-detail__empty">Zadne objednavky v tento den.</div>
      ) : (
        <div className="cal-detail__list">
          {dayOrders.map(o => {
            const totals = orderTotalsMap.get(o.id) || { total: 0 };
            return (
              <button
                key={o.id}
                type="button"
                className="cal-detail__order"
                onClick={() => onViewOrder(o.id)}
              >
                <div className="cal-detail__order-top">
                  <StatusDot status={o.status} />
                  <span className="cal-detail__order-id">
                    #{(o.order_number || o.id).toString().slice(-6)}
                  </span>
                  <span className="cal-detail__order-status">
                    {getStatusLabel(o.status, language)}
                  </span>
                </div>
                <div className="cal-detail__order-customer">
                  {o.customer_snapshot?.name || 'Neznamy zakaznik'}
                </div>
                <div className="cal-detail__order-total">
                  {formatMoney(totals.total)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthStats({ orders, ordersByDate, busiestKey, year, month }) {
  const monthOrders = orders.filter(o => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthRevenue = monthOrders.reduce((sum, o) => sum + computeOrderTotals(o).total, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const avgPerDay = monthOrders.length > 0 ? (monthOrders.length / daysInMonth) : 0;
  const busiestCount = busiestKey && ordersByDate[busiestKey] ? ordersByDate[busiestKey].length : 0;

  const busiestLabel = busiestKey
    ? (() => {
        const parts = busiestKey.split('-');
        return `${parseInt(parts[2], 10)}. ${MONTH_NAMES_CS[parseInt(parts[1], 10) - 1]}`;
      })()
    : '--';

  return (
    <div className="cal-stats">
      <div className="cal-stats__item">
        <div className="cal-stats__value">{monthOrders.length}</div>
        <div className="cal-stats__label">Objednavek</div>
      </div>
      <div className="cal-stats__item">
        <div className="cal-stats__value">{formatMoney(monthRevenue)}</div>
        <div className="cal-stats__label">Trzby</div>
      </div>
      <div className="cal-stats__item">
        <div className="cal-stats__value">{avgPerDay.toFixed(1)}</div>
        <div className="cal-stats__label">Prumer / den</div>
      </div>
      <div className="cal-stats__item">
        <div className="cal-stats__value">
          {busiestCount > 0 ? `${busiestLabel} (${busiestCount})` : '--'}
        </div>
        <div className="cal-stats__label">Nejvytizenejsi den</div>
      </div>
    </div>
  );
}

/* -------- Main Component -------- */

export default function OrderCalendar({ orders, onViewOrder, language }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedCell, setSelectedCell] = useState(null);

  const ordersByDate = useMemo(() => groupOrdersByDate(orders), [orders]);

  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  // Find busiest day in current month
  const busiestKey = useMemo(() => {
    let maxKey = null;
    let maxCount = 0;
    for (const [key, list] of Object.entries(ordersByDate)) {
      if (!key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) continue;
      if (list.length > maxCount) {
        maxCount = list.length;
        maxKey = key;
      }
    }
    return maxKey;
  }, [ordersByDate, year, month]);

  const selectedOrders = selectedCell ? (ordersByDate[selectedCell.dateKey] || []) : [];

  function prevMonth() {
    setSelectedCell(null);
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }

  function nextMonth() {
    setSelectedCell(null);
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  function goToday() {
    setSelectedCell(null);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className="cal-root">
      {/* Month stats bar */}
      <MonthStats
        orders={orders}
        ordersByDate={ordersByDate}
        busiestKey={busiestKey}
        year={year}
        month={month}
      />

      {/* Navigation header */}
      <div className="cal-nav">
        <button type="button" className="cal-nav__btn" onClick={prevMonth}>
          <Icon name="ChevronLeft" size={18} />
        </button>
        <h2 className="cal-nav__title">
          {MONTH_NAMES_CS[month]} {year}
        </h2>
        <button type="button" className="cal-nav__btn" onClick={nextMonth}>
          <Icon name="ChevronRight" size={18} />
        </button>
        <button type="button" className="cal-nav__today" onClick={goToday}>
          Dnes
        </button>
      </div>

      {/* Calendar body + detail panel side by side */}
      <div className="cal-body">
        <div className={`cal-grid-wrap ${selectedCell ? 'cal-grid-wrap--with-panel' : ''}`}>
          {/* Day name headers */}
          <div className="cal-header">
            {DAY_NAMES_CS.map(d => (
              <div key={d} className="cal-header__cell">{d}</div>
            ))}
          </div>

          {/* Day cells grid */}
          <div className="cal-grid">
            {cells.map(cell => (
              <DayCell
                key={cell.dateKey}
                cell={cell}
                dayOrders={ordersByDate[cell.dateKey] || []}
                busiestKey={busiestKey}
                onSelectDay={setSelectedCell}
                isSelected={selectedCell?.dateKey === cell.dateKey}
              />
            ))}
          </div>
        </div>

        {/* Day detail side panel */}
        {selectedCell && (
          <DayDetailPanel
            cell={selectedCell}
            dayOrders={selectedOrders}
            onClose={() => setSelectedCell(null)}
            onViewOrder={onViewOrder}
            language={language}
          />
        )}
      </div>

      <style>{calendarStyles}</style>
    </div>
  );
}

/* -------- Styles -------- */

const calendarStyles = `
  .cal-root {
    /* Container */
  }

  /* ---- Stats Bar ---- */
  .cal-stats {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .cal-stats__item {
    flex: 1 1 140px;
    min-width: 120px;
    background: var(--forge-bg-surface);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-lg);
    padding: 14px 16px;
  }
  .cal-stats__value {
    font-size: 18px;
    font-weight: 800;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-heading);
    margin-bottom: 2px;
  }
  .cal-stats__label {
    font-size: 11px;
    font-family: var(--forge-font-tech);
    color: var(--forge-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ---- Navigation ---- */
  .cal-nav {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .cal-nav__title {
    font-size: 20px;
    font-weight: 800;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-heading);
    margin: 0;
    min-width: 180px;
    text-align: center;
  }
  .cal-nav__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--forge-border-default);
    background: var(--forge-bg-elevated);
    color: var(--forge-text-secondary);
    border-radius: var(--forge-radius-lg);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cal-nav__btn:hover {
    background: var(--forge-bg-overlay);
    border-color: var(--forge-border-active);
    color: var(--forge-text-primary);
  }
  .cal-nav__today {
    margin-left: 8px;
    border: 1px solid var(--forge-border-default);
    background: var(--forge-bg-elevated);
    color: var(--forge-text-secondary);
    border-radius: var(--forge-radius-lg);
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--forge-font-tech);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .cal-nav__today:hover {
    background: var(--forge-bg-overlay);
    border-color: var(--forge-border-active);
    color: var(--forge-text-primary);
  }

  /* ---- Body (grid + panel) ---- */
  .cal-body {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .cal-grid-wrap {
    flex: 1 1 auto;
    min-width: 0;
    transition: flex 0.2s ease;
  }
  .cal-grid-wrap--with-panel {
    flex: 1 1 60%;
  }

  /* ---- Day name header ---- */
  .cal-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }
  .cal-header__cell {
    text-align: center;
    font-size: 11px;
    font-family: var(--forge-font-tech);
    font-weight: 700;
    color: var(--forge-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 6px 0;
  }

  /* ---- Grid of days ---- */
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  /* ---- Day cell ---- */
  .cal-day {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 80px;
    padding: 6px 8px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-surface);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    font-family: var(--forge-font-body);
    color: var(--forge-text-primary);
  }
  .cal-day:hover {
    background: var(--forge-bg-overlay);
    border-color: var(--forge-border-active);
  }
  .cal-day--outside {
    opacity: 0.35;
  }
  .cal-day--today {
    border-color: var(--forge-accent-primary);
    box-shadow: inset 0 0 0 1px var(--forge-accent-primary);
  }
  .cal-day--today .cal-day__number {
    color: var(--forge-accent-primary);
    font-weight: 800;
  }
  .cal-day--selected {
    background: rgba(0, 212, 170, 0.08);
    border-color: var(--forge-accent-primary);
  }
  .cal-day--busiest {
    background: rgba(255, 181, 71, 0.06);
    border-color: rgba(255, 181, 71, 0.4);
  }
  .cal-day--busiest .cal-day__number {
    color: var(--forge-warning, #FFB547);
  }

  .cal-day__number {
    font-size: 13px;
    font-weight: 700;
    color: var(--forge-text-secondary);
    font-family: var(--forge-font-mono);
    margin-bottom: 4px;
  }
  .cal-day__info {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
  }
  .cal-day__count {
    font-size: 11px;
    font-weight: 800;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-mono);
  }
  .cal-day__dots {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }
  .cal-day__revenue {
    font-size: 10px;
    font-family: var(--forge-font-tech);
    color: var(--forge-text-muted);
    margin-top: auto;
  }

  /* ---- Detail Panel ---- */
  .cal-detail {
    flex: 0 0 320px;
    max-height: 560px;
    overflow-y: auto;
    background: var(--forge-bg-surface);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-xl);
    padding: 16px;
    box-shadow: var(--forge-shadow-sm);
  }
  .cal-detail__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .cal-detail__title {
    font-size: 16px;
    font-weight: 800;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-heading);
    margin: 0;
  }
  .cal-detail__subtitle {
    font-size: 12px;
    color: var(--forge-text-muted);
    font-family: var(--forge-font-tech);
    margin-top: 2px;
  }
  .cal-detail__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--forge-border-default);
    background: var(--forge-bg-elevated);
    color: var(--forge-text-muted);
    border-radius: var(--forge-radius-md, 6px);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }
  .cal-detail__close:hover {
    background: var(--forge-bg-overlay);
    color: var(--forge-text-primary);
  }
  .cal-detail__empty {
    text-align: center;
    color: var(--forge-text-muted);
    font-size: 13px;
    padding: 24px 0;
  }
  .cal-detail__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cal-detail__order {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-lg);
    padding: 10px 12px;
    background: var(--forge-bg-elevated);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
    font-family: var(--forge-font-body);
    color: var(--forge-text-primary);
  }
  .cal-detail__order:hover {
    border-color: var(--forge-accent-primary);
    background: var(--forge-bg-overlay);
  }
  .cal-detail__order-top {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .cal-detail__order-id {
    font-size: 12px;
    font-weight: 700;
    font-family: var(--forge-font-mono);
    color: var(--forge-text-primary);
  }
  .cal-detail__order-status {
    margin-left: auto;
    font-size: 10px;
    font-family: var(--forge-font-tech);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--forge-text-muted);
  }
  .cal-detail__order-customer {
    font-size: 12px;
    color: var(--forge-text-secondary);
  }
  .cal-detail__order-total {
    font-size: 13px;
    font-weight: 800;
    color: var(--forge-accent-primary);
    font-family: var(--forge-font-mono);
  }

  /* ---- Responsive ---- */
  @media (max-width: 900px) {
    .cal-body {
      flex-direction: column;
    }
    .cal-detail {
      flex: auto;
      width: 100%;
      max-height: 400px;
    }
    .cal-day {
      min-height: 60px;
      padding: 4px 6px;
    }
    .cal-day__revenue {
      display: none;
    }
    .cal-stats {
      gap: 8px;
    }
    .cal-stats__item {
      min-width: 100px;
      padding: 10px 12px;
    }
    .cal-stats__value {
      font-size: 14px;
    }
  }

  @media (max-width: 600px) {
    .cal-day {
      min-height: 44px;
      padding: 3px 4px;
    }
    .cal-day__count {
      font-size: 10px;
    }
    .cal-day__dots {
      display: none;
    }
    .cal-nav__title {
      font-size: 16px;
      min-width: 140px;
    }
  }
`;

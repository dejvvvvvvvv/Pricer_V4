import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../../components/AppIcon';
import { useAuth } from '../../../../context/AuthContext';
import {
  loadPrintQueue,
  savePrintQueue,
  reorderQueue,
  addToQueue,
  removeFromQueue,
  getDefaultProgress,
  calculateProgress,
  getElapsedMinutes,
  getEstimatedCompletion,
  startPrint,
  pausePrint,
  resumePrint,
  completePrint,
  setManualProgress,
  loadPrintStats,
  logCompletedPrint,
  calculateTodayStats,
} from '../../../../utils/adminPrintQueueStorage';
import {
  computeOrderTotals,
  extractOrderMaterials,
  saveOrders,
  nowIso,
} from '../../../../utils/adminOrdersStorage';
import { addNotification } from '../../../../utils/adminNotificationStorage';
import { formatTime, formatDateTime, formatTimeShort } from '../../../../utils/formatters';

// ─── Helpers ────────────────────────────────────────────────────

function getOrderTimeMin(order) {
  const totals = computeOrderTotals(order);
  return totals.sum_time_min || 0;
}

function getOrderModels(order) {
  return (order.models || []).map((m) => m.file_snapshot?.filename || 'model').join(', ');
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{
      flex: '1 1 160px',
      background: 'var(--forge-bg-surface)',
      borderRadius: 'var(--forge-radius-xl)',
      padding: '14px 16px',
      border: '1px solid var(--forge-border-default)',
      boxShadow: 'var(--forge-shadow-sm)',
      minWidth: '140px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <Icon name={icon} size={16} style={{ color: 'var(--forge-accent-primary)' }} />
        <span style={{
          fontSize: '10px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 700,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '22px',
        fontWeight: 900,
        color: 'var(--forge-text-primary)',
        fontFamily: 'var(--forge-font-heading)',
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-tech)',
          marginTop: '2px',
        }}>{sub}</div>
      )}
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────

function ProgressBar({ percent, status }) {
  const color = status === 'paused'
    ? 'var(--forge-warning)'
    : status === 'completed'
      ? '#00D4AA'
      : 'var(--forge-accent-primary)';

  return (
    <div style={{
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      background: 'var(--forge-bg-elevated)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, percent))}%`,
        height: '100%',
        borderRadius: '3px',
        background: color,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

// ─── Queue Item ─────────────────────────────────────────────────

function QueueItem({
  order,
  entry,
  index,
  onStart,
  onPause,
  onResume,
  onComplete,
  onSetProgress,
  onViewDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onMoveToTop,
  isDragging,
}) {
  const [editPercent, setEditPercent] = useState(false);
  const [percentValue, setPercentValue] = useState(0);

  const progress = calculateProgress(entry);
  const elapsed = getElapsedMinutes(entry);
  const estimatedCompletion = getEstimatedCompletion(entry);
  const materials = extractOrderMaterials(order);
  const models = getOrderModels(order);
  const timeMin = getOrderTimeMin(order);
  const isPrinting = entry.status === 'printing';
  const isPaused = entry.status === 'paused';
  const isCompleted = entry.status === 'completed';
  const isQueued = entry.status === 'queued';

  const statusColor = isPrinting
    ? 'var(--forge-accent-primary)'
    : isPaused
      ? 'var(--forge-warning)'
      : isCompleted
        ? '#00D4AA'
        : 'var(--forge-text-muted)';

  const statusLabel = isPrinting
    ? 'Tiskne se'
    : isPaused
      ? 'Pozastaveno'
      : isCompleted
        ? 'Dokonceno'
        : 'Ve fronte';

  return (
    <div
      draggable={!isCompleted}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      style={{
        background: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-xl)',
        padding: '14px 16px',
        border: `1px solid ${isDragging ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
        boxShadow: isDragging ? '0 4px 16px rgba(0, 212, 170, 0.15)' : 'var(--forge-shadow-sm)',
        opacity: isDragging ? 0.6 : 1,
        cursor: isCompleted ? 'default' : 'grab',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        {!isCompleted && (
          <Icon name="GripVertical" size={16} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--forge-font-mono)',
              fontSize: '12px',
              color: 'var(--forge-text-primary)',
              fontWeight: 800,
            }}>
              #{(order.order_number || order.id || '').toString().slice(-6)}
            </span>
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
              color: statusColor,
              background: isPrinting
                ? 'rgba(0, 212, 170, 0.1)'
                : isPaused
                  ? 'rgba(255, 181, 71, 0.1)'
                  : isCompleted
                    ? 'rgba(0, 212, 170, 0.15)'
                    : 'var(--forge-bg-elevated)',
              border: `1px solid ${statusColor}33`,
            }}>
              {statusLabel}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--forge-text-muted)',
            fontFamily: 'var(--forge-font-body)',
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }} title={models}>
            {models || '--'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {isQueued && index > 0 && (
            <button
              onClick={() => onMoveToTop(index)}
              type="button"
              title="Presunout na zacatek fronty"
              style={actionBtnStyle('var(--forge-text-muted)')}
            >
              <Icon name="ChevronsUp" size={14} />
            </button>
          )}
          {isQueued && (
            <button
              onClick={() => onStart(order.id)}
              type="button"
              title="Zahajit tisk"
              style={actionBtnStyle('var(--forge-accent-primary)')}
            >
              <Icon name="Play" size={14} />
            </button>
          )}
          {isPrinting && (
            <button
              onClick={() => onPause(order.id)}
              type="button"
              title="Pozastavit"
              style={actionBtnStyle('var(--forge-warning)')}
            >
              <Icon name="Pause" size={14} />
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => onResume(order.id)}
              type="button"
              title="Pokracovat"
              style={actionBtnStyle('var(--forge-accent-primary)')}
            >
              <Icon name="Play" size={14} />
            </button>
          )}
          {(isPrinting || isPaused) && (
            <button
              onClick={() => onComplete(order.id)}
              type="button"
              title="Oznacit jako dokonceno"
              style={actionBtnStyle('#00D4AA')}
            >
              <Icon name="Check" size={14} />
            </button>
          )}
          <button
            onClick={() => onViewDetail(order.id)}
            type="button"
            title="Detail objednavky"
            style={actionBtnStyle('var(--forge-text-secondary)')}
          >
            <Icon name="ExternalLink" size={14} />
          </button>
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <InfoPill icon="Package" label="Material" value={materials.join(', ') || '--'} />
        <InfoPill icon="Clock" label="Odhadovany cas" value={formatTime(timeMin)} />
        {entry.startedAt && (
          <InfoPill icon="PlayCircle" label="Zahajeno" value={formatDateTime(entry.startedAt)} />
        )}
        {estimatedCompletion && !isCompleted && (
          <InfoPill icon="Target" label="Odhad dokonceni" value={formatTimeShort(estimatedCompletion)} />
        )}
        {isPrinting || isPaused ? (
          <InfoPill icon="Timer" label="Ubehlo" value={formatTime(elapsed)} />
        ) : null}
      </div>

      {/* Progress bar */}
      {!isQueued && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)',
                fontWeight: 700,
              }}>
                PRUBEH
              </span>
              {!isCompleted && entry.estimatedTimeMin === 0 && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-warning)',
                  fontWeight: 600,
                }} title="Objednavka nema data ze sliceru — casovac nefunguje. Nastavte % rucne.">
                  (bez odhadu — nastavte % rucne)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isCompleted && (
                editPercent ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentValue}
                      onChange={(e) => setPercentValue(e.target.value)}
                      style={{
                        width: '50px',
                        padding: '2px 4px',
                        fontSize: '11px',
                        fontFamily: 'var(--forge-font-mono)',
                        border: '1px solid var(--forge-border-default)',
                        borderRadius: 'var(--forge-radius-sm)',
                        background: 'var(--forge-bg-elevated)',
                        color: 'var(--forge-text-primary)',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSetProgress(order.id, Number(percentValue));
                          setEditPercent(false);
                        }
                        if (e.key === 'Escape') setEditPercent(false);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        onSetProgress(order.id, Number(percentValue));
                        setEditPercent(false);
                      }}
                      type="button"
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--forge-accent-primary)',
                        padding: '2px',
                      }}
                    >
                      <Icon name="Check" size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPercentValue(progress);
                      setEditPercent(true);
                    }}
                    type="button"
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--forge-text-muted)',
                      fontSize: '10px',
                      fontFamily: 'var(--forge-font-tech)',
                      padding: '0',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                    }}
                  >
                    Upravit %
                  </button>
                )
              )}
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--forge-font-mono)',
                color: 'var(--forge-text-primary)',
                fontWeight: 800,
              }}>
                {progress}%
              </span>
            </div>
          </div>
          <ProgressBar percent={progress} status={entry.status} />
        </div>
      )}

      {/* G-code availability */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {order.storage?.storagePath ? (
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid var(--forge-border-default)',
              background: 'var(--forge-bg-elevated)',
              color: 'var(--forge-text-secondary)',
              borderRadius: 'var(--forge-radius-lg)',
              padding: '4px 8px',
              fontSize: '10px',
              fontFamily: 'var(--forge-font-tech)',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
            title="Stahnout G-code"
          >
            <Icon name="Download" size={12} /> G-code
          </button>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <Icon name="FileX" size={12} /> G-code nedostupne
          </span>
        )}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Icon name={icon} size={12} style={{ color: 'var(--forge-text-muted)' }} />
      <span style={{
        fontSize: '10px',
        fontFamily: 'var(--forge-font-tech)',
        color: 'var(--forge-text-muted)',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>{label}:</span>
      <span style={{
        fontSize: '11px',
        fontFamily: 'var(--forge-font-mono)',
        color: 'var(--forge-text-secondary)',
      }}>{value}</span>
    </div>
  );
}

function actionBtnStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: `1px solid ${color}44`,
    borderRadius: 'var(--forge-radius-lg)',
    background: `${color}11`,
    color: color,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  };
}

// ─── Main Component ─────────────────────────────────────────────

export default function PrintQueue({ orders, setOrders, onViewOrder }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const [queueData, setQueueData] = useState(() => loadPrintQueue());
  const [stats, setStats] = useState(() => loadPrintStats());
  const [dragIndex, setDragIndex] = useState(null);
  const [, setTick] = useState(0);
  const tickRef = useRef(null);

  // Auto-refresh progress every 15s — only when there are printing or paused jobs
  useEffect(() => {
    const hasActive = queueData.queue.some((id) => {
      const entry = queueData.progress[id];
      return entry && (entry.status === 'printing' || entry.status === 'paused');
    });
    if (!hasActive) return;
    tickRef.current = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(tickRef.current);
  }, [queueData.queue, queueData.progress]);

  // Sync: ensure all PRINTING orders are in the queue
  useEffect(() => {
    const printingOrders = orders.filter((o) => o.status === 'PRINTING');
    let queue = [...queueData.queue];
    let progress = { ...queueData.progress };
    let changed = false;

    for (const o of printingOrders) {
      if (!queue.includes(o.id)) {
        queue = addToQueue(queue, o.id);
        changed = true;
      }
      if (!progress[o.id]) {
        progress[o.id] = getDefaultProgress(o.id, getOrderTimeMin(o));
        changed = true;
      }
    }

    // Remove orders that are no longer PRINTING (and not in progress)
    const printingIds = new Set(printingOrders.map((o) => o.id));
    const cleanedQueue = queue.filter((id) => {
      if (printingIds.has(id)) return true;
      // Keep if actively printing/paused in progress
      const entry = progress[id];
      if (entry && (entry.status === 'printing' || entry.status === 'paused')) return true;
      return false;
    });
    if (cleanedQueue.length !== queue.length) {
      queue = cleanedQueue;
      changed = true;
    }

    if (changed) {
      const next = { queue, progress };
      setQueueData(next);
      savePrintQueue(next);
    }
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((next) => {
    setQueueData(next);
    savePrintQueue(next);
  }, []);

  const queueOrders = useMemo(() => {
    return queueData.queue
      .map((id) => orders.find((o) => o.id === id))
      .filter(Boolean);
  }, [queueData.queue, orders]);

  // Production stats
  const todayStats = useMemo(() => {
    const totalEstimated = queueOrders.reduce((sum, o) => {
      const entry = queueData.progress[o.id];
      if (entry && entry.status !== 'completed') {
        const remaining = getOrderTimeMin(o) * (1 - calculateProgress(entry) / 100);
        return sum + remaining;
      }
      return sum;
    }, 0);
    return calculateTodayStats(stats, queueOrders.length, totalEstimated);
  }, [stats, queueOrders, queueData.progress]);

  // ─── Actions ────────────────────────────────────────────────

  const handleStart = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId);
    const timeMin = order ? getOrderTimeMin(order) : 0;
    const next = {
      ...queueData,
      progress: startPrint(queueData.progress, orderId, timeMin),
    };
    persist(next);
  }, [queueData, orders, persist]);

  const handlePause = useCallback((orderId) => {
    const next = {
      ...queueData,
      progress: pausePrint(queueData.progress, orderId),
    };
    persist(next);
  }, [queueData, persist]);

  const handleResume = useCallback((orderId) => {
    const next = {
      ...queueData,
      progress: resumePrint(queueData.progress, orderId),
    };
    persist(next);
  }, [queueData, persist]);

  const handleComplete = useCallback((orderId) => {
    const entry = queueData.progress[orderId];
    const elapsedMin = entry ? getElapsedMinutes(entry) : 0;

    // Update progress
    const nextProgress = completePrint(queueData.progress, orderId);
    const nextQueue = removeFromQueue(queueData.queue, orderId);
    const next = { queue: nextQueue, progress: nextProgress };
    persist(next);

    // Log stats
    const newStats = logCompletedPrint(orderId, elapsedMin);
    setStats(newStats);

    // Move order to POSTPROCESS
    const updatedOrders = orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: 'POSTPROCESS',
        updated_at: nowIso(),
        activity: [
          { timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE', payload: { from: 'PRINTING', to: 'POSTPROCESS' } },
          { timestamp: nowIso(), user_id: currentUser, type: 'PRINT_COMPLETED', payload: { printTimeMin: Math.round(elapsedMin) } },
          ...(o.activity || []),
        ].slice(0, 200),
      };
    });
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    addNotification({
      type: 'order',
      title: `Tisk dokoncen`,
      description: `Objednavka #${orderId.toString().slice(-6)} presunuta do postprocessu`,
    });
  }, [queueData, orders, setOrders, persist]);

  const handleSetProgress = useCallback((orderId, percent) => {
    const next = {
      ...queueData,
      progress: setManualProgress(queueData.progress, orderId, percent),
    };
    persist(next);
  }, [queueData, persist]);

  const handleMoveToTop = useCallback((fromIndex) => {
    if (fromIndex <= 0) return;
    const next = {
      ...queueData,
      queue: reorderQueue(queueData.queue, fromIndex, 0),
    };
    persist(next);
  }, [queueData, persist]);

  const handleViewDetail = useCallback((orderId) => {
    if (onViewOrder) onViewOrder(orderId);
  }, [onViewOrder]);

  // ─── Drag & Drop ───────────────────────────────────────────

  const handleDragStart = useCallback((e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, toIndex) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    setDragIndex(null);
    if (fromIndex == null || fromIndex === toIndex) return;

    const next = {
      ...queueData,
      queue: reorderQueue(queueData.queue, fromIndex, toIndex),
    };
    persist(next);
  }, [dragIndex, queueData, persist]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Production Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <StatCard
          icon="CheckCircle"
          label="Dokonceno dnes"
          value={todayStats.completedToday}
          sub={todayStats.totalPrintTimeToday > 0 ? `${formatTime(todayStats.totalPrintTimeToday)} tisku` : null}
        />
        <StatCard
          icon="Layers"
          label="Ve fronte"
          value={todayStats.queueLength}
          sub={todayStats.estimatedRemainingMin > 0 ? `~${formatTime(todayStats.estimatedRemainingMin)} zbyvajici` : null}
        />
        <StatCard
          icon="Activity"
          label="Vytizenost dnes"
          value={`${todayStats.utilizationPercent}%`}
          sub="tisk vs. prostoj"
        />
      </div>

      {/* Queue */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          fontSize: '12px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 700,
        }}>
          Tiskova fronta ({queueOrders.length})
        </div>
        <div style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
        }}>
          Pretahnete pro zmenu priority
        </div>
      </div>

      {queueOrders.length === 0 ? (
        <div style={{
          background: 'var(--forge-bg-surface)',
          borderRadius: 'var(--forge-radius-xl)',
          padding: '32px',
          border: '1px solid var(--forge-border-default)',
          textAlign: 'center',
        }}>
          <Icon name="Printer" size={32} style={{ color: 'var(--forge-text-muted)', marginBottom: '8px' }} />
          <div style={{
            color: 'var(--forge-text-muted)',
            fontFamily: 'var(--forge-font-body)',
            fontSize: '14px',
          }}>
            Zadne objednavky ve stavu "Tiskne se".
          </div>
          <div style={{
            color: 'var(--forge-text-muted)',
            fontFamily: 'var(--forge-font-body)',
            fontSize: '12px',
            marginTop: '4px',
          }}>
            Presunte objednavku do stavu PRINTING pro pridani do fronty.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queueOrders.map((order, idx) => {
            const entry = queueData.progress[order.id] || getDefaultProgress(order.id, getOrderTimeMin(order));
            return (
              <QueueItem
                key={order.id}
                order={order}
                entry={entry}
                index={idx}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onComplete={handleComplete}
                onSetProgress={handleSetProgress}
                onViewDetail={handleViewDetail}
                onMoveToTop={handleMoveToTop}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={dragIndex === idx}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState, useEffect } from 'react';

/* ── Print phase config ─────────────────────────────────────────────────── */
const PHASES = [
  { key: 'firstLayer',  label: 'Prvni vrstva',       pct: 0.05, color: '#FF6B35' }, // orange
  { key: 'infill',      label: 'Výplň (infill)',     pct: 0.60, color: '#00D4AA' }, // teal
  { key: 'walls',       label: 'Stěny (perimetry)',  pct: 0.25, color: '#4A9EFF' }, // blue
  { key: 'topBottom',   label: 'Horní/dolní vrstvy', pct: 0.10, color: '#9B59B6' }, // purple
];

/* ── Phase icons (simple SVG paths) ─────────────────────────────────────── */
const PHASE_ICONS = {
  firstLayer: (
    <path d="M3 17h18v2H3v-2zm0-4h18v1.5H3V13z" fill="currentColor" />
  ),
  infill: (
    <path d="M4 4l4 4-4 4 4 4-4 4M12 4l4 4-4 4 4 4-4 4M20 4l-4 4 4 4-4 4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
  ),
  walls: (
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
  ),
  topBottom: (
    <path d="M3 5h18M3 19h18M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1.5" fill="none" />
  ),
};

/* ── Time formatting ────────────────────────────────────────────────────── */
function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0 min';

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (days > 0) {
    const parts = [`${days}d`];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && days < 2) parts.push(`${minutes}min`);
    return parts.join(' ');
  }
  if (hours > 0) {
    const parts = [`${hours}h`];
    if (minutes > 0) parts.push(`${minutes}min`);
    return parts.join(' ');
  }
  return `${Math.max(1, minutes)} min`;
}

function formatTimeShort(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ── Fun comparison text ────────────────────────────────────────────────── */
function getComparisonText(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;

  const minutes = totalSeconds / 60;

  if (minutes < 5) return 'Rychlejsi nez uvarit kafe';
  if (minutes < 15) return 'Jako kratka pauza na kafe';
  if (minutes < 30) return 'Stihnes jednu epizodu serialu';
  if (minutes < 60) return 'Cas na dobry obed';
  if (minutes < 120) return 'Priblizne jako 1 film';
  if (minutes < 240) return `Priblizne jako ${Math.round(minutes / 120)} filmy`;
  if (minutes < 480) return 'Jako kratky pracovni den';
  if (minutes < 600) return 'Priblizne jako spanek';
  if (minutes < 1440) return `Priblizne jako ${Math.round(minutes / 60)} hodin prace`;
  return `Priblizne jako ${Math.round(minutes / 1440)} dnu nepretrziteho tisku`;
}

/* ── SVG Circular Progress ──────────────────────────────────────────────── */
const CIRCLE_SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = CIRCLE_SIZE / 2;

function CircularProgress({ totalSeconds, animated }) {
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    if (!animated) {
      setAnimProgress(1);
      return;
    }
    setAnimProgress(0);
    const timeout = setTimeout(() => setAnimProgress(1), 50);
    return () => clearTimeout(timeout);
  }, [totalSeconds, animated]);

  const segments = useMemo(() => {
    let offset = 0;
    return PHASES.map((phase) => {
      const segLen = CIRCUMFERENCE * phase.pct * animProgress;
      const gap = 2;
      const seg = {
        ...phase,
        dashArray: `${Math.max(0, segLen - gap)} ${CIRCUMFERENCE - Math.max(0, segLen - gap)}`,
        dashOffset: -offset,
        seconds: (totalSeconds || 0) * phase.pct,
      };
      offset += segLen;
      return seg;
    });
  }, [totalSeconds, animProgress]);

  return (
    <div style={{ position: 'relative', width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
      <svg
        width={CIRCLE_SIZE}
        height={CIRCLE_SIZE}
        viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--forge-bg-elevated, #1a1d24)"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Phase segments */}
        {segments.map((seg) => (
          <circle
            key={seg.key}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="round"
            style={{
              transition: animated ? 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out' : 'none',
              filter: `drop-shadow(0 0 3px ${seg.color}40)`,
            }}
          />
        ))}
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '2px' }}>
          <circle cx="12" cy="12" r="9" stroke="var(--forge-text-muted, #7A8291)" strokeWidth="2" />
          <path d="M12 7v5l3 3" stroke="var(--forge-text-muted, #7A8291)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: 'var(--forge-text-lg, 18px)',
            fontWeight: 700,
            fontFamily: 'var(--forge-font-mono)',
            color: 'var(--forge-text-primary, #E8EAED)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {formatTime(totalSeconds)}
        </span>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--forge-font-body)',
            color: 'var(--forge-text-muted, #7A8291)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: '2px',
          }}
        >
          odhad tisku
        </span>
      </div>
    </div>
  );
}

/* ── Phase legend row ───────────────────────────────────────────────────── */
function PhaseRow({ phase, totalSeconds, isHovered, onHover, onLeave }) {
  const seconds = (totalSeconds || 0) * phase.pct;
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.375rem',
        borderRadius: 'var(--forge-radius-sm, 4px)',
        background: isHovered ? 'var(--forge-bg-elevated, #1a1d24)' : 'transparent',
        transition: 'background 0.15s ease',
        cursor: 'default',
      }}
      title={`${phase.label}: ${formatTimeShort(seconds)} (${Math.round(phase.pct * 100)}%)`}
    >
      {/* Color dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: phase.color,
          flexShrink: 0,
          boxShadow: isHovered ? `0 0 6px ${phase.color}60` : 'none',
          transition: 'box-shadow 0.15s ease',
        }}
      />
      {/* Icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        style={{ color: phase.color, flexShrink: 0, opacity: 0.8 }}
      >
        {PHASE_ICONS[phase.key]}
      </svg>
      {/* Label */}
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-secondary, #9CA3AF)',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {phase.label}
      </span>
      {/* Time */}
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-mono)',
          color: isHovered ? phase.color : 'var(--forge-text-muted, #7A8291)',
          whiteSpace: 'nowrap',
          transition: 'color 0.15s ease',
        }}
      >
        {formatTimeShort(seconds)}
      </span>
      {/* Percentage */}
      <span
        style={{
          fontSize: '10px',
          fontFamily: 'var(--forge-font-mono)',
          color: 'var(--forge-text-muted, #7A8291)',
          opacity: 0.6,
          whiteSpace: 'nowrap',
        }}
      >
        {Math.round(phase.pct * 100)}%
      </span>
    </div>
  );
}

/* ── Per-file time row (multi-file) ─────────────────────────────────────── */
function FileTimeRow({ name, seconds }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        padding: '0.125rem 0',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-secondary, #9CA3AF)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-mono)',
          color: 'var(--forge-text-primary, #E8EAED)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatTimeShort(seconds)}
      </span>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function PrintTimeVisualization({ uploadedFiles }) {
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const [visible, setVisible] = useState(false);

  // Extract time data from completed files
  const timeData = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    const completed = files.filter((f) => f?.status === 'completed' && f?.result);
    if (completed.length === 0) return null;

    const perFile = completed.map((f) => {
      // Time is in result object — check multiple possible locations
      const metrics = f.result?.metrics || f.result || {};
      const seconds = Number(metrics.estimatedTimeSeconds) || 0;
      const quantity = Number(f.quantity) || 1;
      return {
        id: f.id,
        name: f.name || 'Model',
        seconds,
        totalSeconds: seconds * quantity,
        quantity,
      };
    });

    const totalSeconds = perFile.reduce((sum, f) => sum + f.totalSeconds, 0);

    return {
      perFile,
      totalSeconds,
      isMultiFile: perFile.length > 1,
    };
  }, [uploadedFiles]);

  // Animate in on mount / data change
  useEffect(() => {
    if (timeData) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [timeData?.totalSeconds]);

  if (!timeData || timeData.totalSeconds <= 0) return null;

  const comparison = getComparisonText(timeData.totalSeconds);

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--forge-radius-xl, 12px)',
        border: '1px solid var(--forge-border-default, #2A2D35)',
        background: 'var(--forge-bg-elevated, #1a1d24)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--forge-accent-primary, #00D4AA)" strokeWidth="2" />
          <path d="M12 7v5l3 3" stroke="var(--forge-accent-primary, #00D4AA)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-heading)',
            fontWeight: 600,
            color: 'var(--forge-text-primary, #E8EAED)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Odhad casu tisku
        </span>
      </div>

      {/* Circular indicator + legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <CircularProgress totalSeconds={timeData.totalSeconds} animated={visible} />

        <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {PHASES.map((phase) => (
            <PhaseRow
              key={phase.key}
              phase={phase}
              totalSeconds={timeData.totalSeconds}
              isHovered={hoveredPhase === phase.key}
              onHover={() => setHoveredPhase(phase.key)}
              onLeave={() => setHoveredPhase(null)}
            />
          ))}
        </div>
      </div>

      {/* Per-file breakdown (multi-file) */}
      {timeData.isMultiFile && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--forge-border-default, #2A2D35)',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-text-muted, #7A8291)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            Cas na model
          </span>
          {timeData.perFile.map((f) => (
            <FileTimeRow
              key={f.id}
              name={f.quantity > 1 ? `${f.name} (${f.quantity}x)` : f.name}
              seconds={f.totalSeconds}
            />
          ))}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginTop: '0.25rem',
              paddingTop: '0.25rem',
              borderTop: '1px solid var(--forge-border-default, #2A2D35)',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-body)',
                fontWeight: 600,
                color: 'var(--forge-text-primary, #E8EAED)',
              }}
            >
              Celkem
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-mono)',
                fontWeight: 600,
                color: 'var(--forge-accent-primary, #00D4AA)',
              }}
            >
              {formatTime(timeData.totalSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* Fun comparison */}
      {comparison && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.5rem',
            borderRadius: 'var(--forge-radius-md, 8px)',
            background: 'rgba(0, 212, 170, 0.06)',
            border: '1px solid rgba(0, 212, 170, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="var(--forge-accent-primary, #00D4AA)"
              opacity="0.7"
            />
          </svg>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-accent-primary, #00D4AA)',
              fontStyle: 'italic',
            }}
          >
            {comparison}
          </span>
        </div>
      )}
    </div>
  );
}

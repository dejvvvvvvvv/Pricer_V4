import React, { useMemo, useState, useEffect } from 'react';

/* ── Constants ─────────────────────────────────────────────────────────── */
const SPOOL_WEIGHT_G = 1000; // Standard 1kg spool
const SPOOL_LENGTH_M = 330;  // ~330m of 1.75mm filament per 1kg spool
const WARNING_THRESHOLD = 0.8; // 80% of spool

/* ── SVG Spool dimensions ──────────────────────────────────────────────── */
const SPOOL_SIZE = 100;
const CENTER = SPOOL_SIZE / 2;
const OUTER_RADIUS = 42;
const HUB_RADIUS = 14;
const FLANGE_WIDTH = 3;

/* ── Spool SVG (side profile view) ─────────────────────────────────────── */
function SpoolGraphic({ usagePct, animProgress, materialColor }) {
  const fillColor = materialColor || 'var(--forge-accent-primary, #00D4AA)';
  const bgColor = 'var(--forge-bg-elevated, #1a1d24)';
  const borderColor = 'var(--forge-border-default, #2A2D35)';

  // The filament "wound" area goes from hub to outer edge
  // usagePct = how much of the spool is USED, so remaining = 1 - usagePct
  // We show remaining filament as filled, used portion as empty
  const clampedPct = Math.min(Math.max(usagePct, 0), 1);
  const remainingPct = 1 - clampedPct;
  const animatedRemaining = remainingPct * animProgress;

  // Filament ring: from hub outward, radius represents remaining filament
  const filamentRadius = HUB_RADIUS + (OUTER_RADIUS - HUB_RADIUS) * animatedRemaining;

  return (
    <svg
      width={SPOOL_SIZE}
      height={SPOOL_SIZE}
      viewBox={`0 0 ${SPOOL_SIZE} ${SPOOL_SIZE}`}
      role="img"
      aria-label={`Civka filamentu — spotrebovano ${Math.round(clampedPct * 100)}%`}
      style={{ flexShrink: 0 }}
    >
      {/* Outer flange (spool rim) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={OUTER_RADIUS + FLANGE_WIDTH}
        fill="none"
        stroke={borderColor}
        strokeWidth={FLANGE_WIDTH}
      />

      {/* Empty spool background */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={OUTER_RADIUS}
        fill={bgColor}
      />

      {/* Remaining filament (wound around hub) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={filamentRadius}
        fill={fillColor}
        opacity={0.2}
        style={{
          transition: animProgress < 1 ? 'r 0.8s ease-out' : 'none',
        }}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={filamentRadius}
        fill="none"
        stroke={fillColor}
        strokeWidth={1.5}
        opacity={0.6}
        style={{
          transition: animProgress < 1 ? 'r 0.8s ease-out' : 'none',
        }}
      />

      {/* Winding lines (decorative) */}
      {animatedRemaining > 0.05 && (
        <>
          {[0.25, 0.5, 0.75].map((frac) => {
            const r = HUB_RADIUS + (filamentRadius - HUB_RADIUS) * frac;
            if (r <= HUB_RADIUS + 1) return null;
            return (
              <circle
                key={frac}
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke={fillColor}
                strokeWidth={0.5}
                opacity={0.15}
                style={{
                  transition: animProgress < 1 ? 'r 0.8s ease-out' : 'none',
                }}
              />
            );
          })}
        </>
      )}

      {/* Center hub */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={HUB_RADIUS}
        fill="var(--forge-bg-surface, #12141A)"
        stroke={borderColor}
        strokeWidth={1.5}
      />
      {/* Hub hole */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={5}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1}
      />

      {/* Inner flange */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={OUTER_RADIUS + FLANGE_WIDTH}
        fill="none"
        stroke={borderColor}
        strokeWidth={0.5}
      />

      {/* Usage percentage text in center */}
      <text
        x={CENTER}
        y={CENTER + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--forge-text-primary, #E8EAED)"
        fontSize="11"
        fontFamily="var(--forge-font-mono)"
        fontWeight="700"
      >
        {Math.round(clampedPct * 100)}%
      </text>
    </svg>
  );
}

/* ── Stat row ──────────────────────────────────────────────────────────── */
function StatRow({ label, value, accent = false, muted = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-body)',
          color: muted ? 'var(--forge-text-muted, #7A8291)' : 'var(--forge-text-secondary, #9CA3AF)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-mono)',
          fontWeight: accent ? 600 : 400,
          color: accent ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-text-primary, #E8EAED)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Warning box ──────────────────────────────────────────────────────── */
function WarningBox({ children }) {
  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '0.375rem 0.5rem',
        borderRadius: 'var(--forge-radius-md, 8px)',
        background: 'rgba(255, 107, 53, 0.06)',
        border: '1px solid rgba(255, 107, 53, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M12 2L2 22h20L12 2zm0 7v6m0 2v2"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-body)',
          color: '#FF6B35',
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Per-file filament row ────────────────────────────────────────────── */
function FileFilamentRow({ name, grams }) {
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
        {grams.toFixed(1)} g
      </span>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function FilamentUsageVisualization({ uploadedFiles }) {
  const [visible, setVisible] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);

  // Extract filament data from completed files
  const filamentData = useMemo(() => {
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
    const completed = files.filter((f) => f?.status === 'completed' && f?.result);
    if (completed.length === 0) return null;

    const perFile = completed.map((f) => {
      const metrics = f.result?.metrics || f.result || {};
      const grams = Number(metrics.filamentGrams) || 0;
      const mm = Number(metrics.filamentMm) || 0;
      const quantity = Number(f.quantity) || 1;
      return {
        id: f.id,
        name: f.name || 'Model',
        grams,
        totalGrams: grams * quantity,
        mm,
        totalMm: mm * quantity,
        quantity,
      };
    });

    const totalGrams = perFile.reduce((sum, f) => sum + f.totalGrams, 0);
    const totalMm = perFile.reduce((sum, f) => sum + f.totalMm, 0);

    if (totalGrams <= 0) return null;

    const spoolUsagePct = totalGrams / SPOOL_WEIGHT_G;
    const spoolCount = totalGrams / SPOOL_WEIGHT_G;
    // Convert mm to meters for display
    const totalMeters = totalMm > 0 ? totalMm / 1000 : (totalGrams / SPOOL_WEIGHT_G) * SPOOL_LENGTH_M;

    return {
      perFile,
      totalGrams,
      totalMeters,
      spoolUsagePct,
      spoolCount,
      isMultiFile: perFile.length > 1,
      needsWarning80: spoolUsagePct >= WARNING_THRESHOLD && spoolUsagePct < 1,
      needsWarningMultiSpool: spoolUsagePct >= 1,
    };
  }, [uploadedFiles]);

  // Animate in
  useEffect(() => {
    if (filamentData) {
      setVisible(false);
      setAnimProgress(0);
      const t1 = setTimeout(() => setVisible(true), 30);
      const t2 = setTimeout(() => setAnimProgress(1), 80);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    setVisible(false);
    setAnimProgress(0);
  }, [filamentData?.totalGrams]);

  if (!filamentData) return null;

  const { totalGrams, totalMeters, spoolUsagePct, spoolCount, perFile, isMultiFile, needsWarning80, needsWarningMultiSpool } = filamentData;

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
      role="region"
      aria-label="Spotreba filamentu"
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
          <circle cx="12" cy="12" r="4" stroke="var(--forge-accent-primary, #00D4AA)" strokeWidth="1.5" />
          <line x1="12" y1="3" x2="12" y2="8" stroke="var(--forge-accent-primary, #00D4AA)" strokeWidth="1.5" />
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
          Spotreba filamentu
        </span>
      </div>

      {/* Spool graphic + stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <SpoolGraphic
          usagePct={Math.min(spoolUsagePct, 1)}
          animProgress={animProgress}
        />

        <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <StatRow label="Hmotnost" value={`${totalGrams.toFixed(1)} g`} accent />
          <StatRow label="Delka" value={`${totalMeters.toFixed(1)} m`} />
          {needsWarningMultiSpool ? (
            <StatRow
              label="Civky"
              value={`${spoolCount.toFixed(1)} civek`}
              accent
            />
          ) : (
            <StatRow
              label="Spotreba civky"
              value={`${(spoolUsagePct * 100).toFixed(1)}% z 1kg`}
            />
          )}
        </div>
      </div>

      {/* Per-file breakdown (multi-file) */}
      {isMultiFile && (
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
            Filament na model
          </span>
          {perFile.map((f) => (
            <FileFilamentRow
              key={f.id}
              name={f.quantity > 1 ? `${f.name} (${f.quantity}x)` : f.name}
              grams={f.totalGrams}
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
              {totalGrams.toFixed(1)} g
            </span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {needsWarningMultiSpool && (
        <WarningBox>
          Tisk vyzaduje {spoolCount.toFixed(1)} civek (1kg). Pripravte dostatek materialu.
        </WarningBox>
      )}
      {needsWarning80 && (
        <WarningBox>
          Tisk spotrebuje vice nez 80% civky. Doporucujeme mit nahradni.
        </WarningBox>
      )}
    </div>
  );
}

// src/pages/test-kalkulacka/components/ModelInfoPanel.jsx
// Detailed model info panel — collapsible section with comprehensive model statistics.
import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

/* ── Build plate defaults (Prusa MK3S+) ──────────────────────────────────── */
const BUILD_PLATE = { x: 250, y: 210, z: 210 }; // width, depth, height in mm

/* ── Styles (Forge dark theme, inline) ────────────────────────────────────── */
const s = {
  wrapper: {
    borderRadius: 'var(--forge-radius-xl)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-surface)',
    overflow: 'hidden',
  },
  toggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    fontSize: 'var(--forge-text-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  content: (open) => ({
    maxHeight: open ? '1200px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  }),
  inner: {
    padding: '0 1rem 1rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  statCard: {
    padding: '0.5rem 0.625rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statIcon: {
    width: '28px',
    height: '28px',
    borderRadius: 'var(--forge-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: '10px',
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    lineHeight: 1.2,
  },
  statValue: {
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-mono, monospace)',
    color: 'var(--forge-text-primary)',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  sectionLabel: {
    fontSize: '10px',
    fontFamily: 'var(--forge-font-tech)',
    color: 'var(--forge-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  fitBadge: (fits) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: 'var(--forge-radius-md)',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 600,
    background: fits
      ? 'rgba(0, 212, 170, 0.1)'
      : 'rgba(239, 68, 68, 0.1)',
    color: fits
      ? 'var(--forge-accent-primary, #00D4AA)'
      : 'var(--forge-error, #EF4444)',
    border: `1px solid ${fits ? 'rgba(0, 212, 170, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
  }),
  barTrack: {
    height: '6px',
    borderRadius: '3px',
    background: 'var(--forge-bg-void)',
    overflow: 'hidden',
    flex: 1,
  },
  barFill: (pct, ok) => ({
    height: '100%',
    borderRadius: '3px',
    width: `${Math.min(pct, 100)}%`,
    background: ok
      ? 'var(--forge-accent-primary, #00D4AA)'
      : 'var(--forge-error, #EF4444)',
    transition: 'width 0.4s ease',
  }),
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-mono, monospace)',
    color: 'var(--forge-text-secondary)',
  },
  barLabel: {
    width: '14px',
    textAlign: 'right',
    fontWeight: 600,
    fontSize: '10px',
    color: 'var(--forge-text-muted)',
  },
  suggestion: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--forge-radius-md)',
    background: 'rgba(251, 191, 36, 0.08)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    fontSize: 'var(--forge-text-xs)',
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-text-secondary)',
    lineHeight: 1.5,
  },
  skeleton: {
    height: '12px',
    borderRadius: '4px',
    background: 'var(--forge-bg-elevated)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileFormat(name) {
  const ext = String(name || '').split('.').pop()?.toUpperCase() || '';
  return ext || '-';
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('cs-CZ');
}

/* ── Stat card sub-component ──────────────────────────────────────────────── */

function StatCard({ icon, iconBg, label, value, title }) {
  return (
    <div style={s.statCard} title={title}>
      <div style={{ ...s.statIcon, background: iconBg || 'var(--forge-bg-surface)' }}>
        <Icon name={icon} size={14} style={{ color: 'var(--forge-text-muted)' }} />
      </div>
      <div>
        <div style={s.statLabel}>{label}</div>
        <div style={s.statValue}>{value}</div>
      </div>
    </div>
  );
}

/* ── Build plate bar ──────────────────────────────────────────────────────── */

function PlateBar({ axis, modelMm, plateMm }) {
  const pct = Number.isFinite(modelMm) && plateMm > 0
    ? (modelMm / plateMm) * 100
    : 0;
  const ok = pct <= 100;
  return (
    <div style={s.barRow}>
      <span style={s.barLabel}>{axis}</span>
      <div style={s.barTrack}>
        <div style={s.barFill(pct, ok)} />
      </div>
      <span style={{ minWidth: '48px', textAlign: 'right' }}>
        {Number.isFinite(modelMm) ? `${modelMm.toFixed(1)}` : '-'} / {plateMm}
      </span>
    </div>
  );
}

/* ── Skeleton placeholder ─────────────────────────────────────────────────── */

function InfoSkeleton() {
  return (
    <div style={s.inner}>
      <div style={s.grid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={s.statCard}>
            <div style={{ ...s.skeleton, width: '28px', height: '28px', borderRadius: 'var(--forge-radius-sm)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...s.skeleton, width: '60%', marginBottom: '4px' }} />
              <div style={{ ...s.skeleton, width: '80%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════════════════ */

/**
 * ModelInfoPanel — collapsible panel showing comprehensive model statistics.
 *
 * @param {object}  selectedFile       - currently selected file object from uploadedFiles[]
 * @param {object}  modelGeometry      - Three.js BufferGeometry (from ModelViewer onGeometryLoaded)
 * @param {boolean} defaultOpen        - whether the panel starts expanded (default true)
 */
const ModelInfoPanel = ({ selectedFile, modelGeometry, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  // Extract all available data
  const data = useMemo(() => {
    if (!selectedFile) return null;

    const result = selectedFile.result;
    const modelInfo = result?.modelInfo;
    const metrics = result?.metrics;
    const clientInfo = selectedFile.clientModelInfo;
    const clientMeta = selectedFile.clientModelInfoMeta?.surface;

    // Dimensions from slicer
    const dims = modelInfo?.sizeMm;
    const dimX = Number(dims?.x) || null;
    const dimY = Number(dims?.y) || null;
    const dimZ = Number(dims?.z) || null;

    // Volume
    const volumeMm3 = Number(modelInfo?.volumeMm3) || null;
    const volumeCm3 = volumeMm3 != null ? volumeMm3 / 1000 : null;

    // Surface
    const surfaceMm2 = Number.isFinite(modelInfo?.surfaceMm2)
      ? modelInfo.surfaceMm2
      : Number.isFinite(clientInfo?.surfaceMm2)
        ? clientInfo.surfaceMm2
        : null;
    const surfaceCm2 = surfaceMm2 != null ? surfaceMm2 / 100 : null;

    // Filament
    const filamentG = Number.isFinite(Number(metrics?.filamentGrams))
      ? Number(metrics.filamentGrams)
      : null;
    const filamentMm = Number.isFinite(Number(metrics?.filamentMm))
      ? Number(metrics.filamentMm)
      : null;

    // Print time
    const printTimeSec = Number.isFinite(Number(metrics?.estimatedTimeSeconds))
      ? Number(metrics.estimatedTimeSeconds)
      : null;

    // Triangle / vertex counts (from client-side surface computation or geometry)
    let triangleCount = clientMeta?.triangleCount ?? null;
    let vertexCount = clientMeta?.vertexCount ?? null;

    // If geometry is available and we don't have counts from surface computation
    if (modelGeometry && triangleCount == null) {
      const pos = modelGeometry.attributes?.position;
      if (pos) {
        vertexCount = pos.count || 0;
        const idx = modelGeometry.getIndex?.() || modelGeometry.index;
        triangleCount = idx?.array
          ? Math.floor(idx.array.length / 3)
          : Math.floor(vertexCount / 3);
      }
    }

    // File metadata
    const fileSize = selectedFile.size || selectedFile.file?.size || null;
    const fileName = selectedFile.name || '';
    const format = getFileFormat(fileName);

    // Build plate fit
    const fitsX = dimX != null ? dimX <= BUILD_PLATE.x : null;
    const fitsY = dimY != null ? dimY <= BUILD_PLATE.y : null;
    const fitsZ = dimZ != null ? dimZ <= BUILD_PLATE.z : null;
    const fitsAll = fitsX !== null && fitsY !== null && fitsZ !== null
      ? (fitsX && fitsY && fitsZ)
      : null;

    // Scale suggestion
    const maxDim = Math.max(dimX || 0, dimY || 0, dimZ || 0);
    const minDim = Math.min(
      ...[dimX, dimY, dimZ].filter(d => d != null && d > 0)
    );
    let scaleSuggestion = null;
    if (maxDim > 0 && maxDim < 10) {
      scaleSuggestion = {
        type: 'small',
        message: `Model je velmi maly (max ${maxDim.toFixed(1)} mm). Zvazte zvetseni pro lepsi kvalitu tisku.`,
      };
    } else if (maxDim > 200 && fitsAll !== false) {
      scaleSuggestion = {
        type: 'large',
        message: `Model je pomerne velky (max ${maxDim.toFixed(1)} mm). Tisk muze trvat dlouho.`,
      };
    } else if (fitsAll === false) {
      const overflows = [];
      if (!fitsX) overflows.push(`X o ${(dimX - BUILD_PLATE.x).toFixed(1)} mm`);
      if (!fitsY) overflows.push(`Y o ${(dimY - BUILD_PLATE.y).toFixed(1)} mm`);
      if (!fitsZ) overflows.push(`Z o ${(dimZ - BUILD_PLATE.z).toFixed(1)} mm`);
      scaleSuggestion = {
        type: 'overflow',
        message: `Model presahuje tiskovou plochu (${overflows.join(', ')}). Zmensete model nebo pouzijte vetsi tiskarnu.`,
      };
    }

    const isSliced = selectedFile.status === 'completed' && result != null;
    const isProcessing = selectedFile.status === 'processing';

    return {
      dimX, dimY, dimZ, volumeCm3, surfaceCm2,
      filamentG, filamentMm, printTimeSec,
      triangleCount, vertexCount,
      fileSize, format,
      fitsAll, fitsX, fitsY, fitsZ,
      scaleSuggestion, maxDim,
      isSliced, isProcessing,
    };
  }, [selectedFile, modelGeometry]);

  if (!selectedFile) return null;

  const hasDims = data?.dimX != null || data?.dimY != null || data?.dimZ != null;
  const hasAnyData = hasDims || data?.triangleCount != null || data?.fileSize != null;

  return (
    <div style={s.wrapper}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="model-info-panel"
        style={s.toggle}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="Info" size={15} style={{ color: 'var(--forge-accent-primary)' }} />
          Informace o modelu
        </span>
        <Icon
          name="ChevronDown"
          size={16}
          style={{
            color: 'var(--forge-text-muted)',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div id="model-info-panel" style={s.content(open)}>
        {data?.isProcessing ? (
          <InfoSkeleton />
        ) : (
          <div style={s.inner}>
            {/* ── File metadata ──────────────────────────────────────────── */}
            <div style={s.grid}>
              <StatCard
                icon="File"
                iconBg="rgba(0, 212, 170, 0.08)"
                label="Format"
                value={data?.format || '-'}
              />
              <StatCard
                icon="HardDrive"
                iconBg="rgba(0, 212, 170, 0.08)"
                label="Velikost souboru"
                value={formatFileSize(data?.fileSize)}
              />
              {data?.triangleCount != null && (
                <StatCard
                  icon="Triangle"
                  iconBg="rgba(139, 92, 246, 0.08)"
                  label="Trojuhelniky"
                  value={formatNumber(data.triangleCount)}
                  title={`Vertexy: ${formatNumber(data.vertexCount)}`}
                />
              )}
              {data?.vertexCount != null && (
                <StatCard
                  icon="Waypoints"
                  iconBg="rgba(139, 92, 246, 0.08)"
                  label="Vertexy"
                  value={formatNumber(data.vertexCount)}
                />
              )}
            </div>

            {/* ── Dimensions detail ──────────────────────────────────────── */}
            {hasDims && (
              <div>
                <div style={s.sectionLabel}>Rozmery modelu</div>
                <div style={s.grid}>
                  <StatCard
                    icon="Maximize2"
                    iconBg="rgba(59, 130, 246, 0.08)"
                    label="X (sirka)"
                    value={data.dimX != null ? `${data.dimX.toFixed(2)} mm` : '-'}
                  />
                  <StatCard
                    icon="Maximize2"
                    iconBg="rgba(59, 130, 246, 0.08)"
                    label="Y (hloubka)"
                    value={data.dimY != null ? `${data.dimY.toFixed(2)} mm` : '-'}
                  />
                  <StatCard
                    icon="Maximize2"
                    iconBg="rgba(59, 130, 246, 0.08)"
                    label="Z (vyska)"
                    value={data.dimZ != null ? `${data.dimZ.toFixed(2)} mm` : '-'}
                  />
                  {data.volumeCm3 != null && (
                    <StatCard
                      icon="Box"
                      iconBg="rgba(59, 130, 246, 0.08)"
                      label="Objem"
                      value={`${data.volumeCm3.toFixed(2)} cm\u00B3`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Slicing results ────────────────────────────────────────── */}
            {data?.isSliced && (data.filamentG != null || data.surfaceCm2 != null) && (
              <div>
                <div style={s.sectionLabel}>Vysledky slicovani</div>
                <div style={s.grid}>
                  {data.filamentG != null && (
                    <StatCard
                      icon="Scale"
                      iconBg="rgba(251, 191, 36, 0.08)"
                      label="Hmotnost"
                      value={`${data.filamentG.toFixed(1)} g`}
                    />
                  )}
                  {data.filamentMm != null && (
                    <StatCard
                      icon="Cable"
                      iconBg="rgba(251, 191, 36, 0.08)"
                      label="Filament"
                      value={`${(data.filamentMm / 1000).toFixed(2)} m`}
                    />
                  )}
                  {data.surfaceCm2 != null && (
                    <StatCard
                      icon="Layers"
                      iconBg="rgba(251, 191, 36, 0.08)"
                      label="Povrch"
                      value={`${data.surfaceCm2.toFixed(2)} cm\u00B2`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Build plate fit ────────────────────────────────────────── */}
            {hasDims && (
              <div>
                <div style={s.sectionLabel}>Tiskova plocha ({BUILD_PLATE.x} x {BUILD_PLATE.y} x {BUILD_PLATE.z} mm)</div>

                {data.fitsAll != null && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={s.fitBadge(data.fitsAll)}>
                      <Icon
                        name={data.fitsAll ? 'CheckCircle2' : 'AlertTriangle'}
                        size={14}
                      />
                      {data.fitsAll ? 'Vejde se na tiskarnu' : 'Prekracuje rozmery!'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <PlateBar axis="X" modelMm={data.dimX} plateMm={BUILD_PLATE.x} />
                  <PlateBar axis="Y" modelMm={data.dimY} plateMm={BUILD_PLATE.y} />
                  <PlateBar axis="Z" modelMm={data.dimZ} plateMm={BUILD_PLATE.z} />
                </div>
              </div>
            )}

            {/* ── Scale suggestion ───────────────────────────────────────── */}
            {data?.scaleSuggestion && (
              <div style={s.suggestion}>
                <Icon
                  name={data.scaleSuggestion.type === 'overflow' ? 'AlertTriangle' : 'Lightbulb'}
                  size={14}
                  style={{
                    color: data.scaleSuggestion.type === 'overflow'
                      ? 'var(--forge-error, #EF4444)'
                      : 'rgba(251, 191, 36, 0.9)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
                <span>{data.scaleSuggestion.message}</span>
              </div>
            )}

            {/* ── No data yet prompt ─────────────────────────────────────── */}
            {!hasAnyData && !data?.isProcessing && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  fontSize: 'var(--forge-text-xs)',
                  color: 'var(--forge-text-muted)',
                  fontFamily: 'var(--forge-font-body)',
                }}
              >
                Spustte slicovani pro zobrazeni detailnich informaci o modelu.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelInfoPanel;

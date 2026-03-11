// src/pages/test-kalkulacka/components/MeshRepairPanel.jsx
// Mesh analysis & repair UI panel for the test-kalkulacka page.

import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { analyzeMesh, repairMesh, exportSTL } from '../../../lib/meshRepair';

/* -- Severity config ------------------------------------------------------ */

const SEVERITY_CONFIG = {
  error: {
    color: 'var(--forge-error)',
    bg: 'rgba(255, 71, 87, 0.1)',
    border: 'rgba(255, 71, 87, 0.25)',
    icon: 'AlertCircle',
    label: 'Chyba',
  },
  warning: {
    color: 'var(--forge-warning)',
    bg: 'rgba(255, 181, 71, 0.1)',
    border: 'rgba(255, 181, 71, 0.25)',
    icon: 'AlertTriangle',
    label: 'Upozorn\u011Bn\u00ED',
  },
  info: {
    color: 'var(--forge-success)',
    bg: 'rgba(0, 212, 170, 0.1)',
    border: 'rgba(0, 212, 170, 0.25)',
    icon: 'CheckCircle',
    label: 'OK',
  },
};

/* -- Forge style objects -------------------------------------------------- */

const fg = {
  panel: {
    background: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-xl)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  title: {
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '0.5rem',
  },
  statCard: {
    textAlign: 'center',
    padding: '0.5rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
  },
  statValue: {
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-mono)',
    fontSize: 'var(--forge-text-xs)',
  },
  statLabel: {
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  issuesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  issueItem: (severity) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.5rem 0.625rem',
    background: SEVERITY_CONFIG[severity]?.bg || 'transparent',
    border: '1px solid ' + (SEVERITY_CONFIG[severity]?.border || 'var(--forge-border-default)'),
    borderRadius: 'var(--forge-radius-md)',
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
  }),
  issueIcon: (severity) => ({
    flexShrink: 0,
    color: SEVERITY_CONFIG[severity]?.color || 'var(--forge-text-muted)',
    marginTop: '1px',
  }),
  issueSeverity: (severity) => ({
    fontWeight: 600,
    color: SEVERITY_CONFIG[severity]?.color || 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
    fontSize: 'var(--forge-text-xs)',
    textTransform: 'uppercase',
    flexShrink: 0,
    minWidth: '3.5rem',
  }),
  repairsSection: {
    padding: '0.75rem',
    background: 'var(--forge-bg-elevated)',
    borderRadius: 'var(--forge-radius-md)',
    border: '1px solid var(--forge-border-default)',
  },
  repairItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-body)',
    padding: '0.25rem 0',
  },
  buttonRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  progressBar: {
    width: '100%',
    height: '3px',
    background: 'var(--forge-bg-elevated)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--forge-accent-primary)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  timeLabel: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
    textAlign: 'right',
  },
};

/* -- Component ------------------------------------------------------------ */

/**
 * MeshRepairPanel - analyzes and repairs Three.js BufferGeometry meshes.
 *
 * @param {{ geometry: THREE.BufferGeometry | null, fileName: string }} props
 */
const MeshRepairPanel = ({ geometry, fileName = 'model.stl' }) => {
  const [analysis, setAnalysis] = useState(null);
  const [repairResult, setRepairResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const hasErrors = analysis?.issues?.some(i => i.severity === 'error');
  const hasWarnings = analysis?.issues?.some(i => i.severity === 'warning');
  const isClean = analysis && !hasErrors && !hasWarnings;

  const handleAnalyze = useCallback(() => {
    if (!geometry || isAnalyzing) return;
    setIsAnalyzing(true);
    setRepairResult(null);

    // Use requestAnimationFrame to avoid blocking the UI thread
    requestAnimationFrame(() => {
      try {
        const result = analyzeMesh(geometry);
        setAnalysis(result);
      } catch (e) {
        setAnalysis({
          issues: [{
            type: 'ERROR', severity: 'error',
            message: 'Chyba p\u0159i anal\u00FDze: ' + (e.message || 'Nezn\u00E1m\u00E1 chyba'),
            messageEn: 'Analysis error: ' + (e.message || 'Unknown error'),
          }],
          isWatertight: false, triangleCount: 0, vertexCount: 0,
          boundingBox: null, volume: null, surfaceArea: null, ms: 0,
        });
      } finally {
        setIsAnalyzing(false);
      }
    });
  }, [geometry, isAnalyzing]);

  const handleRepair = useCallback(() => {
    if (!geometry || isRepairing) return;
    setIsRepairing(true);

    requestAnimationFrame(() => {
      try {
        const result = repairMesh(geometry);
        setRepairResult(result);
        // Update analysis to show the after-repair state
        setAnalysis(result.issuesAfter);
      } catch (e) {
        setRepairResult({
          repairsApplied: ['Chyba: ' + (e.message || 'Oprava selhala')],
          issuesBefore: analysis,
          issuesAfter: analysis,
          ms: 0,
        });
      } finally {
        setIsRepairing(false);
      }
    });
  }, [geometry, isRepairing, analysis]);

  const handleExport = useCallback(() => {
    const geo = repairResult?.repairedGeometry || geometry;
    if (!geo) return;

    const baseName = fileName.replace(/\.[^.]+$/, '');
    const exportName = baseName + '_repaired.stl';
    exportSTL(geo, exportName);
  }, [repairResult, geometry, fileName]);

  if (!geometry) {
    return null;
  }

  return (
    <div className="tk-mesh-panel" style={fg.panel}>
      {/* Header */}
      <div style={fg.header}>
        <h3 style={fg.title}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="Search" size={14} style={{ color: 'var(--forge-accent-primary)' }} />
            Anal\u00FDza mesh
          </span>
        </h3>
        {analysis?.ms != null && (
          <span style={fg.timeLabel}>{analysis.ms.toFixed(0)} ms</span>
        )}
      </div>

      {/* Progress indicator */}
      {(isAnalyzing || isRepairing) && (
        <div style={fg.progressBar}>
          <div style={{
            ...fg.progressFill,
            width: '100%',
            animation: 'meshRepairPulse 1.5s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Action buttons */}
      <div className="tk-mesh-button-row" style={fg.buttonRow}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing || isRepairing}
        >
          {isAnalyzing ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Icon name="Loader2" size={14} className="animate-spin" />
              Analyzuji...
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Icon name="Search" size={14} />
              Analyzovat
            </span>
          )}
        </Button>

        {analysis && (hasErrors || hasWarnings) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRepair}
            disabled={isRepairing || isAnalyzing}
          >
            {isRepairing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <Icon name="Loader2" size={14} className="animate-spin" />
                Opravuji...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <Icon name="Wrench" size={14} />
                Opravit automaticky
              </span>
            )}
          </Button>
        )}

        {(repairResult?.repairedGeometry || analysis) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isRepairing || isAnalyzing}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Icon name="Download" size={14} />
              {repairResult ? 'St\u00E1hnout opraven\u00FD model' : 'St\u00E1hnout STL'}
            </span>
          </Button>
        )}
      </div>

      {/* Mesh stats */}
      {analysis && (
        <div className="tk-mesh-stats-row" style={fg.statsRow}>
          <div style={fg.statCard}>
            <p style={fg.statValue}>{(analysis.triangleCount || 0).toLocaleString('cs')}</p>
            <p style={fg.statLabel}>Troj\u00FAheln\u00EDky</p>
          </div>
          <div style={fg.statCard}>
            <p style={fg.statValue}>{(analysis.vertexCount || 0).toLocaleString('cs')}</p>
            <p style={fg.statLabel}>Vertexy</p>
          </div>
          <div style={fg.statCard}>
            <p style={{
              ...fg.statValue,
              color: analysis.isWatertight ? 'var(--forge-success)' : 'var(--forge-error)',
            }}>
              {analysis.isWatertight ? 'Ano' : 'Ne'}
            </p>
            <p style={fg.statLabel}>Vodot\u011Bsn\u00FD</p>
          </div>
          {analysis.volume != null && (
            <div style={fg.statCard}>
              <p style={fg.statValue}>{(analysis.volume / 1000).toFixed(2)}</p>
              <p style={fg.statLabel}>Objem (cm\u00B3)</p>
            </div>
          )}
          {analysis.surfaceArea != null && (
            <div style={fg.statCard}>
              <p style={fg.statValue}>{(analysis.surfaceArea / 100).toFixed(2)}</p>
              <p style={fg.statLabel}>Povrch (cm\u00B2)</p>
            </div>
          )}
        </div>
      )}

      {/* Bounding box */}
      {analysis?.boundingBox?.size && (
        <div style={{
          fontSize: 'var(--forge-text-xs)',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-mono)',
          textAlign: 'center',
        }}>
          Bounding box: {analysis.boundingBox.size.x.toFixed(1)} x {analysis.boundingBox.size.y.toFixed(1)} x {analysis.boundingBox.size.z.toFixed(1)} mm
        </div>
      )}

      {/* Issues list */}
      {analysis?.issues?.length > 0 && (
        <div style={fg.issuesList}>
          {analysis.issues.map((issue, idx) => (
            <div key={idx} style={fg.issueItem(issue.severity)}>
              <span style={fg.issueIcon(issue.severity)}>
                <Icon name={SEVERITY_CONFIG[issue.severity]?.icon || 'Info'} size={14} />
              </span>
              <span style={fg.issueSeverity(issue.severity)}>
                {SEVERITY_CONFIG[issue.severity]?.label || issue.severity}
              </span>
              <span style={{ flex: 1 }}>{issue.message}</span>
              {issue.count != null && (
                <span style={{
                  fontFamily: 'var(--forge-font-mono)',
                  color: 'var(--forge-text-muted)',
                  fontSize: 'var(--forge-text-xs)',
                  flexShrink: 0,
                }}>
                  ({issue.count})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Repair results */}
      {repairResult && (
        <div style={fg.repairsSection}>
          <p style={{
            fontFamily: 'var(--forge-font-heading)',
            fontWeight: 600,
            fontSize: 'var(--forge-text-xs)',
            color: 'var(--forge-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 0.5rem 0',
          }}>
            Proveden\u00E9 opravy
            {repairResult.ms != null && (
              <span style={{ fontWeight: 400, color: 'var(--forge-text-muted)', marginLeft: '0.5rem' }}>
                ({repairResult.ms.toFixed(0)} ms)
              </span>
            )}
          </p>
          {repairResult.repairsApplied.map((repair, idx) => (
            <div key={idx} style={fg.repairItem}>
              <Icon name="CheckCircle" size={12} style={{ color: 'var(--forge-success)', flexShrink: 0 }} />
              <span>{repair}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline keyframes for progress animation */}
      <style>{`
        @keyframes meshRepairPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MeshRepairPanel;
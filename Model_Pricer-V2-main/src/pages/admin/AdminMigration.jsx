/*
  Admin Migration — UI for localStorage → Supabase data migration.
  Provides dry-run mode, progress bar, backup/restore, and rollout controls.
*/

import React, { useState, useEffect, useCallback } from 'react';
import {
  getMigrationList,
  runMigrations,
  backupLocalStorage,
  enableSupabaseForAll,
  enableDualWriteForAll,
  rollbackToLocalStorage,
} from '../../lib/supabase/migrationRunner';
import { checkSupabaseConnection, isSupabaseAvailable } from '../../lib/supabase/client';
import { getAllStorageModes, setStorageMode } from '../../lib/supabase/featureFlags';

export default function AdminMigration() {
  const [migrations, setMigrations] = useState([]);
  const [connection, setConnection] = useState(null);
  const [storageModes, setStorageModes] = useState({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    setMigrations(getMigrationList());
    setStorageModes(getAllStorageModes());

    if (isSupabaseAvailable()) {
      checkSupabaseConnection().then(setConnection);
    } else {
      setConnection({ ok: false, error: 'Supabase not configured' });
    }
  }, []);

  const refreshModes = useCallback(() => {
    setStorageModes(getAllStorageModes());
  }, []);

  const handleDryRun = useCallback(async () => {
    setRunning(true);
    setResults(null);
    setProgress(null);

    try {
      const result = await runMigrations({
        dryRun: true,
        onProgress: setProgress,
      });
      setResults(result);
    } catch (err) {
      setResults({ ok: false, error: err.message, total: 0, migrated: 0, skipped: 0, errors: 1, results: [] });
    } finally {
      setRunning(false);
    }
  }, []);

  const handleMigrate = useCallback(async () => {
    if (!window.confirm('This will copy all localStorage data to Supabase. Continue?')) return;

    setRunning(true);
    setResults(null);
    setProgress(null);

    try {
      const result = await runMigrations({
        dryRun: false,
        onProgress: setProgress,
      });
      setResults(result);
      setMigrations(getMigrationList());
    } catch (err) {
      setResults({ ok: false, error: err.message, total: 0, migrated: 0, skipped: 0, errors: 1, results: [] });
    } finally {
      setRunning(false);
    }
  }, []);

  const handleBackup = useCallback(() => {
    const backup = backupLocalStorage();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelpricer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleSetMode = useCallback((ns, mode) => {
    setStorageMode(ns, mode);
    refreshModes();
  }, [refreshModes]);

  const handleEnableDualWrite = useCallback(() => {
    enableDualWriteForAll();
    refreshModes();
  }, [refreshModes]);

  const handleEnableSupabase = useCallback(() => {
    if (!window.confirm('Switch ALL namespaces to Supabase-only mode? localStorage will no longer be written to.')) return;
    enableSupabaseForAll();
    refreshModes();
  }, [refreshModes]);

  const handleRollback = useCallback(() => {
    if (!window.confirm('Switch ALL namespaces back to localStorage mode?')) return;
    rollbackToLocalStorage();
    refreshModes();
  }, [refreshModes]);

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const totalLocalData = migrations.reduce((s, m) => s + m.localDataSize, 0);

  const modeColor = (mode) => {
    if (mode === 'supabase') return { background: 'rgba(0,212,170,0.08)', color: 'var(--forge-success)', border: '1px solid rgba(0,212,170,0.3)' };
    if (mode === 'dual-write') return { background: 'rgba(255,181,71,0.08)', color: 'var(--forge-warning)', border: '1px solid rgba(255,181,71,0.3)' };
    return { background: 'var(--forge-bg-elevated)', color: 'var(--forge-text-secondary)', border: '1px solid var(--forge-border-default)' };
  };

  return (
    <div className="mig-page">
      <div>
        <h1 className="mig-title">Database Migration</h1>
        <p className="mig-subtitle">
          Migrate data from localStorage to Supabase PostgreSQL
        </p>
      </div>

      {/* Connection Status */}
      <div className="mig-conn-status" style={{
        padding: 16, borderRadius: 'var(--forge-radius-md)',
        border: `1px solid ${connection?.ok ? 'rgba(0,212,170,0.3)' : 'rgba(255,71,87,0.3)'}`,
        background: connection?.ok ? 'rgba(0,212,170,0.08)' : 'rgba(255,71,87,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
            background: connection?.ok ? 'var(--forge-success)' : 'var(--forge-error)',
          }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: connection?.ok ? 'var(--forge-success)' : 'var(--forge-error)' }}>
            {connection?.ok ? 'Supabase connected' : `Supabase: ${connection?.error || 'Checking...'}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mig-actions">
        <button onClick={handleBackup} className="mig-btn mig-btn-secondary">
          Download Backup
        </button>
        <button
          onClick={handleDryRun}
          disabled={running || !connection?.ok}
          className="mig-btn mig-btn-outline"
        >
          {running ? 'Running...' : 'Dry Run'}
        </button>
        <button
          onClick={handleMigrate}
          disabled={running || !connection?.ok}
          className="mig-btn mig-btn-primary"
        >
          {running ? 'Migrating...' : 'Migrate to Supabase'}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--forge-text-secondary)' }}>
            <span>{progress.migration}</span>
            <span style={{ fontFamily: 'var(--forge-font-mono)' }}>{progress.current} / {progress.total}</span>
          </div>
          <div style={{ width: '100%', background: 'var(--forge-bg-elevated)', borderRadius: 999, height: 8 }}>
            <div
              style={{
                height: 8, borderRadius: 999, background: 'var(--forge-accent-primary)',
                transition: 'width 0.3s', width: `${(progress.current / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{
          padding: 16, borderRadius: 'var(--forge-radius-md)',
          border: `1px solid ${results.ok ? 'rgba(0,212,170,0.3)' : 'rgba(255,181,71,0.3)'}`,
          background: results.ok ? 'rgba(0,212,170,0.08)' : 'rgba(255,181,71,0.08)',
        }}>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)' }}>
            {results.dryRun ? 'Dry Run Results' : 'Migration Results'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: 14 }}>
            <div><span style={{ color: 'var(--forge-text-muted)' }}>Total:</span> <span style={{ color: 'var(--forge-text-primary)' }}>{results.total}</span></div>
            <div><span style={{ color: 'var(--forge-success)' }}>Migrated:</span> <span style={{ color: 'var(--forge-text-primary)' }}>{results.migrated}</span></div>
            <div><span style={{ color: 'var(--forge-text-muted)' }}>Skipped:</span> <span style={{ color: 'var(--forge-text-primary)' }}>{results.skipped}</span></div>
            <div><span style={{ color: 'var(--forge-error)' }}>Errors:</span> <span style={{ color: 'var(--forge-text-primary)' }}>{results.errors}</span></div>
          </div>
          {results.results?.some((r) => r.status === 'error') && (
            <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
              {results.results.filter((r) => r.status === 'error').map((r) => (
                <div key={r.migrationId} style={{ fontSize: 12, color: 'var(--forge-error)', fontFamily: 'var(--forge-font-mono)' }}>
                  {r.name}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Migration Table */}
      <div>
        <h2 className="mig-section-title">Data Sources ({migrations.length})</h2>
        <p style={{ fontSize: 12, color: 'var(--forge-text-muted)', marginBottom: 12, fontFamily: 'var(--forge-font-mono)' }}>
          Total localStorage data: {formatBytes(totalLocalData)}
        </p>
        <div className="mig-table-wrap">
          <table className="mig-table">
            <thead>
              <tr>
                <th>Namespace</th>
                <th>Table</th>
                <th style={{ textAlign: 'right' }}>Size</th>
                <th style={{ textAlign: 'center' }}>Has Data</th>
              </tr>
            </thead>
            <tbody>
              {migrations.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--forge-text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>{m.namespace}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--forge-font-mono)', fontSize: 12, color: 'var(--forge-text-secondary)' }}>{m.table}</td>
                  <td style={{ textAlign: 'right', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-mono)' }}>
                    {m.hasLocalData ? formatBytes(m.localDataSize) : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {m.hasLocalData ? (
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--forge-success)' }} />
                    ) : (
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--forge-text-muted)' }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Flags / Storage Modes */}
      <div>
        <h2 className="mig-section-title">Storage Mode per Namespace</h2>
        <div className="mig-actions" style={{ marginBottom: 16 }}>
          <button onClick={handleEnableDualWrite} className="mig-btn mig-btn-warn-outline">
            Enable Dual-Write (all)
          </button>
          <button onClick={handleEnableSupabase} className="mig-btn mig-btn-success-outline">
            Switch to Supabase (all)
          </button>
          <button onClick={handleRollback} className="mig-btn mig-btn-danger-outline">
            Rollback to localStorage (all)
          </button>
        </div>

        <div className="mig-table-wrap">
          <table className="mig-table">
            <thead>
              <tr>
                <th>Namespace</th>
                <th>Current Mode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(storageModes).map(([ns, mode]) => (
                <tr key={ns}>
                  <td style={{ fontFamily: 'var(--forge-font-mono)', fontSize: 12, color: 'var(--forge-text-secondary)' }}>{ns}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
                      borderRadius: 'var(--forge-radius-sm)', fontSize: 12, fontWeight: 600,
                      fontFamily: 'var(--forge-font-tech)',
                      ...modeColor(mode),
                    }}>
                      {mode}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    {['localStorage', 'dual-write', 'supabase'].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSetMode(ns, m)}
                        disabled={mode === m}
                        style={{
                          padding: '2px 8px', fontSize: 12, borderRadius: 'var(--forge-radius-sm)',
                          border: '1px solid var(--forge-border-default)', cursor: mode === m ? 'default' : 'pointer',
                          fontFamily: 'var(--forge-font-tech)',
                          background: mode === m ? 'rgba(0,212,170,0.12)' : 'var(--forge-bg-elevated)',
                          color: mode === m ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                          fontWeight: mode === m ? 600 : 400,
                          opacity: mode === m ? 1 : 0.8,
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .mig-page {
          max-width: 1024px; margin: 0 auto; padding: 24px;
          display: grid; gap: 32px;
          background: var(--forge-bg-void); min-height: 100vh;
        }
        .mig-title {
          font-size: 24px; font-weight: 700; color: var(--forge-text-primary);
          font-family: var(--forge-font-heading); margin: 0;
        }
        .mig-subtitle {
          font-size: 14px; color: var(--forge-text-secondary); margin: 4px 0 0 0;
        }
        .mig-section-title {
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech); margin: 0 0 12px 0;
        }
        .mig-actions {
          display: flex; flex-wrap: wrap; gap: 12px;
        }
        .mig-btn {
          padding: 10px 14px; font-size: 13px; border-radius: var(--forge-radius-md);
          cursor: pointer; font-weight: 600; font-family: var(--forge-font-tech);
          letter-spacing: 0.02em;
        }
        .mig-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mig-btn-secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary);
          border: 1px solid var(--forge-border-default);
        }
        .mig-btn-secondary:hover { background: var(--forge-bg-overlay); }
        .mig-btn-outline {
          background: transparent; color: var(--forge-accent-primary);
          border: 1px solid rgba(0,212,170,0.3);
        }
        .mig-btn-outline:hover { background: rgba(0,212,170,0.06); }
        .mig-btn-primary {
          background: var(--forge-accent-primary); color: var(--forge-bg-void);
          border: 1px solid var(--forge-accent-primary);
        }
        .mig-btn-primary:hover { background: var(--forge-accent-primary-h); }
        .mig-btn-warn-outline {
          background: transparent; color: var(--forge-warning);
          border: 1px solid rgba(255,181,71,0.3);
        }
        .mig-btn-warn-outline:hover { background: rgba(255,181,71,0.06); }
        .mig-btn-success-outline {
          background: transparent; color: var(--forge-success);
          border: 1px solid rgba(0,212,170,0.3);
        }
        .mig-btn-success-outline:hover { background: rgba(0,212,170,0.06); }
        .mig-btn-danger-outline {
          background: transparent; color: var(--forge-error);
          border: 1px solid rgba(255,71,87,0.3);
        }
        .mig-btn-danger-outline:hover { background: rgba(255,71,87,0.06); }
        .mig-table-wrap {
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-lg); overflow: hidden;
        }
        .mig-table {
          width: 100%; font-size: 13px; border-collapse: collapse;
          color: var(--forge-text-secondary);
        }
        .mig-table th {
          text-align: left; padding: 8px 16px; font-weight: 800; font-size: 11px;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--forge-text-muted); background: var(--forge-bg-elevated);
          font-family: var(--forge-font-tech);
          border-bottom: 1px solid var(--forge-border-default);
        }
        .mig-table td {
          padding: 8px 16px; border-bottom: 1px solid var(--forge-border-default);
        }
        .mig-table tr:last-child td { border-bottom: none; }
        .mig-table tbody tr:hover { background: var(--forge-bg-elevated); }
      `}</style>
    </div>
  );
}

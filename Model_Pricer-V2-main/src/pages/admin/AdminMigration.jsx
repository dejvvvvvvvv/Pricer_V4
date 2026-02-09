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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Migration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Migrate data from localStorage to Supabase PostgreSQL
        </p>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${connection?.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${connection?.ok ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium text-sm">
            {connection?.ok ? 'Supabase connected' : `Supabase: ${connection?.error || 'Checking...'}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleBackup}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Download Backup
        </button>
        <button
          onClick={handleDryRun}
          disabled={running || !connection?.ok}
          className="px-4 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          {running ? 'Running...' : 'Dry Run'}
        </button>
        <button
          onClick={handleMigrate}
          disabled={running || !connection?.ok}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? 'Migrating...' : 'Migrate to Supabase'}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress.migration}</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className={`p-4 rounded-lg border ${results.ok ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className="font-medium text-sm mb-2">
            {results.dryRun ? 'Dry Run Results' : 'Migration Results'}
          </h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Total:</span> {results.total}</div>
            <div><span className="text-green-600">Migrated:</span> {results.migrated}</div>
            <div><span className="text-gray-500">Skipped:</span> {results.skipped}</div>
            <div><span className="text-red-600">Errors:</span> {results.errors}</div>
          </div>
          {results.results?.some((r) => r.status === 'error') && (
            <div className="mt-3 space-y-1">
              {results.results.filter((r) => r.status === 'error').map((r) => (
                <div key={r.migrationId} className="text-xs text-red-600">
                  {r.name}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Migration Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Data Sources ({migrations.length})</h2>
        <p className="text-xs text-gray-500 mb-3">
          Total localStorage data: {formatBytes(totalLocalData)}
        </p>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Namespace</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Table</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Size</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">Has Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {migrations.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.namespace}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-600 font-mono text-xs">{m.table}</td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {m.hasLocalData ? formatBytes(m.localDataSize) : '-'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {m.hasLocalData ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
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
        <h2 className="text-lg font-semibold mb-3">Storage Mode per Namespace</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleEnableDualWrite}
            className="px-3 py-1.5 text-xs border border-amber-300 text-amber-700 rounded hover:bg-amber-50"
          >
            Enable Dual-Write (all)
          </button>
          <button
            onClick={handleEnableSupabase}
            className="px-3 py-1.5 text-xs border border-green-300 text-green-700 rounded hover:bg-green-50"
          >
            Switch to Supabase (all)
          </button>
          <button
            onClick={handleRollback}
            className="px-3 py-1.5 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50"
          >
            Rollback to localStorage (all)
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Namespace</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Current Mode</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(storageModes).map(([ns, mode]) => (
                <tr key={ns} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{ns}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      mode === 'supabase' ? 'bg-green-100 text-green-800'
                        : mode === 'dual-write' ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mode}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-1">
                    {['localStorage', 'dual-write', 'supabase'].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSetMode(ns, m)}
                        disabled={mode === m}
                        className={`px-2 py-0.5 text-xs rounded ${
                          mode === m ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
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
    </div>
  );
}

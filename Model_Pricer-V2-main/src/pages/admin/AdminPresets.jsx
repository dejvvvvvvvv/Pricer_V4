import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { readTenantJson, writeTenantJson } from '../../utils/adminTenantStorage';
import { deletePreset, listPresets, patchPreset, setDefaultPreset, uploadPreset } from '../../services/presetsApi';

// =============================================================
// Admin / Presets (backend sync)
// Checkpoint 2: full CRUD via backend + offline editable fallback (localStorage)
// =============================================================

const LOCAL_FALLBACK_NAMESPACE = 'presets:v1';

function pickLang(language, cs, en) {
  return String(language || '').toLowerCase().startsWith('en') ? en : cs;
}

function normalizePreset(raw) {
  const id = String(raw?.id || '').trim();
  const name = String(raw?.name || raw?.title || id || '').trim();

  const orderRaw = raw?.order ?? raw?.priority ?? raw?.sort;
  const orderNum = Number(orderRaw);
  const order = Number.isFinite(orderNum) ? orderNum : 0;

  const visibleInWidgetRaw =
    raw?.visibleInWidget ?? raw?.visible_in_widget ?? raw?.widgetVisible ?? raw?.visible;
  const visibleInWidget = Boolean(visibleInWidgetRaw);

  const createdAt = raw?.createdAt ? String(raw.createdAt) : '';
  const updatedAt = raw?.updatedAt ? String(raw.updatedAt) : '';
  const sizeBytes = Number.isFinite(Number(raw?.sizeBytes)) ? Number(raw.sizeBytes) : null;

  return { id, name, order, visibleInWidget, createdAt, updatedAt, sizeBytes };
}

function readLocalFallback() {
  // Fallback is VIEW-ONLY and may come from older localStorage formats.
  const raw = readTenantJson(LOCAL_FALLBACK_NAMESPACE, []);

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.presets)
      ? raw.presets
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

  const presets = list.map(normalizePreset).filter((p) => p.id);

  let defaultPresetId = null;
  if (raw && !Array.isArray(raw) && typeof raw?.defaultPresetId === 'string' && raw.defaultPresetId) {
    defaultPresetId = raw.defaultPresetId;
  } else {
    const selected = list.find((p) => p?.is_default_selected);
    if (selected?.id) defaultPresetId = String(selected.id);
  }

  return { presets, defaultPresetId: defaultPresetId || null };
}

function writeLocalFallback({ presets, defaultPresetId }) {
  try {
    writeTenantJson(LOCAL_FALLBACK_NAMESPACE, {
      presets: Array.isArray(presets) ? presets : [],
      defaultPresetId: defaultPresetId || null,
    });
  } catch {
    // ignore
  }
}

export default function AdminPresets() {
  const { language } = useLanguage();

  const strings = useMemo(
    () => ({
      title: pickLang(language, 'Presety', 'Presets'),
      subtitle: pickLang(
        language,
        'Správa presetů (.ini) uložených na serveru. Presety se používají pro slicování v PrusaSlicer CLI.',
        'Manage server-stored presets (.ini). Presets are used for slicing in PrusaSlicer CLI.'
      ),
      loading: pickLang(language, 'Načítám presety…', 'Loading presets…'),
      refresh: pickLang(language, 'Obnovit', 'Refresh'),
      uploadPreset: pickLang(language, 'Nahrát preset', 'Upload preset'),
      saveChanges: pickLang(language, 'Uložit změny', 'Save changes'),
      setAsDefault: pickLang(language, 'Nastavit jako výchozí', 'Set as default'),
      delete: pickLang(language, 'Smazat', 'Delete'),
      visibleInWidget: pickLang(language, 'Viditelný ve widgetu', 'Visible in widget'),
      namePlaceholder: pickLang(language, 'Název presetu', 'Preset name'),
      orderLabel: pickLang(language, 'Pořadí', 'Order'),
      fileLabel: pickLang(language, 'Soubor (.ini)', 'File (.ini)'),
      offlineBanner: pickLang(
        language,
        'Offline režim: Backend není dostupný. Změny se ukládají lokálně do prohlížeče (localStorage), ne na server.',
        "Offline mode: Backend is unreachable. Changes are saved locally in your browser (localStorage), not to the server."
      ),
      offlineActionTooltip: pickLang(
        language,
        'Offline režim — změny se ukládají lokálně.',
        'Offline mode — changes are saved locally.'
      ),
      backendErrorLabel: pickLang(language, 'Chyba:', 'Error:'),
      emptyTitle: pickLang(language, 'Zatím nemáš žádné presety.', 'No presets yet.'),
      emptyHint: pickLang(
        language,
        'Jakmile bude backend dostupný, přidáš presety nahráním .ini.',
        'Once backend is available, you can add presets by uploading an .ini.'
      ),
      colName: pickLang(language, 'Název', 'Name'),
      colOrder: pickLang(language, 'Pořadí', 'Order'),
      colWidget: pickLang(language, 'Widget', 'Widget'),
      colActions: pickLang(language, 'Akce', 'Actions'),
      badgeDefault: pickLang(language, 'Výchozí', 'Default'),
      badgeVisible: pickLang(language, 'Viditelný', 'Visible'),
      statusOffline: pickLang(language, 'Offline', 'Offline'),
      statusOnline: pickLang(language, 'Online', 'Online'),
      toastFail: pickLang(language, 'Operace se nezdařila:', 'Operation failed:'),
      toastSaved: pickLang(language, 'Preset uložen.', 'Preset saved.'),
      toastDefaultSet: pickLang(language, 'Výchozí preset nastaven.', 'Default preset set.'),
      toastDeleted: pickLang(language, 'Preset smazán.', 'Preset deleted.'),
      toastDeletedNewDefault: pickLang(language, 'Preset smazán. Nový výchozí:', 'Preset deleted. New default:'),
      toastDeletedNoDefault: pickLang(
        language,
        'Preset smazán. Žádný výchozí preset — používám default profil.',
        'Preset deleted. No default preset — using default profile.'
      ),
      deleteDefaultTitle: pickLang(language, 'Smazat výchozí preset?', 'Delete default preset?'),
      deleteDefaultBody: pickLang(
        language,
        'Po smazání se výchozí preset automaticky přepne na preset s nejvyšší prioritou.\nPokud žádný další preset nezůstane, budou použity default parametry z Admin/parameters (backend PRUSA_DEFAULT_INI), dokud nepřidáš nový preset.',
        'After deletion, the default preset will switch to the highest-priority preset.\nIf no presets remain, defaults from Admin/parameters (backend PRUSA_DEFAULT_INI) will be used until you add a new preset.'
      ),
      confirmYesDelete: pickLang(language, 'Ano, smazat', 'Yes, delete'),
      confirmCancel: pickLang(language, 'Zrušit', 'Cancel'),
      hintMax5mb: pickLang(language, 'Max 5 MB. Pouze .ini.', 'Max 5 MB. .ini only.'),
    }),
    [language]
  );

  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [presets, setPresets] = useState([]);
  const [defaultPresetId, setDefaultPresetId] = useState(null);

  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadOrder, setUploadOrder] = useState(0);
  const [uploadVisibleInWidget, setUploadVisibleInWidget] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Inline edits per preset id
  const [edits, setEdits] = useState({});
  const [savingById, setSavingById] = useState({});
  const [defaultingById, setDefaultingById] = useState({});
  const [deletingById, setDeletingById] = useState({});

  // Delete default modal
  const [deleteModal, setDeleteModal] = useState({ open: false, presetId: null });

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (kind, msg) => {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const showError = (message) => {
    showToast('err', `${strings.toastFail} ${message || 'Unknown error'}`);
  };

  const load = async () => {
    setLoading(true);
    setBackendError('');

    const res = await listPresets();
    if (res.ok) {
      const payload = res.data || {};
      const list = Array.isArray(payload.presets)
        ? payload.presets
        : Array.isArray(payload.items)
          ? payload.items
          : [];

      const mapped = list.map(normalizePreset).filter((p) => p.id);
      const def = payload.defaultPresetId || payload.defaultPreset || payload.default || null;

      setPresets(mapped);
      setDefaultPresetId(def ? String(def) : null);
      setOfflineMode(false);
      setBackendError('');

      // Cache last known server state for offline view.
      writeLocalFallback({ presets: mapped, defaultPresetId: def ? String(def) : null });
    } else {
      const local = readLocalFallback();
      setPresets(local.presets);
      setDefaultPresetId(local.defaultPresetId);
      setOfflineMode(true);
      setBackendError(res.message || 'Backend unreachable');
      showToast('err', `${strings.toastFail} ${res.message || 'Backend unreachable'}`);
    }

    setLoading(false);
  };

  // Keep edits in sync with loaded presets (do not overwrite in-progress edits).
  useEffect(() => {
    setEdits((prev) => {
      const next = { ...prev };
      presets.forEach((p) => {
        if (!next[p.id]) {
          next[p.id] = { name: p.name || '', order: p.order || 0, visibleInWidget: !!p.visibleInWidget };
        }
      });
      // Remove edits for presets that disappeared.
      Object.keys(next).forEach((id) => {
        if (!presets.some((p) => p.id === id)) delete next[id];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presets]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist edits in offline mode so refresh keeps the state.
  useEffect(() => {
    if (!offlineMode) return;
    if (loading) return;
    writeLocalFallback({ presets, defaultPresetId });
  }, [offlineMode, loading, presets, defaultPresetId]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const statusLabel = offlineMode ? strings.statusOffline : strings.statusOnline;

  const actionsDisabled = loading;
  const actionsTitle = offlineMode ? strings.offlineActionTooltip : undefined;

  const onUpload = async () => {
    if (actionsDisabled) return;
    if (!uploadFile) {
      showError(pickLang(language, 'Vyber .ini soubor.', 'Select an .ini file.'));
      return;
    }
    setUploading(true);
    const meta = {
      name: uploadName?.trim() || undefined,
      order: Number.isFinite(Number(uploadOrder)) ? Number(uploadOrder) : 0,
      visibleInWidget: !!uploadVisibleInWidget,
    };

    // Offline mode: store changes locally (localStorage) so the page is still usable without backend.
    if (offlineMode) {
      const nowIso = new Date().toISOString();
      const id = `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const baseFromFile = uploadFile?.name ? String(uploadFile.name).replace(/\.ini$/i, '') : '';
      const nextPreset = normalizePreset({
        id,
        name: meta.name || baseFromFile || id,
        order: meta.order ?? 0,
        visibleInWidget: meta.visibleInWidget ?? true,
        createdAt: nowIso,
        updatedAt: nowIso,
        sizeBytes: uploadFile?.size ?? null,
      });

      setPresets((prev) => [...prev, nextPreset]);

      showToast('ok', strings.toastSaved);
      setUploadFile(null);
      setUploadName('');
      setUploadOrder(0);
      setUploadVisibleInWidget(true);
      setUploading(false);
      return;
    }

    const res = await uploadPreset(uploadFile, meta);
    if (!res.ok) {
      showError(res.message);
      setUploading(false);
      return;
    }
    showToast('ok', strings.toastSaved);
    setUploadFile(null);
    setUploadName('');
    setUploadOrder(0);
    setUploadVisibleInWidget(true);
    await load();
    setUploading(false);
  };

  const isDirty = (id) => {
    const p = presets.find((x) => x.id === id);
    const e = edits[id];
    if (!p || !e) return false;
    return (
      String(e.name || '').trim() !== String(p.name || '').trim() ||
      Number(e.order || 0) !== Number(p.order || 0) ||
      Boolean(e.visibleInWidget) !== Boolean(p.visibleInWidget)
    );
  };

  const onSave = async (id) => {
    if (actionsDisabled) return;
    const e = edits[id];
    if (!e) return;
    setSavingById((s) => ({ ...s, [id]: true }));
    if (offlineMode) {
      const nowIso = new Date().toISOString();
      const nextName = String(e.name || '').trim();
      const nextOrder = Number.parseInt(String(e.order ?? 0), 10) || 0;
      const nextVisible = !!e.visibleInWidget;

      setPresets((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, name: nextName, order: nextOrder, visibleInWidget: nextVisible, updatedAt: nowIso } : p
        )
      );

      showToast('ok', strings.toastSaved);
      setSavingById((s) => ({ ...s, [id]: false }));
      return;
    }

    const res = await patchPreset(id, {
      name: String(e.name || '').trim(),
      order: Number.parseInt(String(e.order ?? 0), 10) || 0,
      visibleInWidget: !!e.visibleInWidget,
    });
    if (!res.ok) {
      showError(res.message);
      setSavingById((s) => ({ ...s, [id]: false }));
      return;
    }
    showToast('ok', strings.toastSaved);
    await load();
    setSavingById((s) => ({ ...s, [id]: false }));
  };

  const onSetDefault = async (id) => {
    if (actionsDisabled) return;
    setDefaultingById((s) => ({ ...s, [id]: true }));
    if (offlineMode) {
      setDefaultPresetId(String(id));
      showToast('ok', strings.toastDefaultSet);
      setDefaultingById((s) => ({ ...s, [id]: false }));
      return;
    }

    const res = await setDefaultPreset(id);
    if (!res.ok) {
      showError(res.message);
      setDefaultingById((s) => ({ ...s, [id]: false }));
      return;
    }
    showToast('ok', strings.toastDefaultSet);
    await load();
    setDefaultingById((s) => ({ ...s, [id]: false }));
  };

  const runDelete = async (id) => {
    if (actionsDisabled) return;
    setDeletingById((s) => ({ ...s, [id]: true }));
    if (offlineMode) {
      // Local delete behavior: if deleting default, pick next highest-priority preset as new default.
      const removedId = String(id);
      const nextPresets = presets.filter((p) => String(p.id) !== removedId);

      let nextDefaultId = defaultPresetId ? String(defaultPresetId) : null;
      const wasDefault = nextDefaultId && removedId === nextDefaultId;

      if (wasDefault) {
        const sorted = nextPresets
          .slice()
          .sort((a, b) => {
            const byOrder = (b.order || 0) - (a.order || 0);
            if (byOrder !== 0) return byOrder;
            return String(a.name).localeCompare(String(b.name));
          });
        nextDefaultId = sorted[0]?.id ? String(sorted[0].id) : null;
      }

      setPresets(nextPresets);
      setDefaultPresetId(nextDefaultId);

      if (!nextDefaultId) {
        showToast('ok', strings.toastDeletedNoDefault);
      } else if (wasDefault && removedId !== nextDefaultId) {
        const newName = normalizePreset(nextPresets.find((p) => String(p?.id) === String(nextDefaultId))).name;
        showToast('ok', `${strings.toastDeletedNewDefault} ${newName || nextDefaultId}`);
      } else {
        showToast('ok', strings.toastDeleted);
      }

      setDeletingById((s) => ({ ...s, [id]: false }));
      return;
    }

    const res = await deletePreset(id);
    if (!res.ok) {
      showError(res.message);
      setDeletingById((s) => ({ ...s, [id]: false }));
      return;
    }

    const previousDefaultId = res.data?.previousDefaultId || null;
    const newDefaultId = res.data?.newDefaultId || res.data?.index?.defaultPresetId || null;

    // Prefer server-provided index to build the toast text (no reliance on async state updates).
    const indexPresets = Array.isArray(res.data?.index?.presets) ? res.data.index.presets : [];
    const newDefaultName = newDefaultId
      ? normalizePreset(indexPresets.find((p) => String(p?.id) === String(newDefaultId))).name
      : '';

    // Refresh UI state.
    await load();

    if (!newDefaultId) {
      showToast('ok', strings.toastDeletedNoDefault);
    } else if (previousDefaultId && String(previousDefaultId) !== String(newDefaultId)) {
      showToast('ok', `${strings.toastDeletedNewDefault} ${newDefaultName || newDefaultId}`);
    } else {
      showToast('ok', strings.toastDeleted);
    }

    setDeletingById((s) => ({ ...s, [id]: false }));
  };

  const onDelete = async (id) => {
    if (!id) return;
    const isDef = defaultPresetId && id === defaultPresetId;
    if (isDef) {
      setDeleteModal({ open: true, presetId: id });
      return;
    }
    await runDelete(id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="titleRow">
            <h1 className="title">{strings.title}</h1>
            <span className={`statusDot ${offlineMode ? 'offline' : 'online'}`} />
            <span className={`statusText ${offlineMode ? 'offline' : 'online'}`}>{statusLabel}</span>
          </div>
          <p className="subtitle">{strings.subtitle}</p>
        </div>

        <div className="right">
          <button className="btn" onClick={load} disabled={loading}>
            <Icon name="RefreshCcw" size={16} />
            {strings.refresh}
          </button>
        </div>
      </div>

      {offlineMode ? (
        <div className="banner">
          <Icon name="WifiOff" size={16} />
          <div>
            <div className="bannerTitle">{strings.offlineBanner}</div>
            {backendError ? (
              <div className="bannerMeta">
                <span className="muted">{strings.backendErrorLabel}</span> {backendError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="card pad" style={{ marginTop: 12 }}>
        <div className="uploadGrid">
          <div className="field">
            <div className="label">{strings.fileLabel}</div>
            <input
              className="input"
              type="file"
              accept=".ini"
              disabled={actionsDisabled || uploading}
              title={actionsTitle}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setUploadFile(f);
                if (f && !uploadName) {
                  const base = String(f.name || '').replace(/\.ini$/i, '');
                  setUploadName(base);
                }
              }}
            />
            <div className="hint">{strings.hintMax5mb}</div>
          </div>

          <div className="field">
            <div className="label">{strings.colName}</div>
            <input
              className="input"
              type="text"
              placeholder={strings.namePlaceholder}
              value={uploadName}
              disabled={actionsDisabled || uploading}
              title={actionsTitle}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="label">{strings.orderLabel}</div>
            <input
              className="input"
              type="number"
              value={uploadOrder}
              disabled={actionsDisabled || uploading}
              title={actionsTitle}
              onChange={(e) => setUploadOrder(Number(e.target.value))}
            />
          </div>

          <div className="field" style={{ alignSelf: 'end' }}>
            <label className="checkRow" title={actionsTitle}>
              <input
                type="checkbox"
                checked={uploadVisibleInWidget}
                disabled={actionsDisabled || uploading}
                onChange={(e) => setUploadVisibleInWidget(e.target.checked)}
              />
              <span>{strings.visibleInWidget}</span>
            </label>
          </div>

          <div className="field" style={{ alignSelf: 'end', justifySelf: 'end' }}>
            <button
              className="btn primary"
              onClick={onUpload}
              disabled={actionsDisabled || uploading}
              title={actionsTitle}
            >
              {uploading ? <Icon name="Loader2" size={16} className="spin" /> : <Icon name="Upload" size={16} />}
              {strings.uploadPreset}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <Icon name="Loader2" size={18} className="spin" />
          <span>{strings.loading}</span>
        </div>
      ) : presets.length === 0 ? (
        <div className="empty">
          <p>{strings.emptyTitle}</p>
          <p className="muted">{strings.emptyHint}</p>
        </div>
      ) : (
        <div className="card">
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{strings.colName}</th>
                  <th style={{ width: 120 }}>{strings.colOrder}</th>
                  <th style={{ width: 160 }}>{strings.colWidget}</th>
                  <th style={{ width: 300 }}>{strings.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {presets
                  .slice()
                  .sort((a, b) => {
                    const byOrder = (b.order || 0) - (a.order || 0);
                    if (byOrder !== 0) return byOrder;
                    return String(a.name).localeCompare(String(b.name));
                  })
                  .map((p) => {
                    const isDefault = defaultPresetId && p.id === defaultPresetId;
                    const e = edits[p.id] || { name: p.name || '', order: p.order || 0, visibleInWidget: !!p.visibleInWidget };
                    const dirty = isDirty(p.id);
                    const saving = !!savingById[p.id];
                    const defaulting = !!defaultingById[p.id];
                    const deleting = !!deletingById[p.id];
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="nameCell">
                            <div className="nameLine">
                              <input
                                className="input inline"
                                value={e.name}
                                disabled={actionsDisabled}
                                title={actionsTitle}
                                onChange={(ev) =>
                                  setEdits((s) => ({
                                    ...s,
                                    [p.id]: { ...e, name: ev.target.value },
                                  }))
                                }
                              />
                              {isDefault ? <span className="badge green">{strings.badgeDefault}</span> : null}
                              {p.visibleInWidget ? (
                                <span className="badge blue">{strings.badgeVisible}</span>
                              ) : null}
                            </div>
                            <div className="muted small">ID: {p.id}</div>
                          </div>
                        </td>
                        <td>
                          <input
                            className="input small mono"
                            type="number"
                            value={Number.isFinite(Number(e.order)) ? e.order : 0}
                            disabled={actionsDisabled}
                            title={actionsTitle}
                            onChange={(ev) =>
                              setEdits((s) => ({
                                ...s,
                                [p.id]: { ...e, order: Number(ev.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <label className="checkRow" title={actionsTitle}>
                            <input
                              type="checkbox"
                              checked={!!e.visibleInWidget}
                              disabled={actionsDisabled}
                              onChange={(ev) =>
                                setEdits((s) => ({
                                  ...s,
                                  [p.id]: { ...e, visibleInWidget: ev.target.checked },
                                }))
                              }
                            />
                            <span className="mono">{e.visibleInWidget ? 'true' : 'false'}</span>
                          </label>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="btnSmall"
                              onClick={() => onSave(p.id)}
                              disabled={actionsDisabled || !dirty || saving || deleting}
                              title={actionsTitle}
                            >
                              {saving ? <Icon name="Loader2" size={16} className="spin" /> : <Icon name="Save" size={16} />}
                              {strings.saveChanges}
                            </button>

                            <button
                              className="btnSmall"
                              onClick={() => onSetDefault(p.id)}
                              disabled={actionsDisabled || isDefault || defaulting || deleting}
                              title={actionsTitle}
                            >
                              {defaulting ? <Icon name="Loader2" size={16} className="spin" /> : <Icon name="Star" size={16} />}
                              {strings.setAsDefault}
                            </button>

                            <button
                              className="btnSmall danger"
                              onClick={() => onDelete(p.id)}
                              disabled={actionsDisabled || deleting || saving || defaulting}
                              title={actionsTitle}
                            >
                              {deleting ? <Icon name="Loader2" size={16} className="spin" /> : <Icon name="Trash2" size={16} />}
                              {strings.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteModal.open ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">{strings.deleteDefaultTitle}</div>
              <button
                className="iconBtn"
                onClick={() => setDeleteModal({ open: false, presetId: null })}
              >
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="modalBody">
              <pre className="modalText">{strings.deleteDefaultBody}</pre>
            </div>
            <div className="modalFooter">
              <button className="btn" onClick={() => setDeleteModal({ open: false, presetId: null })}>
                {strings.confirmCancel}
              </button>
              <button
                className="btn danger"
                onClick={async () => {
                  const id = deleteModal.presetId;
                  setDeleteModal({ open: false, presetId: null });
                  if (id) await runDelete(id);
                }}
              >
                <Icon name="Trash2" size={16} />
                {strings.confirmYesDelete}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toast.kind === 'err' ? 'toastErr' : 'toastOk'}`}>
          {toast.kind === 'err' ? <Icon name="XCircle" size={18} /> : <Icon name="CheckCircle" size={18} />}
          <span>{toast.msg}</span>
        </div>
      ) : null}

      <style>{css}</style>
    </div>
  );
}

const css = `
  .page { padding: 20px; }

  .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom: 12px; }

  .titleRow { display:flex; align-items:center; gap:10px; }
  .title { font-size: 22px; font-weight: 700; line-height:1.1; margin:0; }
  .subtitle { margin: 6px 0 0; color: rgba(0,0,0,0.6); max-width: 920px; }

  .right { display:flex; gap:10px; }

  .statusDot { width: 10px; height:10px; border-radius: 50%; display:inline-block; margin-top:2px; }
  .statusDot.online { background: #22c55e; }
  .statusDot.offline { background: #f59e0b; }
  .statusText { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.1); }
  .statusText.online { background: rgba(34,197,94,0.12); color: #166534; }
  .statusText.offline { background: rgba(245,158,11,0.14); color: #92400e; }

  .btn { display:inline-flex; align-items:center; gap:8px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.12); background: #fff; cursor:pointer; font-weight: 600; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn.primary { background: rgba(59,130,246,0.10); border-color: rgba(59,130,246,0.25); }
  .btn.danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); }

  .btnSmall { display:inline-flex; align-items:center; gap:8px; padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.12); background: #fff; cursor:pointer; font-weight: 700; font-size: 12px; }
  .btnSmall:disabled { opacity: 0.6; cursor: not-allowed; }
  .btnSmall.danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); }

  .banner { display:flex; gap:10px; align-items:flex-start; border: 1px solid rgba(245,158,11,0.35); background: rgba(245,158,11,0.10); padding: 10px 12px; border-radius: 12px; margin: 12px 0; }
  .bannerTitle { font-weight: 600; }
  .bannerMeta { margin-top: 4px; font-size: 12px; }

  .loading { display:flex; align-items:center; gap:10px; padding: 14px 0; color: rgba(0,0,0,0.75); }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .empty { padding: 18px 0; }
  .muted { color: rgba(0,0,0,0.6); }
  .muted.small { font-size: 12px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

  .card { border: 1px solid rgba(0,0,0,0.10); border-radius: 16px; background: #fff; overflow: hidden; }
  .card.pad { padding: 14px; overflow: visible; }
  .tableWrap { width: 100%; overflow: auto; }
  .table { width: 100%; border-collapse: collapse; }
  .table thead th { text-align:left; font-size: 12px; letter-spacing: .02em; text-transform: uppercase; color: rgba(0,0,0,0.55); padding: 12px 14px; border-bottom: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); }
  .table tbody td { padding: 12px 14px; border-bottom: 1px solid rgba(0,0,0,0.06); vertical-align: top; }
  .table tbody tr:hover td { background: rgba(0,0,0,0.02); }

  .nameCell { display:flex; flex-direction:column; gap:3px; }
  .nameLine { display:flex; align-items:center; gap:8px; flex-wrap: wrap; }
  .name { font-weight: 700; }

  .uploadGrid { display:grid; grid-template-columns: 1.2fr 1.2fr 0.5fr 0.9fr auto; gap: 12px; align-items: start; }
  @media (max-width: 980px) { .uploadGrid { grid-template-columns: 1fr; } }
  .field { display:flex; flex-direction:column; gap:6px; }
  .label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: rgba(0,0,0,0.55); }
  .hint { font-size: 12px; color: rgba(0,0,0,0.55); }
  .input { width: 100%; padding: 9px 10px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.14); background: #fff; }
  .input:disabled { background: rgba(0,0,0,0.02); cursor: not-allowed; }
  .input.inline { font-weight: 800; }
  .input.small { padding: 7px 8px; }

  .checkRow { display:inline-flex; align-items:center; gap:8px; user-select:none; }

  .actions { display:flex; gap:10px; flex-wrap: wrap; }

  .badge { display:inline-flex; align-items:center; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid rgba(0,0,0,0.10); }
  .badge.green { background: rgba(34,197,94,0.12); color: #166534; border-color: rgba(34,197,94,0.28); }
  .badge.blue { background: rgba(59,130,246,0.12); color: #1d4ed8; border-color: rgba(59,130,246,0.26); }

  /* toast */
  .toast { position: fixed; right: 16px; bottom: 16px; z-index: 1000; display:flex; align-items:center; gap:10px; padding: 10px 12px; border-radius: 12px; background: #fff; border: 1px solid rgba(0,0,0,0.12); box-shadow: 0 10px 30px rgba(0,0,0,0.10); max-width: min(520px, calc(100vw - 32px)); }
  .toastOk { border-color: rgba(34,197,94,0.35); }
  .toastErr { border-color: rgba(239,68,68,0.35); }

  /* modal */
  .modalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.30); display:flex; align-items:center; justify-content:center; padding: 16px; z-index: 1100; }
  .modal { width: min(720px, 100%); background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.12); box-shadow: 0 16px 50px rgba(0,0,0,0.18); overflow: hidden; }
  .modalHeader { display:flex; align-items:center; justify-content:space-between; padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,0.08); }
  .modalTitle { font-weight: 900; font-size: 14px; }
  .iconBtn { width: 34px; height: 34px; display:inline-flex; align-items:center; justify-content:center; border-radius: 10px; border: 1px solid rgba(0,0,0,0.12); background: #fff; cursor:pointer; }
  .modalBody { padding: 14px 16px; }
  .modalText { white-space: pre-wrap; margin: 0; font-family: inherit; color: rgba(0,0,0,0.75); line-height: 1.5; }
  .modalFooter { display:flex; justify-content:flex-end; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); }
`;

/**
 * DataImportWizard — 5-step modal wizard for importing configuration data.
 *
 * Steps:
 *   1. Choose what to import (materials/pricing, fees, branding, presets)
 *   2. Upload file (JSON/CSV) or manual entry
 *   3. Preview & map data — show conflicts, choose merge/replace per section
 *   4. Confirm and import
 *   5. Success summary
 *
 * Uses existing storage helpers for writing — never touches localStorage directly.
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import ForgeDialog from '../../../components/ui/forge/ForgeDialog';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getTenantId, readTenantJson, writeTenantJson } from '../../../utils/adminTenantStorage';
import { loadPricingConfigV3, savePricingConfigV3 } from '../../../utils/adminPricingStorage';
import { loadFeesConfigV3, saveFeesConfigV3 } from '../../../utils/adminFeesStorage';
import { getBranding, saveBranding } from '../../../utils/adminBrandingWidgetStorage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMPORT_SECTIONS = [
  { key: 'pricing',  label: 'Cenova konfigurace (materialy, ceny)',  icon: 'Calculator', color: '#8B5CF6' },
  { key: 'fees',     label: 'Poplatky a priplatky',                  icon: 'Receipt',    color: '#F59E0B' },
  { key: 'branding', label: 'Branding (nazev, logo, barvy)',         icon: 'Palette',    color: '#EC4899' },
  { key: 'presets',  label: 'Tiskove presety',                       icon: 'Settings',   color: '#0EA5E9' },
];

const MERGE_OPTIONS = [
  { value: 'merge',   label: 'Sloucit (zachovat existujici, pridat nove)', icon: 'GitMerge' },
  { value: 'replace', label: 'Nahradit (prepsat existujici data)',          icon: 'Replace' },
];

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Auto-detect separator
  const sep = lines[0].includes(';') ? ';' : ',';

  const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateImportData(section, data) {
  const warnings = [];
  const errors = [];

  if (data == null || (typeof data === 'object' && Object.keys(data).length === 0)) {
    errors.push(`Sekce "${section}" je prazdna nebo neobsahuje zadna data.`);
    return { warnings, errors, valid: false };
  }

  if (section === 'pricing') {
    if (!data.materials && !data.materialPrices && !Array.isArray(data)) {
      warnings.push('Data nemaji ocekavanou strukturu pro pricing (chybi "materials" nebo "materialPrices").');
    }
  }

  if (section === 'fees') {
    if (!Array.isArray(data) && !Array.isArray(data?.fees)) {
      warnings.push('Data pro poplatky by mela byt pole nebo objekt s polem "fees".');
    }
  }

  if (section === 'branding') {
    if (typeof data !== 'object') {
      errors.push('Branding data musi byt objekt.');
      return { warnings, errors, valid: false };
    }
  }

  if (section === 'presets') {
    if (!Array.isArray(data)) {
      warnings.push('Presety by mely byt pole. Budou zabaleny do pole.');
    }
  }

  return { warnings, errors, valid: errors.length === 0 };
}

function detectConflicts(section, newData) {
  const conflicts = [];
  const tenantId = getTenantId();

  if (section === 'pricing') {
    const existing = loadPricingConfigV3();
    if (existing && (existing.materials?.length > 0 || existing.materialPrices)) {
      conflicts.push('Existujici cenova konfigurace bude ovlivnena.');
    }
  }

  if (section === 'fees') {
    const existing = loadFeesConfigV3();
    const feesList = Array.isArray(existing) ? existing : (Array.isArray(existing?.fees) ? existing.fees : []);
    if (feesList.length > 0) {
      conflicts.push(`Existuje ${feesList.length} poplatku ktere mohou byt ovlivneny.`);
    }
  }

  if (section === 'branding') {
    const existing = getBranding(tenantId);
    if (existing && existing.businessName) {
      conflicts.push(`Existujici branding "${existing.businessName}" bude ovlivnen.`);
    }
  }

  if (section === 'presets') {
    const existing = readTenantJson('presets:v1', []);
    if (Array.isArray(existing) && existing.length > 0) {
      conflicts.push(`Existuje ${existing.length} presetu ktere mohou byt ovlivneny.`);
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// CSV-to-section mapper
// ---------------------------------------------------------------------------

function mapCSVToSection(section, csvData) {
  const { headers, rows } = csvData;

  if (section === 'pricing') {
    // Expect columns like: name/material, price_per_gram/price, density, type
    const nameCol = headers.find(h => /^(name|material|nazev|material_name)$/i.test(h));
    const priceCol = headers.find(h => /^(price|price_per_gram|cena|cena_za_gram)$/i.test(h));
    const densityCol = headers.find(h => /^(density|hustota)$/i.test(h));
    const typeCol = headers.find(h => /^(type|typ|material_type)$/i.test(h));

    if (!nameCol) {
      return { data: null, error: 'CSV neobsahuje sloupec pro nazev materialu (ocekavany: name, material, nazev).' };
    }

    const materials = rows.map(row => ({
      name: row[nameCol] || '',
      price_per_gram: priceCol ? parseFloat(row[priceCol]) || 0 : 0,
      density: densityCol ? parseFloat(row[densityCol]) || 1.24 : 1.24,
      type: typeCol ? row[typeCol] : 'PLA',
      colors: [],
    })).filter(m => m.name);

    return { data: { materials }, error: null };
  }

  if (section === 'fees') {
    const nameCol = headers.find(h => /^(name|nazev|fee_name|label)$/i.test(h));
    const valueCol = headers.find(h => /^(value|hodnota|amount|castka|cena)$/i.test(h));
    const typeCol = headers.find(h => /^(type|typ|fee_type|unit)$/i.test(h));

    if (!nameCol || !valueCol) {
      return { data: null, error: 'CSV pro poplatky musi obsahovat sloupce pro nazev a hodnotu.' };
    }

    const fees = rows.map(row => ({
      name: row[nameCol] || '',
      value: parseFloat(row[valueCol]) || 0,
      type: typeCol ? row[typeCol] : 'fixed',
      enabled: true,
    })).filter(f => f.name);

    return { data: { fees }, error: null };
  }

  return { data: null, error: `CSV import pro sekci "${section}" neni podporovan. Pouzijte JSON.` };
}

// ---------------------------------------------------------------------------
// Apply import
// ---------------------------------------------------------------------------

function applyImport(section, data, strategy) {
  const tenantId = getTenantId();

  if (section === 'pricing') {
    if (strategy === 'replace') {
      savePricingConfigV3(data);
    } else {
      // Merge: load existing, combine materials
      const existing = loadPricingConfigV3() || {};
      const existingMaterials = existing.materials || [];
      const newMaterials = data.materials || [];

      const merged = [...existingMaterials];
      for (const nm of newMaterials) {
        const existIdx = merged.findIndex(m =>
          (m.name || '').toLowerCase() === (nm.name || '').toLowerCase()
        );
        if (existIdx === -1) {
          merged.push(nm);
        }
        // Skip duplicates when merging (keep existing)
      }
      savePricingConfigV3({ ...existing, ...data, materials: merged });
    }
    return true;
  }

  if (section === 'fees') {
    const rawFees = Array.isArray(data) ? data : (Array.isArray(data?.fees) ? data.fees : [data]);
    if (strategy === 'replace') {
      saveFeesConfigV3({ fees: rawFees });
    } else {
      const existing = loadFeesConfigV3();
      const existingFees = Array.isArray(existing) ? existing : (Array.isArray(existing?.fees) ? existing.fees : []);
      const merged = [...existingFees];
      for (const nf of rawFees) {
        const existIdx = merged.findIndex(f =>
          (f.name || '').toLowerCase() === (nf.name || '').toLowerCase()
        );
        if (existIdx === -1) {
          merged.push(nf);
        }
      }
      saveFeesConfigV3({ fees: merged });
    }
    return true;
  }

  if (section === 'branding') {
    if (strategy === 'replace') {
      saveBranding(tenantId, data);
    } else {
      const existing = getBranding(tenantId) || {};
      const merged = { ...existing };
      for (const [key, val] of Object.entries(data)) {
        if (val && val !== '' && val !== null) {
          merged[key] = val;
        }
      }
      saveBranding(tenantId, merged);
    }
    return true;
  }

  if (section === 'presets') {
    const presets = Array.isArray(data) ? data : [data];
    if (strategy === 'replace') {
      writeTenantJson('presets:v1', presets);
    } else {
      const existing = readTenantJson('presets:v1', []);
      const merged = Array.isArray(existing) ? [...existing] : [];
      for (const np of presets) {
        const existIdx = merged.findIndex(p =>
          (p.name || '').toLowerCase() === (np.name || '').toLowerCase()
        );
        if (existIdx === -1) {
          merged.push(np);
        }
      }
      writeTenantJson('presets:v1', merged);
    }
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataImportWizard({ open, onClose }) {
  const { language } = useLanguage();
  const cs = language === 'cs';
  const fileInputRef = useRef(null);

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1: selected sections
  const [selectedSections, setSelectedSections] = useState([]);

  // Step 2: file + parsed data
  const [inputMethod, setInputMethod] = useState('file'); // 'file' | 'manual'
  const [fileType, setFileType] = useState(null); // 'json' | 'csv'
  const [fileName, setFileName] = useState('');
  const [rawParsed, setRawParsed] = useState(null); // parsed file data
  const [parseError, setParseError] = useState('');

  // Step 3: preview state — merge strategies per section
  const [mergeStrategies, setMergeStrategies] = useState({});
  const [previewData, setPreviewData] = useState({}); // { section: { data, validation, conflicts } }

  // Step 4/5: import results
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const resetWizard = useCallback(() => {
    setStep(1);
    setSelectedSections([]);
    setInputMethod('file');
    setFileType(null);
    setFileName('');
    setRawParsed(null);
    setParseError('');
    setMergeStrategies({});
    setPreviewData({});
    setImporting(false);
    setImportResults(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose?.();
  }, [onClose, resetWizard]);

  // ---------------------------------------------------------------------------
  // Step 1 handlers
  // ---------------------------------------------------------------------------

  const toggleSection = useCallback((key) => {
    setSelectedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Step 2 handlers
  // ---------------------------------------------------------------------------

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setFileName(file.name);

    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = (ev) => {
      const text = ev.target.result;

      if (ext === 'json') {
        try {
          const parsed = JSON.parse(text);
          setRawParsed(parsed);
          setFileType('json');
          setParseError('');
        } catch {
          setParseError('Soubor neni validni JSON.');
          setRawParsed(null);
        }
      } else if (ext === 'csv') {
        const csvResult = parseCSV(text);
        if (csvResult.rows.length === 0) {
          setParseError('CSV soubor neobsahuje zadne radky s daty.');
          setRawParsed(null);
        } else {
          setRawParsed(csvResult);
          setFileType('csv');
          setParseError('');
        }
      } else {
        setParseError(`Nepodporovany format souboru: .${ext}. Pouzijte .json nebo .csv.`);
        setRawParsed(null);
      }
    };

    reader.onerror = () => {
      setParseError('Chyba pri cteni souboru.');
    };

    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // Simulate file input
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Step 3: Build preview
  // ---------------------------------------------------------------------------

  const buildPreview = useCallback(() => {
    const preview = {};
    const strategies = {};

    for (const sectionKey of selectedSections) {
      let sectionData = null;

      if (fileType === 'json') {
        // JSON: try to find section data in parsed object
        if (rawParsed && typeof rawParsed === 'object') {
          // Check if the JSON has section keys (e.g., { pricing: {...}, fees: {...} })
          if (rawParsed[sectionKey]) {
            sectionData = rawParsed[sectionKey];
          } else if (sectionKey === 'pricing' && (rawParsed.materials || rawParsed.materialPrices)) {
            sectionData = rawParsed;
          } else if (sectionKey === 'fees' && (Array.isArray(rawParsed) || rawParsed.fees)) {
            sectionData = rawParsed;
          } else if (sectionKey === 'branding' && (rawParsed.businessName || rawParsed.logo)) {
            sectionData = rawParsed;
          } else if (sectionKey === 'presets' && Array.isArray(rawParsed)) {
            sectionData = rawParsed;
          } else {
            // Check nested under config/data keys
            const nested = rawParsed.config || rawParsed.data || rawParsed;
            if (nested[sectionKey]) {
              sectionData = nested[sectionKey];
            }
          }
        }
      } else if (fileType === 'csv') {
        // CSV: map to section
        const mapped = mapCSVToSection(sectionKey, rawParsed);
        if (mapped.error) {
          preview[sectionKey] = {
            data: null,
            validation: { warnings: [], errors: [mapped.error], valid: false },
            conflicts: [],
          };
          strategies[sectionKey] = 'merge';
          continue;
        }
        sectionData = mapped.data;
      }

      if (sectionData === null || sectionData === undefined) {
        preview[sectionKey] = {
          data: null,
          validation: { warnings: [`Data pro sekci "${sectionKey}" nebyla nalezena v souboru.`], errors: [], valid: false },
          conflicts: [],
        };
      } else {
        const validation = validateImportData(sectionKey, sectionData);
        const conflicts = detectConflicts(sectionKey, sectionData);
        preview[sectionKey] = { data: sectionData, validation, conflicts };
      }

      strategies[sectionKey] = 'merge';
    }

    setPreviewData(preview);
    setMergeStrategies(strategies);
  }, [selectedSections, rawParsed, fileType]);

  // ---------------------------------------------------------------------------
  // Step 4: Execute import
  // ---------------------------------------------------------------------------

  const executeImport = useCallback(() => {
    setImporting(true);
    const results = { success: [], failed: [], skipped: [] };

    for (const sectionKey of selectedSections) {
      const preview = previewData[sectionKey];
      if (!preview?.data || !preview.validation.valid) {
        results.skipped.push(sectionKey);
        continue;
      }

      try {
        const ok = applyImport(sectionKey, preview.data, mergeStrategies[sectionKey] || 'merge');
        if (ok) {
          results.success.push(sectionKey);
        } else {
          results.failed.push(sectionKey);
        }
      } catch (err) {
        results.failed.push(sectionKey);
      }
    }

    setImportResults(results);
    setImporting(false);
    setStep(5);
  }, [selectedSections, previewData, mergeStrategies]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const canGoNext = useMemo(() => {
    if (step === 1) return selectedSections.length > 0;
    if (step === 2) return rawParsed != null && !parseError;
    if (step === 3) {
      return selectedSections.some(s => previewData[s]?.validation?.valid);
    }
    return true;
  }, [step, selectedSections, rawParsed, parseError, previewData]);

  const goNext = useCallback(() => {
    if (step === 2) {
      buildPreview();
    }
    if (step === 4) {
      executeImport();
      return;
    }
    setStep(s => Math.min(s + 1, 5));
  }, [step, buildPreview, executeImport]);

  const goBack = useCallback(() => {
    setStep(s => Math.max(s - 1, 1));
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const sectionLabel = (key) => IMPORT_SECTIONS.find(s => s.key === key)?.label || key;
  const sectionIcon = (key) => IMPORT_SECTIONS.find(s => s.key === key)?.icon || 'File';
  const sectionColor = (key) => IMPORT_SECTIONS.find(s => s.key === key)?.color || '#7A8291';

  // Count items for summary
  const countItems = (sectionKey, data) => {
    if (!data) return 0;
    if (sectionKey === 'pricing') return data.materials?.length || Object.keys(data.materialPrices || {}).length || 0;
    if (sectionKey === 'fees') return Array.isArray(data) ? data.length : (data.fees?.length || 0);
    if (sectionKey === 'presets') return Array.isArray(data) ? data.length : 1;
    if (sectionKey === 'branding') return Object.keys(data || {}).length;
    return 0;
  };

  // ---------------------------------------------------------------------------
  // Render: Step 1 — Choose sections
  // ---------------------------------------------------------------------------

  const renderStep1 = () => (
    <div className="diw-step-content">
      <p className="diw-step-desc">
        Vyberte, ktere casti konfigurace chcete importovat.
      </p>
      <div className="diw-section-grid">
        {IMPORT_SECTIONS.map(sec => {
          const selected = selectedSections.includes(sec.key);
          return (
            <button
              key={sec.key}
              className={`diw-section-card ${selected ? 'diw-section-card--selected' : ''}`}
              onClick={() => toggleSection(sec.key)}
              style={{ '--sec-color': sec.color }}
            >
              <div className="diw-section-card-icon" style={{ background: `${sec.color}15`, color: sec.color }}>
                <Icon name={sec.icon} size={22} />
              </div>
              <span className="diw-section-card-label">{sec.label}</span>
              {selected && (
                <div className="diw-section-card-check">
                  <Icon name="Check" size={16} color="#00D4AA" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Step 2 — Upload file
  // ---------------------------------------------------------------------------

  const renderStep2 = () => (
    <div className="diw-step-content">
      <p className="diw-step-desc">
        Nahrajte soubor s daty (JSON nebo CSV).
        {' '}Pro export existujicich dat pouzijte funkci "Zaloha konfigurace" v nastaveni.
      </p>

      <div
        className={`diw-dropzone ${rawParsed ? 'diw-dropzone--done' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        {rawParsed ? (
          <div className="diw-dropzone-done">
            <Icon name="CheckCircle" size={32} color="#00D4AA" />
            <span className="diw-dropzone-filename">{fileName}</span>
            <span className="diw-dropzone-meta">
              {fileType === 'json' ? 'JSON' : 'CSV'}
              {fileType === 'csv' && rawParsed?.rows ? ` — ${rawParsed.rows.length} radku` : ''}
            </span>
            <button
              className="diw-dropzone-change"
              onClick={(e) => {
                e.stopPropagation();
                setRawParsed(null);
                setFileName('');
                setFileType(null);
                setParseError('');
              }}
            >
              Zmenit soubor
            </button>
          </div>
        ) : (
          <div className="diw-dropzone-empty">
            <Icon name="Upload" size={36} color="var(--forge-text-muted)" />
            <p>Pretahnete soubor sem nebo kliknete pro vyber</p>
            <span className="diw-dropzone-formats">Podporovane formaty: .json, .csv</span>
          </div>
        )}
      </div>

      {parseError && (
        <div className="diw-error">
          <Icon name="AlertCircle" size={16} />
          {parseError}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Step 3 — Preview and map
  // ---------------------------------------------------------------------------

  const renderStep3 = () => (
    <div className="diw-step-content">
      <p className="diw-step-desc">
        Nahled importovanych dat. Zvolte strategii pro kazdou sekci.
      </p>

      <div className="diw-preview-list">
        {selectedSections.map(sectionKey => {
          const preview = previewData[sectionKey];
          if (!preview) return null;

          const { data, validation, conflicts } = preview;
          const strategy = mergeStrategies[sectionKey] || 'merge';
          const itemCount = countItems(sectionKey, data);

          return (
            <div
              key={sectionKey}
              className={`diw-preview-card ${!validation.valid ? 'diw-preview-card--invalid' : ''}`}
            >
              <div className="diw-preview-card-header">
                <div className="diw-preview-card-title">
                  <Icon name={sectionIcon(sectionKey)} size={18} color={sectionColor(sectionKey)} />
                  <span>{sectionLabel(sectionKey)}</span>
                </div>
                {validation.valid && (
                  <span className="diw-preview-badge diw-preview-badge--ok">
                    {itemCount} {itemCount === 1 ? 'polozka' : 'polozek'}
                  </span>
                )}
                {!validation.valid && (
                  <span className="diw-preview-badge diw-preview-badge--error">
                    Nelze importovat
                  </span>
                )}
              </div>

              {/* Warnings */}
              {validation.warnings.map((w, i) => (
                <div key={i} className="diw-preview-warning">
                  <Icon name="AlertTriangle" size={14} color="#F59E0B" />
                  <span>{w}</span>
                </div>
              ))}

              {/* Errors */}
              {validation.errors.map((e, i) => (
                <div key={i} className="diw-preview-error">
                  <Icon name="XCircle" size={14} color="#EF4444" />
                  <span>{e}</span>
                </div>
              ))}

              {/* Conflicts */}
              {conflicts.length > 0 && (
                <div className="diw-conflicts">
                  <div className="diw-conflicts-header">
                    <Icon name="AlertTriangle" size={14} color="#F59E0B" />
                    <span>Konflikty s existujicimi daty:</span>
                  </div>
                  {conflicts.map((c, i) => (
                    <div key={i} className="diw-conflict-item">{c}</div>
                  ))}
                </div>
              )}

              {/* Merge strategy selector */}
              {validation.valid && conflicts.length > 0 && (
                <div className="diw-strategy-selector">
                  <span className="diw-strategy-label">Strategie:</span>
                  <div className="diw-strategy-options">
                    {MERGE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`diw-strategy-btn ${strategy === opt.value ? 'diw-strategy-btn--active' : ''}`}
                        onClick={() => setMergeStrategies(prev => ({ ...prev, [sectionKey]: opt.value }))}
                      >
                        <Icon name={opt.icon} size={14} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data preview snippet */}
              {validation.valid && data && (
                <div className="diw-data-preview">
                  <div className="diw-data-preview-label">Nahled dat:</div>
                  <pre className="diw-data-preview-code">
                    {JSON.stringify(data, null, 2).slice(0, 500)}
                    {JSON.stringify(data, null, 2).length > 500 ? '\n...' : ''}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Step 4 — Confirm
  // ---------------------------------------------------------------------------

  const importableSections = selectedSections.filter(s => previewData[s]?.validation?.valid);

  const renderStep4 = () => (
    <div className="diw-step-content">
      <p className="diw-step-desc">
        Potvrdite import nasledujicich sekci. Tuto akci nelze vzit zpet.
      </p>

      <div className="diw-confirm-list">
        {importableSections.map(sectionKey => {
          const strategy = mergeStrategies[sectionKey] || 'merge';
          const itemCount = countItems(sectionKey, previewData[sectionKey]?.data);

          return (
            <div key={sectionKey} className="diw-confirm-item">
              <div className="diw-confirm-item-left">
                <Icon name={sectionIcon(sectionKey)} size={18} color={sectionColor(sectionKey)} />
                <span>{sectionLabel(sectionKey)}</span>
              </div>
              <div className="diw-confirm-item-right">
                <span className="diw-confirm-count">{itemCount} pol.</span>
                <span className={`diw-confirm-strategy diw-confirm-strategy--${strategy}`}>
                  {strategy === 'merge' ? 'Sloucit' : 'Nahradit'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSections.length > importableSections.length && (
        <div className="diw-preview-warning" style={{ marginTop: 12 }}>
          <Icon name="AlertTriangle" size={14} color="#F59E0B" />
          <span>
            {selectedSections.length - importableSections.length} sekci bude preskoceno kvuli chybam.
          </span>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Step 5 — Results
  // ---------------------------------------------------------------------------

  const renderStep5 = () => {
    if (!importResults) return null;
    const { success, failed, skipped } = importResults;
    const allOk = failed.length === 0;

    return (
      <div className="diw-step-content">
        <div className="diw-result-header">
          <Icon
            name={allOk ? 'CheckCircle' : 'AlertCircle'}
            size={48}
            color={allOk ? '#00D4AA' : '#F59E0B'}
          />
          <h3 className="diw-result-title">
            {allOk ? 'Import dokoncen uspesne' : 'Import dokoncen s chybami'}
          </h3>
        </div>

        {success.length > 0 && (
          <div className="diw-result-group">
            <div className="diw-result-group-header diw-result-group-header--ok">
              <Icon name="Check" size={14} color="#00D4AA" />
              Uspesne importovano ({success.length})
            </div>
            {success.map(s => (
              <div key={s} className="diw-result-item diw-result-item--ok">
                <Icon name={sectionIcon(s)} size={16} color={sectionColor(s)} />
                {sectionLabel(s)}
              </div>
            ))}
          </div>
        )}

        {failed.length > 0 && (
          <div className="diw-result-group">
            <div className="diw-result-group-header diw-result-group-header--error">
              <Icon name="X" size={14} color="#EF4444" />
              Selhalo ({failed.length})
            </div>
            {failed.map(s => (
              <div key={s} className="diw-result-item diw-result-item--error">
                <Icon name={sectionIcon(s)} size={16} color={sectionColor(s)} />
                {sectionLabel(s)}
              </div>
            ))}
          </div>
        )}

        {skipped.length > 0 && (
          <div className="diw-result-group">
            <div className="diw-result-group-header diw-result-group-header--skip">
              <Icon name="SkipForward" size={14} color="#7A8291" />
              Preskoceno ({skipped.length})
            </div>
            {skipped.map(s => (
              <div key={s} className="diw-result-item diw-result-item--skip">
                <Icon name={sectionIcon(s)} size={16} color={sectionColor(s)} />
                {sectionLabel(s)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Step titles
  // ---------------------------------------------------------------------------

  const STEP_TITLES = [
    '', // 0 unused
    'Vyber dat k importu',
    'Nahrani souboru',
    'Nahled a mapovani',
    'Potvrzeni importu',
    'Vysledek',
  ];

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <ForgeDialog
      open={open}
      onClose={handleClose}
      title={`Import dat — ${STEP_TITLES[step]}`}
      maxWidth={640}
    >
      {/* Step indicator */}
      <div className="diw-steps-bar">
        {[1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            className={`diw-step-indicator ${s === step ? 'diw-step-indicator--active' : ''} ${s < step ? 'diw-step-indicator--done' : ''}`}
          >
            <div className="diw-step-dot">
              {s < step ? <Icon name="Check" size={12} /> : s}
            </div>
            <span className="diw-step-label">{STEP_TITLES[s]}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}

      {/* Footer */}
      <div className="diw-footer">
        {step > 1 && step < 5 && (
          <button className="diw-footer-btn diw-footer-btn--secondary" onClick={goBack}>
            <Icon name="ArrowLeft" size={16} />
            Zpet
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 && (
          <button
            className="diw-footer-btn diw-footer-btn--primary"
            onClick={goNext}
            disabled={!canGoNext}
          >
            Dalsi
            <Icon name="ArrowRight" size={16} />
          </button>
        )}
        {step === 4 && (
          <button
            className="diw-footer-btn diw-footer-btn--primary"
            onClick={executeImport}
            disabled={importing || importableSections.length === 0}
          >
            {importing ? 'Importuji...' : 'Importovat'}
            <Icon name={importing ? 'Loader' : 'Download'} size={16} />
          </button>
        )}
        {step === 5 && (
          <button className="diw-footer-btn diw-footer-btn--primary" onClick={handleClose}>
            Zavrit
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      <style>{wizardStyles}</style>
    </ForgeDialog>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const wizardStyles = `
  /* Steps bar */
  .diw-steps-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 4px;
    padding: 0 0 20px 0;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--forge-border-default, #1E293B);
  }

  .diw-step-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex: 1;
    opacity: 0.4;
    transition: opacity 0.2s;
  }

  .diw-step-indicator--active,
  .diw-step-indicator--done {
    opacity: 1;
  }

  .diw-step-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    font-weight: 700;
    border: 2px solid var(--forge-border-default, #1E293B);
    color: var(--forge-text-muted, #7A8291);
    background: var(--forge-bg-surface, #111827);
    transition: all 0.2s;
  }

  .diw-step-indicator--active .diw-step-dot {
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-accent-primary, #00D4AA);
    box-shadow: 0 0 12px rgba(0, 212, 170, 0.2);
  }

  .diw-step-indicator--done .diw-step-dot {
    border-color: var(--forge-accent-primary, #00D4AA);
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .diw-step-label {
    font-size: 10px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--forge-text-muted, #7A8291);
    text-align: center;
    line-height: 1.3;
  }

  .diw-step-indicator--active .diw-step-label {
    color: var(--forge-text-primary, #F1F5F9);
  }

  /* Step content */
  .diw-step-content {
    min-height: 200px;
    max-height: 420px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .diw-step-content::-webkit-scrollbar {
    width: 4px;
  }
  .diw-step-content::-webkit-scrollbar-thumb {
    background: var(--forge-border-default, #1E293B);
    border-radius: 2px;
  }

  .diw-step-desc {
    font-size: 13px;
    color: var(--forge-text-secondary, #94A3B8);
    margin: 0 0 16px 0;
    line-height: 1.5;
  }

  /* Section grid (Step 1) */
  .diw-section-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .diw-section-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-surface, #111827);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    position: relative;
  }

  .diw-section-card:hover {
    border-color: var(--sec-color, #7A8291);
    background: var(--forge-bg-elevated, #1E293B);
  }

  .diw-section-card--selected {
    border-color: var(--forge-accent-primary, #00D4AA);
    background: rgba(0, 212, 170, 0.05);
  }

  .diw-section-card-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--forge-radius-md, 6px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .diw-section-card-label {
    font-size: 13px;
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 500;
    line-height: 1.3;
  }

  .diw-section-card-check {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  /* Drop zone (Step 2) */
  .diw-dropzone {
    border: 2px dashed var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--forge-bg-surface, #111827);
  }

  .diw-dropzone:hover {
    border-color: var(--forge-accent-primary, #00D4AA);
    background: rgba(0, 212, 170, 0.03);
  }

  .diw-dropzone--done {
    border-style: solid;
    border-color: rgba(0, 212, 170, 0.3);
  }

  .diw-dropzone-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .diw-dropzone-empty p {
    margin: 0;
    font-size: 14px;
    color: var(--forge-text-secondary, #94A3B8);
  }

  .diw-dropzone-formats {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .diw-dropzone-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .diw-dropzone-filename {
    font-size: 14px;
    font-weight: 600;
    color: var(--forge-text-primary, #F1F5F9);
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
  }

  .diw-dropzone-meta {
    font-size: 11px;
    color: var(--forge-text-muted, #7A8291);
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .diw-dropzone-change {
    font-size: 12px;
    color: var(--forge-accent-primary, #00D4AA);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    margin-top: 4px;
  }

  .diw-dropzone-change:hover {
    text-decoration: underline;
  }

  /* Error */
  .diw-error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: var(--forge-radius-md, 6px);
    background: rgba(239, 68, 68, 0.08);
    color: #EF4444;
    font-size: 13px;
  }

  /* Preview cards (Step 3) */
  .diw-preview-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .diw-preview-card {
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 16px;
    background: var(--forge-bg-surface, #111827);
  }

  .diw-preview-card--invalid {
    opacity: 0.6;
  }

  .diw-preview-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .diw-preview-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--forge-text-primary, #F1F5F9);
  }

  .diw-preview-badge {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
  }

  .diw-preview-badge--ok {
    background: rgba(0, 212, 170, 0.12);
    color: #00D4AA;
  }

  .diw-preview-badge--error {
    background: rgba(239, 68, 68, 0.12);
    color: #EF4444;
  }

  .diw-preview-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(245, 158, 11, 0.06);
    font-size: 12px;
    color: #F59E0B;
    margin-bottom: 6px;
  }

  .diw-preview-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(239, 68, 68, 0.06);
    font-size: 12px;
    color: #EF4444;
    margin-bottom: 6px;
  }

  /* Conflicts */
  .diw-conflicts {
    margin: 8px 0;
    padding: 10px 12px;
    border-radius: 4px;
    background: rgba(245, 158, 11, 0.04);
    border: 1px solid rgba(245, 158, 11, 0.15);
  }

  .diw-conflicts-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #F59E0B;
    margin-bottom: 6px;
  }

  .diw-conflict-item {
    font-size: 12px;
    color: var(--forge-text-secondary, #94A3B8);
    padding: 2px 0 2px 22px;
  }

  /* Strategy selector */
  .diw-strategy-selector {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--forge-border-default, #1E293B);
  }

  .diw-strategy-label {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--forge-text-muted, #7A8291);
    display: block;
    margin-bottom: 8px;
  }

  .diw-strategy-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .diw-strategy-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-elevated, #0D1117);
    color: var(--forge-text-secondary, #94A3B8);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .diw-strategy-btn:hover {
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .diw-strategy-btn--active {
    border-color: var(--forge-accent-primary, #00D4AA);
    background: rgba(0, 212, 170, 0.06);
    color: var(--forge-accent-primary, #00D4AA);
  }

  /* Data preview */
  .diw-data-preview {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--forge-border-default, #1E293B);
  }

  .diw-data-preview-label {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--forge-text-muted, #7A8291);
    margin-bottom: 6px;
  }

  .diw-data-preview-code {
    font-size: 11px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-secondary, #94A3B8);
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: 4px;
    padding: 10px;
    max-height: 120px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }

  /* Confirm list (Step 4) */
  .diw-confirm-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .diw-confirm-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-surface, #111827);
  }

  .diw-confirm-item-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 500;
  }

  .diw-confirm-item-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .diw-confirm-count {
    font-size: 12px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
  }

  .diw-confirm-strategy {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .diw-confirm-strategy--merge {
    background: rgba(0, 212, 170, 0.12);
    color: #00D4AA;
  }

  .diw-confirm-strategy--replace {
    background: rgba(245, 158, 11, 0.12);
    color: #F59E0B;
  }

  /* Result (Step 5) */
  .diw-result-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px 0;
  }

  .diw-result-title {
    margin: 0;
    font-size: 18px;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 700;
  }

  .diw-result-group {
    margin-bottom: 12px;
  }

  .diw-result-group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .diw-result-group-header--ok { color: #00D4AA; }
  .diw-result-group-header--error { color: #EF4444; }
  .diw-result-group-header--skip { color: #7A8291; }

  .diw-result-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--forge-text-secondary, #94A3B8);
    border-left: 2px solid transparent;
    margin-left: 6px;
  }

  .diw-result-item--ok { border-left-color: #00D4AA; }
  .diw-result-item--error { border-left-color: #EF4444; }
  .diw-result-item--skip { border-left-color: #7A8291; }

  /* Footer */
  .diw-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--forge-border-default, #1E293B);
  }

  .diw-footer-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: var(--forge-radius-md, 6px);
    font-size: 13px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .diw-footer-btn--primary {
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .diw-footer-btn--primary:hover:not(:disabled) {
    background: #00E8BB;
    box-shadow: 0 0 16px rgba(0, 212, 170, 0.25);
  }

  .diw-footer-btn--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .diw-footer-btn--secondary {
    background: var(--forge-bg-surface, #111827);
    color: var(--forge-text-secondary, #94A3B8);
    border-color: var(--forge-border-default, #1E293B);
  }

  .diw-footer-btn--secondary:hover {
    background: var(--forge-bg-elevated, #1E293B);
    color: var(--forge-text-primary, #F1F5F9);
    border-color: var(--forge-accent-primary, #00D4AA);
  }

  /* Responsive */
  @media (max-width: 560px) {
    .diw-section-grid {
      grid-template-columns: 1fr;
    }

    .diw-step-label {
      display: none;
    }

    .diw-steps-bar {
      gap: 8px;
    }
  }
`;

/**
 * BuilderPage — main composition for Widget Builder V3.
 *
 * Loads widget by :id from URL, initialises builder state, and renders:
 *   TopBar  (spans both columns)
 *   LeftPanel (35 %)  |  RightPanel + DevicePreviewFrame (65 %)
 *
 * Route: /admin/widget/builder/:id  (rendered OUTSIDE AdminLayout for fullscreen).
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getTenantId } from '@/utils/adminTenantStorage';
import { getBranding } from '@/utils/adminBrandingWidgetStorage';
import { themeToCssVars } from '@/utils/widgetThemeStorage';

import useBuilderState from './hooks/useBuilderState';

import BuilderTopBar from './components/BuilderTopBar';
import BuilderLeftPanel from './components/BuilderLeftPanel';
import BuilderRightPanel from './components/BuilderRightPanel';
import DevicePreviewFrame from './components/DevicePreviewFrame';
import OnboardingOverlay from './components/OnboardingOverlay';
import StyleTab from './components/tabs/StyleTab';
import ElementsTab from './components/tabs/ElementsTab';
import GlobalTab from './components/tabs/GlobalTab';

import WidgetKalkulacka from '@/pages/widget-kalkulacka';

import './styles/builder-tokens.css';

export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenantId = getTenantId();

  const builder = useBuilderState(id, tenantId);

  // ---------------------------------------------------------------------------
  // Preview step switcher (1=Upload, 2=Config, 3=Summary)
  // ---------------------------------------------------------------------------
  const [previewStep, setPreviewStep] = useState(1);

  // ---------------------------------------------------------------------------
  // Save toast feedback
  // ---------------------------------------------------------------------------
  const [toast, setToast] = useState(null);

  const handleSave = async () => {
    const result = await builder.save();
    setToast(result.ok
      ? { text: 'Ulozeno', kind: 'ok' }
      : { text: result.error || 'Chyba pri ukladani', kind: 'err' });
    setTimeout(() => setToast(null), 2500);
  };

  // ---------------------------------------------------------------------------
  // Phase 6.1: First-run onboarding overlay
  // ---------------------------------------------------------------------------
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const key = `modelpricer:${tenantId}:builder:onboarding_complete`;
    try {
      return localStorage.getItem(key) !== 'true';
    } catch {
      return false;
    }
  });

  // ---------------------------------------------------------------------------
  // Phase 6.2: Branding auto-apply on first load
  // Applies tenant branding colours to the widget theme when the theme is
  // still at factory defaults (never previously customised by the user).
  // Runs once after builder finishes loading; does NOT touch useBuilderState.
  // ---------------------------------------------------------------------------
  const brandingAppliedRef = useRef(false);

  useEffect(() => {
    // Guard: only run once, after builder has loaded with a widget present.
    if (builder.loading || !builder.widget || brandingAppliedRef.current) return;

    // Only apply when the theme has not been customised yet (isDirty === false
    // right after load means no edits, and themeConfig being absent/empty means
    // the widget was created with defaults).
    const isDefault =
      !builder.widget.themeConfig ||
      Object.keys(builder.widget.themeConfig).length === 0;

    if (!isDefault) {
      brandingAppliedRef.current = true;
      return;
    }

    const branding = getBranding(tenantId);
    if (branding?.primaryColor) {
      builder.updateThemeProperty('buttonPrimaryColor', branding.primaryColor);
    }
    if (branding?.businessName) {
      builder.updateThemeProperty('textHeaderTitle', branding.businessName);
    }

    brandingAppliedRef.current = true;
    // Intentionally depend only on builder.loading so this fires once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.loading]);

  // --- Loading state ---
  if (builder.loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Nacitani builderu...</span>
      </div>
    );
  }

  // --- Widget not found ---
  if (!builder.widget) {
    return (
      <div style={styles.loadingScreen}>
        <span style={styles.errorText}>Widget nenalezen</span>
        <button
          onClick={() => navigate('/admin/widget')}
          style={styles.backLink}
        >
          Zpet na seznam widgetu
        </button>
      </div>
    );
  }

  // --- CSS variables for live preview ---
  const themeVars = themeToCssVars(builder.theme);

  return (
    <div style={styles.grid}>
      {/* TOP BAR — spans both columns */}
      <div style={styles.topBar}>
        <BuilderTopBar
          widgetName={builder.widgetName}
          onWidgetNameChange={builder.setWidgetName}
          onBack={() => navigate('/admin/widget')}
          deviceMode={builder.deviceMode}
          onDeviceModeChange={builder.setDeviceMode}
          previewStep={previewStep}
          onPreviewStepChange={setPreviewStep}
          publicWidgetId={builder.widget?.publicId}
          canUndo={builder.canUndo}
          canRedo={builder.canRedo}
          onUndo={builder.undo}
          onRedo={builder.redo}
          onReset={builder.resetToOriginal}
          onSave={handleSave}
          isDirty={builder.isDirty}
          saving={builder.saving}
        />
      </div>

      {/* LEFT PANEL (35 %) */}
      <div style={styles.leftPanel}>
        <BuilderLeftPanel
          activeTab={builder.activeTab}
          onTabChange={builder.setActiveTab}
          styleContent={
            <StyleTab
              selectedElementId={builder.selectedElementId}
              theme={builder.theme}
              onUpdateProperty={builder.updateThemeProperty}
            />
          }
          elementsContent={
            <ElementsTab
              selectedElementId={builder.selectedElementId}
              onSelectElement={(elementId) => {
                builder.selectElement(elementId);
                builder.setActiveTab('style');
              }}
              onSwitchToStyle={() => builder.setActiveTab('style')}
              theme={builder.theme}
            />
          }
          globalContent={
            <GlobalTab
              theme={builder.theme}
              onUpdateProperty={builder.updateThemeProperty}
              onApplyBulkTheme={builder.setThemeBulk}
              isDirty={builder.isDirty}
            />
          }
        />
      </div>

      {/* RIGHT PANEL (65 %) — preview */}
      <div style={styles.rightPanel}>
        <BuilderRightPanel>
          <DevicePreviewFrame deviceMode={builder.deviceMode}>
            <div style={themeVars}>
              <WidgetKalkulacka
                theme={builder.theme}
                builderMode={true}
                forceStep={previewStep}
                onElementSelect={builder.selectElement}
                onElementHover={builder.hoverElement}
                selectedElementId={builder.selectedElementId}
                hoveredElementId={builder.hoveredElementId}
                onTextEditStart={builder.setEditingTextId}
                embedded={false}
              />
            </div>
          </DevicePreviewFrame>
        </BuilderRightPanel>
      </div>

      {/* Phase 6.1: First-run walkthrough overlay */}
      {showOnboarding && (
        <OnboardingOverlay
          tenantId={tenantId}
          onComplete={() => setShowOnboarding(false)}
          lang="cs"
        />
      )}

      {/* Save toast */}
      {toast && (
        <div
          role={toast.kind === 'err' ? 'alert' : 'status'}
          aria-live={toast.kind === 'err' ? 'assertive' : 'polite'}
          style={{
            position: 'fixed',
            bottom: 18,
            right: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--builder-radius-md, 8px)',
            background: toast.kind === 'ok' ? '#065F46' : '#991B1B',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--builder-font-body)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Layout: CSS Grid  —  2 columns, 2 rows.
   Row 1: top bar (56px, spans both columns)
   Row 2: left panel (35%) | right panel (65%)
   ------------------------------------------------------------------ */
const styles = {
  grid: {
    display: 'grid',
    gridTemplateRows: 'var(--builder-topbar-height, 56px) 1fr',
    gridTemplateColumns: 'var(--builder-left-panel-width, 35%) var(--builder-right-panel-width, 65%)',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--builder-bg-primary)',
    color: 'var(--builder-text-primary)',
  },
  topBar: {
    gridColumn: '1 / -1',
    minWidth: 0,
  },
  leftPanel: {
    minWidth: 0,
    overflow: 'hidden',
  },
  rightPanel: {
    minWidth: 0,
    overflow: 'hidden',
  },

  /* Loading / error states */
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--builder-bg-primary)',
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid var(--builder-border-default)',
    borderTopColor: 'var(--builder-accent-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 14,
    color: 'var(--builder-text-secondary)',
  },
  errorText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 16,
    color: 'var(--builder-accent-error)',
    fontWeight: 600,
  },
  backLink: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    color: 'var(--builder-accent-primary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

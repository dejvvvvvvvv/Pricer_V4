/**
 * BuilderPage -- VvvebJs-inspired 3-panel visual editor for widget customization.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────────┐
 * |                          TOP BAR                                 |
 * |  Back | Widget Name | Step Tabs | Devices | Undo/Redo | Save    |
 * ├──────────┬────────────────────────────────┬──────────────────────┤
 * |          |                                |                      |
 * |  LEFT    |        CANVAS                  |     RIGHT            |
 * |  PANEL   |        (Preview)               |     PANEL            |
 * |          |                                |                      |
 * | Compon.  |   ┌────────────────────┐       |  Content             |
 * | Blocks   |   |   Widget           |       |  Style               |
 * | Layers   |   |   Preview          |       |  Advanced            |
 * |          |   |                    |       |                      |
 * |          |   └────────────────────┘       |  [Props of           |
 * |          |                                |   selected elem]     |
 * ├──────────┴────────────────────────────────┴──────────────────────┤
 * |  BOTTOM BAR: Breadcrumb (body > section > element)               |
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Features:
 *   - Resizable left/right panels (drag handles)
 *   - Collapsible panels (toggle buttons)
 *   - Full-height layout (100vh)
 *   - Step tabs in top bar (1-5)
 *   - Device preview switcher (mobile 360, tablet 768, desktop 1280)
 *   - Bottom breadcrumb showing element path
 *   - Keyboard shortcuts: Ctrl+Z, Ctrl+Y, Ctrl+S, Delete, Escape
 *   - Zoom controls on canvas
 *
 * Route: /admin/widget/builder/:id (rendered OUTSIDE AdminLayout for fullscreen)
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getTenantId, readTenantJson } from '@/utils/adminTenantStorage';
import { getBranding } from '@/utils/adminBrandingWidgetStorage';
import { themeToCssVars } from '@/utils/widgetThemeStorage';

import useBuilderState from './hooks/useBuilderState';
import useDragAndDrop from './hooks/useDragAndDrop';

import BuilderTopBar from './components/BuilderTopBar';
import BuilderLeftPanel from './components/BuilderLeftPanel';
import BuilderCanvas from './components/BuilderCanvas';
import BuilderPropertyPanel from './components/BuilderPropertyPanel';
import DevicePreviewFrame from './components/DevicePreviewFrame';
import OnboardingOverlay from './components/OnboardingOverlay';
import StyleTab from './components/tabs/StyleTab';
import GlobalTab from './components/tabs/GlobalTab';
import LayersPanel from './components/LayersPanel';
import BlockLibrary from './components/BlockLibrary';
import LayoutSwitcher from './components/LayoutSwitcher';
import ElementToolbar from './components/ElementToolbar';

import WidgetKalkulacka from '@/pages/widget-kalkulacka';
import ErrorBoundary from '@/pages/widget-kalkulacka/components/ErrorBoundary';

import {
  ELEMENT_REGISTRY, HIDEABLE_ELEMENTS, isCustomBlock, getElement,
} from './config/elementRegistry';

import {
  PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen,
  ChevronRight,
} from 'lucide-react';

import './styles/builder-tokens.css';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 450;

/* ------------------------------------------------------------------ */
/* Resize Handle Component                                             */
/* ------------------------------------------------------------------ */

function ResizeHandle({ side, onResize }) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = 0; // will be set by caller

    const handleMouseMove = (ev) => {
      if (!isDragging.current) return;
      const delta = side === 'left'
        ? ev.clientX - startX.current
        : startX.current - ev.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [side, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        ...resizeHandleStyle,
        ...(side === 'left' ? { right: -3 } : { left: -3 }),
      }}
      title={side === 'left' ? 'Zmenit sirku leveho panelu' : 'Zmenit sirku praveho panelu'}
    >
      <div style={resizeHandleLineStyle} />
    </div>
  );
}

const resizeHandleStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 6,
  cursor: 'col-resize',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const resizeHandleLineStyle = {
  width: 2,
  height: 40,
  borderRadius: 1,
  background: 'var(--builder-border-default)',
  transition: 'background var(--builder-transition-fast)',
};

/* ------------------------------------------------------------------ */
/* Breadcrumb Bar                                                      */
/* ------------------------------------------------------------------ */

function BreadcrumbBar({ selectedElementId }) {
  const crumbs = ['body'];

  if (selectedElementId) {
    const element = getElement(selectedElementId);
    if (element) {
      const zone = element.zone || 'full';
      if (zone !== 'full') {
        crumbs.push(zone === 'left' ? 'main-content' : 'sidebar');
      } else {
        crumbs.push('section');
      }
      crumbs.push(element.label?.en || selectedElementId);
    } else if (isCustomBlock(selectedElementId)) {
      crumbs.push('custom-blocks');
      crumbs.push(selectedElementId);
    }
  }

  return (
    <div style={breadcrumbBarStyle}>
      {crumbs.map((crumb, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && (
            <ChevronRight
              size={12}
              color="var(--builder-text-muted)"
              style={{ flexShrink: 0 }}
            />
          )}
          <span style={{
            ...breadcrumbItemStyle,
            ...(idx === crumbs.length - 1 ? breadcrumbItemActiveStyle : {}),
          }}>
            {crumb}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

const breadcrumbBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  height: 28,
  padding: '0 12px',
  background: 'var(--builder-bg-topbar)',
  borderTop: '1px solid var(--builder-border-subtle)',
  flexShrink: 0,
  overflow: 'hidden',
};

const breadcrumbItemStyle = {
  fontFamily: 'var(--builder-font-code)',
  fontSize: 11,
  color: 'var(--builder-text-muted)',
  whiteSpace: 'nowrap',
};

const breadcrumbItemActiveStyle = {
  color: 'var(--builder-text-secondary)',
  fontWeight: 600,
};

/* ------------------------------------------------------------------ */
/* Panel Toggle Button                                                 */
/* ------------------------------------------------------------------ */

function PanelToggleButton({ side, isOpen, onToggle }) {
  const OpenIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen;
  const CloseIcon = side === 'left' ? PanelLeftClose : PanelRightClose;
  const Icon = isOpen ? CloseIcon : OpenIcon;
  const label = isOpen
    ? (side === 'left' ? 'Skryt levy panel' : 'Skryt pravy panel')
    : (side === 'left' ? 'Zobrazit levy panel' : 'Zobrazit pravy panel');

  return (
    <button
      onClick={onToggle}
      style={{
        ...panelToggleStyle,
        ...(side === 'left'
          ? { left: 4, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
          : { right: 4, borderTopRightRadius: 0, borderBottomRightRadius: 0 }),
      }}
      title={label}
      aria-label={label}
    >
      <Icon size={16} color="var(--builder-text-muted)" />
    </button>
  );
}

const panelToggleStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 48,
  background: 'var(--builder-bg-secondary)',
  border: '1px solid var(--builder-border-subtle)',
  borderRadius: 'var(--builder-radius-sm)',
  cursor: 'pointer',
  zIndex: 15,
};

/* ------------------------------------------------------------------ */
/* Right Panel (Property editor)                                       */
/* ------------------------------------------------------------------ */

/**
 * RightPropertyPanel -- wrapper that delegates to BuilderPropertyPanel.
 * Kept as a local function for backward compatibility with the BuilderPage grid layout.
 */
function RightPropertyPanel({
  selectedElementId,
  rightPanelTab,
  onTabChange,
  theme,
  onUpdateProperty,
  onClearSelection,
}) {
  return (
    <BuilderPropertyPanel
      selectedElementId={selectedElementId}
      theme={theme}
      onUpdateProperty={onUpdateProperty}
      onClose={onClearSelection}
    />
  );
}

/* ================================================================== */
/* MAIN COMPONENT                                                      */
/* ================================================================== */

export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenantId = getTenantId();
  const canvasRef = useRef(null);

  // Main builder state
  const builder = useBuilderState(id, tenantId);

  // DnD (HTML5 native)
  const dnd = useDragAndDrop(builder.layout);

  // ---------------------------------------------------------------------------
  // Resizable panels -- track width delta from drag
  // ---------------------------------------------------------------------------
  const leftBaseWidth = useRef(builder.leftPanelWidth);
  const rightBaseWidth = useRef(builder.rightPanelWidth);

  const handleLeftResize = useCallback((delta) => {
    const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, leftBaseWidth.current + delta));
    builder.setLeftPanelWidth(newWidth);
  }, [builder]);

  const handleRightResize = useCallback((delta) => {
    const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, rightBaseWidth.current + delta));
    builder.setRightPanelWidth(newWidth);
  }, [builder]);

  // Update base widths on mousedown for accurate delta tracking
  useEffect(() => {
    leftBaseWidth.current = builder.leftPanelWidth;
  }, [builder.leftPanelWidth]);

  useEffect(() => {
    rightBaseWidth.current = builder.rightPanelWidth;
  }, [builder.rightPanelWidth]);

  // ---------------------------------------------------------------------------
  // Onboarding overlay (first-run)
  // ---------------------------------------------------------------------------
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return readTenantJson('builder:onboarding_complete', null) !== true;
  });

  // ---------------------------------------------------------------------------
  // Branding auto-apply on first load
  // ---------------------------------------------------------------------------
  const brandingAppliedRef = useRef(false);

  useEffect(() => {
    if (builder.loading || !builder.widget || brandingAppliedRef.current) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder.loading]);

  // ---------------------------------------------------------------------------
  // Element toolbar action handlers
  // ---------------------------------------------------------------------------
  const handleMoveUp = useCallback(() => {
    const order = builder.layout.elementOrder;
    const idx = order.indexOf(builder.selectedElementId);
    if (idx > 0) builder.layout.moveElement(builder.selectedElementId, idx, idx - 1);
  }, [builder.layout, builder.selectedElementId]);

  const handleMoveDown = useCallback(() => {
    const order = builder.layout.elementOrder;
    const idx = order.indexOf(builder.selectedElementId);
    if (idx < order.length - 1) {
      builder.layout.moveElement(builder.selectedElementId, idx, idx + 1);
    }
  }, [builder.layout, builder.selectedElementId]);

  const handleDeleteElement = useCallback(() => {
    if (!builder.selectedElementId) return;
    if (builder.selectedElementId.startsWith('cb_')) {
      builder.layout.removeCustomBlock(builder.selectedElementId);
    } else {
      builder.layout.toggleElementVisibility(builder.selectedElementId);
    }
    builder.clearSelection();
  }, [builder]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (builder.loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Nacitani builderu...</span>
      </div>
    );
  }

  // Widget not found
  if (!builder.widget) {
    return (
      <div style={styles.loadingScreen}>
        <span style={styles.errorText}>Widget nenalezen / Widget not found</span>
        <button
          onClick={() => navigate('/admin/widget')}
          style={styles.backLink}
        >
          Zpet na seznam widgetu / Back to widget list
        </button>
      </div>
    );
  }

  // CSS variables for live preview
  const themeVars = themeToCssVars(builder.theme);

  // Show right panel when element is selected
  const showRightPanel = builder.selectedElementId !== null && builder.rightPanelOpen;

  // Grid column calculation
  const leftCol = builder.leftPanelOpen ? `${builder.leftPanelWidth}px` : '0px';
  const rightCol = showRightPanel ? `${builder.rightPanelWidth}px` : '0px';

  return (
    <div style={styles.root}>
      {/* TOP BAR */}
      <BuilderTopBar
        widgetName={builder.widgetName}
        onWidgetNameChange={builder.setWidgetName}
        onBack={() => navigate('/admin/widget')}
        currentStep={builder.currentStep}
        onStepChange={builder.setCurrentStep}
        deviceMode={builder.deviceMode}
        onDeviceModeChange={builder.setDeviceMode}
        canUndo={builder.canUndo}
        canRedo={builder.canRedo}
        onUndo={builder.undo}
        onRedo={builder.redo}
        onReset={builder.resetToOriginal}
        publicWidgetId={builder.widget?.publicId}
        autoSaveStatus={builder.autoSaveStatus}
        onSave={builder.save}
        isDirty={builder.isDirty}
      />

      {/* MAIN 3-PANEL AREA */}
      <div style={{
        ...styles.mainArea,
        gridTemplateColumns: `${leftCol} 1fr ${rightCol}`,
      }}>
        {/* ---- LEFT PANEL ---- */}
        {builder.leftPanelOpen && (
          <div style={{
            ...styles.leftPanel,
            width: builder.leftPanelWidth,
          }}>
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
              blocksContent={
                <BlockLibrary
                  elementOrder={builder.layout.elementOrder}
                  onAddBlock={builder.layout.addCustomBlock}
                  onPaletteDragStart={dnd.handlePaletteDragStart}
                />
              }
              layersContent={
                <LayersPanel
                  elementOrder={builder.layout.elementOrder}
                  selectedElementId={builder.selectedElementId}
                  hiddenElements={builder.layout.hiddenElements}
                  onSelectElement={(elementId) => {
                    builder.selectElement(elementId);
                    builder.setActiveTab('style');
                  }}
                  onToggleVisibility={builder.layout.toggleElementVisibility}
                  onDeleteBlock={builder.layout.removeCustomBlock}
                />
              }
              globalContent={
                <>
                  <LayoutSwitcher
                    activePresetId={builder.layout.activePresetId}
                    onApplyPreset={builder.layout.applyPreset}
                  />
                  <div style={{ marginTop: 16 }}>
                    <GlobalTab
                      theme={builder.theme}
                      onUpdateProperty={builder.updateThemeProperty}
                      onApplyBulkTheme={builder.setThemeBulk}
                    />
                  </div>
                </>
              }
            />

            {/* Resize handle */}
            <ResizeHandle side="left" onResize={handleLeftResize} />
          </div>
        )}

        {/* Left panel toggle (shown when collapsed) */}
        {!builder.leftPanelOpen && (
          <div style={{ width: 0, position: 'relative' }}>
            <PanelToggleButton
              side="left"
              isOpen={false}
              onToggle={() => builder.setLeftPanelOpen(true)}
            />
          </div>
        )}

        {/* ---- CENTER: Canvas ---- */}
        <div style={styles.centerPanel} ref={canvasRef}>
          <BuilderCanvas
            deviceMode={builder.deviceMode}
            zoom={builder.zoom}
            onZoomChange={builder.setZoom}
            isDragging={dnd.isDragging}
            dropIndicatorIndex={dnd.dropIndicatorIndex}
            onCanvasDragOver={dnd.handleCanvasDragOver}
            onCanvasDragLeave={dnd.handleCanvasDragLeave}
            onCanvasDrop={dnd.handleCanvasDrop}
          >
            <div style={themeVars}>
              <ErrorBoundary>
                <WidgetKalkulacka
                  theme={builder.theme}
                  builderMode={true}
                  forceStep={builder.currentStep}
                  onElementSelect={builder.selectElement}
                  onElementHover={builder.hoverElement}
                  selectedElementId={builder.selectedElementId}
                  hoveredElementId={builder.hoveredElementId}
                  onTextEditStart={builder.setEditingTextId}
                  embedded={false}
                  layoutConfig={{
                    elementOrder: builder.layout.elementOrder,
                    hiddenElements: builder.layout.hiddenElements,
                    customBlocks: builder.layout.customBlocks,
                    sizeOverrides: builder.layout.sizeOverrides,
                  }}
                />
              </ErrorBoundary>
            </div>
          </BuilderCanvas>

          {/* Floating Element Toolbar */}
          <ElementToolbar
            selectedElementId={builder.selectedElementId}
            elementOrder={builder.layout.elementOrder}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDelete={handleDeleteElement}
            canvasRef={canvasRef}
          />

          {/* Panel toggle buttons on canvas edges */}
          {builder.leftPanelOpen && (
            <PanelToggleButton
              side="left"
              isOpen={true}
              onToggle={() => builder.setLeftPanelOpen(false)}
            />
          )}
          {(builder.selectedElementId && builder.rightPanelOpen) && (
            <PanelToggleButton
              side="right"
              isOpen={true}
              onToggle={() => builder.setRightPanelOpen(false)}
            />
          )}
          {(builder.selectedElementId && !builder.rightPanelOpen) && (
            <PanelToggleButton
              side="right"
              isOpen={false}
              onToggle={() => builder.setRightPanelOpen(true)}
            />
          )}
        </div>

        {/* ---- RIGHT PANEL (conditional) ---- */}
        {showRightPanel && (
          <div style={{
            ...styles.rightPanel,
            width: builder.rightPanelWidth,
          }}>
            <RightPropertyPanel
              selectedElementId={builder.selectedElementId}
              rightPanelTab={builder.rightPanelTab}
              onTabChange={builder.setRightPanelTab}
              theme={builder.theme}
              onUpdateProperty={builder.updateThemeProperty}
              onClearSelection={builder.clearSelection}
            />

            {/* Resize handle */}
            <ResizeHandle side="right" onResize={handleRightResize} />
          </div>
        )}
      </div>

      {/* BOTTOM BREADCRUMB BAR */}
      <BreadcrumbBar selectedElementId={builder.selectedElementId} />

      {/* Onboarding overlay (first-run) */}
      {showOnboarding && (
        <OnboardingOverlay
          tenantId={tenantId}
          onComplete={() => setShowOnboarding(false)}
          lang="cs"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout styles                                                       */
/* ------------------------------------------------------------------ */

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--builder-bg-primary)',
    color: 'var(--builder-text-primary)',
  },

  mainArea: {
    display: 'grid',
    flex: '1 1 0%',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'grid-template-columns 200ms ease',
  },

  leftPanel: {
    position: 'relative',
    minWidth: 0,
    overflow: 'hidden',
    borderRight: '1px solid var(--builder-border-subtle)',
    transition: 'width 200ms ease',
  },

  centerPanel: {
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
  },

  rightPanel: {
    position: 'relative',
    minWidth: 0,
    overflow: 'hidden',
    borderLeft: '1px solid var(--builder-border-subtle)',
    transition: 'width 200ms ease',
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

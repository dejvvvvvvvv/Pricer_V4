/**
 * BuilderPage — main composition for Widget Builder V2.
 *
 * Tri-panel layout with DnD context:
 *   TopBar (spans all columns)
 *   LeftPanel (280px) | Canvas (flex) | RightPanel (300px, conditional)
 *
 * Route: /admin/widget/builder/:id (rendered OUTSIDE AdminLayout for fullscreen).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { getTenantId } from '@/utils/adminTenantStorage';
import { getBranding } from '@/utils/adminBrandingWidgetStorage';
import { themeToCssVars } from '@/utils/widgetThemeStorage';

import useBuilderState from './hooks/useBuilderState';
import useDragAndDrop from './hooks/useDragAndDrop';

import BuilderTopBar from './components/BuilderTopBar';
import BuilderLeftPanel from './components/BuilderLeftPanel';
import BuilderRightPanel from './components/BuilderRightPanel';
import DevicePreviewFrame from './components/DevicePreviewFrame';
import OnboardingOverlay from './components/OnboardingOverlay';
import StyleTab from './components/tabs/StyleTab';
import GlobalTab from './components/tabs/GlobalTab';
import LayersPanel from './components/LayersPanel';
import BlockLibrary from './components/BlockLibrary';
import LayoutSwitcher from './components/LayoutSwitcher';
import ElementToolbar from './components/ElementToolbar';
import DragOverlayElement from './components/DragOverlayElement';

import WidgetKalkulacka from '@/pages/widget-kalkulacka';
import ErrorBoundary from '@/pages/widget-kalkulacka/components/ErrorBoundary';

import './styles/builder-tokens.css';

export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenantId = getTenantId();
  const canvasRef = useRef(null);

  const builder = useBuilderState(id, tenantId);

  // DnD
  const dnd = useDragAndDrop(builder.layout);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // ---------------------------------------------------------------------------
  // Preview step switcher (1=Upload, 2=Config, 3=Review, 4=Checkout, 5=Confirm)
  // ---------------------------------------------------------------------------
  const [previewStep, setPreviewStep] = useState(1);

  // ---------------------------------------------------------------------------
  // Right panel visibility (shown when element is selected)
  // ---------------------------------------------------------------------------
  const showRightPanel = builder.selectedElementId !== null;

  // Auto-save is handled by useBuilderState hook — no manual save needed.

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
  // Element toolbar actions
  // ---------------------------------------------------------------------------
  const handleMoveUp = useCallback(() => {
    const order = builder.layout.elementOrder;
    const idx = order.indexOf(builder.selectedElementId);
    if (idx > 0) builder.layout.moveElement(builder.selectedElementId, idx, idx - 1);
  }, [builder.layout.elementOrder, builder.layout.moveElement, builder.selectedElementId]);

  const handleMoveDown = useCallback(() => {
    const order = builder.layout.elementOrder;
    const idx = order.indexOf(builder.selectedElementId);
    if (idx < order.length - 1) {
      builder.layout.moveElement(builder.selectedElementId, idx, idx + 1);
    }
  }, [builder.layout.elementOrder, builder.layout.moveElement, builder.selectedElementId]);

  const handleDeleteElement = useCallback(() => {
    if (!builder.selectedElementId) return;
    // For custom blocks — remove completely
    if (builder.selectedElementId.startsWith('cb_')) {
      builder.layout.removeCustomBlock(builder.selectedElementId);
    } else {
      // For built-in elements — toggle visibility
      builder.layout.toggleElementVisibility(builder.selectedElementId);
    }
    builder.clearSelection();
  }, [builder]);

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={dnd.handleDragStart}
      onDragOver={dnd.handleDragOver}
      onDragEnd={dnd.handleDragEnd}
      onDragCancel={dnd.handleDragCancel}
    >
      <div style={{
        ...styles.grid,
        gridTemplateColumns: showRightPanel
          ? '280px 1fr 300px'
          : '280px 1fr',
      }}>
        {/* TOP BAR — spans all columns */}
        <div style={{
          ...styles.topBar,
          gridColumn: showRightPanel ? '1 / 4' : '1 / 3',
        }}>
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
            autoSaveStatus={builder.autoSaveStatus}
          />
        </div>

        {/* LEFT PANEL (280px) */}
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
            blocksContent={
              <BlockLibrary
                elementOrder={builder.layout.elementOrder}
                onAddBlock={builder.layout.addCustomBlock}
              />
            }
            layersContent={
              <SortableContext
                items={builder.layout.elementOrder}
                strategy={verticalListSortingStrategy}
              >
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
              </SortableContext>
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
        </div>

        {/* CENTER — Canvas (flex) */}
        <div style={styles.centerPanel} ref={canvasRef}>
          <BuilderRightPanel>
            <DevicePreviewFrame deviceMode={builder.deviceMode}>
              <div style={themeVars}>
                <ErrorBoundary>
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
                    layoutConfig={{
                      elementOrder: builder.layout.elementOrder,
                      hiddenElements: builder.layout.hiddenElements,
                      customBlocks: builder.layout.customBlocks,
                      sizeOverrides: builder.layout.sizeOverrides,
                    }}
                  />
                </ErrorBoundary>
              </div>
            </DevicePreviewFrame>
          </BuilderRightPanel>

          {/* Floating Element Toolbar */}
          <ElementToolbar
            selectedElementId={builder.selectedElementId}
            elementOrder={builder.layout.elementOrder}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDelete={handleDeleteElement}
            canvasRef={canvasRef}
          />
        </div>

        {/* RIGHT PANEL (300px, conditional) — Property editor */}
        {showRightPanel && (
          <div style={styles.rightPanel}>
            <div style={styles.rightPanelHeader}>
              <span style={styles.rightPanelTitle}>Vlastnosti</span>
              <button
                onClick={builder.clearSelection}
                style={styles.closeButton}
                aria-label="Zavrit panel vlastnosti"
              >
                ×
              </button>
            </div>
            <div style={styles.rightPanelContent}>
              <StyleTab
                selectedElementId={builder.selectedElementId}
                theme={builder.theme}
                onUpdateProperty={builder.updateThemeProperty}
              />
            </div>
          </div>
        )}

        {/* Phase 6.1: First-run walkthrough overlay */}
        {showOnboarding && (
          <OnboardingOverlay
            tenantId={tenantId}
            onComplete={() => setShowOnboarding(false)}
            lang="cs"
          />
        )}

        {/* Auto-save status is shown in the top bar */}
      </div>

      {/* DnD Overlay */}
      <DragOverlay>
        {dnd.activeId ? <DragOverlayElement id={dnd.activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ------------------------------------------------------------------
   Layout: CSS Grid — tri-panel.
   Row 1: top bar (56px, spans all columns)
   Row 2: left (280px) | center (flex) | right (300px, conditional)
   ------------------------------------------------------------------ */
const styles = {
  grid: {
    display: 'grid',
    gridTemplateRows: 'var(--builder-topbar-height, 56px) 1fr',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--builder-bg-primary)',
    color: 'var(--builder-text-primary)',
  },
  topBar: {
    minWidth: 0,
  },
  leftPanel: {
    minWidth: 0,
    overflow: 'hidden',
  },
  centerPanel: {
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    background: 'var(--builder-bg-secondary)',
    borderLeft: '1px solid var(--builder-border-subtle)',
  },
  rightPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid var(--builder-border-subtle)',
    flexShrink: 0,
  },
  rightPanelTitle: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    fontSize: 18,
    borderRadius: 4,
  },
  rightPanelContent: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--builder-scrollbar-thumb) var(--builder-scrollbar-track)',
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

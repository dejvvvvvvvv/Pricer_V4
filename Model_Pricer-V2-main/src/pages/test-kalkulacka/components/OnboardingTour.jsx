// src/pages/test-kalkulacka/components/OnboardingTour.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

// ---------------------------------------------------------------------------
// Tour step definitions
// ---------------------------------------------------------------------------

export const TOUR_STEPS = [
  {
    id: 'upload',
    target: '[data-tour="upload-zone"]',
    title: 'Nahrajte model',
    body: 'Pretahujte soubory primo sem, nebo kliknete a vyberte z disku. Muzete take vlozit ze schranky (Ctrl+V). Podporovane formaty: STL, OBJ, 3MF.',
    icon: 'Upload',
    placement: 'bottom',
  },
  {
    id: 'viewer',
    target: '[data-tour="model-viewer"]',
    title: '3D nahled',
    body: 'Otacejte model tazenim mysi, priblizujte koleckem. Na zalozce "Build plate" vidite, zda se model vejde na tiskovou podlozku.',
    icon: 'Eye',
    placement: 'left',
  },
  {
    id: 'config',
    target: '[data-tour="print-config"]',
    title: 'Nastaveni tisku',
    body: 'Vyberte material, kvalitu vrstvy a vyplneni (infill). Zmena parametru automaticky prepocita cenu.',
    icon: 'Settings',
    placement: 'right',
  },
  {
    id: 'generate',
    target: '[data-tour="generate-btn"]',
    title: 'Spustit vypocet',
    body: 'Kliknete na "Spocitat cenu" nebo pouzijte klavesovou zkratku Ctrl+Enter. Slicovani obvykle trva 5\u201315 sekund.',
    icon: 'Play',
    placement: 'bottom',
  },
  {
    id: 'pricing',
    target: '[data-tour="pricing-results"]',
    title: 'Vysledky a cena',
    body: 'Zde uvidite detailni rozpad ceny: material, cas tisku, poplatky a celkovou cenu. Cena se aktualizuje v realnem case pri zmene parametru.',
    icon: 'Calculator',
    placement: 'left',
  },
  {
    id: 'mesh-repair',
    target: '[data-tour="mesh-repair"]',
    title: 'Oprava mesh',
    body: 'Pokud ma model chyby (nespojene hrany, prevracene normaly), panel nabidne analyzu a opravu.',
    icon: 'Wrench',
    placement: 'left',
  },
  {
    id: 'done',
    target: null, // centered, no spotlight
    title: 'Hotovo!',
    body: 'Nyni vite vse potrebne. Klavesove zkratky zobrazite stiskem "?" nebo pres tlacitko v pravem dolnim rohu.',
    icon: 'CheckCircle',
    placement: 'center',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
};

/** Compute position for the tooltip relative to the target rect. */
function computeTooltipPosition(targetRect, placement, tooltipWidth, tooltipHeight) {
  const GAP = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  if (!targetRect || placement === 'center') {
    // Center on screen
    return {
      top: Math.max(20, (vh - tooltipHeight) / 2),
      left: Math.max(20, (vw - tooltipWidth) / 2),
      actualPlacement: 'center',
    };
  }

  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;

  // Try requested placement first, then fall back.
  const attempts = [placement, 'bottom', 'top', 'right', 'left'];

  for (const p of attempts) {
    switch (p) {
      case 'bottom':
        top = targetRect.bottom + GAP;
        left = cx - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - GAP;
        left = cx - tooltipWidth / 2;
        break;
      case 'right':
        top = cy - tooltipHeight / 2;
        left = targetRect.right + GAP;
        break;
      case 'left':
        top = cy - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - GAP;
        break;
      default:
        break;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vw - tooltipWidth - 12));
    top = Math.max(12, Math.min(top, vh - tooltipHeight - 12));

    // Check that the tooltip does not overlap the target (for the primary placement).
    const tooltipRect = { top, left, right: left + tooltipWidth, bottom: top + tooltipHeight };
    const overlaps =
      tooltipRect.left < targetRect.right &&
      tooltipRect.right > targetRect.left &&
      tooltipRect.top < targetRect.bottom &&
      tooltipRect.bottom > targetRect.top;

    if (!overlaps) {
      return { top, left, actualPlacement: p };
    }
    // If overlaps, try next placement.
  }

  // Fallback — use bottom, clamped
  return {
    top: Math.max(12, Math.min(targetRect.bottom + GAP, vh - tooltipHeight - 12)),
    left: Math.max(12, Math.min(cx - tooltipWidth / 2, vw - tooltipWidth - 12)),
    actualPlacement: 'bottom',
  };
}

// ---------------------------------------------------------------------------
// OnboardingTour component
// ---------------------------------------------------------------------------

const OnboardingTour = ({
  active,
  currentStepIndex,
  currentStep,
  totalSteps,
  doNotShowAgain,
  onDoNotShowAgainChange,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}) => {
  const tooltipRef = useRef(null);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, actualPlacement: 'center' });
  const [visible, setVisible] = useState(false);
  const [tooltipSize, setTooltipSize] = useState({ width: 380, height: 260 });

  const reduced = useMemo(prefersReducedMotion, []);
  const transitionDuration = reduced ? '0ms' : '250ms';

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // -----------------------------------------------------------------------
  // Resolve target element and its bounding rect
  // -----------------------------------------------------------------------
  const resolveTarget = useCallback(() => {
    if (!currentStep?.target) {
      setTargetRect(null);
      return null;
    }
    const el = document.querySelector(currentStep.target);
    if (!el) {
      setTargetRect(null);
      return null;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    return el;
  }, [currentStep]);

  // On step change: resolve target, scroll into view, reposition tooltip.
  useEffect(() => {
    if (!active) return;

    // Short delay to let the DOM settle after potential step transitions.
    const frame = requestAnimationFrame(() => {
      const el = resolveTarget();
      if (el) {
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        // Recalculate after scroll settles.
        setTimeout(() => resolveTarget(), reduced ? 50 : 350);
      }
      setVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [active, currentStepIndex, resolveTarget, reduced]);

  // Recalculate on resize / scroll.
  useEffect(() => {
    if (!active) return;

    const handler = () => resolveTarget();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [active, resolveTarget]);

  // Measure tooltip once rendered.
  useEffect(() => {
    if (!tooltipRef.current) return;
    const { offsetWidth, offsetHeight } = tooltipRef.current;
    if (offsetWidth && offsetHeight) {
      setTooltipSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [currentStepIndex, active]);

  // Position tooltip relative to target.
  useEffect(() => {
    if (!active) return;
    const pos = computeTooltipPosition(
      targetRect,
      currentStep?.placement || 'bottom',
      tooltipSize.width,
      tooltipSize.height,
    );
    setTooltipPos(pos);
  }, [active, targetRect, currentStep, tooltipSize]);

  // Close on Escape.
  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onSkip();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [active, onSkip]);

  // Fade out when deactivated.
  useEffect(() => {
    if (!active) setVisible(false);
  }, [active]);

  if (!active || !currentStep) return null;

  // -----------------------------------------------------------------------
  // Spotlight cutout dimensions (padding around target element)
  // -----------------------------------------------------------------------
  const PAD = 8;
  const hasTarget = !!targetRect;
  const cutout = hasTarget
    ? {
        x: targetRect.left - PAD,
        y: targetRect.top - PAD,
        w: targetRect.width + PAD * 2,
        h: targetRect.height + PAD * 2,
        rx: 12,
      }
    : null;

  return (
    <div
      className="onboarding-tour-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        pointerEvents: 'auto',
        opacity: visible ? 1 : 0,
        transition: `opacity ${transitionDuration} ease`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Pruvodce kalkulackou \u2014 krok ${currentStepIndex + 1} z ${totalSteps}`}
    >
      {/* Dark overlay with SVG cutout */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {cutout && (
              <rect
                x={cutout.x}
                y={cutout.y}
                width={cutout.w}
                height={cutout.h}
                rx={cutout.rx}
                fill="black"
                style={{ transition: reduced ? 'none' : 'all 250ms ease' }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={onSkip}
        />
      </svg>

      {/* Click-through area over the highlighted element so users can still interact */}
      {cutout && (
        <div
          style={{
            position: 'fixed',
            left: cutout.x,
            top: cutout.y,
            width: cutout.w,
            height: cutout.h,
            borderRadius: `${cutout.rx}px`,
            pointerEvents: 'none',
            boxShadow: '0 0 0 3px var(--forge-accent-primary, #14B8A6)',
            transition: reduced ? 'none' : 'all 250ms ease',
            zIndex: 10001,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: '380px',
          maxWidth: 'calc(100vw - 24px)',
          zIndex: 10002,
          transition: reduced ? 'none' : `top ${transitionDuration} ease, left ${transitionDuration} ease`,
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--forge-bg-surface, #1A1D24)',
            border: '1px solid var(--forge-accent-primary, #14B8A6)',
            borderRadius: 'var(--forge-radius-xl, 16px)',
            padding: '20px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            fontFamily: 'var(--forge-font-body)',
          }}
        >
          {/* Step counter + skip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech, monospace)',
              color: 'var(--forge-text-muted, #7A8291)',
              letterSpacing: '0.05em',
            }}>
              {currentStepIndex + 1}/{totalSteps}
            </span>
            <button
              type="button"
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '12px',
                color: 'var(--forge-text-muted, #7A8291)',
                fontFamily: 'var(--forge-font-body)',
                borderRadius: '4px',
              }}
              aria-label="Preskocit pruvodce"
            >
              Preskocit
            </button>
          </div>

          {/* Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
          }}>
            {currentStep.icon && (
              <Icon
                name={currentStep.icon}
                size={20}
                style={{ color: 'var(--forge-accent-primary, #14B8A6)', flexShrink: 0 }}
              />
            )}
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--forge-text-primary, #E8EAED)',
              fontFamily: 'var(--forge-font-heading)',
            }}>
              {currentStep.title}
            </h3>
          </div>

          {/* Body */}
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--forge-text-secondary, #B0B7C3)',
          }}>
            {currentStep.body}
          </p>

          {/* "Do not show again" checkbox — last step only */}
          {isLastStep && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
              fontSize: '12px',
              color: 'var(--forge-text-muted, #7A8291)',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={doNotShowAgain}
                onChange={(e) => onDoNotShowAgainChange(e.target.checked)}
                style={{
                  accentColor: 'var(--forge-accent-primary, #14B8A6)',
                  width: '14px',
                  height: '14px',
                  cursor: 'pointer',
                }}
              />
              Nespoustet znovu
            </label>
          )}

          {/* Progress dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '14px',
          }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStepIndex ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === currentStepIndex
                    ? 'var(--forge-accent-primary, #14B8A6)'
                    : i < currentStepIndex
                      ? 'var(--forge-accent-primary, #14B8A6)'
                      : 'var(--forge-border-active, #3A3F4B)',
                  opacity: i <= currentStepIndex ? 1 : 0.4,
                  transition: reduced ? 'none' : 'width 200ms ease, background-color 200ms ease',
                }}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirstStep}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                color: isFirstStep
                  ? 'var(--forge-text-muted, #7A8291)'
                  : 'var(--forge-text-secondary, #B0B7C3)',
                backgroundColor: 'transparent',
                border: isFirstStep
                  ? '1px solid var(--forge-border-default, #2A2D35)'
                  : '1px solid var(--forge-border-active, #3A3F4B)',
                borderRadius: 'var(--forge-radius-md, 8px)',
                cursor: isFirstStep ? 'not-allowed' : 'pointer',
                opacity: isFirstStep ? 0.4 : 1,
                fontFamily: 'var(--forge-font-body)',
                transition: 'border-color 150ms ease',
              }}
              aria-label="Predchozi krok"
            >
              <Icon name="ChevronLeft" size={14} />
              Zpet
            </button>

            <button
              type="button"
              onClick={isLastStep ? onFinish : onNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--forge-bg-void, #0D0F12)',
                backgroundColor: 'var(--forge-accent-primary, #14B8A6)',
                border: 'none',
                borderRadius: 'var(--forge-radius-md, 8px)',
                cursor: 'pointer',
                fontFamily: 'var(--forge-font-body)',
                transition: 'filter 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              aria-label={isLastStep ? 'Dokoncit pruvodce' : 'Dalsi krok'}
            >
              {isLastStep ? 'Dokoncit' : 'Dalsi'}
              {!isLastStep && <Icon name="ChevronRight" size={14} />}
              {isLastStep && <Icon name="Check" size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;

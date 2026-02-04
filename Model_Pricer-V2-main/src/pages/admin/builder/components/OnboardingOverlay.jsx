/**
 * OnboardingOverlay -- first-run walkthrough for the Widget Builder V3.
 *
 * Shows a 5-step guided tour on the user's first visit to the builder.
 * Completion is persisted via a tenant-scoped localStorage key so it
 * only appears once per tenant.
 *
 * Visual approach:
 *   Step 1 (welcome): full-screen dark overlay with centered card.
 *   Steps 2-5: same dark overlay with the info card positioned near the
 *              relevant builder area (left panel, right panel, top bar).
 *
 * Props:
 *   tenantId  -- string, current tenant identifier
 *   onComplete -- () => void, called when the user finishes or skips
 *   lang       -- 'cs' | 'en', UI language (defaults to 'cs')
 */
import React, { useState, useCallback } from 'react';
import { ONBOARDING_STEPS } from '../config/onboardingSteps';

export default function OnboardingOverlay({ tenantId, onComplete, lang = 'cs' }) {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];
  const isLast = step === total - 1;

  // -------------------------------------------------------------------------
  // Persist completion and unmount
  // -------------------------------------------------------------------------
  const finish = useCallback(() => {
    setIsExiting(true);
    try {
      const key = `modelpricer:${tenantId}:builder:onboarding_complete`;
      localStorage.setItem(key, 'true');
    } catch {
      // Non-critical -- overlay just won't be suppressed next time.
    }
    // Short delay for fade-out animation
    setTimeout(() => {
      onComplete();
    }, 250);
  }, [tenantId, onComplete]);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const handleNext = useCallback(() => {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, finish]);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  // -------------------------------------------------------------------------
  // Card position based on step target
  // -------------------------------------------------------------------------
  const getCardPosition = () => {
    if (!current) return positionPresets.center;
    switch (current.targetRef) {
      case 'right-panel':
        return positionPresets.centerRight;
      case 'left-panel':
        return positionPresets.centerLeft;
      case 'global-tab':
        return positionPresets.leftMiddle;
      case 'save-button':
        return positionPresets.topRight;
      default:
        return positionPresets.center;
    }
  };

  if (!current) return null;

  const title = current.title[lang] || current.title.cs;
  const text = current.text[lang] || current.text.cs;
  const cardPos = getCardPosition();

  const labels = {
    skip: lang === 'en' ? 'Skip' : 'Preskocit',
    next: lang === 'en' ? 'Next' : 'Dalsi',
    done: lang === 'en' ? 'Done' : 'Hotovo',
    stepOf: lang === 'en' ? 'of' : 'z',
  };

  return (
    <div
      style={{
        ...styles.overlay,
        opacity: isExiting ? 0 : 1,
      }}
      onClick={(e) => {
        // Clicking the overlay backdrop does nothing (user must click buttons)
        e.stopPropagation();
      }}
    >
      {/* Tooltip card */}
      <div
        style={{
          ...styles.card,
          ...cardPos,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step counter */}
        <div style={styles.stepCounter}>
          {step + 1} {labels.stepOf} {total}
        </div>

        {/* Title */}
        <h3 style={styles.title}>{title}</h3>

        {/* Description */}
        <p style={styles.text}>{text}</p>

        {/* Progress dots */}
        <div style={styles.dotsRow}>
          {ONBOARDING_STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                ...(i === step ? styles.dotActive : {}),
                ...(i < step ? styles.dotCompleted : {}),
              }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div style={styles.buttonRow}>
          <button
            onClick={handleSkip}
            style={styles.skipButton}
            type="button"
          >
            {labels.skip}
          </button>
          <button
            onClick={handleNext}
            style={styles.nextButton}
            type="button"
          >
            {isLast ? labels.done : labels.next}
          </button>
        </div>
      </div>

      {/* Area hint indicator -- shows a pulsing outline on the target region */}
      {current.targetRef && (
        <div
          style={{
            ...styles.areaHint,
            ...getAreaHintPosition(current.targetRef),
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area hint positions -- lightweight outlines showing which area is relevant
// ---------------------------------------------------------------------------
function getAreaHintPosition(targetRef) {
  switch (targetRef) {
    case 'right-panel':
      return {
        top: 'var(--builder-topbar-height, 56px)',
        right: 0,
        width: 'var(--builder-right-panel-width, 65%)',
        bottom: 0,
      };
    case 'left-panel':
      return {
        top: 'var(--builder-topbar-height, 56px)',
        left: 0,
        width: 'var(--builder-left-panel-width, 35%)',
        bottom: 0,
      };
    case 'global-tab':
      return {
        top: 'var(--builder-topbar-height, 56px)',
        left: 0,
        width: 'var(--builder-left-panel-width, 35%)',
        height: '50%',
      };
    case 'save-button':
      return {
        top: 0,
        right: 0,
        width: '240px',
        height: 'var(--builder-topbar-height, 56px)',
      };
    default:
      return { display: 'none' };
  }
}

// ---------------------------------------------------------------------------
// Card position presets
// ---------------------------------------------------------------------------
const positionPresets = {
  center: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  centerRight: {
    top: '50%',
    right: '20%',
    transform: 'translateY(-50%)',
  },
  centerLeft: {
    top: '50%',
    left: '8%',
    transform: 'translateY(-50%)',
  },
  leftMiddle: {
    top: '35%',
    left: '8%',
    transform: 'translateY(-50%)',
  },
  topRight: {
    top: '72px',
    right: '24px',
  },
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0, 0, 0, 0.6)',
    transition: 'opacity 250ms ease',
    // Prevent interaction with builder while overlay is shown
    pointerEvents: 'auto',
  },

  card: {
    position: 'absolute',
    maxWidth: 360,
    width: '90vw',
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 10000,
    animation: 'onboardingCardIn 300ms ease forwards',
  },

  stepCounter: {
    fontFamily: 'var(--builder-font-body, Inter, system-ui, sans-serif)',
    fontSize: 12,
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },

  title: {
    fontFamily: 'var(--builder-font-heading, "DM Sans", system-ui, sans-serif)',
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px 0',
    lineHeight: 1.3,
  },

  text: {
    fontFamily: 'var(--builder-font-body, Inter, system-ui, sans-serif)',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 1.6,
    margin: '0 0 20px 0',
  },

  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#D1D5DB',
    transition: 'background 200ms ease, transform 200ms ease',
  },

  dotActive: {
    background: '#3B82F6',
    transform: 'scale(1.25)',
  },

  dotCompleted: {
    background: '#10B981',
  },

  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  skipButton: {
    fontFamily: 'var(--builder-font-body, Inter, system-ui, sans-serif)',
    fontSize: 13,
    fontWeight: 500,
    color: '#6B7280',
    background: 'transparent',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'color 150ms ease, background 150ms ease',
  },

  nextButton: {
    fontFamily: 'var(--builder-font-body, Inter, system-ui, sans-serif)',
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    background: '#3B82F6',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 150ms ease',
    boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
  },

  areaHint: {
    position: 'absolute',
    border: '2px solid rgba(59, 130, 246, 0.5)',
    borderRadius: 4,
    pointerEvents: 'none',
    animation: 'onboardingPulse 2s ease-in-out infinite',
    background: 'rgba(59, 130, 246, 0.04)',
  },
};

// src/pages/widget-kalkulacka/components/WidgetStepper.jsx
// 5-step progress indicator for the embeddable widget calculator.

import React, { useMemo } from 'react';
import {
  Check,
  Upload,
  SlidersHorizontal,
  Calculator,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';

const STEPS_3 = [
  { id: 1, label: 'Nahrani modelu', shortLabel: 'Nahrani', Icon: Upload },
  { id: 2, label: 'Nastaveni', shortLabel: 'Nastaveni', Icon: SlidersHorizontal },
  { id: 3, label: 'Souhrn a cena', shortLabel: 'Souhrn', Icon: Calculator },
];

const STEPS_5 = [
  { id: 1, label: 'Nahrani', shortLabel: 'Nahrani', Icon: Upload },
  { id: 2, label: 'Konfigurace', shortLabel: 'Konfig.', Icon: SlidersHorizontal },
  { id: 3, label: 'Prehled ceny', shortLabel: 'Cena', Icon: Calculator },
  { id: 4, label: 'Objednavka', shortLabel: 'Obj.', Icon: ClipboardList },
  { id: 5, label: 'Potvrzeni', shortLabel: 'Hotovo', Icon: CheckCircle },
];

const STATE_LABELS = {
  completed: 'dokonceno',
  active: 'aktivni',
  inactive: 'ceka',
};

/**
 * WidgetStepper - Configurable step progress indicator.
 *
 * Each step shows an icon circle + label + connecting line.
 * States: completed (accent check), active (accent icon), inactive (grey).
 * Optional progress bar below steps.
 * Responsive: hides labels under 500px width, shows compact "Krok X z Y" under 360px.
 *
 * Props:
 * - currentStep: Current active step (1-based)
 * - totalSteps: Number of steps to display (3 or 5, default 5)
 * - steps: Custom steps array (overrides totalSteps). Each item: { id, label, shortLabel?, Icon? }
 * - stepperProgressVisible: Show progress bar below steps (default: true)
 * - builderMode: Enable click-to-select for the builder (default: false)
 * - elementId: Element identifier for builder selection (default: 'steps')
 * - onElementSelect: Callback when element is clicked in builder mode
 */
const WidgetStepper = ({
  currentStep = 1,
  totalSteps = 5,
  steps: customSteps,
  stepperProgressVisible = true,
  builderMode = false,
  elementId = 'steps',
  onElementSelect,
}) => {
  const STEPS = useMemo(() => {
    if (customSteps && customSteps.length > 0) return customSteps;
    return totalSteps >= 5 ? STEPS_5 : STEPS_3;
  }, [customSteps, totalSteps]);

  const stepCount = STEPS.length;

  const handleBuilderClick = (e) => {
    if (builderMode && onElementSelect) {
      e.stopPropagation();
      onElementSelect(elementId);
    }
  };

  const getStepState = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'inactive';
  };

  // Adaptive circle size: 28px for 5+ steps, 32px for 3
  const circleSize = stepCount >= 5 ? 28 : 32;
  const iconSize = stepCount >= 5 ? 14 : 16;

  const getCircleStyle = (state) => {
    const accentColor = 'var(--widget-accent, var(--forge-accent, #00D4AA))';
    const mutedColor = 'var(--forge-text-muted, #7A8291)';
    const inactiveBorder = 'var(--widget-stepper-inactive, #E5E7EB)';

    const base = {
      width: circleSize,
      height: circleSize,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: stepCount >= 5 ? '0.6875rem' : '0.8125rem',
      fontWeight: 600,
      transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
      flexShrink: 0,
    };

    switch (state) {
      case 'completed':
        return {
          ...base,
          backgroundColor: accentColor,
          color: '#FFFFFF',
          border: `2px solid ${accentColor}`,
        };
      case 'active':
        return {
          ...base,
          backgroundColor: accentColor,
          color: '#FFFFFF',
          border: `2px solid ${accentColor}`,
        };
      default:
        return {
          ...base,
          backgroundColor: 'transparent',
          color: mutedColor,
          border: `2px solid ${inactiveBorder}`,
        };
    }
  };

  const getLabelStyle = (state) => {
    const accentColor = 'var(--widget-accent, var(--forge-accent, #00D4AA))';
    const mutedColor = 'var(--forge-text-muted, #7A8291)';
    const textColor = 'var(--widget-text, #374151)';

    return {
      fontSize: stepCount >= 5 ? '0.625rem' : '0.75rem',
      fontWeight: state === 'active' ? 600 : state === 'completed' ? 500 : 400,
      color: state === 'inactive' ? mutedColor : state === 'active' ? accentColor : textColor,
      marginTop: '4px',
      textAlign: 'center',
      lineHeight: 1.2,
      maxWidth: stepCount >= 5 ? '64px' : '80px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  };

  const getLineStyle = (stepId) => {
    const accentColor = 'var(--widget-accent, var(--forge-accent, #00D4AA))';
    const inactiveColor = 'var(--widget-stepper-inactive, #E5E7EB)';
    const filled = stepId < currentStep;
    return {
      flex: 1,
      height: 2,
      backgroundColor: filled ? accentColor : inactiveColor,
      transition: 'background-color 200ms ease',
      marginLeft: stepCount >= 5 ? 4 : 8,
      marginRight: stepCount >= 5 ? 4 : 8,
      alignSelf: 'center',
      // Vertically align with circle center; offset for label below
      marginBottom: stepCount >= 5 ? '18px' : '22px',
    };
  };

  // Progress fraction: 0 for step 1, 1.0 for last step
  const progressFraction = (currentStep - 1) / (stepCount - 1);

  const containerStyle = {
    marginBottom: '24px',
  };

  if (builderMode) {
    containerStyle.cursor = 'pointer';
  }

  return (
    <div
      className="widget-stepper"
      style={containerStyle}
      onClick={builderMode ? handleBuilderClick : undefined}
      role="navigation"
      aria-label="Prubeh objednavky"
    >
      {/* Compact view for very narrow containers (inline CSS handles responsivity via container) */}
      <div
        className="widget-stepper__compact"
        style={{
          display: 'none',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--widget-text, #374151)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'var(--widget-accent, var(--forge-accent, #00D4AA))',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {currentStep}
        </span>
        <span>Krok {currentStep} z {stepCount}</span>
        {STEPS[currentStep - 1] && (
          <span style={{ color: 'var(--forge-text-muted, #7A8291)', fontWeight: 400 }}>
            — {STEPS[currentStep - 1].label}
          </span>
        )}
      </div>

      {/* Full steps row */}
      <div
        className="widget-stepper__full"
        role="list"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: stepCount >= 5 ? '520px' : '420px',
        }}
      >
        {STEPS.map((step, index) => {
          const state = getStepState(step.id);
          const stateLabel = STATE_LABELS[state] || 'ceka';
          const StepIcon = step.Icon;
          return (
            <React.Fragment key={step.id}>
              <div
                role="listitem"
                aria-label={`Krok ${step.id}: ${step.label}, ${stateLabel}`}
                aria-current={state === 'active' ? 'step' : undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={getCircleStyle(state)}>
                  {state === 'completed' ? (
                    <Check size={iconSize} strokeWidth={2.5} />
                  ) : StepIcon ? (
                    <StepIcon size={iconSize} strokeWidth={2} />
                  ) : (
                    step.id
                  )}
                </div>
                {/* Label: show shortLabel for 5+ steps, full label for 3 */}
                <span
                  className="widget-stepper__label"
                  style={getLabelStyle(state)}
                >
                  {stepCount >= 5 ? (step.shortLabel || step.label) : step.label}
                </span>
              </div>
              {index < stepCount - 1 && (
                <div style={getLineStyle(step.id)} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar */}
      {stepperProgressVisible && (
        <div
          className="widget-stepper__progress"
          role="progressbar"
          aria-valuenow={Math.round(progressFraction * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Prubeh: ${Math.round(progressFraction * 100)}%`}
          style={{
            marginTop: '12px',
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--widget-stepper-inactive, #E5E7EB)',
            overflow: 'hidden',
            maxWidth: stepCount >= 5 ? '520px' : '420px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressFraction * 100}%`,
              backgroundColor: 'var(--widget-accent, var(--forge-accent, #00D4AA))',
              borderRadius: 2,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      )}

      {/* Responsive CSS: hide labels under 500px, show compact under 360px */}
      <style>{`
        @container (max-width: 500px) {
          .widget-stepper__label {
            display: none !important;
          }
          .widget-stepper__full [role="listitem"] {
            min-width: 0;
          }
        }
        @container (max-width: 360px) {
          .widget-stepper__full {
            display: none !important;
          }
          .widget-stepper__compact {
            display: flex !important;
          }
          .widget-stepper__progress {
            max-width: 100% !important;
          }
        }
        @media (max-width: 500px) {
          .widget-stepper__label {
            display: none !important;
          }
        }
        @media (max-width: 360px) {
          .widget-stepper__full {
            display: none !important;
          }
          .widget-stepper__compact {
            display: flex !important;
          }
          .widget-stepper__progress {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WidgetStepper;

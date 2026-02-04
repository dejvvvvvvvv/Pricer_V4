// src/pages/widget-kalkulacka/components/WidgetStepper.jsx
// 3-step progress indicator for the embeddable widget calculator.

import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Nahrani modelu' },
  { id: 2, label: 'Nastaveni' },
  { id: 3, label: 'Souhrn a cena' },
];

/**
 * WidgetStepper - 3-step progress indicator.
 *
 * Each step shows a numbered circle + label + connecting line.
 * States: completed (green check), active (colored circle), inactive (grey).
 * Optional progress bar below steps.
 *
 * Props:
 * - currentStep: Current active step (1, 2, or 3)
 * - stepperProgressVisible: Show progress bar below steps (default: true)
 * - builderMode: Enable click-to-select for the builder (default: false)
 * - elementId: Element identifier for builder selection (default: 'steps')
 * - onElementSelect: Callback when element is clicked in builder mode
 */
const WidgetStepper = ({
  currentStep = 1,
  stepperProgressVisible = true,
  builderMode = false,
  elementId = 'steps',
  onElementSelect,
}) => {
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

  const getCircleStyle = (state) => {
    const base = {
      width: 32,
      height: 32,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8125rem',
      fontWeight: 600,
      transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
      flexShrink: 0,
    };

    switch (state) {
      case 'completed':
        return {
          ...base,
          backgroundColor: 'var(--widget-stepper-completed, #10B981)',
          color: '#FFFFFF',
          border: '2px solid var(--widget-stepper-completed, #10B981)',
        };
      case 'active':
        return {
          ...base,
          backgroundColor: 'var(--widget-stepper-active, #3B82F6)',
          color: '#FFFFFF',
          border: '2px solid var(--widget-stepper-active, #3B82F6)',
        };
      default:
        return {
          ...base,
          backgroundColor: 'transparent',
          color: 'var(--widget-muted, #6B7280)',
          border: '2px solid var(--widget-stepper-inactive, #E5E7EB)',
        };
    }
  };

  const getLabelStyle = (state) => ({
    fontSize: '0.75rem',
    fontWeight: state === 'inactive' ? 400 : 500,
    color: state === 'inactive'
      ? 'var(--widget-muted, #6B7280)'
      : 'var(--widget-text, #374151)',
    marginTop: '6px',
    textAlign: 'center',
    lineHeight: 1.3,
    maxWidth: '80px',
  });

  const getLineStyle = (stepId) => {
    const filled = stepId < currentStep;
    return {
      flex: 1,
      height: 2,
      backgroundColor: filled
        ? 'var(--widget-stepper-completed, #10B981)'
        : 'var(--widget-stepper-inactive, #E5E7EB)',
      transition: 'background-color 200ms ease',
      marginLeft: 8,
      marginRight: 8,
      alignSelf: 'center',
      // Vertically align the line with the circle center
      marginBottom: '22px',
    };
  };

  // Progress fraction: 0 for step 1, 0.5 for step 2, 1.0 for step 3
  const progressFraction = (currentStep - 1) / (STEPS.length - 1);

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
    >
      {/* Steps row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: '420px',
        }}
      >
        {STEPS.map((step, index) => {
          const state = getStepState(step.id);
          return (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={getCircleStyle(state)}>
                  {state === 'completed' ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    step.id
                  )}
                </div>
                <span style={getLabelStyle(state)}>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div style={getLineStyle(step.id)} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar */}
      {stepperProgressVisible && (
        <div
          style={{
            marginTop: '12px',
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--widget-stepper-inactive, #E5E7EB)',
            overflow: 'hidden',
            maxWidth: '420px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressFraction * 100}%`,
              backgroundColor: 'var(--widget-stepper-active, #3B82F6)',
              borderRadius: 2,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WidgetStepper;

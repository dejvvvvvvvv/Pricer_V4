import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressSteps = ({ currentStep, totalSteps, steps }) => {
  return (
    <div style={{ width: '100%', marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {steps?.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          const circleStyle = {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid',
            transition: 'all 200ms ease-out',
            borderColor: isCompleted
              ? 'var(--forge-accent-primary)'
              : isActive
              ? 'var(--forge-accent-primary)'
              : 'var(--forge-border-default)',
            backgroundColor: isCompleted
              ? 'var(--forge-accent-primary)'
              : isActive
              ? 'rgba(0, 212, 170, 0.1)'
              : 'var(--forge-bg-elevated)',
            color: isCompleted
              ? '#08090C'
              : isActive
              ? 'var(--forge-accent-primary)'
              : 'var(--forge-text-disabled)',
          };

          return (
            <React.Fragment key={step?.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={circleStyle}>
                  {isCompleted ? (
                    <Icon name="Check" size={16} />
                  ) : (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'var(--forge-font-mono)',
                    }}>{stepNumber}</span>
                  )}
                </div>

                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'var(--forge-font-tech)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isActive ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                  }}>
                    {step?.title}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--forge-text-disabled)',
                    marginTop: '2px',
                    maxWidth: '80px',
                    fontFamily: 'var(--forge-font-body)',
                  }}>
                    {step?.description}
                  </p>
                </div>
              </div>

              {index < steps?.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  margin: '0 16px',
                  marginBottom: '40px',
                  transition: 'all 200ms ease-out',
                  backgroundColor: stepNumber < currentStep
                    ? 'var(--forge-accent-primary)'
                    : 'var(--forge-border-default)',
                  borderRadius: '1px',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;

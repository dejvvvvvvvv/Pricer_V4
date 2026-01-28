import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressSteps = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps?.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={step?.id}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isActive
                    ? 'bg-primary/10 border-primary text-primary' :'bg-muted border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <Icon name="Check" size={16} />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step?.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-20">
                    {step?.description}
                  </p>
                </div>
              </div>
              {/* Connector Line */}
              {index < steps?.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 mt-5 transition-all duration-200 ${
                  stepNumber < currentStep
                    ? 'bg-primary' :'bg-muted-foreground/20'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;